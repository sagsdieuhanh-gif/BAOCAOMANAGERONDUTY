'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
globalThis.window=globalThis;globalThis.staff=[];globalThis.gse=[];globalThis.GSE_NAMES={};
globalThis.prevDate=d=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10)};
require('../v212-personnel.js');require('../v19-report.js');
const staff=[
 ['DH','COORD',8,8],['PVHK','PVHK_DEPARTURE_TEAM',43,59],['PVHK','PVHK_ARRIVAL_TEAM',16,16],
 ['KTS','BAGGAGE',8,7],['KTS','GSE_DRIVER',18,18],['KTS','COBUS_DRIVER',0,0],
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
function shiftCells(html,unit){
 const section=html.match(/<table class="v318-staff-by-shift">([\s\S]*?)<\/table>/)?.[1];
 assert.ok(section,'Report must have one main staffing table');
 const row=section.match(new RegExp('<tr><th scope="row">'+unit+'</th>([\\s\\S]*?)<\\/tr>'))?.[1];
 assert.ok(row,'Missing department '+unit);
 const cells=row.match(/<td class="v318-staff-shift-cell">[\s\S]*?<\/td>/g)||[];
 assert.equal(cells.length,2,'Department '+unit+' must have exactly morning + evening cells');
 return cells;
}
for(const revision of [1,2]){
 const data=window.SagsReportV19.build({...base,revision});
 assert.deepEqual(data.pvsdSummary.map(x=>x.name),['PVSĐ','PVHLNG','BỐC XẾP PVSĐ','SKYONE']);
 assert.deepEqual(data.pvsdSummary.map(x=>[x.morning,x.night]),[[50,51],[15,15],[8,7],[9,11]]);
 assert.ok(data.staffDetails.some(x=>x.role==='Lái xe GSE'),'Keep full saved role details in memory');
 const html=window.SagsReportV19.renderHtml(data);
 const [am,pm]=shiftCells(html,'PVSĐ');
 for(const t of ['PVSĐ:','50 người','PVHLNG:','15 người','BỐC XẾP PVSĐ:','8 người','SKYONE:','9 người'])
   assert.ok(am.includes(t),'Morning missing '+t);
 for(const t of ['51 người','15 người','7 người','11 người'])assert.ok(pm.includes(t),'Evening missing '+t);
 assert.ok(!am.includes('51 người')&&!pm.includes('50 người'),'Do not combine shifts inside the same cell');
 const [pA,pB]=shiftCells(html,'PVHK');
 assert.ok(pA.includes('Đội đến:')&&pA.includes('16 người')&&pA.includes('Đội đi:')&&pA.includes('43 người'));
 assert.ok(pB.includes('Đội đến:')&&pB.includes('16 người')&&pB.includes('Đội đi:')&&pB.includes('59 người'));
 assert.ok(!html.includes('v317-pvsd-summary'),'Legacy unsplit PVSĐ row removed');
 assert.ok(!html.includes('KHUNG_SKYONE_BAGGAGE_'),'Custom shift must not be duplicated');
}
const original=fs.readFileSync('v300-workspace.js','utf8');
assert.ok(original.includes('function pvsdSavedSummary()')&&original.includes('function pvhkSavedSummary()'));
assert.ok(original.includes('v318-shift-summary')&&original.includes('v317-pvsd-edit'));
assert.ok(original.includes('data-v300-staff')&&original.includes('ops_staff_capacity'));
const injected=original.replace(
 ' root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:',
 ' root.__v318Test={setState:v=>{state=v},pvsdSavedSummary,pvhkSavedSummary,roleInputs};\n root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:');
assert.notEqual(injected,original);
const c={window:{},document:{getElementById:()=>null},unit:'KTS'};
vm.runInNewContext(injected,c,{filename:'v300-workspace.js'});
c.window.__v318Test.setState({plans,staff});
const shown=c.window.__v318Test.pvsdSavedSummary();
assert.equal((shown.match(/class="v318-shift-cell"/g)||[]).length,2);
for(const t of ['PVSĐ','PVHLNG','BỐC XẾP PVSĐ','SKYONE','CA SÁNG','CA TỐI','50 người','51 người'])assert.ok(shown.includes(t));
const edit=c.window.__v318Test.roleInputs('KTS');
assert.equal((edit.match(/data-v300-staff="/g)||[]).length,10,'All original PVSĐ input cells preserved');
assert.ok(edit.includes('v317-pvsd-edit v318-team-edit" >'),'Saved staff edit panel defaults closed');
c.window.__v318Test.setState({plans:[],staff:[]});
const empty=c.window.__v318Test.roleInputs('KTS');
assert.ok(empty.includes('v318-team-edit" open'),'New staff entry defaults open');
assert.ok(empty.includes('CHỜ XÁC NHẬN'));
const missing=window.SagsReportV19.build({...base,staff:staff.filter(x=>x.role_code!=='TERMINAL_BAGGAGE')});
assert.equal(missing.pvsdSummary[1].morning,null);
assert.equal(missing.pvsdSummary[0].morning,50,'Missing subgroup cannot alter PVSĐ total');
const ui=fs.readFileSync('index.html','utf8');
for(const x of ["APP_VERSION='V3.18'",'v19-report.js?v=3.18','v300-workspace.js?v=3.18','v300-workspace.css?v=3.18'])
 assert.ok(ui.includes(x),'Version/cache missing '+x);
console.log('PASS V3.18: prior PVSĐ staffing data and details retained; distinct morning/evening cells');
