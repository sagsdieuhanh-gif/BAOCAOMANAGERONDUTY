'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const m=globalThis.SagsShuttleModel;
const g=globalThis.SagsShuttleGridV24._test;
const e=globalThis.SagsShuttleExport._test;
const fixed={
 NHA_CXR:[420,1050,1170],
 CXR_NHA:[990,1110,1560,1935]
};
assert.deepEqual(m.defaults.filter(x=>x.direction==='NHA_CXR').map(x=>x.departure_min),fixed.NHA_CXR);
assert.deepEqual(m.defaults.filter(x=>x.direction==='CXR_NHA').map(x=>x.departure_min),fixed.CXR_NHA);
assert.equal(m.clock(1560),'02:00');
assert.equal(m.clock(1935),'08:15');
assert.equal(m.parseClock('02:00',true),1560);
for(const [direction,minutes] of Object.entries(fixed)){
 for(const minute of minutes)assert.equal(m.isDefault(direction,minute),true,'Must protect '+direction+' '+minute);
}
assert.equal(m.isDefault('CXR_NHA',1185),false,'19:45 must remain addable');
assert.equal(m.isDefault('NHA_CXR',1230),false,'20:30 must remain addable');
const recorded=[{unit:'DH',direction:'CXR_NHA',departure_min:1560,line_no:0,quantity:7}];
const rows=g.assemble(recorded,[]);
assert.equal(rows.filter(x=>x.direction==='CXR_NHA').length,4);
const slot=rows.find(x=>x.departure_min===1560);
assert.ok(slot&&slot.defaultTime,'02:00 is a base row, never a removable additional slot');
assert.equal(slot.cells[0].quantity,7,'Existing data at 02:00 is preserved');
const grid=g.makeGrid('CXR_NHA',rows,'DH');
assert.ok(grid.includes('02:00'));
assert.ok(grid.includes('08:15'));
assert.ok(grid.includes('THÊM GIỜ XE'));
const custom=[{unit:'PVHK',direction:'CXR_NHA',departure_min:1185,line_no:0,quantity:4}];
const withOther=g.assemble([...recorded,...custom],[]);
assert.equal(withOther.find(x=>x.departure_min===1185).defaultTime,false);
const exported=e.normalize([...recorded,...custom]);
assert.ok(exported.find(x=>x.direction==='CXR_NHA'&&x.departure_min===1560&&!x.is_custom),'PNG/PDF must include fixed 02:00');
assert.ok(exported.find(x=>x.direction==='CXR_NHA'&&x.departure_min===1185&&x.is_custom),'PNG/PDF must keep custom hours');
const index=fs.readFileSync('index.html','utf8');
assert.ok(/Báo cáo điều hành V3\.\d{2}/.test(index));
for(const file of ['v21-shuttle-model.js','v21-shuttle-export.js']){
 assert.ok(index.includes(file+'?v=3.05'),'Chronological model/export assets must bypass cache: '+file);
}
assert.ok(index.includes('v24-shuttle-grid.js?v=3.06'),
 'Restored shuttle personnel grid must bypass legacy asset cache');
const migration=fs.readFileSync('server/v227-shuttle-fixed-seven.sql','utf8');
assert.ok(migration.includes('(990,1110,1560,1935)'),'DB protects 02:00 along with previous fixed departures');
assert.ok(migration.includes('ops_remove_shuttle_addition'));
assert.ok(migration.includes('ops_set_shuttle_reason'));
console.log('PASS V3.07: seven fixed storage keys retained, clean 02:00/08:15 labels and chronological clock ordering');
