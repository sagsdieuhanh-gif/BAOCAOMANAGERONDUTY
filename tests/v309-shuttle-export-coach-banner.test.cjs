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
const canvas=e.draw({date:'2026-10-31',rows},{naturalWidth:100,naturalHeight:100,kind:'SAGS'});
assert.equal(canvas.width,1300,'V3.33+ compact export is 1300 pixels wide');
const texts=paint.filter(p=>p.kind==='text').map(p=>p.label);
assert.ok(texts.includes('16:30')&&texts.includes('08:15'),'Both fixed departure times survive');
assert.ok(texts.includes('50'),'Confirmed actual total is used, not a canned example');
assert.ok(texts.includes('ĐỦ 4/4 ĐƠN VỊ'),'Four-unit full confirmation remains visible');
assert.ok(texts.includes('TẠM TÍNH 1/4'),'Partial input remains explicitly provisional');
assert.ok(texts.includes('GỢI Ý XE: '+m.suggestVehicles(50).label),
 'Correct 45+29-seat proposal stays in its own card');
assert.ok(texts.includes('GỢI Ý XE: '+m.suggestVehicles(20).label),
 'Partial 20-person trip has a provisional 29-seat suggestion');
assert.ok(!texts.some(x=>x==='GỢI Ý XE'||x==='GỢI Ý XE THEO GIỜ'),
 'Avoid redundant large top banner: user-requested simplified report');
assert.ok(!texts.includes('08:15 (+1)'),'08:15 must never display a +1 marker');
assert.ok(!paint.some(p=>p.kind==='image'&&(p.image==='29'||p.image==='45')),
 'Do not draw decorative vehicle icons in compact report');
const index=fs.readFileSync('index.html','utf8');
assert.ok(index.includes('v21-shuttle-model.js?v=3.11'));
assert.ok(index.includes('v24-shuttle-grid.js?v=3.11'));
assert.ok(index.includes('v21-shuttle-export.js?v='));
assert.ok(index.includes("APP_VERSION='V3."));
console.log('PASS V3.36: accurate coach advice in compact cards, no redundant banner/icons, exact fixed clocks, partial vs confirmed');
