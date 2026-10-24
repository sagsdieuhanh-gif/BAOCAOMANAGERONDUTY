// E-Report carrier notebook adapter. The ORIGINAL module is executed unchanged
// when the verified static assets are available from SAGS FORM LITE.
// If the Lite Pages asset is missing, verify the pinned original source and
// adapt ONLY its data URLs to the old E-Report Pages path (never change logic).
const SOURCE_SHA='70b822f2fde2b44e98076a9721e8a70f05034050';
const SRC='app/modules/carrier-notebook.v1.js';
const DATA='data/carrier-service-guide.json';
const VERSION='data/carrier-guide-version.json';
const NATIVE_APP='https://sagsdieuhanh-gif.github.io/E-REPORT-SAGS/';
let loading=null;
const relativeURL=(path,base=document.baseURI)=>new URL(path,base).href;
const oldURL=(path)=>relativeURL('../E-REPORT-SAGS/'+path);

async function assetAvailable(url){
 try{
  const r=await fetch(url,{method:'HEAD',cache:'no-store'});
  if(r.status===405){const x=await fetch(url,{cache:'no-store'});return x.ok}
  return r.ok;
 }catch{return false}
}
function appendScript(url){
 return new Promise((resolve,reject)=>{
  const el=document.createElement('script');el.src=url;el.async=true;el.dataset.legacyCarrierNotebook='1';
  el.onload=()=>{
   if(typeof window.sagsCarrierGuideOpen==='function')resolve();
   else{el.remove();reject(Error('Tải được JavaScript SỔ TAY nhưng không khởi tạo được hàm mở gốc.'))}
  };
  el.onerror=()=>{el.remove();reject(Error('Không tải được JavaScript SỔ TAY từ '+url))};
  document.head.append(el);
 });
}
async function sha1GitBlob(source){
 if(!globalThis.crypto?.subtle)throw Error('Thiết bị không hỗ trợ xác minh tính toàn vẹn module.');
 const bytes=new TextEncoder().encode(source),head=new TextEncoder().encode('blob '+bytes.byteLength+'\0');
 const buf=new Uint8Array(head.length+bytes.length);buf.set(head);buf.set(bytes,head.length);
 const hash=await crypto.subtle.digest('SHA-1',buf);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
async function loadPinnedOriginalFallback(){
 const srcURL=oldURL(SRC),dataURL=oldURL(DATA),versionURL=oldURL(VERSION);
 if(!(await assetAvailable(dataURL))||!(await assetAvailable(versionURL)))
  throw Error('Không tải được dữ liệu SỔ TAY ở E-Report gốc.');
 const r=await fetch(srcURL,{cache:'no-store'});
 if(!r.ok)throw Error('Module E-Report gốc HTTP '+r.status);
 const source=await r.text();
 if((await sha1GitBlob(source))!==SOURCE_SHA)
  throw Error('Module gốc đã thay đổi so với phiên bản được kiểm chứng; không thực thi mã chưa kiểm tra.');
 const oldDecl="DATA_URL='./data/carrier-service-guide.json', VERSION_URL='./data/carrier-guide-version.json'";
 if(!source.includes(oldDecl))throw Error('Cấu trúc module SỔ TAY gốc thay đổi; cần kiểm duyệt trước khi tích hợp.');
 const code=source.replace(oldDecl,'DATA_URL='+JSON.stringify(dataURL)+', VERSION_URL='+JSON.stringify(versionURL));
 const el=document.createElement('script');
 el.dataset.legacyCarrierNotebook='pinned-original-fallback';
 el.textContent=code;document.head.appendChild(el);
 if(typeof window.sagsCarrierGuideOpen!=='function'){
  el.remove();throw Error('Không khởi tạo được SỔ TAY dự phòng; trình duyệt có thể chặn script nội tuyến.');
 }
}
async function ensureLegacyNotebook(){
 if(typeof window.sagsCarrierGuideOpen==='function')return;
 if(loading)return loading;
 loading=(async()=>{
  const localData=relativeURL('./'+DATA),localVersion=relativeURL('./'+VERSION);
  if(await assetAvailable(localData)&&await assetAvailable(localVersion)){
   try{await appendScript(relativeURL('./'+SRC+'?v=1.9.0'));return}catch(e){console.warn('Local SỔ TAY file unavailable; checking pinned original',e)}
  }
  await loadPinnedOriginalFallback();
 })().catch(e=>{loading=null;throw e});
 return loading;
}
export async function showNotebook(host,user,toast){
 host.innerHTML='<section class="hero"><span class="eyebrow">E-REPORT ORIGINAL</span><h1>📘 SỔ TAY HÃNG HÀNG KHÔNG</h1><p>Dùng module và dữ liệu SỔ TAY E-Report, không tạo bộ danh mục thứ hai.</p></section><div class="card"><h2>SỔ TAY HÃNG</h2><p>Tra cứu, tìm kiếm, quản lý và import/xuất dữ liệu theo module gốc, phụ thuộc quyền tài khoản hiện có.</p><button id="open-legacy-notebook" type="button" class="btn">MỞ SỔ TAY</button><p id="notebook-load-status" class="mini" role="status"></p><p class="mini">Khi tài nguyên SỔ TAY tạm thời không truy cập được tại Lite, bạn vẫn có thể <a href="'+NATIVE_APP+'" target="_blank" rel="noopener noreferrer">mở E-Report gốc</a>.</p></div>';
 window.__sagsGetSession=()=>({role:user.role,profile:user});
 window.currentUserProfile=user;window.currentRole=user.role;
 const btn=host.querySelector('#open-legacy-notebook'),status=host.querySelector('#notebook-load-status');
 btn.onclick=async()=>{
  btn.disabled=true;status.textContent='Đang kiểm tra module và dữ liệu SỔ TAY…';
  try{
   await ensureLegacyNotebook();
   if(!btn.isConnected)return; // user navigated away or signed out while loading
   await window.sagsCarrierGuideOpen();
   if(status.isConnected)status.textContent='Đã mở SỔ TAY E-Report.';
  }catch(e){if(status.isConnected)status.textContent='Chưa mở được SỔ TAY: '+e.message;toast('SỔ TAY: '+e.message)}
  finally{btn.disabled=false}
 };
 // Preserve prior one-tap tab behavior without starting a second loader.
 void btn.onclick();
}