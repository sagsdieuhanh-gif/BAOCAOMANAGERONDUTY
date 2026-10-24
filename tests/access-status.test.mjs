import test from 'node:test';
import assert from 'node:assert/strict';
import{permissionDenied,flightAccessMessage,profileAccessMessage}from'../src/access-status.mjs';
import{readFileSync}from'node:fs';
const code=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
const firebaseCode=readFileSync(new URL('../src/firebase.mjs',import.meta.url),'utf8');
test('Firebase permission-denied identified by SDK code and message',()=>{
 assert.equal(permissionDenied({code:'permission-denied'}),true);
 assert.equal(permissionDenied({code:'firestore/permission-denied'}),true);
 assert.equal(permissionDenied({message:'Missing or insufficient permissions.'}),true);
 assert.equal(permissionDenied({code:'unavailable'}),false);
});
test('Denied lite_flights request is a data issue, not password/profile issue',()=>{
 const m=flightAccessMessage({code:'permission-denied',message:'Missing or insufficient permissions.'});
 assert.match(m,/lite_flights/);assert.match(m,/Đăng nhập E-Report đã được chấp nhận/);
 assert.doesNotMatch(m,/sai mật khẩu/);
});
test('Denied users read is a distinct profile issue',()=>{
 const m=profileAccessMessage({code:'permission-denied'});
 assert.match(m,/users\/\{UID\}/);
});
test('real UI uses legacy E-Report assignments, not lite_flights',()=>{
 assert.match(code,/api\.flights\(state\.date,state\.profile\)/);
 assert.match(code,/if\(!DEMO\)return showLegacyFlights\(\)/);
 assert.match(code,/sags_live_v470\/roster_mail/);
 assert.match(code,/MỞ NHIỆM VỤ GỐC/);
 assert.match(code,/blocked\?'—':flights\.length/);
});

test('every production RTDB data path is explicitly scoped via the original E-Report namespace',()=>{
 assert.match(firebaseCode,/const path=legacyRtdbPath\(isAdmin/);
 assert.match(firebaseCode,/sdk\.d\.ref\(rtdb,legacyRtdbPath\(`flight_records/);
 assert.match(firebaseCode,/legacyRtdbPath\('ac_limits\/catalog_public'\)/);
 assert.match(firebaseCode,/legacyRtdbPath\('ac_limits\/catalog_signal'\)/);
 assert.doesNotMatch(firebaseCode,/sdk\.d\.ref\(rtdb,`flight_records\//);
});