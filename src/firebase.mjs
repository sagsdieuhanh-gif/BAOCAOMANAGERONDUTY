import{legacyRosterItems,groupLegacyRoster,rosterDiagnostics,projectLegacyFlightRecords,safeLegacyKey,legacyUsername,legacyRtdbPath}from './legacy-roster.mjs?v=1.7.0';
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
// Existing E-Report RTDB is authoritative for assignment and flight records.
// Do not write a second lite_flights dataset.
let lastRosterInfo=null;
export function rosterInfo(){return lastRosterInfo}
export async function listFlights(date,user){
 // Same source and day scope as native E-Report, NOT a replacement Firestore collection.
 const username=legacyUsername(user?.username);
 if(!username)throw Error('E-Report chưa xác định được username để đọc phân công.');
 const isAdmin=user.role==='AD';
 const path=legacyRtdbPath(isAdmin?`roster_manifests/${safeLegacyKey(date)}`:`roster_mail/${safeLegacyKey(username)}/items`);
 let q=sdk.d.ref(rtdb,path);
 if(!isAdmin)q=sdk.d.query(q,sdk.d.orderByChild('opDate'),sdk.d.equalTo(date));
 let snap;
 try{snap=await sdk.d.get(q)}catch(e){lastRosterInfo={date,path,source:isAdmin?'MANIFEST':'MAILBOX',error:String(e?.message||e)};throw e}
 const raw=snap.val(),stats=rosterDiagnostics(raw,date,username,isAdmin);
 const flights=groupLegacyRoster(legacyRosterItems(raw,date,username,isAdmin),date);
 lastRosterInfo={date,source:isAdmin?'MANIFEST':'MAILBOX',path,stats,flights:flights.length,empty:!stats.raw};
 return flights;
}

export async function listLegacyFlightRecords(date,user){
 if(user?.role!=='AD')throw Error('Chỉ AD được mở tổng hợp hồ sơ chuyến gốc.');
 const snap=await sdk.d.get(sdk.d.ref(rtdb,legacyRtdbPath(`flight_records/${safeLegacyKey(date)}`)));
 return projectLegacyFlightRecords(snap.val(),date);
}
function nativeOnly(){throw Error('Dữ liệu phân công và biểu mẫu dùng quy trình E-Report gốc. Không ghi vào kho Lite riêng. Hãy mở nhiệm vụ bằng E-Report gốc.');}
export const createFlight=nativeOnly,claimFlight=nativeOnly,updateFlight=nativeOnly,readForm=nativeOnly,saveForm=nativeOnly;
const limitsDoc=()=>sdk.f.doc(db,'sags_handovers','AC_LIMITS_CATALOG_V1');
export async function readLimits(){let r=await sdk.f.getDoc(limitsDoc());if(!r.exists())return{version:0,items:[]};return r.data()}
export function watchLimits(onData,onError){return sdk.f.onSnapshot(limitsDoc(),s=>onData(s.exists()?s.data():{version:0,items:[]}),onError)}
export async function updateLimits(catalog,user){const saved={...catalog,kind:'sags_ac_limits_catalog_v1',version:Date.now(),updatedAtMs:Date.now(),updatedBy:{username:user.name||user.email,uid:user.uid,role:user.role}};await sdk.f.setDoc(limitsDoc(),saved);try{await sdk.d.set(sdk.d.ref(rtdb,legacyRtdbPath('ac_limits/catalog_public')),saved);await sdk.d.set(sdk.d.ref(rtdb,legacyRtdbPath('ac_limits/catalog_signal')),{version:saved.version,updatedAtMs:saved.updatedAtMs,updatedBy:saved.updatedBy})}catch(e){throw Error('Firestore đã lưu nhưng không đồng bộ được RTDB với E-Report cũ: '+e.message)}return saved}