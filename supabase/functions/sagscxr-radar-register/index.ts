import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.0";

const URL = Deno.env.get("SUPABASE_URL") || "";
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || "";
const RNS_URL = "https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/secure.html";
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
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    if(!body||!["invite","list","create","update","reset_password"].includes(body.action))return fail("INVALID_ACTION",400);
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
        return {id:u.id,email:u.email||"",created_at:u.created_at||null,
          email_confirmed:!!u.email_confirmed_at,
          display_name:radar?.display_name||rns?.display_name||"",
          radar_unit:radar?.unit||null,
          radar_active:radar?.active===true,
          rns_role:rns?.role||null,rns_active:rns?.active===true};
      }).sort((a,b)=>(a.email||"").localeCompare(b.email||""));
      return reply({success:true,users,returned:users.length});
    }
    // Existing shared account management is Manager-ADMIN only. Never allow
    // editing own access, changing another ADMIN, or escalating to ADMIN.
    if(body.action==="update"||body.action==="reset_password"){
      const targetId=String(body.user_id||"").trim();
      if(!UUID.test(targetId)||targetId===requester.id)return fail("INVALID_TARGET",403);
      if(body.confirm!==true)return fail("CONFIRMATION_REQUIRED",400);
      const {data:target,error:targetErr}=await admin.auth.admin.getUserById(targetId);
      if(targetErr||!target?.user)return fail("USER_NOT_FOUND",404);
      const {data:existing,error:memberErr}=await admin.from("ops_members")
        .select("unit,active,display_name").eq("user_id",targetId).maybeSingle();
      const {data:rnsAccount,error:rnsErr}=await admin.from("sags_docs_members")
        .select("role,active").eq("user_id",targetId).maybeSingle();
      if(memberErr||rnsErr)return fail("LOOKUP_FAILED",500);
      if(existing?.unit==="ADMIN"||rnsAccount?.role==="admin")return fail("PROTECTED_ACCOUNT",403);
      if(!existing)return fail("MANAGER_MEMBER_NOT_FOUND",404);
      if(body.action==="update"){
        const newName=String(body.display_name||"").trim();
        const newUnit=String(body.unit||"").trim().toUpperCase();
        const newEmail=String(body.email||"").trim().toLowerCase();
        if(!newName||newName.length>120)return fail("INVALID_NAME",400);
        if(!ROLES.has(newUnit))return fail("INVALID_ROLE",400);
        if(!EMAIL.test(newEmail)||newEmail.length>254)return fail("INVALID_EMAIL",400);
        if(typeof body.active!=="boolean")return fail("INVALID_STATUS",400);
        const emailChanged=newEmail!==String(target.user.email||"").toLowerCase();
        if(emailChanged&&body.confirm_email_change!==true)return fail("EMAIL_RECONFIRM_REQUIRED",400);
        // Update the Manager role first; RNS role is intentionally unaffected.
        const {error:managerUpdate}=await admin.from("ops_members")
          .update({unit:newUnit,active:body.active,display_name:newName})
          .eq("user_id",targetId).neq("unit","ADMIN");
        if(managerUpdate)return fail("MANAGER_UPDATE_FAILED",500);
        if(rnsAccount){
          const {error:rnsNameError}=await admin.from("sags_docs_members")
            .update({display_name:newName}).eq("user_id",targetId);
          if(rnsNameError)return fail("RNS_NAME_SYNC_FAILED",500,
            "Quyền Manager đã lưu; chưa đồng bộ tên RNS. Quản trị viên kiểm tra lại.");
        }
        const {error:authUpdate}=await admin.auth.admin.updateUserById(targetId,{
          ...(emailChanged?{email:newEmail,email_confirm:true}:{}),
          user_metadata:{...(target.user.user_metadata||{}),display_name:newName}
        });
        if(authUpdate)return fail("AUTH_PROFILE_UPDATE_FAILED",500,
          "Đã cập nhật hồ sơ Manager nhưng thông tin Auth chưa đồng bộ; kiểm tra lại danh sách.");
        return reply({success:true,user_id:targetId,email:newEmail,
          display_name:newName,manager_unit:newUnit,manager_active:body.active,
          message:"Thông tin và quyền Manager đã được cập nhật; quyền RNS không thay đổi."});
      }
      if(!existing.active)return fail("ACCOUNT_INACTIVE",409,
        "Tài khoản Manager đang khóa, cần mở quyền trước khi cấp lại mật khẩu.");
      if(!target.user.email_confirmed_at)return fail("EMAIL_NOT_VERIFIED",409);
      const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
      const random:number[]=[],limit=Math.floor(256/alphabet.length)*alphabet.length;
      while(random.length<20){
        for(const b of crypto.getRandomValues(new Uint8Array(32))){
          if(b<limit){random.push(b%alphabet.length);if(random.length===20)break;}
        }
      }
      const password=random.map(i=>alphabet[i]).join("");
      const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(password));
      const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,"0")).join("");
      const metadata={...(target.user.app_metadata||{}),
        rns_must_change_password:true,rns_temp_password_sha256:hash};
      const {error:resetErr}=await admin.auth.admin.updateUserById(targetId,{
        password,app_metadata:metadata
      });
      if(resetErr)return fail("RESET_FAILED",502,
        "Không đặt lại được mật khẩu. Mật khẩu cũ có thể vẫn còn hiệu lực.");
      const {error:auditErr}=await admin.from("sags_rns_credential_events").insert({
        target_user_id:targetId,admin_user_id:requester.id,event_type:"admin_reset_password"
      });
      if(auditErr)console.error("Manager credential audit:",auditErr.code);
      return reply({success:true,user_id:targetId,email:target.user.email,
        temporary_password:password,must_change_password:true,
        message:"Đã đặt mật khẩu ngẫu nhiên một lần; nhân viên phải đổi trên RNS trước khi dùng Manager."});
    }
    if(body.action==="create"){
      const email=String(body.email||"").trim().toLowerCase();
      const unit=String(body.unit||"").trim().toUpperCase();
      const displayName=String(body.display_name||"").trim();
      const rnsRole=String(body.rns_role||"viewer").trim().toLowerCase();
      if(!EMAIL.test(email)||email.length>254)return fail("INVALID_EMAIL",400,"Email nhân viên không hợp lệ.");
      if(!ROLES.has(unit))return fail("INVALID_UNIT",400,"Vai trò Manager không hợp lệ.");
      if(!displayName||displayName.length>120)return fail("INVALID_NAME",400,"Cần nhập họ tên nhân viên (tối đa 120 ký tự).");
      if(!["viewer","editor"].includes(rnsRole))return fail("INVALID_RNS_ROLE",403,"Chỉ tạo được tài khoản RNS VIEWER hoặc EDITOR.");
      if(body.email_verified_by_admin!==true)return fail("EMAIL_CONFIRMATION_REQUIRED",400,
        "ADMIN phải kiểm tra chính xác email của nhân viên trước khi tạo.");
      // Only someone who is ALSO an active RNS administrator may assign editor.
      if(rnsRole!=="viewer"){
        const {data:rnsAdmin,error:rnsErr}=await admin.from("sags_docs_members")
          .select("role,active").eq("user_id",requester.id).maybeSingle();
        if(rnsErr||rnsAdmin?.role!=="admin"||rnsAdmin.active!==true)
          return fail("RNS_ADMIN_REQUIRED",403,"Cần đồng thời có quyền ADMIN RNS để cấp quyền EDITOR.");
      }
      const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
      const length=20,values:number[]=[];
      const maxByte=Math.floor(256/alphabet.length)*alphabet.length;
      while(values.length<length){
        const bytes=crypto.getRandomValues(new Uint8Array(32));
        for(const b of bytes){if(b<maxByte){values.push(b%alphabet.length);if(values.length===length)break;}}
      }
      const password=values.map(v=>alphabet[v]).join("");
      const hashed=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(password));
      const passwordHash=Array.from(new Uint8Array(hashed),v=>v.toString(16).padStart(2,"0")).join("");
      const {data:created,error:createError}=await admin.auth.admin.createUser({
        email,password,email_confirm:true,
        app_metadata:{rns_must_change_password:true,rns_temp_password_sha256:passwordHash},
        user_metadata:{display_name:displayName}
      });
      if(createError){
        const msg=String(createError.message||"").toLowerCase();
        if(/already|registered|exists|duplicate|email.*taken/.test(msg))
          return fail("ALREADY_REGISTERED",409,"Email đã có tài khoản RNS/Manager. Hãy sử dụng mục CẤP QUYỀN TÀI KHOẢN ĐÃ CÓ.");
        console.error("RNS direct registration",createError.status,createError.code);
        return fail("CREATE_FAILED",502,"Chưa thể tạo tài khoản Supabase Authentication.");
      }
      const userId=created?.user?.id;
      if(!userId)return fail("CREATE_NO_USER_ID",502);
      try{
        const {error:managerError}=await admin.from("ops_members").insert({
          user_id:userId,unit,display_name:displayName,active:true
        });
        if(managerError)throw Error("MANAGER_ROLE_FAILED");
        const {error:rnsError}=await admin.from("sags_docs_members").insert({
          user_id:userId,role:rnsRole,display_name:displayName,active:true
        });
        if(rnsError)throw Error("RNS_ROLE_FAILED");
      }catch(e){
        const {error:rollbackError}=await admin.auth.admin.deleteUser(userId);
        if(rollbackError)console.error("Registration rollback failed",rollbackError.code);
        console.error("Registration membership failure",e instanceof Error?e.message:"unknown");
        return fail("ACCOUNT_SETUP_FAILED",500,"Chưa hoàn tất phân quyền. Kiểm tra tài khoản trước khi đăng ký lại.");
      }
      // Audit records contain no password; no credentials in logs or database profile.
      const {error:auditError}=await admin.from("sags_rns_credential_events").insert({
        target_user_id:userId,admin_user_id:requester.id,event_type:"admin_created_shared_account"
      });
      if(auditError)console.error("Account create audit unavailable",auditError.code);
      return reply({success:true,email,user_id:userId,manager_unit:unit,
        rns_role:rnsRole,must_change_password:true,temporary_password:password,
        message:"Đã tạo tài khoản dùng chung và cấp quyền tại thời điểm đăng ký. Mật khẩu tạm chỉ hiển thị một lần."});
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