'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const globals={window:{}};
vm.runInNewContext(fs.readFileSync('radar-cxr/v211-report-insights.js','utf8'),globals);
const bank=globals.window.SagsReportInsightsV211;
const core=['Lịch bay','Khung giờ cao điểm','Vị trí đỗ','Nhân sự','GSE','Hành lý','OTP','An toàn','Tồn tại']
 .map(x=>({title:x,observation:'CHỜ XÁC NHẬN',action:'ĐH phối hợp xác nhận'}));
const f=(airline,arrival,departure,pax,stand)=>({arrival,departure,airline,aircraft_type:airline==='KE'?'A330':airline==='VJ'?'B777':'A321',
 arrival_pax:pax,departure_pax:pax,sta_min:1150,std_min:1210,bay:stand});
const rows=[f('KE','KE467','KE468',377,56),f('VJ','VJ6876','VJ6877',366,38),f('AK','AK646','AK647',170,null)];
const c={rows,staff:[],gse:[],unitPlans:[],cargoPlans:[],note:{},controls:[]};
const wide=bank.widebody(c);
assert.ok(wide.observation.includes('KE467 / KE468'));
assert.ok(wide.observation.includes('VJ6876 / VJ6877'));
assert.ok(wide.observation.includes('377'));
assert.ok(wide.action.includes('A330'));
assert.ok(wide.action.includes('B777'));
assert.ok(wide.action.includes('CHỜ XÁC NHẬN'));
let topics=bank.enrich(c,core);
assert.equal(topics.length,10);
assert.match(topics[2].title,/Tàu thân rộng/);
assert.match(topics[3].observation,/khu 2–3/);
assert.match(topics[5].observation,/CHỜ XÁC NHẬN/);
assert.match(topics[6].observation,/KE467/);
assert.equal(topics[0].owner,'ĐH · PVHK · PVSĐ');
const confirm=[
 {unit:'KTS',status:'CONFIRMED',details:{a330_ready:'READY',b777_ready:'LIMITED',widebody_note:'Cần loader phù hợp B777',rolling_support:'Giải quyết dứt điểm từng tàu',gse_risk:'Xe nâng cần xác nhận'}},
 {unit:'PVHK',status:'CONFIRMED',details:{widebody_ready:'READY',widebody_note:'Ưu tiên đội đón khách cho KE467',bag_risk:'Kiểm tra băng chuyền'}},
 {unit:'KHO',status:'CONFIRMED',details:{handover_priority:'Bàn giao AK647 trước giờ STD'}},
 {unit:'QA_IT',status:'CONFIRMED',details:{weather_fod:'FOD theo báo cáo chính thức',open_capa:'Đề nghị kiểm tra tồn tại ca trước'}}
];
topics=bank.enrich({...c,unitPlans:confirm},core);
assert.ok(topics[2].action.includes('CÓ HẠN CHẾ ĐÃ KHAI BÁO'));
assert.ok(topics[2].action.includes('Cần loader phù hợp'));
assert.ok(topics[1].action.includes('Giải quyết dứt điểm'));
assert.ok(topics[6].action.includes('Bàn giao AK647'));
assert.ok(topics[8].observation.includes('FOD'));
assert.ok(topics[9].observation.includes('tồn tại ca trước'));
const draft=confirm.map(x=>({...x,status:'DRAFT'}));
topics=bank.enrich({...c,unitPlans:draft},core);
assert.ok(!topics[2].action.includes('Cần loader phù hợp'),'Draft data must not be presented as confirmed');
const noWide=bank.widebody({...c,rows:[{arrival:'VJ1',departure:'VJ2',aircraft_type:'A321'}]});
assert.match(noWide.observation,/chưa ghi nhận A330\/B777/);
assert.ok(!noWide.observation.includes('KE467'));
console.log('PASS V2.11 10 topics; A330/B777; high PAX; stand zones; confirmed-only inputs; no ungrounded statements');
