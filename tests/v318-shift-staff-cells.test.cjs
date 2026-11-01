'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
globalThis.window=globalThis;globalThis.staff=[];globalThis.gse=[];globalThis.GSE_NAMES={};
globalThis.prevDate=x=>{const d=new Date(x+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)};
require('../v212-personnel.js');require('../v19-report.js');
const raw=[
 ['DH','COORD',8,8],['PVHK','PVHK_ARRIVAL_TEAM',16,16],
 ['PVHK','PVHK_DEPARTURE_TEAM',43,59],['KTS','BAGGAGE',8,7],
 ['KTS','TERMINAL_BAGGAGE',15,15],['KTS','SKYONE_BAGGAGE',0,11],
 ['KTS','GSE_DRIVER',18,18],['KTS','COBUS_DRIVER',0,0]
].flatMap(([unit,role_code,m,n])=>[
 {unit,role_code,shift:'SÁNG',quantity:m,confirmed_at:'2026-11-01T00:00:00Z'},
 {unit,role_code,shift:'ĐÊM',quantity:n,confirmed_at:'2026-11-01T00:00:00Z'}]);
const plans=['DH','PVHK','KTS'].map((unit,i)=>({unit,status:'CONFIRMED',details:{
 pvb_morning:[8,59,50][i],pvb_night:[8,75,51][i]}}));
const base={date:'2026-11-01',author:'ĐH',arrivals:1,departures:1,domestic:2,international:0,
 rows:[{arrival:'VJ101',departure:'VJ102',sta_min:600,std_min:635,airline:'VJ',aircraft_type:'A321'}],
 prior:null,note:{},controls:[],sourceFile:'Book4.xlsx',unitPlans:plans,
 staff:raw,gse:[],contracts:[],minimumNorms:[],cargoPlans:[],flightCargo:[],equipmentIssues:[],
 transport:[],additionalRows:[],quickReports:[]};
function rows(html){
 const table=html.match(/<table class="v318-staff-by-shift">([\s\S]*?)<\/table>/)?.[1];
 assert.ok(table);const titles=[...table.matchAll(/<tr><th scope="row">(.*?)<\/th>/g)].map(x=>x[1]);
 assert.deepEqual(titles,['ĐH','PVHK','PVSĐ']);
 const out={};for(const unit of titles){
  const row=table.match(new RegExp('<tr><th scope="row">'+unit+'</th>([\\s\\S]*?)</tr>'))?.[1];
  const cells=row.match(/<td class="v318-staff-shift-cell">[\s\S]*?<\/td>/g);
  assert.equal(cells?.length,2,'Each department has exactly 2 shift cells: '+unit);
  out[unit]=cells;
 }
 assert.equal((table.match(/<td class="v318-staff-shift-cell">/g)||[]).length,6);
 return out;
}
for(const revision of [1,2]){
 const data=window.SagsReportV19.build({...base,revision});
 const table=rows(window.SagsReportV19.renderHtml(data));
 assert.ok(table['ĐH'][0].includes('8 người')&&table['ĐH'][1].includes('8 người'));
 assert.ok(table.PVHK[0].includes('Đội đến:')&&table.PVHK[0].includes('Đội đi:'));
 assert.ok(table.PVHK[0].includes('16 người')&&table.PVHK[0].includes('43 người'));
 assert.ok(table.PVHK[1].includes('16 người')&&table.PVHK[1].includes('59 người'));
 assert.ok(!table.PVHK[0].includes('59 người'),'PVHK night count must not appear in morning cell');
 assert.ok(table['PVSĐ'][0].includes('PVSĐ:')&&table['PVSĐ'][0].includes('50 người'));
 assert.ok(table['PVSĐ'][1].includes('PVSĐ:')&&table['PVSĐ'][1].includes('51 người'));
 for(const t of ['PVHLNG','BỐC XẾP PVSĐ','SKYONE'])for(const cell of table['PVSĐ'])assert.ok(cell.includes(t));
 assert.ok(table['PVSĐ'][0].includes('0 người'),'Confirmed zero SKYONE must remain zero');
 assert.ok(table['PVSĐ'][1].includes('11 người'),'Night SKYONE count must be preserved');
 assert.ok(!table['PVSĐ'][0].includes('GSE'),'GSE data retained but not extra display rows');
 assert.equal(data.staffDetails.filter(x=>x.unit==='KTS').length,5,'All five underlying roles kept for later editing');
}
const input=fs.readFileSync('v300-workspace.js','utf8');
const injected=input.replace(' root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:',
 ' root.__v318Test={setState:v=>{state=v},pvsdSavedSummary,pvhkSavedSummary,roleInputs};\n root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:');
const ctx={window:{},document:{getElementById:()=>null},unit:'PVHK'};
vm.runInNewContext(injected,ctx);
ctx.window.__v318Test.setState({staff:raw,plans});
const pv=ctx.window.__v318Test.roleInputs('PVHK');
assert.equal((pv.match(/class="v318-shift-cell"/g)||[]).length,2);
assert.ok(pv.includes('CA SÁNG')&&pv.includes('CA TỐI'));
assert.ok((pv.match(/data-v300-staff="/g)||[]).length>=10,'PVHK source inputs still editable');
assert.ok(pv.includes('v318-team-edit" >'),'PVHK details closed after saved');
assert.ok(ctx.window.__v318Test.pvhkSavedSummary().includes('Đội đến:'));
assert.ok(ctx.window.__v318Test.pvhkSavedSummary().includes('Đội đi:'));
const pvsd=ctx.window.__v318Test.roleInputs('KTS');
assert.equal((pvsd.match(/class="v318-shift-cell"/g)||[]).length,2);
assert.ok((pvsd.match(/data-v300-staff="/g)||[]).length>=10,'PVSĐ role data stays editable');
ctx.window.__v318Test.setState({staff:raw.filter(x=>x.role_code!=='PVHK_ARRIVAL_TEAM'),plans});
const missing=ctx.window.__v318Test.pvhkSavedSummary();
assert.ok(missing.includes('CHỜ XÁC NHẬN'),'Never infer missing arrival team from total PVHK');
const css=fs.readFileSync('v300-workspace.css','utf8');
assert.ok(css.includes('.v318-shift-summary')&&css.includes('grid-template-columns:repeat(2'));
assert.ok(css.includes('table.v318-staff-by-shift'),'A4 report layout must keep morning/evening columns');
console.log('PASS V3.22: DH/PVHK/PVSD each one row; separate AM/PM cells, zeros/missing preserved and editability intact');
