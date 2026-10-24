import {test} from 'node:test';import {strict as assert} from 'node:assert';
import{safeLegacyKey,legacyFormCode,legacyRosterItems,groupLegacyRoster}from'../src/legacy-roster.mjs';
test('only supported six form groups map to original assignments',()=>{
 for(const [k,v] of Object.entries({FSAGS421:'42.1',FSAGS423:'42.3',FSAGS551:'55.1',FSAGS54:'54',FSAGS94:'94',FSAGS208:'208'}))assert.equal(legacyFormCode(k),v);
 assert.equal(legacyFormCode('FINAL'),null);
});
test('filter personal assignment by actual recipient and date',()=>{
 const rows={a:{assignmentId:'a',flightId:'old_1',formGroup:'FSAGS423',opDate:'2026-10-24',targetUser:'DATVH'},b:{assignmentId:'b',flightId:'old_1',formGroup:'FSAGS54',opDate:'2026-10-24',targetUser:'SOMEBODY'},c:{assignmentId:'c',flightId:'old_1',formGroup:'FSAGS551',opDate:'2026-10-23',targetUser:'DATVH'},d:{assignmentId:'d',flightId:'old_1',formGroup:'FINAL',opDate:'2026-10-24',targetUser:'DATVH'}};
 assert.deepEqual(legacyRosterItems(rows,'2026-10-24','datvh').map(x=>x.assignmentId),['a']);
 assert.equal(legacyRosterItems(rows,'2026-10-24','AD',true).length,2);
});
test('never lose native flightId or assignmentId when grouping',()=>{
 const input=[{assignmentId:'native-A',flightId:'native-flight',formCode:'42.1',arrFlight:'VJ123',depFlight:'VJ124',sta:'12:30'},{assignmentId:'native-B',flightId:'native-flight',formCode:'55.1',acReg:'VN-ABC'}];
 const groups=groupLegacyRoster(input,'2026-10-24');assert.equal(groups.length,1);assert.equal(groups[0].legacyFlightId,'native-flight');assert.deepEqual(groups[0].tasks.map(x=>x.assignmentId),['native-A','native-B']);assert.equal(groups[0].reg,'VN-ABC');
});
test('safe database key matches original E-Report convention',()=>assert.equal(safeLegacyKey('2026/10/24'),'2026_10_24'));