'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const m=globalThis.SagsShuttleModel;
const g=globalThis.SagsShuttleGridV24._test;
const e=globalThis.SagsShuttleExport._test;
const date='2026-11-01',dir='CXR_NHA';
const four=(min,values)=>['DH','PVHK','KTS','QA_IT'].map((unit,i)=>({
 service_date:date,unit,direction:dir,departure_min:min,line_no:0,
 quantity:values[i],confirmed_at:'2026-10-31T10:00:00Z'
}));
const full=[...four(660,[21,10,6,7]),...four(990,[23,12,16,9])]; // 44 and 60
const extra=[{direction:dir,departure_min:660,line_no:0,reason:'Xe tăng cường 11:00'}];
const rows=g.assemble(full,extra);
const grid=g.makeGrid(dir,rows,'DH');
assert.ok(grid.includes('v306-vehicle-showcase'),'Vehicle recommendation must be prominent before wide table');
assert.ok(g.vehicleGuide().includes('🚌 GỢI Ý XE 29 / 45 CHỖ'),'Keep permanently visible 29/45-seat examples');
assert.ok(grid.includes('GỢI Ý THEO TỪNG GIỜ XE'),'Keep the per-hour live recommendation heading');
assert.ok(grid.includes('shuttle-29.webp')&&grid.includes('shuttle-45.webp'),
 'Both SAGS bus pictures must be available in the visible recommendation');
assert.ok(grid.includes('data-v306-slot="CXR_NHA|660|0"'),
 '11:00 suggestion must be present outside horizontally scrolled cells');
assert.ok(grid.includes('data-v306-slot="CXR_NHA|990|0"'),'16:30 suggestion must be present');
assert.ok(grid.indexOf('v306-vehicle-showcase')<grid.indexOf('v24-table-scroll'),
 'Vehicle thumbnails must be above scrolling columns, visible on mobile');
assert.ok(grid.includes('×1'),'Show vehicle count on image');
assert.ok(grid.includes('45 CHỖ')||grid.includes('45C'),'Provide concrete bus type');
assert.ok(grid.includes('29C')&&grid.includes('45C'),
 'A 60-person trip must suggest the correct mixed fleet according to the existing model');
const normalized=e.normalize(full,extra);
assert.deepEqual(rows.filter(x=>x.direction===dir).map(x=>x.departure_min),
 normalized.filter(x=>x.direction===dir).map(x=>x.departure_min),
 'On-screen recommendations and export must use same chronological slot sequence');
assert.ok(m.suggestVehicles(60).n29===1&&m.suggestVehicles(60).n45===1,
 'The original 29/45-seat vehicle optimization must be retained');
const partial=g.makeGrid(dir,g.assemble(four(660,[4,3,2,1]).slice(0,2),[]),'PVHK');
assert.ok(partial.includes('shuttle-29.webp')&&partial.includes('shuttle-45.webp'),
 'Car illustrations stay visible even if 4 units have not confirmed');
assert.ok(partial.includes('chờ')||partial.includes('Chưa đủ'),
 'Incomplete staffing must not be presented as an official recommendation');
assert.ok(partial.includes('data-v306-slot="CXR_NHA|660|0"'),
 'Each scheduled time remains visible in the summary even while awaiting data');
assert.ok(partial.includes('TẠM TÍNH'),
 'The incomplete hour must show provisional vehicle type without presenting it as final');
const stylesheet=fs.readFileSync('v300-workspace.css','utf8');
assert.ok(stylesheet.includes('.v306-vehicle-showcase'));
assert.ok(stylesheet.includes('.v306-vehicle-legend img'));
assert.ok(stylesheet.includes('@media(max-width:720px)'));
const index=fs.readFileSync('index.html','utf8');
assert.ok(index.includes('v300-workspace.css?v=3.09'));
assert.ok(index.includes('v24-shuttle-grid.js?v=3.09'));
console.log('PASS V3.09: visible 29/45-seat pictures and optimized coach counts, incomplete warnings, chronologically consistent input/PNG/PDF');
