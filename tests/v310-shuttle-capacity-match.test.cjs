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
const top=drawn.filter(v=>v.y>=169&&v.y<=216);
assert.ok(top.some(v=>v.kind==='text'&&v.txt==='17:30 · 42 NGƯỜI'),
 'Export banner must reference actual 17:30 departure with 42 people');
assert.ok(top.some(v=>v.kind==='text'&&v.txt==='16:30 · 50 NGƯỜI'),
 'Export banner must reference actual 16:30 departure with 50 people');
assert.ok(top.some(v=>v.kind==='text'&&v.txt.includes('45 CHỖ')),
 'Banner must recommend 45-seat vehicle for the 42-person run');
assert.ok(top.some(v=>v.kind==='text'&&v.txt.includes('45C + 29C')),
 'Banner must recommend 45+29 for the 50-person run');
assert.ok(top.some(v=>v.kind==='image'&&v.bus==='45'),'Actual top banner must draw a 45-seat vehicle');
assert.ok(top.some(v=>v.kind==='image'&&v.bus==='29'),'Actual 50-person run must include 29-seat vehicle');
assert.ok(!top.some(v=>v.kind==='text'&&v.txt.includes('20 NGƯỜI')),
 'Never show unrelated hardcoded passenger examples in operational report');
const source=fs.readFileSync('v24-shuttle-grid.js','utf8');
assert.ok(!source.includes("vehicleGuide()+makeGrid("),'Do not show unrelated example vehicles above live input');
console.log('PASS V3.11: capacity never under headcount, 30-45=45C, 46-74=45C+29C, image banner uses real departure totals');
