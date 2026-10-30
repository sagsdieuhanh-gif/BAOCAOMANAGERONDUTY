'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const globals={
 window:{SagsMissingV27:{analyze:()=>[
  {unit:'DH',type:'XE GIAO CA',detail:'Chờ'},
  {unit:'PVSĐ',type:'TRANG THIẾT BỊ',detail:'Chờ xác nhận'}
 ]}},
 staff:[],gse:[],GSE_NAMES:{},
 prevDate:d=>{const a=new Date(d+'T12:00:00Z');a.setUTCDate(a.getUTCDate()-1);return a.toISOString().slice(0,10)}
};
vm.runInNewContext(fs.readFileSync('radar-cxr/v211-report-insights.js','utf8'),globals);
vm.runInNewContext(fs.readFileSync('radar-cxr/v19-report.js','utf8'),globals);
const api=globals.window.SagsReportV19;
function f(a,carrier,sta,std){
 return {arrival:carrier+a,departure:carrier+(a+1),airline:carrier,sta_min:sta,std_min:std,aircraft_type:carrier==='KE'?'A330':'A320',cargo_status:'NO_CARGO'};
}
const base={
 date:'2026-10-31',author:'Trực ban',sourceFile:'lich.xlsx',arrivals:4,departures:4,
 domestic:null,international:null,prior:null,note:{},controls:[],
 cargoPlans:[],equipmentIssues:[],transport:[]
};
const evening=[f(100,'AK',1150,1180),f(200,'FD',1155,1185),f(300,'KE',1130,1190),f(400,'VJ',1155,1185)];
let data=api.build({...base,rows:evening});
assert.equal(data.topics.length,10);
assert.equal(data.coord.length,4);
assert.ok(data.topics[1].action.includes('cuốn chiếu'),'Need a rolling crew/equipment strategy');
assert.ok(data.topics[1].action.includes('làm dứt điểm'),'Need completion-first service plan');
assert.ok(data.topics[1].action.includes('PVSĐ')&&data.topics[1].action.includes('PVHK')&&data.topics[1].action.includes('ĐH'),'Need responsible departments');
for(const code of ['AK100','FD200','KE300'])assert.ok(data.topics[1].action.includes(code),code+' needs specific evening priority');
assert.ok(data.topics[1].action.includes('19:00'),'Evening priority must name the actual peak window');
assert.ok(data.peakRows.some(row=>row.action.includes('AK, FD, hãng Hàn Quốc')),'Peak table should include specific high-priority airlines');
assert.ok(data.topics[7].observation.includes('KE300'),'Korean tight turn must use 60 minute service standard');
assert.ok(data.topics.every(x=>x.action.length<=620),'Forecast actions should remain readable');
assert.ok(data.topics.every(x=>!x.observation.includes('Xe giao ca:')),'Shuttle must be separate from main V2.7 report');
assert.ok(data.alerts.every(a=>a.type!=='XE GIAO CA'),'Shuttle pending alerts must not enter main report');
assert.ok(data.alerts.some(a=>a.type==='TRANG THIẾT BỊ'),'Operational missing-data warnings must remain');
data=api.build({...base,rows:[f(100,'KE',1100,1160),f(200,'VJ',1100,1130),f(300,'VJ',1100,1130),f(400,'VJ',1100,1130)]});
assert.ok(data.topics[1].action.includes('hãng Hàn Quốc'),'Korean night peak needs prioritization');
assert.ok(!data.topics[1].action.includes('(AK, FD,'),'Do not invent absent AK and FD');
data=api.build({...base,rows:[f(100,'AK',1150,1180),f(200,'FD',1155,1185)]});
assert.ok(!data.topics[1].action.includes('Trong cao điểm tối'),'Two flights do not constitute a >=4 pair evening peak');
data=api.build({...base,rows:[f(100,'AK',1150,1180)],controls:[{topic:2,action:'ĐH đã nhập phương án riêng'}]});
assert.equal(data.topics[1].action,'ĐH đã nhập phương án riêng','Never overwrite operator-provided action');
console.log('PASS V2.10: actionable-by-unit forecast plans, rolling service, conditional evening priorities, preserved overrides and separate shuttle');
