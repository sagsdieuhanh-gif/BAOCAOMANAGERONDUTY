'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const model=globalThis.SagsShuttleModel;
const grid=globalThis.SagsShuttleGridV24._test;
const exp=globalThis.SagsShuttleExport._test;
const dir='CXR_NHA';
const dept=['DH','PVHK','KTS','QA_IT'];
const persons=(minute,counts)=>dept.map((unit,i)=>({
 unit,direction:dir,departure_min:minute,line_no:0,
 quantity:counts[i],confirmed_at:'2026-10-31T09:00:00Z'
}));
const sample=[...persons(660,[21,13,14,12]), ...persons(990,[12,16,10,8])];
const extra=[{direction:dir,departure_min:660,line_no:0,reason:'Xe 11 giờ'}];
const rows=grid.assemble(sample,extra);
const ids=rows.filter(x=>x.direction===dir).map(x=>x.departure_min);
assert.deepEqual(ids,[660,990,1110,1560,1935], 'Display 11:00, 16:30, 18:30 then 02:00/08:15 next day');
assert.deepEqual(exp.normalize(sample,extra).filter(x=>x.direction===dir).map(x=>x.departure_min),ids,
 'Export PNG/PDF must have identical order and retain original stored minute keys');
assert.equal(model.clock(1935),'08:15','Official 08:15 must never show (+1)');
assert.equal(model.clock(1560),'02:00','Official 02:00 must not be marked (+1)');
const html=grid.makeGrid(dir,rows,'DH');
const times=[...html.matchAll(/class="v24-time"><b>(\d{2}:\d{2})<\/b>/g)].map(m=>m[1]);
assert.deepEqual(times,['11:00','16:30','18:30','02:00','08:15'],'Rendered main rows must follow the actual service day then following day');
assert.ok(!html.includes('GỢI Ý')&&!html.includes('v306-vehicle-showcase'),'No suggestions in headcount entry');
assert.ok(html.includes('data-v24-key="CXR_NHA|660|0"'),'Added 11:00 must remain editable');
assert.ok(html.includes('v307-extras'),'Existing edit/delete controls must remain accessible but collapsed');
assert.ok(!html.includes('class="v28-missing-row"')&&!html.includes('class="v28-reason-row"'),
 'No longer interleave 2+ noisy notes/confirmation rows between departure times');
assert.ok(html.includes('data-v28-reason="CXR_NHA|660|0"'),'Optional drawer must keep reason-edit capability');
assert.ok(html.includes('data-v27-delete="CXR_NHA|660|0"'),'Optional drawer must keep delete capability');
const all=grid.makeGrid(dir,grid.assemble([...sample,...persons(600,[1,2,3,4])],
 [...extra,{direction:dir,departure_min:600,line_no:0,reason:'10 giờ'}]),'DH');
const sorted=[...all.matchAll(/class="v24-time"><b>(\d{2}:\d{2})<\/b>/g)].map(m=>m[1]);
assert.deepEqual(sorted,['10:00','11:00','16:30','18:30','02:00','08:15'],
 'Custom 10:00 and 11:00 must be interleaved while preserving next-day 02:00 and 08:15');
const partial=grid.makeGrid(dir,grid.assemble([{unit:'DH',direction:dir,departure_min:660,line_no:0,quantity:2}],extra),'PVHK');
assert.ok(partial.includes('data-v24-key="CXR_NHA|660|0"'),'Partially confirmed hours stay editable');
assert.ok(grid.vehicleGuide().includes('shuttle-29.webp')&&grid.vehicleGuide().includes('shuttle-45.webp'),
 'The always-visible guide must retain illustrations of 29- and 45-seat coaches');
const ui=fs.readFileSync('v24-shuttle-grid.js','utf8');
assert.ok(ui.includes('show();\n   const req=++sequence;'),'Show timetable before any Supabase query');
const index=fs.readFileSync('index.html','utf8');
assert.match(index,/const APP_VERSION='V3\.13'/);
console.log('PASS V3.10: visible 02:00 → 08:15 → 10:00 → 11:00 → 16:30; compact one-row-per-time table, 29/45-seat suggestions and reliable first paint');
