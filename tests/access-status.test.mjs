import test from 'node:test';
import assert from 'node:assert/strict';
import{permissionDenied,flightAccessMessage,profileAccessMessage}from'../src/access-status.mjs';
import{readFileSync}from'node:fs';
const code=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
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
test('UI retains signed-in session on flight-read error and does not display false zero',()=>{
 assert.match(code,/try\{state\.flights=await api\.flights\(state\.date\);state\.flightError=null\}/);
 assert.match(code,/state\.flightError=flightAccessMessage\(e\)/);
 assert.match(code,/blocked\?'—':n/);
 assert.match(code,/retry-flight-access/);
 assert.match(code,/Không thể tải dữ liệu chuyến bay/);
});