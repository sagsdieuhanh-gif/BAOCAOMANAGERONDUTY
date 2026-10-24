/**
 * SAGS FORM LITE -> original E-Report operational workspace.
 * No alternative RTDB writer or PDF renderer is installed here. Native workflows
 * remain authoritative for accept/transfer, session writes, signatures and PDF.
 */
const ORIGINAL_PATH='./native/';
export const ORIGINAL_APP='https://sagsdieuhanh-gif.github.io/E-REPORT-SAGS/';
export function nativeAppUrl(base=globalThis.document?.baseURI||globalThis.location?.href||'https://sagsdieuhanh-gif.github.io/EREPORT/'){return new URL(ORIGINAL_PATH,base).href}
export const OPS=['roster','task','limits'];
const S=x=>String(x??'').trim();
const safe=v=>S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function originalWithinOrigin(current=globalThis.location?.href||ORIGINAL_APP){
 const local=new URL(current);
 const original=new URL(nativeAppUrl(current));
 return local.origin===new URL(ORIGINAL_APP).origin && local.origin===original.origin;
}
export function validNativeTask(task){
 return Boolean(task&&S(task.assignmentId)&&S(task.flightId)&&/^\d{4}-\d{2}-\d{2}$/.test(S(task.date)));
}
/** Security boundary: original Firebase Auth user must be exactly this Lite UID. */
export function nativeSession(frame, expectedUid, origin=globalThis.location?.origin){
 if(!frame?.contentWindow)throw Error('Màn hình nghiệp vụ gốc chưa tải.');
 const w=frame.contentWindow;
 let actualOrigin, auth;
 try{actualOrigin=w.location.origin;auth=w.firebase?.auth?.()?.currentUser}
 catch{throw Error('Không thể điều khiển E-Report khác tên miền. Mở trang gốc để thao tác.')} 
 if(actualOrigin!==origin)throw Error('Khác nguồn website; không tự động kết nối tài khoản hoặc thao tác trên iframe.');
 if(!auth?.uid)throw Error('Chưa có phiên đăng nhập trong E-Report gốc. Đăng nhập trong khung bên dưới rồi bấm lại.');
 if(auth.uid!==expectedUid)throw Error('Tài khoản E-Report gốc khác với tài khoản Lite. Hãy đăng nhập cùng một tài khoản để tránh sửa nhầm hồ sơ.');
 return w;
}
export function invokeNative(w, mode, task, date){
 if(mode==='limits'){
  const open=typeof w.aclSimpleOpen==='function'?w.aclSimpleOpen:typeof w.aclOpenAdmin==='function'?w.aclOpenAdmin:null;
  if(!open)throw Error('Module A/C LIMITS gốc chưa khởi tạo.');
  return open.call(w);
 }
 if(mode==='roster'){
  const open=w.flightWorkspaceOpenList;
  if(typeof open!=='function')throw Error('Module phân công gốc chưa khởi tạo.');
  return open.call(w,date);
 }
 if(mode==='task'){
  if(!validNativeTask(task))throw Error('Thiếu assignmentId/flightId/ngày gốc, không thể chọn biểu mẫu an toàn.');
  const open=w.sagsV478OpenExactAssignment;
  if(typeof open!=='function')throw Error('Module nhận việc gốc chưa khởi tạo.');
  // The old app independently verifies owner, claim, release status and form policy.
  return open.call(w,task.assignmentId,task.flightId,task.date);
 }
 throw Error('Lệnh nghiệp vụ không hợp lệ.');
}
const labelOf=mode=>mode==='task'?'MỞ ĐÚNG NHIỆM VỤ':mode==='limits'?'MỞ QUẢN LÝ A/C LIMITS':'MỞ PHÂN CÔNG / NHẬN VIỆC';
/** Render only when requested; original app is the single write owner. */
export function renderNativeWorkspace(host,{uid,date,task=null,mode='roster',onBack=()=>{},onHelp=()=>{}}={}){
 if(!uid)throw Error('Chưa xác thực tài khoản Lite.');
 if(!OPS.includes(mode))throw Error('Chế độ nghiệp vụ không hợp lệ.');
 if(mode==='task'&&!validNativeTask(task))throw Error('Không thể mở biểu mẫu khi thiếu mã phân công gốc.');
 const sameOrigin=originalWithinOrigin();
 const nativeUrl=nativeAppUrl();
 host.innerHTML=`<section class="hero"><div class="row between"><div><span class="eyebrow">E-REPORT NATIVE WORKSPACE</span><h1>${mode==='limits'?'A/C LIMITS – CHỨC NĂNG GỐC':mode==='task'?'Hồ sơ và biểu mẫu gốc':'Phân công · Nhận việc · Chuyển giao'}</h1><p>Nhập liệu, xác nhận, chữ ký và PDF sử dụng nguyên bộ xử lý E-Report. Không ghi dữ liệu vào kho Lite.</p></div><button class="btn subtle" id="native-back">← Danh sách</button></div></section>
 <section class="native-ops"><div class="row native-action-row"><button type="button" class="btn" id="native-launch">${labelOf(mode)}</button><button type="button" class="btn subtle" id="native-roster">PHÂN CÔNG / NHẬN VIỆC</button><button type="button" class="btn subtle" id="native-limits">A/C LIMITS</button><button type="button" class="btn subtle" id="native-reload">↻ TẢI LẠI KHUNG</button><a class="btn outline" href="${ORIGINAL_APP}" target="_blank" rel="noopener noreferrer">MỞ CỬA SỔ RIÊNG ↗</a></div>
 ${mode==='task'?`<p class="mini"><b>Biểu mẫu ${safe(task.formCode||task.formGroup||'')}</b> · Flight ID: ${safe(task.flightId)} · Assignment ID: ${safe(task.assignmentId)} · ${safe(task.date)}</p>`:''}
 <p class="mini">Lưu ý: Nếu E-Report gốc yêu cầu đăng nhập trong khung, hãy đăng nhập bằng <b>cùng tài khoản Lite</b>. Phân quyền, điều kiện nhận việc và thao tác xuất PDF do ứng dụng gốc kiểm soát.</p>
 <p class="mini" id="native-status" role="status">${sameOrigin?'Đang tải không gian nghiệp vụ gốc…':'Không cùng tên miền: thao tác điều khiển trực tiếp bị vô hiệu hóa.'}</p></section>
 <div class="native-frame-wrap">${sameOrigin?`<iframe id="native-frame" title="Không gian nghiệp vụ E-Report gốc" src="${nativeUrl}" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-write"></iframe>`:'<p>Ứng dụng không chạy cùng tên miền với E-Report gốc. Hãy dùng nút MỞ CỬA SỔ RIÊNG; không thể tự chuyển phiên đăng nhập.</p>'}</div>`;
 const $=id=>host.querySelector('#'+id),frame=$('native-frame'),status=$('native-status');
 const setStatus=t=>{if(status?.isConnected)status.textContent=t};
 const nativeClick=async(nextMode=mode,nextTask=task)=>{
  if(!sameOrigin){setStatus('Tên miền khác; chỉ có thể mở E-Report gốc trong cửa sổ riêng.');return false}
  const btn=$('native-launch');if(btn)btn.disabled=true;
  try{
   const w=nativeSession(frame,uid);
   await invokeNative(w,nextMode,nextTask,date);
   setStatus(nextMode==='task'?'Đã yêu cầu mở nhiệm vụ gốc. Vui lòng nhận việc, nhập/lưu và bấm XUẤT PDF ngay trong khung.':nextMode==='limits'?'Đã mở module A/C LIMITS gốc. Các thay đổi được lưu qua quyền và quy trình gốc.':'Đã mở danh sách phân công gốc; dùng chức năng nhận/chuyển giao ngay trong khung.');
   return true;
  }catch(e){setStatus('Chưa mở được: '+S(e?.message||e));return false}
  finally{if(btn?.isConnected)btn.disabled=false}
 };
 if(frame){
  frame.addEventListener('load',()=>{setStatus('Đã tải trang E-Report gốc. Chọn nút chức năng phía trên. Nếu hiện Đăng nhập, đăng nhập cùng tài khoản Lite trước.');},{once:true});
  frame.addEventListener('error',()=>setStatus('Không tải được E-Report gốc. Dùng nút mở cửa sổ riêng.'));
 }
 $('native-back').onclick=onBack;
 $('native-launch').onclick=()=>void nativeClick(mode,task);
 $('native-roster').onclick=()=>void nativeClick('roster',null);
 $('native-limits').onclick=()=>void nativeClick('limits',null);
 $('native-reload').onclick=()=>{if(frame){if(!confirm('Tải lại màn hình gốc? Dữ liệu chưa LƯU trong khung có thể bị mất.'))return;frame.src=nativeUrl;setStatus('Đang tải lại E-Report gốc. Dữ liệu chưa lưu trong khung có thể bị mất.')}else onHelp()};
 return {launch:nativeClick};
}