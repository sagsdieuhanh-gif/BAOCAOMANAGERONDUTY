'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
globalThis.window=globalThis;
globalThis.staff=[];globalThis.gse=[];globalThis.GSE_NAMES={};
globalThis.prevDate=d=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10)};
require('../v212-personnel.js');
require('../v19-report.js');
const personnel=globalThis.SagsPersonnelV212,report=globalThis.SagsReportV19;
const plans=['DH','PVHK','KTS'].map((unit,i)=>({
  unit,status:'CONFIRMED',details:{
    pvb_morning:[8,59,50][i].toString(),pvb_night:[8,75,51][i].toString(),
    pvb_morning_status:'PENDING',pvb_night_status:'PENDING'
  }
}));
const p=personnel.summarize(plans);
assert.equal(p.headcountsConfirmed,true,'Count confirmations must be independent from staffing adequacy');
assert.equal(p.complete,false,'Pending sufficiency cannot be declared READY');
assert.ok(p.lines[0].includes('Quân số đã xác nhận'));
assert.ok(p.lines[0].includes('Sáng (8 NS'));
const staffRows=[
 ['DH','COORD',8,8],
 ['PVHK','PVHK_DEPARTURE_TEAM',43,59],
 ['PVHK','PVHK_ARRIVAL_TEAM',16,16],
 ['KTS','BAGGAGE',8,7],
 ['KTS','GSE_DRIVER',18,18],
 ['KTS','SKYONE_BAGGAGE',9,11],
 ['KTS','TERMINAL_BAGGAGE',15,15],
 ['KTS','COBUS_DRIVER',0,0]
].flatMap(([unit,role_code,m,n])=>[
  {unit,role_code,shift:'SÁNG',quantity:m,confirmed_at:'2026-10-31T16:54:20Z'},
  {unit,role_code,shift:'ĐÊM',quantity:n,confirmed_at:'2026-10-31T16:54:20Z'}
]);
staffRows.push({unit:'KTS',role_code:'SKYONE_BAGGAGE',shift:'KHUNG_SKYONE_BAGGAGE_495_1095',quantity:9,confirmed_at:'2026-10-30T19:18:00Z'});
staffRows.push({unit:'KTS',role_code:'UNCONFIRMED',shift:'SÁNG',quantity:999,confirmed_at:null});
const baseline={date:'2026-11-01',author:'Trực ban ĐH',
 arrivals:2,departures:2,domestic:4,international:0,
 rows:[{arrival:'VJ101',departure:'VJ102',sta_min:600,std_min:630,airline:'VJ',aircraft_type:'A321'}],
 prior:null,note:{},controls:[],revision:1,sourceFile:'Lịch bay 01NOV26',
 unitPlans:plans,staff:staffRows,gse:[],contracts:[],minimumNorms:[],equipmentIssues:[],
 cargoPlans:[],flightCargo:[],transport:[],additionalRows:[],quickReports:[]};
for(const revision of [1,2]){
 const data=report.build({...baseline,revision});
 assert.equal(data.staffDetails.length,8,'Only unique confirmed role/shift pairs should be displayed');
 const pvhk=data.staffDetails.find(x=>x.unit==='PVHK'&&x.role.includes('khách đi'));
 assert.deepEqual([pvhk.morning,pvhk.night],[43,59]);
 const kts=data.staffDetails.find(x=>x.unit==='KTS'&&x.role.includes('SKYONE'));
 assert.deepEqual([kts.morning,kts.night],[9,11]);
 assert.ok(!data.staffDetails.some(x=>x.role==='UNCONFIRMED'));
 assert.ok(data.topics[4].observation.includes('đã cập nhật quân số'));
 assert.ok(!/thiếu|đảm bảo|đáp ứng|định mức/i.test(data.topics[4].action),'No staff sufficiency text');
 assert.ok(!data.topics[4].action.includes('50 NS'),'Do not claim sum of PVSD roles is unique staff');
 const html=report.renderHtml(data);
 for(const field of ['QUÂN SỐ THEO CA','Nhân sự','Đội đi','BỐC XẾP PVSĐ','PVHLNG','SKYONE','59 người','43 người','50 người','51 người','15 người','8 người','7 người'])
   assert.ok(html.includes(field),'Report revision '+revision+' missing '+field);
 assert.ok(!html.includes('Nguồn: quân số xác nhận')&&html.includes('SKYONE'),'Hide technical staffing note while preserving separate role counts');
 assert.ok(!html.includes('KHUNG_SKYONE_BAGGAGE_'),'Overlapping custom shift should not be double-counted');
}
assert.ok(fs.readFileSync('v19-report.js','utf8').includes("sb.from('ops_staff_capacity').select"),
 'Report must read saved staff directly, not rely on stale global staff');
assert.ok(fs.readFileSync('v19-report.js','utf8').includes("staff:staffToday.data||[]"),
 'Confirmed staff must use current date query data');
const index=fs.readFileSync('index.html','utf8');
assert.ok(index.includes("APP_VERSION='V3.22'"));
assert.ok(index.includes('v19-report.js?v=3.22'));
assert.ok(index.includes('v212-personnel.js?v=3.15'));
console.log('PASS V3.14: confirmed staffing is visible in L1/L2 by department and shift, readiness distinct, no duplicates');
