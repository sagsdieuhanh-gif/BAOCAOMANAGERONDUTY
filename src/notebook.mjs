// Reuse the exact original E-Report SỔ TAY module, including its UI, IndexedDB,
// Excel import, management, and two-file release workflow. Lazy-load on request.
let loading;
function ensureLegacyNotebook(){
 if(typeof window.sagsCarrierGuideOpen==='function')return Promise.resolve();
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='./app/modules/carrier-notebook.v1.js';
  script.async=true;
  script.dataset.legacyCarrierNotebook='1';
  script.onload=()=>typeof window.sagsCarrierGuideOpen==='function'?resolve():reject(Error('Module SỔ TAY gốc chưa khởi tạo.'));
  script.onerror=()=>reject(Error('Không tải được module SỔ TAY gốc; kiểm tra npm run vendor và kết nối mạng.'));
  document.head.append(script);
 }).catch(e=>{loading=null;throw e});
 return loading;
}
export async function showNotebook(host,user,toast){
 host.innerHTML='<section class="hero"><span class="eyebrow">ORIGINAL E-REPORT MODULE</span><h1>📘 SỔ TAY HÃNG HÀNG KHÔNG</h1><p>Sử dụng nguyên module SỔ TAY của E-Report gốc; không tạo giao diện nhập liệu và dữ liệu SỔ TAY thứ hai.</p></section><div class="card"><h2>SỔ TAY nguyên bản</h2><p>Tra cứu 28 hãng và các chức năng nhập Excel, xem trước, quản lý, xuất bộ dữ liệu chính thức theo đúng module đã được sử dụng.</p><button id="open-legacy-notebook" type="button" class="btn">MỞ SỔ TAY</button><p id="notebook-load-status" class="mini" role="status"></p></div>';
 // The original module reads session via the existing global bridge.
 window.__sagsGetSession=()=>({role:user.role,profile:user});
 window.currentUserProfile=user;window.currentRole=user.role;
 const btn=host.querySelector('#open-legacy-notebook');
 const status=host.querySelector('#notebook-load-status');
 btn.onclick=async()=>{btn.disabled=true;status.textContent='Đang tải module SỔ TAY nguyên bản…';try{await ensureLegacyNotebook();window.sagsCarrierGuideOpen();status.textContent='Đã mở SỔ TAY gốc.'}catch(e){status.textContent=e.message;toast(e.message)}finally{btn.disabled=false}};
 // Open the existing native notebook as soon as this tab is selected.
 btn.click();
}