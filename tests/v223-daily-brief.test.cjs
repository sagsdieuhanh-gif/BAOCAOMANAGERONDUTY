'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const ops=require('../v219-ops-forecast.js'),writer=require('../v223-l2-brief.js');
const contracts=[{airline:'VJ',checkin_counters:3,staff_per_counter:1,checkin_open_lead:120,checkin_close_lead:40,
 gate_staff:2,requirement_source:'Phương án phục vụ hãng đã xác nhận',confirmed_by:'pvhk-123'},
 {airline:'KE',checkin_counters:4,staff_per_counter:1,checkin_open_lead:150,checkin_close_lead:45,
 gate_staff:2,requirement_source:'SLA đã xác nhận',confirmed_by:'pvhk-123'}];
assert.equal(writer.verifiedContract(contracts[0]),true);
assert.equal(writer.verifiedContract({...contracts[0],confirmed_by:null}),false);
assert.equal(writer.verifiedContract({...contracts[0],requirement_source:''}),false);
const rowsA=[
 {arrival:'VJ700',departure:'VJ701',sta_min:1150,std_min:1190,bay:39,airline:'VJ',aircraft_type:'A321',cargo_status:'NO_CARGO'},
 {arrival:'KE401',departure:'KE402',sta_min:1158,std_min:1220,bay:56,airline:'KE',aircraft_type:'A330',cargo_status:'CARGO',booking_sum:284},
 {arrival:'VJ702',departure:'VJ703',sta_min:1164,std_min:1226,bay:58,airline:'VJ',aircraft_type:'A321',cargo_status:'NO_CARGO'},
 {arrival:'KE404',departure:'KE405',sta_min:1169,std_min:1239,bay:40,airline:'KE',aircraft_type:'B777',cargo_status:'CARGO',booking_sum:301}
];
const depsA=[
 {no:'VJ701',carrier:'VJ',t:1190,gate:'G2',booking_sum:210,boarding_start:1153,boarding_finish:1178},
 {no:'KE402',carrier:'KE',t:1220,gate:'G2',booking_sum:284,boarding_start:1164,boarding_finish:1199},
 {no:'VJ703',carrier:'VJ',t:1226,gate:'G4',booking_sum:175,checkin_open:1100,checkin_close:1200},
 {no:'KE405',carrier:'KE',t:1239,gate:'G6',booking_sum:301},
 {no:'TW888',carrier:'TW',t:1250,gate:'G7',ferry:true}
];
const staff=[
 {role_code:'PVHK_DEPARTURE_TEAM',quantity:4,start_min:1000,end_min:1250,confirmed_at:'2026-10-30T09:00:00Z'},
 {role_code:'BAGGAGE',quantity:4,start_min:1100,end_min:1320,confirmed_at:'2026-10-30T09:00:00Z'},
 {role_code:'GSE_DRIVER',quantity:2,start_min:1100,end_min:1320,confirmed_at:'2026-10-30T09:00:00Z'},
 {role_code:'COBUS_DRIVER',quantity:2,start_min:1100,end_min:1320,confirmed_at:'2026-10-30T09:00:00Z'}
];
const gse=[{code:'STAIRS',ready_count:3},{code:'COBUS_LARGE',ready_count:2},
 {code:'BELT',ready_count:3},{code:'TRACTOR',ready_count:3}];
const payloadA={service_date:'2026-10-31',revision:2,flights:rowsA,
 source_detail:{arrivals:[],departures:depsA}};
const cA={date:'2026-10-31',revision:2,rows:rowsA,sourcePayload:payloadA,contracts,
 staff,gse,equipmentIssues:[{equipment_id:'ST-09',issue_status:'REPAIR'}],
 cargoPlans:[{flight_no:'KE402',cargo_kg:820,ready_by_min:1100},{flight_no:'KE405',cargo_kg:1260,ready_by_min:null}],
 unitPlans:[{unit:'PVHK',status:'CONFIRMED',details:{pvb_morning:59,pvb_night:52,pvb_night_required:54,pvb_night_status:'LIMITED'}}]};
const reportA=writer.make({c:cA,operational:ops.summarize(payloadA,rowsA,staff,gse,contracts),
 changes:[{flight:'VJ701',type:'THAY ĐỔI BÃI ĐỖ',from:51,to:39}]});
