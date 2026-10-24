import{flightId,cleanFlight,legacyLoginEmail,operationalRole,validOldRole}from'./core.mjs';
let sdk=null,fb=null,auth=null,db=null,rtdb=null;
export async function initFirebase(config){if(fb)return;const [app,a,f,d]=await Promise.all([
 import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
 import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
 import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
 import('https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js')]);sdk={app,a,f,d};fb=app.initializeApp(config);auth=a.getAuth(fb);db=f.getFirestore(fb);rtdb=d.getDatabase(fb)}
export function subscribeAuth(callback){return sdk.a.onAuthStateChanged(auth,callback)}
export async function signIn(usernameOrEmail,pass){
 const email=legacyLoginEmail(usernameOrEmail);
 if(!email)throw Error('Nhập username hoặc email Firebase hợp lệ. Tài khoản AD cần nhập email Firebase.');
 return sdk.a.signInWithEmailAndPassword(auth,email,pass)
}
export async function signOut(){return sdk.a.signOut(auth)}
export async function myRole(uid){
 const r=await sdk.f.getDoc(sdk.f.doc(db,'users',uid));
 if(!r.exists())return null;
 const d=r.data();
 if(d.active!==true||d.deleted===true||!validOldRole(d.role))return null;
 return {...d,uid,role:operationalRole(d.role),legacyRole:d.role,mustChangePassword:d.mustChangePassword===true};
}
export async function listUsers(){const r=await sdk.f.getDocs(sdk.f.collection(db,'users'));return r.docs.filter(x=>x.data().deleted!==true).map(x=>({uid:x.id,...x.data(),role:operationalRole(x.data().role)}))}
export async function setUser(){throw Error('Tài khoản chung do E-Report gốc quản lý; không cho sửa từ bản Lite.')}
export async function changePassword(next){
 const u=auth?.currentUser;
 if(!u)throw Error('Phiên đăng nhập đã hết hạn.');
 if(String(next).length<8)throw Error('Mật khẩu mới cần ít nhất 8 ký tự.');
 await sdk.a.updatePassword(u,next);
 // Existing E-Report rules allow the owner to clear this flag.
 await sdk.f.updateDoc(sdk.f.doc(db,'users',u.uid),{mustChangePassword:false,passwordChangedAtMs:sdk.f.serverTimestamp()});
}
export async function listFlights(date){const q=sdk.f.query(sdk.f.collection(db,'lite_flights'),sdk.f.where('date','==',date),sdk.f.limit(120));const r=await sdk.f.getDocs(q);return r.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>String(a.std||a.sta).localeCompare(String(b.std||b.sta)))}
export async function createFlight(input,user){const fl=cleanFlight(input),id=flightId(fl),ref=sdk.f.doc(db,'lite_flights',id);await sdk.f.runTransaction(db,async t=>{const old=await t.get(ref);if(old.exists())throw Error('Chuyến bay này đã tồn tại');t.set(ref,{...fl,createdAt:sdk.f.serverTimestamp(),createdBy:user.uid,updatedAt:sdk.f.serverTimestamp(),claimedBy:null,claimedName:''})});return{id,...fl,claimedBy:null}}
export async function claimFlight(id,user){const ref=sdk.f.doc(db,'lite_flights',id);return sdk.f.runTransaction(db,async t=>{let old=await t.get(ref);if(!old.exists())throw Error('Không tìm thấy chuyến');let f=old.data();if(f.claimedBy&&f.claimedBy!==user.uid)throw Error(`Chuyến đang được ${f.claimedName||'nhân viên khác'} nhận`);t.update(ref,{claimedBy:user.uid,claimedName:user.name||user.email||user.uid,claimedAt:sdk.f.serverTimestamp()});return{id,...f,claimedBy:user.uid,claimedName:user.name||user.email||user.uid}})}
export async function updateFlight(id,patch){await sdk.f.updateDoc(sdk.f.doc(db,'lite_flights',id),{...patch,updatedAt:sdk.f.serverTimestamp()})}
export async function readForm(fid,formId){let r=await sdk.f.getDoc(sdk.f.doc(db,'lite_flights',fid,'forms',formId));return r.exists()?{...r.data(),revision:Number(r.data().revision||0)}:{revision:0,values:{}}}
export async function saveForm(fid,formId,values,revision,user){const ref=sdk.f.doc(db,'lite_flights',fid,'forms',formId);return sdk.f.runTransaction(db,async tx=>{let old=await tx.get(ref),prev=old.exists()?Number(old.data().revision||0):0;if(prev!==revision)throw Error('Dữ liệu đã được cập nhật trên máy khác. Hãy tải lại và đối chiếu trước khi lưu.');tx.set(ref,{values,revision:prev+1,updatedAt:sdk.f.serverTimestamp(),updatedBy:user.uid});return prev+1})}
const limitsDoc=()=>sdk.f.doc(db,'sags_handovers','AC_LIMITS_CATALOG_V1');
export async function readLimits(){let r=await sdk.f.getDoc(limitsDoc());if(!r.exists())return{version:0,items:[]};return r.data()}
export function watchLimits(onData,onError){return sdk.f.onSnapshot(limitsDoc(),s=>onData(s.exists()?s.data():{version:0,items:[]}),onError)}
export async function updateLimits(catalog,user){const saved={...catalog,kind:'sags_ac_limits_catalog_v1',version:Date.now(),updatedAtMs:Date.now(),updatedBy:{username:user.name||user.email,uid:user.uid,role:user.role}};await sdk.f.setDoc(limitsDoc(),saved);try{await sdk.d.set(sdk.d.ref(rtdb,'ac_limits/catalog_public'),saved);await sdk.d.set(sdk.d.ref(rtdb,'ac_limits/catalog_signal'),{version:saved.version,updatedAtMs:saved.updatedAtMs,updatedBy:saved.updatedBy})}catch(e){throw Error('Firestore đã lưu nhưng không đồng bộ được RTDB với E-Report cũ: '+e.message)}return saved}