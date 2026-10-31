'use strict';
(function(){
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const roles={ADMIN:'ADMIN (RNS)',DH:'ĐIỀU HÀNH',KTS:'PVSĐ',PVHK:'PVHK',KHO:'KHO HÀNG',QA:'QA',IT:'IT',VIEWER:'CHỈ XEM'};
 let loading=null,accounts=[];
 async function invoke(action,payload={}){
   if(typeof unit==='undefined'||unit!=='ADMIN')throw Error('Chỉ ADMIN của Radar được quản lý tài khoản.');
   if(typeof sb==='undefined'||!sb)throw Error('Không có kết nối xác thực Supabase.');
   const {data,error}=await sb.functions.invoke('sagscxr-radar-register',{body:{action,...payload}});
   if(error){
     let detail=null;
     try{detail=await error.context?.json?.()}catch{}
     throw Error(detail?.message||error.message||'Không thể kết nối dịch vụ tài khoản RNS.');
   }
   if(!data?.success)throw Error(data?.message||'Máy chủ chưa xác nhận kết quả.');
   return data;
 }
 const mark=(id,message,error=false)=>{const el=$(id);if(el){el.textContent=message;el.style.color=error?'#b43a31':'#246b58';}};
 function filter(){
   const div=$('rnsSharedList');if(!div)return;
   const query=$('rnsLookup')?.value.trim().toLocaleLowerCase('vi-VN')||'';
   const visible=accounts.filter(x=>!query||x.email.toLowerCase().includes(query)||(x.display_name||'').toLocaleLowerCase('vi-VN').includes(query));
   const rows=visible.map(x=>'<tr><td><strong>'+esc(x.email)+'</strong>'+
     '<small>'+(x.email_confirmed?'Đã xác minh email':'Chờ kích hoạt email')+'</small></td>'+
     '<td>'+esc(x.display_name||'—')+'</td>'+
     '<td>'+esc(x.rns_role?.toUpperCase()||'CHƯA CẤP')+'</td>'+
     '<td>'+esc(x.radar_unit?roles[x.radar_unit]||x.radar_unit:'CHƯA CẤP')+
     (x.radar_unit&&!x.radar_active?' · ĐÃ KHÓA':'')+'</td>'+
     '<td>'+(x.radar_unit==='ADMIN'?'—':
       '<button type="button" class="rnsPick" data-rns-existing="'+esc(x.email)+'" data-rns-role="'+esc(x.radar_unit||'VIEWER')+
       '" data-rns-name="'+esc(x.display_name||'')+'">CHỌN CẤP QUYỀN</button>')+'</td></tr>').join('');
   div.innerHTML='<div class="rnsTableHead">'+visible.length+' / '+accounts.length+' tài khoản dùng chung RNS/Supabase</div>'+
     '<div class="tablewrap"><table class="rnsSharedTable"><thead><tr><th>EMAIL RNS</th><th>HỌ TÊN</th><th>QUYỀN RNS</th><th>QUYỀN RADAR</th><th>THAO TÁC</th></tr></thead><tbody>'+
     (rows||'<tr><td colspan="5">Không có tài khoản phù hợp.</td></tr>')+'</tbody></table></div>';
 }
 async function loadShared(){
   if(typeof unit==='undefined'||unit!=='ADMIN')return;
   if(loading)return loading;
   mark('rnsSharedStatus','Đang tải danh sách tài khoản RNS dùng chung…');
   loading=(async()=>{
     try{
       const data=await invoke('list');
       accounts=data.users||[];
       filter();
       mark('rnsSharedStatus','Danh sách được lấy từ cùng Supabase Authentication của RNS. Chọn tài khoản để cấp quyền Radar.');
     }catch(e){mark('rnsSharedStatus','Chưa tải được tài khoản: '+e.message,true)}
     finally{loading=null}
   })();
   return loading;
 }
 async function invite(){
   const email=$('rnsInviteEmail')?.value.trim().toLowerCase()||'';
   const name=$('rnsInviteName')?.value.trim()||'';
   const target=$('rnsInviteUnit')?.value||'VIEWER';
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return mark('rnsInviteStatus','Nhập email nhân viên hợp lệ.',true);
   if(name.length>120)return mark('rnsInviteStatus','Họ tên dài quá 120 ký tự.',true);
   if(!Object.hasOwn(roles,target)||target==='ADMIN')
     return mark('rnsInviteStatus','Vai trò Radar không hợp lệ.',true);
   const btn=$('rnsInviteButton');
   if(!confirm('Gửi thư mời tạo tài khoản dùng chung RNS và Radar cho '+email+' với quyền Radar '+(roles[target]||target)+'?'))return;
   btn.disabled=true;
   mark('rnsInviteStatus','Đang yêu cầu Supabase gửi thư mời…');
   try{
     const result=await invoke('invite',{email,display_name:name,unit:target});
     mark('rnsInviteStatus','Supabase ĐÃ TIẾP NHẬN lời mời cho '+result.email+
       '. Đây KHÔNG phải xác nhận email đã đến hộp thư. Nếu chưa nhận được, mở Quản lý tài khoản RNS → CHỜ XÁC MINH → LẤY LINK MỜI để chuyển riêng cho nhân viên. Quyền RNS: VIEWER; Radar: '+(roles[target]||target)+'.');
     $('rnsInviteEmail').value='';$('rnsInviteName').value='';
     if(typeof loadAssignedMembers==='function')await loadAssignedMembers();
     await loadShared();
   }catch(e){
     mark('rnsInviteStatus','Chưa gửi được lời mời: '+e.message+
       (/đã có tài khoản RNS|ALREADY_REGISTERED/.test(e.message)?' Dùng phần CẤP QUYỀN CHO TÀI KHOẢN ĐÃ CÓ ở dưới.':''),true);
   }finally{btn.disabled=false;}
 }
 function init(){
   if(!$('rnsInvitePanel'))return;
   $('rnsInviteButton').onclick=invite;
   $('rnsSharedReload').onclick=loadShared;
   $('rnsLookup').oninput=filter;
   $('rnsSharedList').onclick=e=>{
     const b=e.target.closest('[data-rns-existing]');
     if(!b)return;
     $('memberEmail').value=b.dataset.rnsExisting||'';
     $('memberName').value=b.dataset.rnsName||'';
     const role=b.dataset.rnsRole||'VIEWER';
     $('memberUnit').value=role==='ADMIN'?'VIEWER':role;
     $('rnsExistingPanel').scrollIntoView({behavior:'smooth',block:'start'});
     mark('memberMessage','Đã chọn '+$('memberEmail').value+'. Kiểm tra vai trò Radar rồi bấm CẤP / CẬP NHẬT QUYỀN.');
   };
 }
 init();
 window.RnsRadarAdmin={loadShared,filter};
})();