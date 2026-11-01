'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('v300-workspace.js','utf8');
const reportSrc=fs.readFileSync('v19-report.js','utf8');
const editorialSrc=fs.readFileSync('v319-report-editorial.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const admin=fs.readFileSync('rns-admin.js','utf8');
const edge=fs.readFileSync('supabase/functions/sagscxr-radar-register/index.ts','utf8');
assert.ok(src.includes('data-v319-dh-total'),'DH must input its own total rather than COORD');
assert.ok(src.includes("if(items.length&&u!=='DH')"),'COORD role cannot overwrite DH total');
assert.ok(src.includes("if(u==='DH')"),'DH specialized editor must exist');
assert.ok(src.includes('Điều phối chỉ là một bộ phận'),'Explain difference to entering staff');
assert.ok(reportSrc.includes("{name:'Nhân sự',morning:pvsdCount"),'Report must show total departmental staff');
assert.ok(!reportSrc.includes("{name:'Điều phối',morning:deptRole('DH'"),'DH report must not equate COORD to total');
const mocked={window:{},document:{getElementById:()=>null},unit:'DH'};
const injected=src.replace(' root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:',
 ' root.__v319Test={setState:v=>{state=v},roleInputs};\n root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:');
assert.notEqual(injected,src);
vm.runInNewContext(injected,mocked);
mocked.window.__v319Test.setState({plans:[{unit:'DH',status:'CONFIRMED',
 details:{pvb_morning:'21',pvb_night:'18'}}],staff:[
 {unit:'DH',role_code:'COORD',shift:'SÁNG',quantity:8,confirmed_at:'2026-10-31'},
 {unit:'DH',role_code:'COORD',shift:'ĐÊM',quantity:8,confirmed_at:'2026-10-31'}
]});
const rendered=mocked.window.__v319Test.roleInputs('DH');
assert.equal((rendered.match(/data-v319-dh-total=/g)||[]).length,2);
assert.ok(rendered.includes('value="21"')&&rendered.includes('value="18"'));
assert.ok(rendered.includes('Điều phối/CO'));
assert.ok(rendered.includes('value="8"'),'COORD detail must still be preserved');
const context={window:{}};vm.runInNewContext(editorialSrc,context);
const refine=context.window.SagsReportEditorialV319.refine;
const pairs=[
 {arrival:'VJ101',departure:'VJ102',sta_min:570,std_min:605,bay:61,airline:'VJ',aircraft_type:'A321'},
 {arrival:'KE501',departure:'KE502',sta_min:580,std_min:645,bay:33,airline:'KE',aircraft_type:'A330'},
 {arrival:'FD201',departure:'FD202',sta_min:585,std_min:615,bay:39,airline:'FD',aircraft_type:'A320'}
];
const base={revision:1,date:'2026-11-02',arrivals:3,departures:3,rows:pairs,note:{},
 unitPlans:[{unit:'DH',status:'CONFIRMED',details:{pvb_morning:'21',pvb_night:'18'}}],
 cargoPlans:[{flight_no:'VJ102',cargo_kg:3000}],
 equipmentIssues:[{equipment_id:'GSE-001',issue_status:'LIMITED'}],
 staff:[],gse:[],controls:[]};
const fresh=()=>Array.from({length:10},(_,i)=>({title:String(i+1),observation:'OLD',action:'OLD',owner:'OLD'}));
const reportA=fresh();
refine(base,reportA,{peaks:[{minute:570,items:pairs}],tight:[pairs[0],pairs[2]],wide:[pairs[1]],staffByShift:[]});
assert.equal(reportA.length,10);
assert.ok(reportA[0].observation.includes('3 lượt đến'));
assert.ok(reportA[1].observation.includes('09:30–10:00')&&reportA[1].observation.includes('VJ102'));
assert.ok(reportA[3].observation.includes('K2 1')&&reportA[3].observation.includes('K3 1'));
assert.ok(reportA[3].action.includes('ATC')&&reportA[3].action.includes('PVSĐ'));
assert.ok(reportA[4].observation.includes('Phòng ĐH (sáng 21, tối 18)'));
assert.ok(reportA[5].observation.includes('GSE-001'));
assert.ok(reportA[6].observation.includes('3.000 kg'));
assert.ok(reportA[7].action.includes('ETA/ATA')&&reportA[7].action.includes('OTP'));
assert.ok(!reportA[4].observation.includes('Điều phối:'));
assert.ok(!reportA.some(x=>/Theo những thông tin đã được cập nhật|Đề nghị các đơn vị chủ động/i.test(x.observation)));
const reportB=fresh();refine({...base,rows:[pairs[1]],cargoPlans:[],equipmentIssues:[],
 controls:[{topic:4,observation:'ĐH đã xác nhận bãi theo AOC',action:'Phương án riêng đã duyệt'}]},
 reportB,{peaks:[],tight:[],wide:[pairs[1]]});
assert.equal(reportB[3].observation,'ĐH đã xác nhận bãi theo AOC');
assert.equal(reportB[3].action,'Phương án riêng đã duyệt');
assert.notEqual(reportB[1].observation,reportA[1].observation,'Report must vary by verified situation, not arbitrary template');
const reportC=fresh();refine({...base,revision:2,firstPayload:{arrival_count:4,departure_count:4}},
 reportC,{peaks:[{minute:570,items:pairs}],tight:[pairs[0]],wide:[pairs[1]]});
assert.ok(reportC[0].observation.includes('Lần 1'));
assert.ok(reportC[0].observation.includes('4 → 3'));
assert.ok(reportC[4].action.includes('định mức'));
assert.ok(!reportC[4].action.includes('đủ nhân sự'));
assert.ok(html.indexOf('v319-report-editorial.js?v=3.19')<html.indexOf('v19-report.js?v=3.19'));
assert.ok(html.includes("APP_VERSION='V3.19'"));
for(const id of ['rnsManagerEditPanel','rnsEditSave','rnsEditReset','rnsResetSecretPanel'])assert.ok(html.includes('id="'+id+'"'));
assert.ok(admin.includes("invoke('update'")&&admin.includes("invoke('reset_password'"));
assert.ok(admin.includes("closeReset();")&&admin.includes("selected")===false || admin.includes("picked=x.id"));
assert.ok(edge.includes('membership?.unit!=="ADMIN"')&&edge.includes('existing?.unit==="ADMIN"'));
assert.ok(edge.includes('targetId===requester.id'));
assert.ok(edge.includes('rns_must_change_password:true')&&edge.includes('getRandomValues'));
assert.ok(!edge.includes('password="123456"')&&!edge.includes('body.action==="reset"?"123456"'));
assert.ok(edge.includes('if(body.action==="update"||body.action==="reset_password")'));
assert.ok(!edge.includes('service_role key in browser'));
console.log('PASS V3.19: whole DH staff, deterministic aviation briefing for L1/L2, admin edit/reset authorization boundaries');
