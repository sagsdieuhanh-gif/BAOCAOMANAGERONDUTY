'use strict';
(function(){
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const roles={ADMIN:'ADMIN (RNS)',DH:'ĐIỀU HÀNH',KTS:'PVSĐ',PVHK:'PVHK',KHO:'KHO HÀNG',QA:'QA',IT:'IT',VIEWER:'CHỈ XEM'};
 let loading=null,accounts=[],picked=null,accountBusy=false;
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
       '" data-rns-name="'+esc(x.display_name||'')+'">CẤP QUYỀN</button>'+
       (x.id&&x.radar_unit?'<button type="button" class="rnsPick" data-rns-edit="'+esc(x.id)+'">SỬA HỒ SƠ</button>':'')+
       (x.id&&x.radar_unit&&x.radar_active===true?
         '<button type="button" class="rnsPick rnsResetQuick" data-rns-reset="'+esc(x.id)+'">'+
         (x.rns_active===true?'ĐẶT LẠI MẬT KHẨU':'GỬI LINK ĐỔI MẬT KHẨU')+'</button>':'') )+'</td></tr>').join('');
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

 async function createAccount(){
   const email=$('rnsCreateEmail')?.value.trim().toLowerCase()||'';
   const displayName=$('rnsCreateName')?.value.trim()||'';
   const target=$('rnsCreateUnit')?.value||'VIEWER';
   const rnsRole=$('rnsCreateRnsRole')?.value||'viewer';
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)
     return mark('rnsCreateStatus','Vui lòng nhập đúng email của nhân viên.',true);
   if(!displayName||displayName.length>120)
     return mark('rnsCreateStatus','Cần nhập họ tên nhân viên (tối đa 120 ký tự).',true);
   if(!Object.hasOwn(roles,target)||target==='ADMIN'||!['viewer','editor'].includes(rnsRole))
     return mark('rnsCreateStatus','Vai trò được chọn không hợp lệ.',true);
   if(!$('rnsCreateVerifiedEmail')?.checked)
     return mark('rnsCreateStatus','Hãy kiểm tra địa chỉ email và đánh dấu xác nhận trước khi tạo.',true);
   if(!confirm('TẠO TÀI KHOẢN CHUNG RNS / MANAGER?\n\nEmail: '+email+'\nHọ tên: '+displayName+
     '\nManager: '+(roles[target]||target)+'\nRNS: '+rnsRole.toUpperCase()+
     '\n\nMật khẩu tạm sẽ chỉ được hiển thị 1 lần; nhân viên phải đổi khi đăng nhập RNS lần đầu.'))return;
   const button=$('rnsCreateButton');
   button.disabled=true;
   dismissSecret();
   mark('rnsCreateStatus','Đang đăng ký tài khoản và ghi hai bộ phân quyền…');
   try{
     const result=await invoke('create',{email,display_name:displayName,unit:target,
       rns_role:rnsRole,email_verified_by_admin:true});
     if(!result.temporary_password)throw Error('Máy chủ chưa trả về mật khẩu tạm. Kiểm tra trạng thái trước khi thử lại.');
     $('rnsCreatedUser').textContent='Email: '+result.email+
       ' · Manager: '+(roles[result.manager_unit]||result.manager_unit)+
       ' · RNS: '+String(result.rns_role).toUpperCase();
     $('rnsCreatedPassword').value=result.temporary_password;
     $('rnsCreateSecretPanel').classList.remove('hidden');
     mark('rnsCreateStatus','ĐÃ TẠO VÀ CẤP QUYỀN. Bàn giao mật khẩu tạm riêng cho nhân viên. Không cần gửi email mời.');
     $('rnsCreateEmail').value='';$('rnsCreateName').value='';
     $('rnsCreateVerifiedEmail').checked=false;
     await loadShared();
   }catch(e){mark('rnsCreateStatus','CHƯA TẠO ĐƯỢC: '+e.message,true)}
   finally{button.disabled=false}
 }
 function dismissSecret(){
   const input=$('rnsCreatedPassword');if(input)input.value='';
   const display=$('rnsCreatedUser');if(display)display.textContent='';
   $('rnsCreateSecretPanel')?.classList.add('hidden');
 }
 async function copySecret(){
   const input=$('rnsCreatedPassword'),secret=input?.value||'';
   if(!secret)return;
   try{await navigator.clipboard.writeText(secret);mark('rnsCreateStatus','Đã sao chép mật khẩu tạm. Chỉ chuyển riêng cho đúng nhân viên.');}
   catch{input.select();mark('rnsCreateStatus','Hãy sao chép phần mật khẩu đã được chọn.');}
 }

 function closeReset(){
   if($('rnsResetSecret'))$('rnsResetSecret').value='';
   $('rnsResetSecretPanel')?.classList.add('hidden');
 }
 function deselect(){
   picked=null;closeReset();
   for(const id of ['rnsEditIdentity','rnsEditEmail','rnsEditName'])if($(id))$(id).value='';
   if($('rnsEditSave'))$('rnsEditSave').disabled=true;
   if($('rnsEditReset'))$('rnsEditReset').disabled=true;
   mark('rnsEditStatus','Chọn một tài khoản đã có từ danh sách phía trên.');
 }
 function selectAccount(id){
   const x=accounts.find(a=>a.id===id);
   if(!x||!x.radar_unit||x.radar_unit==='ADMIN'||x.rns_role==='admin')
     return mark('rnsEditStatus','Tài khoản ADMIN được bảo vệ, không sửa tại đây.',true);
   picked=x.id;closeReset();
   $('rnsEditIdentity').value=x.email;
   $('rnsEditEmail').value=x.email;
   $('rnsEditName').value=x.display_name||'';
   $('rnsEditUnit').value=x.radar_unit;
   $('rnsEditActive').checked=x.radar_active===true;
   $('rnsEditSave').disabled=false;
   $('rnsEditReset').disabled=x.radar_active!==true;
   $('rnsEditReset').textContent=x.rns_active===true?'ĐẶT LẠI MẬT KHẨU TẠM':'GỬI LINK ĐỔI MẬT KHẨU';
   mark('rnsEditStatus','Đang chọn '+x.email+'. '+
     (x.rns_active===true?'ADMIN có thể đặt mật khẩu tạm.':
       'Quyền RNS không hoạt động; dùng email khôi phục mật khẩu, không mở quyền RNS.'));
   $('rnsManagerEditPanel')?.scrollIntoView?.({behavior:'smooth',block:'start'});
 }
 async function editAccount(){
   if(!picked||accountBusy)return;
   const u=accounts.find(a=>a.id===picked);if(!u)return;
   const email=$('rnsEditEmail').value.trim().toLowerCase();
   const name=$('rnsEditName').value.trim(),target=$('rnsEditUnit').value;
   const active=$('rnsEditActive').checked;
   if(!name||name.length>120)return mark('rnsEditStatus','Họ tên phải từ 1–120 ký tự.',true);
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)
     return mark('rnsEditStatus','Email không hợp lệ.',true);
   if(!Object.hasOwn(roles,target)||target==='ADMIN')
     return mark('rnsEditStatus','Không có quyền cấp vai trò ADMIN tại đây.',true);
   const changedEmail=email!==u.email.toLowerCase();
   if(changedEmail&&!confirm('Xác nhận địa chỉ email mới '+email+
     ' thực sự thuộc đúng nhân viên? Email đăng nhập RNS và Manager sẽ thay đổi.'))return;
   if(!confirm('LƯU HỒ SƠ '+u.email+'\nHọ tên: '+name+'\nQuyền: '+roles[target]+
     '\nTrạng thái Manager: '+(active?'Đang cấp':'Khóa')+'\nQuyền RNS giữ nguyên.'))return;
   accountBusy=true;$('rnsEditSave').disabled=true;closeReset();
   mark('rnsEditStatus','Đang cập nhật hồ sơ…');
   try{
     const changed=await invoke('update',{user_id:picked,email,display_name:name,
       unit:target,active,confirm:true,confirm_email_change:changedEmail});
     await loadShared();
     selectAccount(changed.user_id);
     mark('rnsEditStatus',changed.message||'Đã cập nhật hồ sơ Manager.');
     if(typeof loadAssignedMembers==='function')await loadAssignedMembers();
   }catch(err){mark('rnsEditStatus','Cập nhật chưa hoàn tất: '+err.message,true)}
   finally{accountBusy=false;$('rnsEditSave').disabled=!picked;}
 }
 async function resetAccount(){
   if(!picked||accountBusy)return;
   const u=accounts.find(a=>a.id===picked);
   if(!u||!u.radar_active)return;
   const useEmail=u.rns_active!==true;
   if(useEmail){
     if(!confirm('GỬI LIÊN KẾT KHÔI PHỤC MẬT KHẨU cho '+u.email+
       '?\n\nTài khoản hiện không có quyền RNS hoạt động. Nhân viên sẽ nhận email để tự đổi mật khẩu đăng nhập dùng chung; quyền RNS giữ nguyên, không tự mở khóa.'))return;
   }else{
     if(!confirm('ĐẶT LẠI MẬT KHẨU cho '+u.email+
       '?\nMật khẩu cũ sẽ hết hiệu lực. Mật khẩu tạm mới được sinh ngẫu nhiên và chỉ hiển thị một lần.'))return;
   }
   accountBusy=true;$('rnsEditReset').disabled=true;closeReset();
   mark('rnsEditStatus',useEmail?'Đang đề nghị gửi email khôi phục mật khẩu…':'Đang tạo mật khẩu tạm mới…');
   try{
     if(useEmail){
       if(typeof sb==='undefined'||!sb)throw Error('Chưa có kết nối Supabase Auth.');
       const {error}=await sb.auth.resetPasswordForEmail(u.email,{
         redirectTo:'https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/secure.html'
       });
       if(error)throw error;
       mark('rnsEditStatus','Supabase đã tiếp nhận yêu cầu khôi phục cho '+u.email+
         '. Nhân viên kiểm tra email và mở liên kết để đặt mật khẩu mới, rồi đăng nhập Manager. Chưa thể xác nhận email đã được phát tới hộp thư. Quyền RNS không thay đổi.');
       return;
     }
     const changed=await invoke('reset_password',{user_id:picked,confirm:true});
     if(!changed.temporary_password)throw Error('Máy chủ chưa trả về mật khẩu tạm, cần kiểm tra trạng thái tài khoản.');
     $('rnsResetSecret').value=changed.temporary_password;
     $('rnsResetSecretPanel').classList.remove('hidden');
     mark('rnsEditStatus','Đã đặt lại mật khẩu cho '+u.email+
       '. Bàn giao riêng; nhân viên phải đổi tại RNS trước khi dùng Manager.');
     $('rnsResetSecretPanel')?.scrollIntoView?.({behavior:'smooth',block:'center'});
   }catch(err){
     mark('rnsEditStatus',(useEmail?'Chưa gửi được yêu cầu khôi phục: ':'Reset mật khẩu chưa thành công: ')+err.message,true);
   }finally{
     accountBusy=false;$('rnsEditReset').disabled=!picked;
   }
 }
 async function copyReset(){
   const pwd=$('rnsResetSecret')?.value||'';if(!pwd)return;
   try{await navigator.clipboard.writeText(pwd);
     mark('rnsEditStatus','Đã sao chép mật khẩu tạm. Chỉ chuyển riêng cho đúng nhân viên.');
   }catch{$('rnsResetSecret').select();mark('rnsEditStatus','Đã chọn mật khẩu tạm để sao chép.');}
 }

 function init(){
   if(!$('rnsInvitePanel'))return;
   $('rnsInviteButton').onclick=invite;
   $('rnsCreateButton').onclick=createAccount;
   $('rnsCreateCopy').onclick=copySecret;
   $('rnsCreateDismiss').onclick=dismissSecret;
   $('rnsSharedReload').onclick=loadShared;
   $('rnsEditSave').onclick=editAccount;
   $('rnsEditReset').onclick=resetAccount;
   $('rnsEditClear').onclick=deselect;
   $('rnsResetCopy').onclick=copyReset;
   $('rnsResetDismiss').onclick=closeReset;
   deselect();
   $('rnsLookup').oninput=filter;
   $('rnsSharedList').onclick=e=>{
     const reset=e.target.closest('[data-rns-reset]');
     if(reset){selectAccount(reset.dataset.rnsReset);resetAccount();return;}
     const edit=e.target.closest('[data-rns-edit]');
     if(edit){selectAccount(edit.dataset.rnsEdit);return}
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