'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
require('../v21-shuttle-model.js');require('../v24-shuttle-grid.js');require('../v21-shuttle-export.js');
const m=globalThis.SagsShuttleModel,g=globalThis.SagsShuttleGridV24._test,e=globalThis.SagsShuttleExport._test;
const fixed={NHA_CXR:[420,1050,1170],CXR_NHA:[990,1110,1560,1935]};
for(const [d,slots] of Object.entries(fixed)){
 assert.deepEqual(m.defaults.filter(x=>x.direction===d).map(x=>x.departure_min),slots);
 for(const slot of slots)assert.ok(m.isDefault(d,slot),'Must protect official '+slot);
}
assert.equal(m.isDefault('CXR_NHA',510),false);
assert.equal(m.clock(1935),'08:15');assert.equal(m.clock(1560),'02:00');
assert.ok(m.isNextDay(1935));
const duplicated=['DH','PVHK','KTS','QA_IT'].flatMap((unit,i)=>[
 {unit,direction:'CXR_NHA',departure_min:510,line_no:0,quantity:10+i},
 {unit,direction:'CXR_NHA',departure_min:1935,line_no:0,quantity:10+i}
]);
const rows=g.assemble(duplicated,[]),exported=e.normalize(duplicated,[]);
assert.equal(rows.filter(x=>x.direction==='CXR_NHA').length,4,'08:30 must not appear in grid');
assert.ok(!rows.some(x=>x.departure_min===510)&&!exported.some(x=>x.departure_min===510),'Do not export obsolete row');
assert.equal(rows.find(x=>x.departure_min===1935).total,46,'08:15 total preserved');
const grid=g.makeGrid('CXR_NHA',rows,'DH');
assert.ok(grid.includes('08:15')&&grid.includes('NGÀY HÔM SAU')&&!grid.includes('08:30'));
const index=fs.readFileSync('index.html','utf8');
assert.ok(index.includes("APP_VERSION='V3.21'"));
for(const file of ['v21-shuttle-model.js','v21-shuttle-export.js','v24-shuttle-grid.js'])
 assert.ok(index.includes(file+'?v=3.11'));
const migration=fs.readFileSync('server/v311-shuttle-0815-not-0830.sql','utf8');
assert.ok(migration.includes('(990,1110,1560,1935)')&&migration.includes('departure_min=1935'));
console.log('PASS V3.11 phantom 08:30 removed; confirmed 08:15 kept; seven protected official slots');
