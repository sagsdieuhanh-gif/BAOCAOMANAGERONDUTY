'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
globalThis.window=globalThis;
globalThis.staff=[];globalThis.gse=[];globalThis.GSE_NAMES={};
globalThis.prevDate=d=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10)};
globalThis.SagsMissingV27={analyze:()=>[]};
require('../v211-report-insights.js');
require('../v212-personnel.js');
require('../v217-second-forecast.js');
require('../v219-ops-forecast.js');
require('../v223-l2-brief.js');
require('../v19-report.js');
const report=globalThis.SagsReportV19;
const flights=[
 {arrival:'VJ101',departure:'VJ102',sta_min:570,std_min:605,bay:39,airline:'VJ',aircraft_type:'A321',cargo_status:'UNKNOWN'},
 {arrival:'VJ103',departure:'VJ104',sta_min:575,std_min:610,bay:61,airline:'VJ',aircraft_type:'A321',cargo_status:'UNKNOWN'},
 {arrival:'KE501',departure:'KE502',sta_min:590,std_min:650,bay:33,airline:'KE',aircraft_type:'A330',cargo_status:'UNKNOWN'},
 {arrival:'VJ105',departure:'VJ106',sta_min:585,std_min:625,bay:62,airline:'VJ',aircraft_type:'A321',cargo_status:'UNKNOWN'}
];
const source_detail={arrivals:[],departures:[
 {no:'VJ102',carrier:'VJ',t:605,gate:'G1',bay:39,booking_sum:210,booking:'0/10/200'},
 {no:'VJ104',carrier:'VJ',t:610,gate:'G2',bay:61,booking_sum:220,booking:'0/20/200'},
 {no:'KE502',carrier:'KE',t:650,gate:'G3',bay:33,booking_sum:287,booking:'0/17/270'},
 {no:'VJ106',carrier:'VJ',t:625,gate:'G4',bay:62,booking_sum:180,booking:'0/10/170'}
]};
const s2={service_date:'2026-11-01',revision:2,arrival_count:4,departure_count:4,domestic_count:4,international_count:4,flights,source_detail};
const s1={service_date:'2026-11-01',revision:1,arrival_count:5,departure_count:5,flights:[
 ...flights,{arrival:'VJ201',departure:'VJ202',sta_min:850,std_min:885,airline:'VJ',aircraft_type:'A321'}],
 source_detail:{arrivals:[],departures:[]}};
const unitPlans=['DH','PVHK','KTS'].map((unit,i)=>({unit,status:'CONFIRMED',details:{
 pvb_morning:[8,59,50][i],pvb_night:[8,75,51][i],pvb_morning_status:'PENDING',pvb_night_status:'PENDING',
 ...(unit==='KTS'?{gse_risk:'Xe kéo đẩy cần kiểm tra lốp trước chuyến, theo báo cáo PVSĐ.'}:{})
}}));
const staffRows=[['DH','COORD',8,8],['PVHK','PVHK_DEPARTURE_TEAM',43,59],
 ['PVHK','PVHK_ARRIVAL_TEAM',16,16],['KTS','GSE_DRIVER',18,18]].flatMap(([unit,role_code,m,n])=>[
  {unit,role_code,shift:'SÁNG',quantity:m,confirmed_at:'2026-10-31T15:00:00Z'},
  {unit,role_code,shift:'ĐÊM',quantity:n,confirmed_at:'2026-10-31T15:00:00Z'}
 ]);
const ctx={date:'2026-11-01',author:'ĐH',rows:flights,arrivals:4,departures:4,
 domestic:4,international:4,prior:null,note:{},controls:[],revision:2,
 sourceFile:'Lịch Lần 2.xlsx',sourcePayload:s2,firstPayload:s1,unitPlans,
 staff:staffRows,gse:[],cargoPlans:[{flight_no:'VJ102',cargo_kg:3000,cargo_pcs:null,ready_by_min:null},
 {flight_no:'VJ104',cargo_kg:1500,cargo_pcs:null,ready_by_min:null}],
 equipmentIssues:[],flightCargo:[],contracts:[],minimumNorms:[],transport:[],
 additionalRows:[],quickReports:[]};
const result=report.build(ctx);
const html=report.renderHtml(result);
assert.equal(result.topics.length,10,'Always retain complete ten-topic report');
assert.ok(result.comparison.includes('đến 5 → 4, đi 5 → 4'),'Use actual L1->L2 movement comparison');
assert.ok(!result.comparison.includes('Không có dữ liệu'),'Do not insert missing previous-day placeholder');
assert.ok(result.topics[3].observation.includes('4/4 hồ sơ'));
assert.ok(result.topics[3].observation.includes('khu vực 1 1, khu vực 2 1, khu vực 3 2'));
assert.ok(result.topics[3].action.includes('ATC'),'PVSD owns ATC coordination');
assert.ok(result.topics[4].observation.includes('quân số thực tế'));
assert.ok(result.topics[4].observation.includes('booking'),'PVHK booking workload belongs after confirmed headcount');
assert.ok(result.topics[4].action.includes('Sáng (8 NS)'));
assert.ok(!/thiếu [0-9]+ NS|chưa đánh giá đủ|đảm bảo nhân sự/i.test(result.topics[4].action));
assert.ok(result.topics[5].observation.includes('Xe kéo đẩy cần kiểm tra lốp'),'Use confirmed GSE notes');
assert.ok(result.topics[6].observation.includes('3.000')||result.topics[6].observation.includes('3000'));
assert.ok(!result.topics[6].observation.includes('chưa chốt giờ hàng'),'Optional ready-by does not mark completed KG notes incomplete');
assert.ok(!result.topics[8].observation.includes('Chưa nhận được báo cáo cụ thể'));
assert.ok(!result.topics[9].observation.includes('Chưa ghi nhận tồn tại từ ca trước'));
assert.ok(html.includes('QUÂN SỐ THEO CA ĐÃ XÁC NHẬN'));
assert.ok(html.includes('Đối chiếu Lần 1 / Lần 2'));
assert.ok(html.includes('VJ102')&&html.includes('VJ104'));
assert.ok(!html.includes('…'),'No clipped analysis fragments in L2 output');
assert.ok(!html.includes('Cập nhật Lần 2: '),'No duplicated miniature annotations');
const idx=html.indexOf('III. CẢNH BÁO CAO ĐIỂM');
const peakSection=html.slice(idx,html.indexOf('IV. PHỐI HỢP THỰC HIỆN',idx));
assert.ok((peakSection.match(/<tr>/g)||[]).length>=2,'Peak rows must be preserved');
const l1=report.build({...ctx,revision:1,sourcePayload:s1,firstPayload:null});
assert.ok(!l1.comparison.includes('Đối chiếu Lần 1 → Lần 2'));
assert.ok(!l1.topics[3].observation.includes('Lịch Lần 2 đã có bãi'));
const flow=fs.readFileSync('v217-second-ui.js','utf8');
assert.ok(flow.includes('await window.SagsReportV19?.preview?.()'));
assert.ok(flow.includes('await window.SagsWorkspaceV300?.refresh?.()'));
const ui=fs.readFileSync('index.html','utf8');
assert.ok(ui.includes("APP_VERSION='V3.19'"));
assert.ok(ui.includes('v19-report.js?v=3.19'));
assert.ok(ui.includes('v217-second-ui.js?v=3.16'));
console.log('PASS V3.19: L2 full 10-topic evidence review, exact zones/bookings/KG/staff, no clipped sentences, auto refresh after save');
