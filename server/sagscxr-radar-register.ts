import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

const URL = Deno.env.get("SUPABASE_URL") || "";
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || "";
const RNS_URL = "https://sagscxr-rns.vercel.app/secure.html";
const ORIGIN = "https://sagsdieuhanh-gif.github.io";
const HEADERS = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "Access-Control-Max-Age": "600",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Vary": "Origin"
};
const reply=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
const fail=(code:string,status:number,message?:string)=>reply({success:false,error:code,message:message||code},status);
const ROLES=new Set(["DH","KTS","PVHK","KHO","QA","IT","VIEWER"]);
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:HEADERS});
  if(req.method!=="POST")return fail("METHOD_NOT_ALLOWED",405);
  if(!URL||!SECRET)return fail("BACKEND_NOT_CONFIGURED",503);

  const bearer=req.headers.get("Authorization")||"";
  const token=bearer.match(/^Bearer\s+(\S+)$/i)?.[1];
  if(!token)return fail("LOGIN_REQUIRED",401);
  const admin=createClient(URL,SECRET,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  });

  try{
    const {data:identity,error:authError}=await admin.auth.getUser(token);
    if(authError||!identity?.user?.id)return fail("INVALID_SESSION",401);
    const requester=identity.user;
    if(requester.app_metadata?.rns_must_change_password===true)
      return fail("PASSWORD_CHANGE_REQUIRED",403);

    const {data:membership,error:memberError}=await admin.from("ops_members")
      .select("unit,active").eq("user_id",requester.id).maybeSingle();
    if(memberError)return fail("PERMISSION_CHECK_FAILED",500);
    if(membership?.unit!=="ADMIN"||membership.active!==true)
      return fail("RADAR_ADMIN_ONLY",403);

    const body=await req.json().catch(()=>null);
    if(!body||!["invite","list"].includes(body.action))return fail("INVALID_ACTION",400);
    if(body.action==="list"){
      const authUsers: Array<{id:string;email?:string;created_at?:string;email_confirmed_at?:string|null}>=[];
      for(let page=1;page<=5;page++){
        const {data,error}=await admin.auth.admin.listUsers({page,perPage:100});
        if(error)return fail("LIST_AUTH_FAILED",500,"Không tải được danh sách tài khoản dùng chung.");
        const users=data?.users||[];
        authUsers.push(...users);
        if(users.length<100)break;
      }
      const [{data:radarUsers,error:radarErr},{data:rnsUsers,error:rnsErr}]=await Promise.all([
        admin.from("ops_members").select("user_id,unit,active,display_name").limit(1000),
        admin.from("sags_docs_members").select("user_id,role,active,display_name").limit(1000)
      ]);
      if(radarErr||rnsErr)return fail("LIST_ROLE_FAILED",500,"Không tải được quyền tài khoản.");
      const radarMap=new Map((radarUsers||[]).map(x=>[x.user_id,x]));
      const rnsMap=new Map((rnsUsers||[]).map(x=>[x.user_id,x]));
      const users=authUsers.map(u=>{
        const radar=radarMap.get(u.id),rns=rnsMap.get(u.id);
        return {email:u.email||"",created_at:u.created_at||null,
          email_confirmed:!!u.email_confirmed_at,
          display_name:radar?.display_name||rns?.display_name||"",
          radar_unit:radar?.unit||null,
          radar_active:radar?.active===true,
          rns_role:rns?.role||null,rns_active:rns?.active===true};
      }).sort((a,b)=>(a.email||"").localeCompare(b.email||""));
      return reply({success:true,users,returned:users.length});
    }
    const email=String(body.email||"").trim().toLowerCase();
    const unit=String(body.unit||"").trim().toUpperCase();
    const displayName=String(body.display_name||"").trim();
    if(!EMAIL.test(email)||email.length>254)return fail("INVALID_EMAIL",400,"Email không hợp lệ.");
    if(!ROLES.has(unit))return fail("INVALID_UNIT",400,"Vai trò Radar không hợp lệ.");
    if(displayName.length>120)return fail("INVALID_NAME",400);
    // Invite new Auth user into the SAME Supabase project that RNS uses.
    // Existing Auth accounts must use the existing Radar role-assignment RPC,
    // never overwrite their RNS role, password, or metadata.
    const {data:invited,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{
      redirectTo:RNS_URL
    });
    if(inviteError){
      const msg=String(inviteError.message||"").toLowerCase();
      if(/already|registered|exists|existing|duplicate/.test(msg))
        return fail("ALREADY_REGISTERED",409,"Email này đã có tài khoản RNS. Hãy dùng CẤP QUYỀN CHO TÀI KHOẢN ĐÃ CÓ.");
      if(inviteError.status===429)return fail("EMAIL_RATE_LIMIT",429,"Giới hạn gửi thư mời. Vui lòng thử lại sau.");
      console.error("RNS invitation error",inviteError.status,inviteError.code);
      return fail("INVITATION_FAILED",502,"Không gửi được thư mời từ Supabase. Kiểm tra cấu hình email.");
    }
    const userId=invited?.user?.id;
    if(!userId)return fail("INVITATION_NO_USER_ID",502);

    try {
      const {error:radarError}=await admin.from("ops_members").insert({
        user_id:userId,unit,display_name:displayName||email.split("@")[0],active:true
      });
      if(radarError)throw new Error("RADAR_ROLE_SAVE_FAILED");
      // Give the new user RNS's least-privileged viewer role, not admin/editor.
      const {error:rnsError}=await admin.from("sags_docs_members").insert({
        user_id:userId,role:"viewer",active:true,display_name:displayName||email.split("@")[0]
      });
      if(rnsError)throw new Error("RNS_VIEWER_SETUP_FAILED");
    } catch(e) {
      // Roll back only the user newly invited by THIS request.
      // Foreign-key ON DELETE CASCADE also removes the two memberships.
      const {error:rollbackError}=await admin.auth.admin.deleteUser(userId);
      if(rollbackError)console.error("Failed to revert incomplete invite",userId,rollbackError.message);
      console.error("Membership setup failed",e instanceof Error?e.message:String(e));
      return fail("ACCOUNT_SETUP_FAILED",500,"Thư mời chưa được hoàn tất do lỗi cấp quyền. Quản trị viên cần kiểm tra trạng thái trước khi thử lại.");
    }
    return reply({
      success:true,email,user_id:userId,radar_unit:unit,
      rns_role:"viewer",invited:true,
      message:"Đã yêu cầu gửi thư mời thiết lập tài khoản RNS. Tài khoản dùng chung RNS/Radar sau khi nhân viên kích hoạt."
    });
  } catch (e){
    console.error("Radar RNS registration failed",e instanceof Error?e.message:String(e));
    return fail("SERVER_ERROR",500,"Có lỗi máy chủ; chưa xác nhận tạo được tài khoản.");
  }
});