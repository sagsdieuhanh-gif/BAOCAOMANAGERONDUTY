'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
globalThis.window=globalThis;globalThis.staff=[];globalThis.gse=[];globalThis.GSE_NAMES={};
globalThis.prevDate=d=>{const t=new Date(d+'T00:00:00Z');t.setUTCDate(t.getUTCDate()-1);return t.toISOString().slice(0,10)};
require('../v212-personnel.js');
require('../v19-report.js');
const staff=[
 ['DH','COORD',8,8],['PVHK','PVHK_DEPARTURE_TEAM',43,59],
 ['PVHK','PVHK_ARRIVAL_TEAM',16,16],['KTS','BAGGAGE',8,7],
 ['KTS','GSE_DRIVER',18,18],['KTS','COBUS_DRIVER',0,0],
 ['KTS','TERMINAL_BAGGAGE',15,15],['KTS','SKYONE_BAGGAGE',9,11]
].flatMap(([unit,role_code,m,n])=>[
 {unit,role_code,shift:'SÁNG',quantity:m,confirmed_at:'2026-11-01T00:00:00Z'},
 {unit,role_code,shift:'ĐÊM',quantity:n,confirmed_at:'2026-11-01T00:00:00Z'}]);
staff.push({unit:'KTS',role_code:'SKYONE_BAGGAGE',shift:'KHUNG_SKYONE_BAGGAGE_495_1095',quantity:9,confirmed_at:'2026-11-01T00:00:00Z'});
const plans=['DH','PVHK','KTS'].map((unit,i)=>({unit,status:'CONFIRMED',details:{
 pvb_morning:[8,59,50][i],pvb_night:[8,75,51][i],
 pvb_morning_status:'PENDING',pvb_night_status:'PENDING'}}));
const base={date:'2026-11-01',author:'ĐH',arrivals:1,departures:1,domestic:2,international:0,
 rows:[{arrival:'VJ101',departure:'VJ102',sta_min:600,std_min:630,airline:'VJ',aircraft_type:'A321'}],
 prior:null,note:{},controls:[],sourceFile:'Lịch SAGS.xlsx',unitPlans:plans,staff,gse:[],
 contracts:[],minimumNorms:[],cargoPlans:[],flightCargo:[],equipmentIssues:[],transport:[],additionalRows:[],quickReports:[]};
for(const revision of [1,2]){
 const data=window.SagsReportV19.build({...base,revision});
 assert.deepEqual(data.pvsdSummary.map(x=>x.name),['PVSĐ','PVHLNG','BỐC XẾP PVSĐ','SKYONE']);
 assert.deepEqual(data.pvsdSummary.map(x=>[x.morning,x.night]),[[50,51],[15,15],[8,7],[9,11]]);
 assert.ok(data.staffDetails.some(x=>x.role==='Lái xe GSE'),'Keep detailed source rows internally');
 const html=window.SagsReportV19.renderHtml(data);
 const block=html.match(/<table class="v317-pvsd-summary">([\s\S]*?)<\/table>/)?.[1];
 assert.ok(block,'One compact PVSĐ table must appear in report '+revision);
 assert.equal((block.match(/<tr>/g)||[]).length,1,'One PVSĐ row only');
 assert.equal((block.match(/<td>/g)||[]).length,1,'One PVSĐ cell only');
 for(const x of ['PVSĐ','PVHLNG','BỐC XẾP PVSĐ','SKYONE','Sáng 50 người','Đêm 51 người',
  'Sáng 15 người','Đêm 15 người','Sáng 8 người','Đêm 7 người','Sáng 9 người','Đêm 11 người'])
  assert.ok(block.includes(x),'Missing '+x);
 assert.ok(!block.includes('Lái xe GSE')&&!block.includes('COBUS'),'No additional display rows');
 const main=html.slice(html.indexOf('<h4>CHI TIẾT QUÂN SỐ'),html.indexOf('<p class="v19-footnote">Nguồn: quân số'));
 assert.ok(!main.includes('<td>PVSĐ</td>'),'PVSĐ must not show as many staff rows');
 assert.ok(main.includes('Đội khách đi'),'Other department rows must stay visible');
}
// The saved workspace count card must show the four groups while preserving
// all five original role inputs inside a closed details section.
const original=fs.readFileSync('v300-workspace.js','utf8');
assert.ok(original.includes('function pvsdSavedSummary()'));
assert.ok(original.includes('v317-pvsd-one-cell')&&original.includes('v317-pvsd-edit'));
assert.ok(original.includes('data-v300-staff')&&original.includes('ops_staff_capacity'));
const injected=original.replace(
 ' root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:',
 ' root.__v317Test={setState:v=>{state=v},pvsdSavedSummary,roleInputs};\n root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:');
assert.notEqual(injected,original,'Test-only workspace hook available');
const context={window:{},document:{getElementById:()=>null},unit:'KTS'};
vm.runInNewContext(injected,context,{filename:'v300-workspace.js'});
context.window.__v317Test.setState({plans,staff});
const shown=context.window.__v317Test.pvsdSavedSummary();
for(const text of ['PVSĐ','PVHLNG','BỐC XẾP PVSĐ','SKYONE','Sáng 50 người','Đêm 51 người'])assert.ok(shown.includes(text));
const edit=context.window.__v317Test.roleInputs('KTS');
assert.equal((edit.match(/data-v300-staff="/g)||[]).length,10,'All five roles and both shifts remain editable');
assert.ok(edit.includes('<details class="v300-details v317-pvsd-edit" >'),'Saved staff details default closed');
context.window.__v317Test.setState({plans:[],staff:[]});
const empty=context.window.__v317Test.roleInputs('KTS');
assert.ok(empty.includes('v317-pvsd-edit" open'),'New staff entry defaults open');
assert.ok(empty.includes('CHỜ XÁC NHẬN'),'Never invent missing headcounts');
// Missing per-role records must not be replaced by inferred group totals.
const missing=window.SagsReportV19.build({...base,staff:staff.filter(x=>x.role_code!=='TERMINAL_BAGGAGE')});
assert.equal(missing.pvsdSummary[1].morning,null);
assert.equal(missing.pvsdSummary[0].morning,50);
const ui=fs.readFileSync('index.html','utf8');
assert.ok(ui.includes("APP_VERSION='V3.17'"));
assert.ok(ui.includes('v19-report.js?v=3.17'));
assert.ok(ui.includes('v300-workspace.js?v=3.17'));
assert.ok(ui.includes('v300-workspace.css?v=3.17'));
console.log('PASS V3.17: one compact PVSĐ report cell and saved input card; original role values remain editable');
