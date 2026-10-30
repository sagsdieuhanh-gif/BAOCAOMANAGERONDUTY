'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const m=globalThis.SagsShuttleModel,g=globalThis.SagsShuttleGridV24._test,e=globalThis.SagsShuttleExport._test;
const cases=[
  [0,0,0,0,0],
  [1,1,0,1,28],
  [29,1,0,1,0],
  [30,1,1,0,15],
  [45,1,1,0,0],
  [46,2,0,2,12],
  [58,2,0,2,0],
  [59,2,1,1,15],
  [74,2,1,1,0],
  [75,2,2,0,15],
  [90,2,2,0,0],
  [91,3,1,2,12],
  [103,3,1,2,0],
  [104,3,2,1,15],
  [119,3,2,1,0],
  [120,3,3,0,15],
  [135,3,3,0,0],
  [136,4,2,2,12]
];
for(const [people,count,n45,n29,spare] of cases){
  const actual=m.suggestVehicles(people);
  assert.ok(actual);
  assert.equal(actual.count,count,'Vehicle count for '+people+' people');
  assert.equal(actual.n45,n45,'45C count for '+people+' people');
  assert.equal(actual.n29,n29,'29C count for '+people+' people');
  assert.equal(actual.spare,spare,'Spare seats for '+people+' people');
  assert.equal(actual.seats,people+spare);
  assert.equal(actual.units.reduce((sum,x)=>sum+x.quantity*x.seats,0),actual.seats);
  assert.ok(actual.count===0||actual.seats>=people,'All people get a seat');
  const grid=g.classify({total:people,confirmed:4});
  assert.equal(grid.label,actual.label);
}
assert.equal(m.suggestVehicles(-1),null);
assert.equal(m.suggestVehicles(3.5),null);
assert.equal(m.suggestVehicles(5001),null);
assert.equal(g.classify({confirmed:3,total:83}).label,'CHỜ XÁC NHẬN');
assert.equal(g.classify({confirmed:4,total:45}).label,'45 CHỖ');
assert.equal(g.classify({confirmed:4,total:29}).label,'29 CHỖ');
const values=['DH','PVHK','KTS','QA_IT'].map((unit,i)=>({unit,direction:'NHA_CXR',departure_min:420,line_no:0,quantity:[18,23,21,12][i]}));
const row=g.assemble(values,[]).find(x=>x.direction==='NHA_CXR'&&x.departure_min===420);
assert.equal(row.total,74);
assert.equal(g.classify(row).label,'2 XE: 45C + 29C');
const normalized=e.normalize(values,[]).find(x=>x.direction==='NHA_CXR'&&x.departure_min===420);
assert.equal(normalized.total,74);
const draws=[];
const ctx={};
for(const method of ['beginPath','moveTo','lineTo','quadraticCurveTo','closePath','fill','stroke','fillRect','strokeRect','save','restore','translate','arc','bezierCurveTo','setLineDash'])ctx[method]=()=>{};
ctx.fillText=x=>draws.push(String(x));
ctx.drawImage=(...args)=>draws.push('IMAGE:'+args[0]?.kind);
globalThis.document={createElement(tag){if(tag==='canvas')return {width:0,height:0,getContext:()=>ctx};throw Error('Unexpected '+tag)}};
const png=e.draw({date:'2026-10-31',rows:[normalized]},{naturalWidth:80,naturalHeight:80,kind:'logo'},
  {small:{naturalWidth:100,naturalHeight:75,kind:'29'},big:{naturalWidth:100,naturalHeight:75,kind:'45'}});
assert.ok(png.width>1000);
assert.ok(draws.some(x=>x.includes('GỢI Ý: 2 XE: 45C + 29C')));
assert.ok(draws.some(x=>x.includes('74 ghế · dư 0 ghế')));
assert.ok(draws.some(x=>x==='IMAGE:29')&&draws.some(x=>x==='IMAGE:45'));
const exportCode=fs.readFileSync('v21-shuttle-export.js','utf8');
const gridCode=fs.readFileSync('v24-shuttle-grid.js','utf8');
assert.ok(exportCode.includes('model().suggestVehicles(total)'));
assert.ok(gridCode.includes('model().suggestVehicles(row.total)'));
assert.ok(gridCode.includes('cls.details'),'UI must include available seats and spare seats');
assert.ok(gridCode.includes('shuttle-'+ "'+x.seats+'" +'.webp'),'UI must show each vehicle type in plan');
console.log('PASS V2.21: optimize 29C/45C combinations, preserve four-unit confirmation, consistent PNG/PDF and UI plans');
