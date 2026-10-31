'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const model=globalThis.SagsShuttleModel,ui=globalThis.SagsShuttleGridV24._test;
const exporter=globalThis.SagsShuttleExport._test;
const nha=model.defaults.filter(x=>x.direction==='NHA_CXR');
const cxr=model.defaults.filter(x=>x.direction==='CXR_NHA');
assert.deepEqual(nha.map(x=>x.departure_min),[420,1050,1170],
 'NHA → CXR fixed times: 07:00,17:30,19:30');
assert.deepEqual(cxr.map(x=>x.departure_min),[510,990,1110,1560,1935],
 'CXR → NHA fixed times: 08:30 today,16:30,18:30,02:00 next day,08:15 next day');
assert.equal(model.clock(510),'08:30');
assert.equal(model.clock(1935),'08:15');
assert.equal(model.isNextDay(510),false);
assert.equal(model.isNextDay(1560),true);
assert.equal(model.isNextDay(1935),true);
const extra=[{direction:'CXR_NHA',departure_min:660,line_no:0,reason:'Xe 11 giờ'}];
const personRows=[{unit:'DH',direction:'CXR_NHA',departure_min:660,line_no:0,quantity:20}];
const rows=ui.assemble(personRows,extra);
const times=rows.filter(x=>x.direction==='CXR_NHA').map(x=>x.departure_min);
assert.deepEqual(times,[510,660,990,1110,1560,1935],
 '11:00 should come after today 08:30 and before 16:30, with next-day buses at the end');
assert.deepEqual(exporter.normalize(personRows,extra).filter(x=>x.direction==='CXR_NHA')
 .map(x=>x.departure_min),times,'PNG/PDF preserves the same actual chronology');
const html=ui.makeGrid('CXR_NHA',rows,'DH');
const visible=[...html.matchAll(/class="v24-time"><b>(\d\d:\d\d)<\/b>/g)].map(x=>x[1]);
assert.deepEqual(visible,['08:30','11:00','16:30','18:30','02:00','08:15'],
 'Actual HTML table must show all five fixed departures and custom 11:00');
assert.equal((html.match(/class="v308-next-day"/g)||[]).length,2,
 '02:00 and 08:15 must be visibly labeled as NEXT DAY; 08:30 is same-day');
const example=ui.vehicleGuide();
for(const num of [20,40,50,60])assert.ok(example.includes('data-v308-example="'+num+'"'),
 'Always show bus choice example for '+num+' people');
assert.ok(example.includes('shuttle-29.webp')&&example.includes('shuttle-45.webp'));
assert.equal(model.suggestVehicles(20).n29,1);
assert.equal(model.suggestVehicles(40).n45,1);
assert.equal(model.suggestVehicles(50).n29,2);
assert.equal(model.suggestVehicles(60).n29,1);
assert.equal(model.suggestVehicles(60).n45,1);
const estimate=ui.proposal([20,null,null,null],false);
assert.equal(estimate.entered,1);
assert.equal(estimate.n29,1);
assert.equal(estimate.official,false);
assert.match(estimate.label,/TẠM TÍNH/);
const confirmed=ui.proposal([20,15,15,10],true);
assert.equal(confirmed.official,true);
assert.equal(confirmed.n29,1);
assert.equal(confirmed.n45,1);
assert.ok(!confirmed.label.includes('TẠM TÍNH'));
assert.equal(ui.proposal([null,null,null,null],false).people,null,
 'Missing is unknown, not zero, and should not propose any vehicles');
assert.ok(html.includes('TẠM TÍNH · 29 CHỖ'),
 'A single entered row should immediately show a provisional vehicle choice');
assert.ok(html.includes('GỢI Ý THEO TỪNG GIỜ XE'));
const code=fs.readFileSync('v24-shuttle-grid.js','utf8');
assert.ok(code.includes("div.addEventListener('input',onQuantityInput)"),
 'Updating headcount must refresh current bus advice without waiting for save');
assert.ok(code.includes("model().suggestVehicles(people)"));
assert.ok(code.includes('vehicleGuide()+makeGrid('),'Static vehicle examples must appear above both direction tables');
const migration=fs.readFileSync('server/v308-shuttle-eight-fixed.sql','utf8');
assert.ok(migration.includes('(510,990,1110,1560,1935)'));
console.log('PASS V3.08: correct eight official trips, next-day chronology, automatic 29/45-seat provisional and confirmed recommendations');
