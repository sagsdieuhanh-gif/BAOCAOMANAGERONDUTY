'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const context={
 window:{SagsMissingV27:{analyze:()=>[]}},staff:[],gse:[],GSE_NAMES:{},
 prevDate:d=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10)}
};
for(const module of ['v211-report-insights.js','v212-personnel.js','v19-report.js']){
 vm.runInNewContext(fs.readFileSync(''+module,'utf8'),context,{filename:module});
}
const P=context.window.SagsPersonnelV212;
const report=context.window.SagsReportV19;
const details=(morning,night,ms='READY',ns='READY')=>({
 pvb_morning:String(morning),pvb_night:String(night),
 pvb_morning_status:ms,pvb_night_status:ns
});
assert.equal(P.parseCount(''),null);
assert.equal(P.parseCount('-2'),null);
assert.equal(P.parseCount('22a'),null);
assert.equal(P.parseCount('0'),0);
assert.throws(()=>P.validate({pvb_morning:'-3'}),/tổng quân số/i);
assert.throws(()=>P.validate({pvb_morning_status:'READY'}),/chưa nhập/i);
P.validate(details(20,18));
const confirmed=[
 {unit:'DH',status:'CONFIRMED',details:details(20,18)},
 {unit:'PVHK',status:'CONFIRMED',details:details(59,52)},
 {unit:'KTS',status:'CONFIRMED',details:details(74,73,'LIMITED','LIMITED')}
];
const staff=P.summarize(confirmed);
assert.ok(staff.complete);
assert.equal(staff.incomplete.length,0);
assert.equal(staff.lines[0],'- Phòng ĐH: Quân số đã xác nhận. Sáng (20 NS); Đêm (18 NS).');
assert.equal(staff.lines[1],'- Phòng PVHK: Quân số đã xác nhận. Sáng (59 NS); Đêm (52 NS).');
assert.equal(staff.lines[2],'- Phòng KTSĐ: Quân số đã xác nhận. Sáng (74 NS); Đêm (73 NS).');
const draft=P.summarize(confirmed.map(x=>({...x,status:'DRAFT'})));
assert.ok(!draft.complete);
assert.ok(!draft.lines.join(' ').includes('59 NS'),'Draft figures must not leak into official forecast');
const partial=P.summarize([confirmed[1]]);
assert.equal(partial.incomplete.length,2);
assert.ok(partial.lines[0].includes('CHỜ XÁC NHẬN'));
assert.ok(partial.lines[1].includes('59 NS'));
const f=(n,airline,st,en,type='A320')=>({arrival:airline+n,departure:airline+(n+1),airline,sta_min:st,std_min:en,aircraft_type:type,cargo_status:'NO_CARGO'});
const c={date:'2026-10-31',author:'ĐH',sourceFile:'lich.xlsx',arrivals:4,departures:4,domestic:3,international:5,
 rows:[f(100,'AK',1140,1170),f(200,'FD',1140,1170),f(300,'KE',1130,1190,'A330'),f(400,'VJ',1140,1170)],
 unitPlans:confirmed,prior:null,note:{},controls:[],cargoPlans:[],equipmentIssues:[],transport:[]};
const d=report.build(c);
assert.equal(d.topics.length,10);
assert.equal(d.topics[4].title,'05. Nhân lực khai thác');
assert.equal(d.topics[4].action,staff.lines.join('\n'));
assert.equal(d.topics[4].owner,'ĐH · PVHK · KTSĐ');
assert.ok(d.topics[1].action.includes('làm dứt điểm từng chuyến'));
assert.ok(d.topics[1].action.includes('điều chuyển'));
assert.ok(d.peakRows[0].action.includes('Phòng ĐH'));
const all=[...d.topics.flatMap(x=>[x.observation,x.action]),...d.peakRows.flatMap(x=>[x.risk,x.action]),d.recommendation].join(' ');
for(const not of [/hồ sơ/i,/mốc STD/i,/không suy ra/i,/theo quy ước/i,/dữ liệu nguồn/i,/thuật toán/i,/GSE rảnh/i])assert.ok(!not.test(all),'No robotic phrasing: '+not);
const missing=report.build({...c,unitPlans:[]});
assert.ok(missing.topics[4].action.includes('CHỜ XÁC NHẬN'));
assert.ok(!missing.topics[4].action.includes('59 NS'));
const inputs=fs.readFileSync('v211-unit-input.js','utf8');
for(const term of ['pvb_morning','pvb_night','pvb_morning_status','pvb_night_status','data-v212-preview','root.SagsPersonnelV212.validate'])assert.ok(inputs.includes(term));
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.indexOf('v212-personnel.js')<html.indexOf('v211-unit-input.js'));
assert.ok(html.indexOf('v212-personnel.js')<html.indexOf('v19-report.js'));
assert.ok(!staff.lines.join(' ').match(/Đảm bảo|Chưa đảm bảo|cần bổ sung lực lượng|thiếu [0-9]/i));
console.log('PASS V2.12 per-unit staffing totals, draft protection, live preview fields and manager-style report language');