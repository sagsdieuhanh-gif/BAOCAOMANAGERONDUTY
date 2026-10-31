'use strict';
const assert=require('node:assert/strict');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const m=globalThis.SagsShuttleModel;
const grid=globalThis.SagsShuttleGridV24._test;
const exported=globalThis.SagsShuttleExport._test;
const dir='CXR_NHA';
const values=[
 {unit:'DH',direction:dir,departure_min:660,line_no:0,quantity:2,is_custom:true}, // 11:00
 {unit:'DH',direction:dir,departure_min:990,line_no:0,quantity:6}, // fixed 16:30
 {unit:'PVHK',direction:dir,departure_min:600,line_no:0,quantity:3,is_custom:true}, // 10:00
 {unit:'KTS',direction:dir,departure_min:660,line_no:1,quantity:4,is_custom:true}, // same-time extra coach
 {unit:'DH',direction:'NHA_CXR',departure_min:630,line_no:0,quantity:5,is_custom:true} // other direction
];
const added=[
 {direction:dir,departure_min:660,line_no:0,reason:'xe tăng cường'},
 {direction:dir,departure_min:660,line_no:1,reason:'xe bổ sung cùng giờ'},
 {direction:dir,departure_min:600,line_no:0,reason:'chuyến 10 giờ'}
];
const extracted=records=>records.filter(x=>x.direction===dir)
 .filter(x=>[600,660,990].includes(x.departure_min))
 .map(x=>[x.departure_min,x.line_no||0]);
const expected=[[600,0],[660,0],[660,1],[990,0]];
assert.deepEqual(extracted(grid.assemble(values,added)),expected,
 'Live shuttle form must interleave 10:00 → 11:00 (+ extra coach) → 16:30, not append custom hours');
assert.deepEqual(extracted(exported.normalize(values,added)),expected,
 'PNG and PDF source must use identical chronological order');
const html=grid.makeGrid(dir,grid.assemble(values,added),'DH');
assert.ok(html.indexOf('>10:00</b>')>=0);
assert.ok(html.indexOf('>10:00</b>')<html.indexOf('>11:00</b>'));
assert.ok(html.indexOf('>11:00</b>')<html.indexOf('>16:30</b>'),
 'Visible table rows must read 10:00, 11:00, 16:30');
const timeline=m.order([
 {direction:dir,departure_min:1560},
 {direction:dir,departure_min:660},
 {direction:dir,departure_min:1935},
 {direction:dir,departure_min:990}
]).map(x=>x.departure_min);
assert.deepEqual(timeline,[660,990,1560,1935],'After-midnight (+1) remains after current-day departures');
assert.deepEqual(values[0].departure_min,660,'Sort must not mutate persisted booking source records');
assert.ok(grid.assemble(values,added).find(x=>x.direction==='NHA_CXR'&&x.departure_min===630),
 'Other direction must retain independent added time');
console.log('PASS V3.05: mixed default/custom 10:00 → 11:00 → 16:30, extra coach and (+1) ordered identically in live grid and PNG/PDF');
