'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const m=globalThis.SagsShuttleModel,ui=globalThis.SagsShuttleGridV24._test,e=globalThis.SagsShuttleExport._test;
const guide=ui.vehicleGuide();
assert.ok(guide.includes('data-v308-example="50"'));
assert.ok(guide.includes('2 XE: 45C + 29C'),'50 employees must NOT use two 29-seat coaches');
for(const [p,big,small] of [[20,0,1],[40,1,0],[46,1,1],[50,1,1],[58,1,1],[60,1,1],[74,1,1],[75,2,0]]){
 const x=m.suggestVehicles(p);
 assert.equal(x.n45,big,'45-seat coach count for '+p+' employees');
 assert.equal(x.n29,small,'29-seat coach count for '+p+' employees');
}
const complete=['DH','PVHK','KTS','QA_IT'].map((unit,i)=>({
 unit,direction:'CXR_NHA',departure_min:990,line_no:0,quantity:[20,15,10,5][i]
}));
const partial=[{unit:'DH',direction:'CXR_NHA',departure_min:1935,line_no:0,quantity:20}];
const rows=e.normalize([...complete,...partial],[]);
const paint=[];
const context={};
for(const k of ['beginPath','moveTo','lineTo','quadraticCurveTo','closePath','fill','stroke','fillRect','strokeRect','save','restore','translate','arc','bezierCurveTo','setLineDash'])context[k]=()=>{};
context.fillText=(label,x,y)=>paint.push({kind:'text',label:String(label),x,y});
context.drawImage=(image,x,y,w,h)=>paint.push({kind:'image',image:image?.kind,x,y,w,h});
globalThis.document={createElement(tag){
 if(tag!=='canvas')throw Error('Unexpected element '+tag);
 return {width:0,height:0,getContext:()=>context};
}};
const canvas=e.draw({date:'2026-10-31',rows},{naturalWidth:100,naturalHeight:100,kind:'SAGS'},
 {small:{naturalWidth:120,naturalHeight:80,kind:'29'},big:{naturalWidth:120,naturalHeight:80,kind:'45'}});
assert.equal(canvas.width,1420);
const banner=paint.find(p=>p.kind==='text'&&p.label==='GỢI Ý XE');
assert.ok(banner&&banner.y<228,'Compact illustrated suggestion strip must appear inside export at TOP, before route tables');
assert.ok(paint.some(p=>p.label==='16:30 · 50 NGƯỜI'&&p.y<228));
assert.ok(paint.some(p=>p.label==='2 XE: 45C + 29C'&&p.y<228));
assert.ok(!paint.some(p=>p.label==='40 NGƯỜI'&&p.y<228),
 'No misleading unrelated generic 40-person example is shown in exported heading');
assert.ok(paint.filter(p=>p.kind==='image'&&(p.image==='29'||p.image==='45')&&p.y<228).length>=3,
 'The small upper image strip must actually draw bus illustrations, not only labels');
assert.ok(paint.some(p=>p.kind==='text'&&p.label.includes('GỢI Ý: 2 XE: 45C + 29C')),
 'Confirmed 50-person trip must show recommended 45C+29C in its own exported card');
assert.ok(paint.some(p=>p.kind==='text'&&p.label.includes('TẠM TÍNH: 29 CHỖ')),
 'Partial 20-person trip must show provisional 29C suggestion in exported card');
assert.ok(paint.some(p=>p.kind==='text'&&p.label==='NGÀY HÔM SAU'),
 '08:15 trip must show its next-day label in exported image');
assert.ok(paint.some(p=>p.kind==='text'&&p.label==='16:30'));
assert.ok(paint.some(p=>p.kind==='text'&&p.label==='08:15'));
assert.ok(paint.filter(p=>p.kind==='image'&&(p.image==='29'||p.image==='45')).every(p=>p.w<=70&&p.h<=43),'Vehicle icons must be smaller in final export');
const index=fs.readFileSync('index.html','utf8');
for(const file of ['v21-shuttle-model.js','v21-shuttle-export.js','v24-shuttle-grid.js'])
 assert.ok(index.includes(file+'?v=3.11'),'Cache-bust changed '+file);
assert.ok(index.includes("APP_VERSION='V3.11'"));
console.log('PASS V3.11: eight fixed routes, compact top image bus advice, 45C+29C preference, partial/confirmed labels and next-day timing');