assert.ok(reportA.entries.length>=5&&reportA.entries.length<=7);
assert.ok(!reportA.entries.filter(x=>['checkin','resource'].includes(x.key)).some(x=>/chênh thiếu|thiếu \d+ người|đáp ứng theo số|định mức.*thiếu/i.test(x.observation+' '+x.action)));
assert.ok(reportA.staffing.includes('PVHK: sáng 59 người')&&reportA.staffing.includes('đêm 52 người'));

assert.ok(reportA.lead.includes('19:00')||reportA.lead.includes('19:30'));
assert.ok(reportA.entries.some(x=>x.key==='stands'&&x.observation.includes('K2')));
assert.ok(reportA.entries.some(x=>x.key==='gate'&&x.observation.includes('G2')));
assert.ok(reportA.entries.some(x=>x.key==='wide'&&x.observation.includes('KE402')));
assert.ok(reportA.entries.some(x=>x.key==='checkin'&&x.observation.includes('booking')));
assert.ok(reportA.entries.some(x=>x.key==='resource'&&x.observation.includes('ST-09')));
assert.ok(reportA.entries.some(x=>x.key==='cargo'&&x.observation.includes('KE405')));
assert.ok(reportA.entries.some(x=>x.action.includes('PVSĐ')&&x.action.includes('ĐH')));
assert.ok(!reportA.entries.some(x=>/^\s*(?:Đề nghị các đơn vị chủ động|Các phòng tiếp tục thực hiện nhiệm vụ)/.test(x.action)));
const rowsB=[{arrival:'VJ110',departure:'VJ111',sta_min:480,std_min:525,bay:53,airline:'VJ',
 aircraft_type:'A321',cargo_status:'NO_CARGO'}];
const payloadB={service_date:'2026-11-01',revision:2,flights:rowsB,
 source_detail:{arrivals:[],departures:[{no:'VJ111',carrier:'VJ',t:525,gate:'G8',booking_sum:63}]}};
const cB={date:'2026-11-01',revision:2,rows:rowsB,sourcePayload:payloadB,contracts,
 staff:[],gse:[],equipmentIssues:[],cargoPlans:[],unitPlans:[]};
const reportB=writer.make({c:cB,operational:ops.summarize(payloadB,rowsB,[],[],contracts),changes:[]});
assert.ok(reportB);
assert.ok(!reportB.entries.some(x=>x.key==='gate'),'Do not fabricate gate collision when none exists');
assert.ok(!reportB.entries.some(x=>x.key==='cargo'),'Do not fabricate cargo notes');
assert.ok(!reportB.entries.some(x=>x.key==='wide'),'Do not report widebody when none exists');
assert.ok(!reportB.entries.some(x=>x.key==='stands'),'Do not report K2/K3 if none present');
assert.notEqual(reportA.entries.map(x=>x.observation).join(''),reportB.entries.map(x=>x.observation).join(''));
assert.ok(writer.make({c:{...cA,revision:1},operational:ops.summarize(payloadA,rowsA,staff,gse,contracts)})===null);
const main=fs.readFileSync('v19-report.js','utf8'),index=fs.readFileSync('index.html','utf8');
assert.ok(main.includes('SagsL2BriefV223?.make')&&main.includes('const brief=isL2?data.dailyBrief?.entries||[]:[];'),
 'Confirmed L2 findings must be inserted in the corresponding L1 section, not a duplicate report');
assert.ok(main.includes("!known(ctrl.action)")&&main.includes("item.key!=='checkin'"),'Manual editorial action overrides and confirmed personnel totals must take priority');
assert.ok(index.includes('v223-l2-brief.js'),'Daily engine must load on every page');
assert.ok(index.indexOf('v223-l2-brief.js')<index.indexOf('v19-report.js'),'Engine before report builder');
assert.ok(fs.readFileSync('report-export-v29.js','utf8').includes('SagsOfficeExportV29.exportElement'),
 'Word/PDF must export from the same rendered L2 report');
console.log('PASS V2.23 daily L2 briefing: day-specific scenarios, actual gate/stands/booking/cargo, no fabricated issues, manual overrides and Word/PDF DOM');
