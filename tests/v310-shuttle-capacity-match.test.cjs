'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const model=globalThis.SagsShuttleModel,ui=globalThis.SagsShuttleGridV24._test;
const exporter=globalThis.SagsShuttleExport._test;
for(let pax=0;pax<=180;pax++){
 const plan=model.suggestVehicles(pax);
 assert.ok(plan,'Must have a safe capacity for '+pax);
 assert.ok(plan.seats>=pax,'Never provide too few seats for '+pax+' people');
 assert.equal(plan.seats,plan.n29*29+plan.n45*45);
 assert.equal(plan.count,plan.n29+plan.n45);
}
for(let pax=30;pax<=45;pax++){
 const plan=model.suggestVehicles(pax);
 assert.deepEqual([plan.n45,plan.n29],[1,0],pax+' people MUST display only one 45-seat coach');
}
for(let pax=46;pax<=74;pax++){
 const plan=model.suggestVehicles(pax);
 assert.deepEqual([plan.n45,plan.n29],[1,1],pax+' people MUST display one 45C plus one 29C');
}
assert.deepEqual([model.suggestVehicles(75).n45,model.suggestVehicles(75).n29],[2,0]);
const gridRows=ui.assemble([
 {unit:'DH',direction:'NHA_CXR',departure_min:1050,line_no:0,quantity:42},
 {unit:'DH',direction:'CXR_NHA',departure_min:990,line_no:0,quantity:50}
],[]);
const htmlN=ui.makeGrid('NHA_CXR',gridRows,'DH'),htmlC=ui.makeGrid('CXR_NHA',gridRows,'DH');
assert.ok(!htmlN.includes('v306-vehicle-showcase')&&!htmlC.includes('v306-vehicle-showcase'),'No vehicle proposals in entry');
assert.ok(htmlN.includes('data-v24-value="DH"')&&htmlC.includes('data-v24-value="DH"'));
const exportRows=exporter.normalize([
 {unit:'DH',direction:'NHA_CXR',departure_min:1050,line_no:0,quantity:42},
 {unit:'DH',direction:'CXR_NHA',departure_min:990,line_no:0,quantity:50}
]);
const drawn=[];
const ctx={};
for(const method of ['beginPath','moveTo','lineTo','quadraticCurveTo','closePath','fill','stroke','fillRect','strokeRect','save','restore','translate','arc','bezierCurveTo','setLineDash'])ctx[method]=()=>{};
ctx.fillText=(txt,x,y)=>drawn.push({kind:'text',txt:String(txt),x,y});
ctx.drawImage=(image,x,y)=>drawn.push({kind:'image',bus:image?.name||'logo',x,y});
globalThis.document={createElement(name){if(name!=='canvas')throw Error('Unexpected '+name);return {width:0,height:0,getContext:()=>ctx};}};
const canvas=exporter.draw({date:'2026-10-31',rows:exportRows},
 {naturalWidth:100,naturalHeight:50,name:'logo'},
 {small:{naturalWidth:90,naturalHeight:50,name:'29'},big:{naturalWidth:90,naturalHeight:50,name:'45'}});
assert.ok(canvas.width>1000);
const texts=drawn.filter(v=>v.kind==='text').map(v=>v.txt);
assert.ok(texts.includes('17:30')&&texts.includes('16:30'),
 'Export must show the actual 17:30 and 16:30 clocks');
assert.ok(texts.includes('42')&&texts.includes('50'),
 'Export card totals must derive from actual data, not examples');
assert.ok(texts.includes('GỢI Ý XE: '+model.suggestVehicles(42).label),
 '42 staff must get exactly one 45-seat coach in its own card');
assert.ok(texts.includes('GỢI Ý XE: '+model.suggestVehicles(50).label),
 '50 staff must get one 45C + one 29C in its own card');
assert.ok(!texts.includes('GỢI Ý XE THEO GIỜ'),
 'Do not reintroduce redundant top banner after compact V3.33 UI');
assert.ok(!texts.includes('20 NGƯỜI'),'Never show canned passenger examples in operational report');
assert.ok(!drawn.some(v=>v.kind==='image'&&(v.bus==='29'||v.bus==='45')),
 'Compact report deliberately omits decorative vehicle images');
const source=fs.readFileSync('v24-shuttle-grid.js','utf8');
assert.ok(!source.includes("vehicleGuide()+makeGrid("),'Do not show unrelated example vehicles above live input');
console.log('PASS V3.36: capacity never under headcount; compact per-time suggestions use real confirmed totals');
