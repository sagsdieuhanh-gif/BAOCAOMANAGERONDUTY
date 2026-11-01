'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
globalThis.window=globalThis;globalThis.staff=[];globalThis.gse=[];globalThis.GSE_NAMES={};
globalThis.prevDate=d=>{let x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10)};
require('../v320-staff-roster.js');require('../v212-personnel.js');require('../v19-report.js');
const schema=globalThis.SagsStaffRosterV320;
const raw=[
 ['PVHK','PVHK_OFFICE',1,null],['PVHK','PVHK_DEPARTURE_TEAM',33,33],
 ['PVHK','PVHK_ARRIVAL_TEAM',14,15],['KTS','KTS_OFFICE',1,1],
 ['KTS','KTS_RAMP_TEAM',18,16],['KTS','BAGGAGE',9,7],
 ['KTS','KTS_HLSD_SKO',9,11],['KTS','TERMINAL_BAGGAGE',11,10],
 ['KTS','KTS_HLNG_SKO',4,4],['KTS','KTS_PVTT',13,13],
 ['KTS','KTS_PVTT_TC',null,3],['KTS','KTS_PVTT_SKO',3,3],
 ['KTS','KTS_WORKSHOP_SC',7,0]
].flatMap(([unit,role_code,m,n])=>
 [['SÁNG',m],['ĐÊM',n]].filter(([,q])=>q!=null).map(([shift,quantity])=>
 ({unit,role_code,shift,quantity,confirmed_at:'2026-11-01T00:00:00Z'})));
assert.deepEqual(schema.TEAMS.PVHK.map(x=>x.label),['Cán bộ Phòng','Đội PVHK đi','Đội PVHK đến']);
assert.deepEqual(schema.TEAMS.KTS.map(x=>x.label),['Cán bộ Phòng','Đội PVSĐ','HLSĐ','HLNG','Đội PVTT','Xưởng SC']);
const fmt=(unit,shift)=>schema.groups(raw,unit,shift).map(x=>schema.pretty(x));
assert.deepEqual(fmt('PVHK','SÁNG'),['1','33','14']);
assert.deepEqual(fmt('PVHK','ĐÊM'),[null,'33','15']);
assert.deepEqual(fmt('KTS','SÁNG'),['1','18','9 + 9 SKO','11 + 4 SKO','13 + 3 SKO','7']);
assert.deepEqual(fmt('KTS','ĐÊM'),['1','16','7 + 11 SKO','10 + 4 SKO','13 + 3 TC + 3 SKO','0']);
const legacy=[...raw,{unit:'KTS',role_code:'SKYONE_BAGGAGE',shift:'SÁNG',quantity:25,confirmed_at:'ok'}];
assert.equal(schema.legacy(legacy,'KTS','SÁNG'),25);
assert.deepEqual(schema.groups(legacy,'KTS','SÁNG').map(x=>schema.pretty(x)),fmt('KTS','SÁNG'),'Do not reallocate legacy SKYONE');
const plans=['DH','PVHK','KTS'].map((unit,i)=>({
 unit,status:'CONFIRMED',details:{pvb_morning:[20,47,61][i],pvb_night:[18,48,55][i],
 ...(unit!=='DH'?{personnel_structure:'V3.20'}:{})}
}));
const c={date:'2026-11-02',author:'ĐH',arrivals:1,departures:1,domestic:2,international:0,
 rows:[{arrival:'VJ101',departure:'VJ102',sta_min:600,std_min:635,airline:'VJ',aircraft_type:'A321'}],
 note:{},prior:null,controls:[],unitPlans:plans,staff:raw,gse:[],cargoPlans:[],
 contracts:[],flightCargo:[],minimumNorms:[],transport:[],additionalRows:[],quickReports:[],
 equipmentIssues:[],sourceFile:'Lịch.xlsx',revision:2};
for(const rev of [1,2]){
 const data=window.SagsReportV19.build({...c,revision:rev});
 const pv=data.staffByShift.find(x=>x.label==='PVHK'),kts=data.staffByShift.find(x=>x.label==='PVSĐ');
 assert.equal(pv.groups.length,3);
 assert.equal(kts.groups.length,6);
 assert.equal(pv.groups[0].night,null,'Empty office night is NOT zero');
 assert.equal(kts.groups[4].night,'13 + 3 TC + 3 SKO');
 assert.equal(kts.groups[5].night,'0');
 const html=window.SagsReportV19.renderHtml(data);
 const table=html.match(/<table class="v318-staff-by-shift">([\s\S]*?)<\/table>/)?.[1];
 assert.ok(table);
 assert.equal((table.match(/<tr><th scope="row">/g)||[]).length,3,'Only DH/PVHK/PVSD three room rows');
 for(const v of ['HLSĐ','HLNG','PVTT','SKO','13 + 3 TC + 3 SKO','Cán bộ Phòng']){
  assert.ok(table.includes(v),'Missing '+v);
 }
 assert.ok(!html.includes('0 người')||table.includes('Xưởng SC:'));
}
const source=fs.readFileSync('v300-workspace.js','utf8');
assert.ok(source.includes('function structuredStaffInputs(u)'));
assert.ok(source.includes('return structuredStaffInputs(u)'));
assert.ok(source.includes("personnel_structure='V3.20'"));
assert.ok(source.includes("if(items.length&&!['DH','KTS','PVHK'].includes(u))"),'Do not use simplistic headcount sum');
const patched=source.replace(' root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:',
 ' root.__v320Test={setState:v=>{state=v},roleInputs};\n root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:');
assert.notEqual(source,patched);
const box={window:{SagsStaffRosterV320:schema},document:{getElementById:()=>null}};
vm.runInNewContext(patched,box);
box.window.__v320Test.setState({staff:raw,plans});
for(const [unit,min] of [['PVHK',6],['KTS',20]]){
 const rendered=box.window.__v320Test.roleInputs(unit);
 assert.equal((rendered.match(/class="v320-shift-card"/g)||[]).length,2);
 assert.ok(rendered.includes('CA SÁNG')&&rendered.includes('CA TỐI'));
 assert.ok((rendered.match(/data-v300-staff="/g)||[]).length>=min);
}
const pvUi=box.window.__v320Test.roleInputs('PVHK');
assert.ok(pvUi.includes('PVHK_OFFICE|SÁNG')&&pvUi.includes('PVHK_OFFICE|ĐÊM'));
assert.ok(pvUi.includes('value="14"')&&pvUi.includes('value="15"'));
assert.ok(!pvUi.includes('PVHK_OFFICE|ĐÊM" value="0"'));
const ktUi=box.window.__v320Test.roleInputs('KTS');
for(const code of ['KTS_RAMP_TEAM','KTS_HLSD_SKO','KTS_HLNG_SKO','KTS_PVTT_TC','KTS_PVTT_SKO','KTS_WORKSHOP_SC'])
 assert.ok(ktUi.includes(code+'|SÁNG')&&ktUi.includes(code+'|ĐÊM'));
assert.ok(ktUi.includes('dữ liệu cũ'),'Keep legacy specialty counts editable');
console.log('PASS V3.22: precise PVHK/PVSĐ staff groups by two shifts; SKYONE and TC independent; no write of examples');
