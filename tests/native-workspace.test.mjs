import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nativeAppUrl,originalWithinOrigin,validNativeTask,nativeSession,invokeNative} from '../src/native-workspace.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const task={assignmentId:'A-01',flightId:'FD-234',date:'2026-10-24',formCode:'42.3'};
test('pinned native app resolves within the SAME GitHub Pages origin, separate from Vercel redirect',()=>{
 assert.equal(nativeAppUrl('https://sagsdieuhanh-gif.github.io/EREPORT/index.html'),'https://sagsdieuhanh-gif.github.io/EREPORT/native/');
 assert.equal(originalWithinOrigin('https://sagsdieuhanh-gif.github.io/EREPORT/'),true);
 assert.equal(originalWithinOrigin('https://untrusted.example/EREPORT/'),false); // never trust a different deployment origin
});
test('native workspace requires the original assignment, flight, and date',()=>{
 assert.equal(validNativeTask(task),true);
 for(const x of [{...task,assignmentId:''},{...task,flightId:''},{...task,date:'2026-1-1'}])assert.equal(validNativeTask(x),false);
});
test('cross-origin iframe, unsigned original app and mismatching Firebase UID are blocked',()=>{
 const fake=(origin,uid)=>({contentWindow:{location:{origin},firebase:{auth:()=>({currentUser:uid?{uid}:null})}}});
 assert.throws(()=>nativeSession(fake('https://evil.example','u1'),'u1','https://safe.example'),/Khác nguồn/);
 assert.throws(()=>nativeSession(fake('https://safe.example',null),'u1','https://safe.example'),/Chưa có phiên/);
 assert.throws(()=>nativeSession(fake('https://safe.example','u2'),'u1','https://safe.example'),/khác/);
 assert.ok(nativeSession(fake('https://safe.example','u1'),'u1','https://safe.example'));
});
test('native target dispatch delegates exclusively to existing E-Report functions',async()=>{
 const calls=[];const w={sagsV478OpenExactAssignment:(...args)=>calls.push(['task',...args]),flightWorkspaceOpenList:d=>calls.push(['roster',d]),aclSimpleOpen:()=>calls.push(['limits'])};
 await invokeNative(w,'task',task,task.date);await invokeNative(w,'roster',null,task.date);await invokeNative(w,'limits',null,task.date);
 assert.deepEqual(calls,[['task',task.assignmentId,task.flightId,task.date],['roster',task.date],['limits']]);
 assert.throws(()=>invokeNative(w,'task',{...task,flightId:''},task.date),/Thiếu/);
 assert.throws(()=>invokeNative(w,'anything',task,task.date),/không hợp lệ/);
});
test('native build enforces pinned source and only removes old site canonical redirect',()=>{
 const script=read('scripts/build-native.mjs'),workflow=read('.github/workflows/pages.yml');
 assert.match(script,/41ad37fc9033f160fd00c21008ff9711ddfd7294/);
 assert.match(script,/matched\?\.length!==1/);
 assert.match(script,/sagsCanonicalProduction/);
 assert.match(workflow,/Checkout pinned original E-Report operational source/);
 assert.match(workflow,/npm run build:native/);
 assert.match(read('src/app.mjs'),/renderNativeWorkspace/);
 assert.doesNotMatch(read('src/native-workspace.mjs'),/\bsdk\.d\.set\b|\bupdateDoc\b|\bwriteForm\b/);
});