import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {safeLegacyKey,legacyUsername,legacyFormCode,legacyRosterItems,groupLegacyRoster,rosterDiagnostics,projectLegacyFlightRecords,legacyRtdbPath,LEGACY_RTDB_ROOT} from '../src/legacy-roster.mjs';
test('all six original forms and actual FSAGS alias are recognized',()=>{
 for(const [k,v] of Object.entries({FSAGS:'42.3',FSAGS421:'42.1',FSAGS423:'42.3',FSAGS551:'55.1',FSAGS54:'54',FSAGS94:'94',FSAGS208:'208',CLC_CHECKLIST:'94','F/SAGS-CXR/94':'94'}))assert.equal(legacyFormCode(k),v);
 assert.equal(legacyFormCode('FINAL'),null);
});
test('read original worker mailbox: restrict account and day, retain flight evidence from other groups',()=>{
 const rows={a:{assignmentId:'a',flightId:'old_1',formGroup:'FSAGS',opDate:'2026-10-24',targetUser:'DATVH'},b:{assignmentId:'b',flightId:'old_1',formGroup:'FSAGS54',opDate:'2026-10-24',targetUser:'SOMEBODY'},c:{assignmentId:'c',flightId:'old_1',formGroup:'FSAGS551',opDate:'2026-10-23',targetUser:'DATVH'},d:{assignmentId:'d',flightId:'old_2',formGroup:'FINAL',opDate:'2026-10-24',targetUser:'DATVH'},z:{assignmentId:'z',flightId:'old_3',formGroup:'FSAGS208',opDate:'2026-10-24',targetUser:'DATVH',active:false}};
 assert.deepEqual(legacyRosterItems(rows,'2026-10-24',' datvh ').map(x=>x.assignmentId),['a','d']);
 assert.equal(legacyRosterItems(rows,'2026-10-24','AD',true).length,3);
 assert.equal(legacyRosterItems(rows,'2026-10-24','DATVH')[0].formCode,'42.3');
 assert.equal(legacyRosterItems(rows,'2026-10-24','DATVH')[1].formCode,null);
});
test('same original manifest parent wrapper is supported',()=>{
 const wrapper={opDate:'2026-10-24',items:{'aid.1':{flightId:'fid1',formGroup:'FSAGS',opDate:'2026-10-24',targetUser:'DUYTK'}}};
 assert.equal(legacyRosterItems(wrapper,'2026-10-24','AD',true).length,1);
 assert.equal(legacyRosterItems(wrapper,'2026-10-24','DUYTK')[0].assignmentId,'aid.1');
 assert.equal(rosterDiagnostics(wrapper,'2026-10-24','DUYTK').sixForms,1);
});
test('diagnostics distinguish no assignment from missing valid form',()=>{
 const rows={a:{flightId:'old_1',formGroup:'FINAL',opDate:'2026-10-24',targetUser:'DATVH'},b:{flightId:'old_2',formGroup:'FSAGS',opDate:'2026-10-24',targetUser:'OTHERS'}};
 const o=rosterDiagnostics(rows,'2026-10-24','DATVH');assert.equal(o.raw,2);assert.equal(o.day,2);assert.equal(o.assigned,1);assert.equal(o.otherForms,1);assert.equal(o.sixForms,0);
});
test('native IDs and grouping preserved for all legacy task families',()=>{
 const input=[{assignmentId:'native-A',flightId:'native-flight',formCode:'42.1',arrFlight:'VJ123',depFlight:'VJ124',sta:'12:30'},{assignmentId:'native-B',flightId:'native-flight',formCode:null,acReg:'VN-ABC'}];
 const groups=groupLegacyRoster(input,'2026-10-24');assert.equal(groups.length,1);assert.equal(groups[0].legacyFlightId,'native-flight');assert.deepEqual(groups[0].tasks.map(x=>x.assignmentId),['native-A','native-B']);assert.equal(groups[0].reg,'VN-ABC');
});
test('safe RTDB key and normalized username match native E-Report',()=>{
 assert.equal(safeLegacyKey('2026/10/24'),'2026_10_24');assert.equal(legacyUsername(' da tvh '),'DATVH');
});
test('flight_records projection reveals existing historic records without leaking form payload',()=>{
 const records=projectLegacyFlightRecords({'fid1':{flightId:'fid1',flightName:'VJ 101',acReg:'VN-AAA',modules:{FSAGS208:{state:{private:'sensitive'}},RAMP:{state:{private:'sensitive'}}},documents:{FSAGS208:{private:'sensitive'}}}},'2026-10-24');
 assert.equal(records.length,1);assert.equal(records[0].flightId,'fid1');assert.equal(records[0].has208,true);assert.deepEqual(records[0].documents,['FSAGS208']);assert.equal(JSON.stringify(records).includes('sensitive'),false);
});

test('all E-Report RTDB operations use the original sags_live_v470 namespace',()=>{
 assert.equal(LEGACY_RTDB_ROOT,'sags_live_v470');
 assert.equal(legacyRtdbPath('roster_mail/DATVH/items'),'sags_live_v470/roster_mail/DATVH/items');
 assert.equal(legacyRtdbPath('roster_manifests/2026-10-24'),'sags_live_v470/roster_manifests/2026-10-24');
 assert.equal(legacyRtdbPath('flight_records/2026-10-24'),'sags_live_v470/flight_records/2026-10-24');
 assert.equal(legacyRtdbPath('ac_limits/catalog_public'),'sags_live_v470/ac_limits/catalog_public');
 assert.equal(legacyRtdbPath('sags_live_v470/roster_mail/DATVH/items'),'sags_live_v470/roster_mail/DATVH/items');
 assert.equal(legacyRtdbPath('/roster_mail/DATVH/items'),'sags_live_v470/roster_mail/DATVH/items');
 assert.equal(legacyRtdbPath(''),'sags_live_v470');
});
