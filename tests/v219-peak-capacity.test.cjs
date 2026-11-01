'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const a=require('../v219-ops-forecast.js');
const payload={source_detail:{
 arrivals:[
  {no:'VJ101',t:550,route:'SGN-CXR',bay:53},
  {no:'KE401',t:575,route:'ICN-CXR',bay:33},
  {no:'AK203',t:620,route:'KUL-CXR',bay:58},
  {no:'TW042',t:1500,route:'PUS-CXR',bay:56}
 ],
 departures:[
  {no:'VJ102',t:595,route:'CXR-SGN',bay:53,gate:'G1',carrier:'VJ'},
  {no:'KE402',t:605,route:'CXR-ICN',bay:33,gate:'G2',carrier:'KE'},
  {no:'AK204',t:660,route:'CXR-KUL',bay:58,gate:'G5',carrier:'AK'}
 ]},
 flights:[
  {arrival:'VJ101',departure:'VJ102',sta_min:550,std_min:595,bay:53,airline:'VJ'},
  {arrival:'KE401',departure:'KE402',sta_min:575,std_min:605,bay:33,airline:'KE'},
  {arrival:'AK203',departure:'AK204',sta_min:620,std_min:660,bay:58,airline:'AK'}
 ]};
const chart=a.movements(payload);
assert.equal(chart.slots.length,24);
assert.deepEqual([chart.slots[9].ia,chart.slots[9].id,chart.slots[9].da,chart.slots[9].dd],[1,0,1,1]);
assert.deepEqual([chart.slots[10].ia,chart.slots[10].id,chart.slots[10].da,chart.slots[10].dd],[1,1,0,0]);
assert.equal(chart.verified,6);
assert.equal(chart.plusOne,1);
const l1={source_detail:{arrivals:[{flight:'VJ101',row:12}],departures:[{flight:'VJ102',row:13}]},
  flights:[{arrival:'VJ101',departure:'VJ102',sta_min:540,std_min:605,international:false,
    arrival_route:'SGN-CXR',departure_route:'CXR-SGN'}]};
const l1hours=a.movements(l1);
assert.equal(l1hours.verified,2,'L1 metadata-only source_detail must use flights paired STA/STD');
assert.equal(l1hours.slots[9].da,1);
assert.equal(l1hours.slots[10].dd,1);

assert.ok(a.svg(chart).includes('Quốc tế đến')&&a.svg(chart).includes('Quốc nội đi'));
assert.equal(a.zone(53),'K1');assert.equal(a.zone(39),'K2');assert.equal(a.zone(60),'K3');
const verified=a.boardings([
 {no:'VJ201',t:610,gate:'G1',boarding_start:565,boarding_finish:590,carrier:'VJ'},
 {no:'VJ203',t:615,gate:'G1',boarding_start:580,boarding_finish:603,carrier:'VJ'}
],[]);
assert.equal(verified.warnings.length,1);assert.equal(verified.warnings[0].verified,true);
const etaRisk=a.boardings([{no:'VJ501',t:680,gate:'G8',carrier:'VJ'}],
 [{departure:'VJ501',sta_min:640,eta_min:670,std_min:680,airline:'VJ'}]);
assert.equal(etaRisk.risky.length,1,'Delayed ETA requires boarding-risk warning');
const reference=a.boardings([
 {no:'KE401',t:610,gate:'G1',carrier:'KE'},
 {no:'VJ401',t:615,gate:'G1',carrier:'VJ'}
],[]);
assert.equal(reference.warnings.length,1);assert.equal(reference.warnings[0].verified,false);
assert.equal(a.boardingWindow({no:'QH120',t:620}),null,'Unknown carrier has no invented gate opening');
const pairs=[
 {arrival:'VJ300',departure:'VJ301',sta_min:600,std_min:660,bay:56,airline:'VJ',cargo_status:'NO_CARGO'},
 {arrival:'VJ302',departure:'VJ303',sta_min:605,std_min:665,bay:57,airline:'VJ',cargo_status:'NO_CARGO'}
];
const staff=[
 {role_code:'BAGGAGE',quantity:6,start_min:580,end_min:780,confirmed_at:'2026-10-30T00:00:00Z'},
 {role_code:'GSE_DRIVER',quantity:2,start_min:580,end_min:780,confirmed_at:'2026-10-30T00:00:00Z'},
 {role_code:'PVHK_DEPARTURE_TEAM',quantity:2,start_min:500,end_min:700,confirmed_at:'2026-10-30T00:00:00Z'}
];
const gse=[
 {code:'STAIRS',ready_count:3},{code:'COBUS_LARGE',ready_count:4},
 {code:'BELT',ready_count:4},{code:'TRACTOR',ready_count:4}
];
const contract=[{airline:'VJ',checkin_counters:3,staff_per_counter:1,checkin_open_lead:120,checkin_close_lead:40}];
const src={departures:[{no:'VJ301',t:660,gate:'G1',carrier:'VJ',checkin_open:null,checkin_close:null}]};
const windows=a.capacity(pairs,staff,gse,contract,src);
const w=windows.find(x=>x.start===600);
assert.equal(w.total,2);assert.equal(w.outer,2);
assert.equal(w.gse.find(x=>x.key==='STAIRS').required,4);
assert.equal(w.gse.find(x=>x.key==='STAIRS').shortage,1);
assert.equal(w.baggage.need,6);assert.equal(w.baggage.shortage,0);
assert.equal(w.driver.need,2);assert.equal(w.driver.shortage,0);
assert.equal(w.cobusDrivers.need,4);
assert.equal(w.cobusDrivers.shortage,null,'No Cobus driver capacity confirmed');
assert.equal(w.gateStaff.shortage,null,'No signed gate staffing rule, no staffing verdict');
const check=windows.find(x=>x.start===570);
assert.equal(check.checkin.required,3);
assert.equal(check.checkin.available,2);
assert.equal(check.checkin.shortage,1);
const uncertain=a.capacity(pairs,staff,gse,[],src);
assert.equal(uncertain.find(x=>x.start===570).checkin.shortage,null,'No contract, no staff verdict');
const noCargo=a.capacity(pairs.map(x=>({...x,cargo_status:'UNKNOWN'})),staff,gse,contract,src);
assert.equal(noCargo.find(x=>x.start===600).baggage.shortage,null,'Unknown cargo, no fake sufficiency');
assert.equal(noCargo.find(x=>x.start===600).baggage.scenarioMin,6);
assert.equal(noCargo.find(x=>x.start===600).baggage.scenarioMax,12);
assert.equal(noCargo.find(x=>x.start===600).driver.scenarioMin,2);
assert.equal(noCargo.find(x=>x.start===600).driver.scenarioMax,4);
const html=fs.readFileSync('index.html','utf8'),report=fs.readFileSync('v19-report.js','utf8');
assert.ok(html.includes('id="v219HourlyPeak"')&&html.includes('v219-peak-ui.js'));
assert.ok(report.includes("SagsOpsForecastV219?.summarize")&&report.includes('PHÂN BỔ LƯỢT BAY THEO GIỜ'));
assert.ok(fs.existsSync('v219-contract-input.js'));
console.log('PASS 24h four-series Peak Hours, verified/estimated gate collision, stand zones, and conditional GSE/staff deficits');