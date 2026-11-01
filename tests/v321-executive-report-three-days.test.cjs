'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
globalThis.window=globalThis;globalThis.staff=[];globalThis.gse=[];globalThis.GSE_NAMES={};
globalThis.prevDate=d=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10)};
require('../v212-personnel.js');
require('../v320-staff-roster.js');require('../v320-cargo-booking.js');
require('../v319-report-editorial.js');require('../v321-executive-editorial.js');require('../v19-report.js');
const mod=window.SagsReportV19;
const schedule={
 '2026-10-31':{arr:33,dep:35,pairs:35,z:[22,2,11],peak:'09:30',booking:0},
 '2026-11-01':{arr:39,dep:36,pairs:40,z:[23,6,11],peak:'00:00',booking:17000},
 '2026-11-02':{arr:26,dep:25,pairs:28,z:[19,0,9],peak:'09:30',booking:0}
};
function createRows(day,l2){
 const cfg=schedule[day],stands=[
  ...Array(cfg.z[0]).fill(31),...Array(cfg.z[1]).fill(39),...Array(cfg.z[2]).fill(61)];
 return Array.from({length:cfg.pairs},(_,i)=>({
  arrival:'VJ'+(7000+i),departure:'VJ'+(8000+i),airline:'VJ',aircraft_type:'A320',
  sta_min:570+i*5,std_min:600+i*5,bay:l2?stands[i]:null
 }));
}
function data(day,revision){
 const cfg=schedule[day],l2=revision===2;
 const rows=createRows(day,l2),first={
  arrival_count:day==='2026-11-01'?40:cfg.arr,
  departure_count:day==='2026-11-01'?37:cfg.dep
 };
 const charter=day==='2026-10-31'?[{no:'QQE530',charter:true,ferry:true}]:[];
 const cargo=day==='2026-11-01'?
  [['TW034',1500],['VJ1774',1500],['VJ1782',1500],['VJ5200',3000],
   ['VJ5352',1500],['VJ730',2500],['VJ770',2500],['VJ834',2000],['VU1270',1000]]
   .map(([flight_no,cargo_kg])=>({flight_no,cargo_kg})):[];
 const unitPlans=day==='2026-10-31'?[{unit:'KTS',status:'CONFIRMED',
  details:{pvb_morning:'70',pvb_night:'80',pvb_morning_status:'LIMITED',pvb_night_status:'LIMITED'}}]:
 day==='2026-11-01'?[
  {unit:'DH',status:'CONFIRMED',details:{pvb_morning:'21',pvb_night:'18'}},
  {unit:'PVHK',status:'CONFIRMED',details:{pvb_morning:'59',pvb_night:'75'}},
  {unit:'KTS',status:'CONFIRMED',details:{pvb_morning:'50',pvb_night:'51',
   gse_risk:'Xe kéo đẩy máy bay 430 CXR 31806 lốp bị phù, mòn không đều. Xe xinfa 30704 cho xe xinfa 30703 mượn bơm nước máy sau'}}
 ]:[{unit:'DH',status:'CONFIRMED',details:{pvb_morning:'14',pvb_night:'14'}},
  {unit:'PVHK',status:'CONFIRMED',details:{personnel_structure:'V3.20'}},
  {unit:'KTS',status:'CONFIRMED',details:{personnel_structure:'V3.20',
   gse_risk:'Xe kéo đẩy máy bay 430 CXR 31806 lốp bị phù, mòn không đều.\nXe xinfa 30704 nằm xsc do cho xe xinfa 30703 mượn bơm nước máy sau'}}];
 const staff=day==='2026-11-02'?
 [['PVHK','PVHK_OFFICE',1,0],['PVHK','PVHK_DEPARTURE_TEAM',33,33],
  ['PVHK','PVHK_ARRIVAL_TEAM',14,15],['KTS','KTS_OFFICE',1,1],
  ['KTS','KTS_RAMP_TEAM',18,16],['KTS','BAGGAGE',9,7],['KTS','KTS_HLSD_SKO',9,11],
  ['KTS','TERMINAL_BAGGAGE',11,10],['KTS','KTS_HLNG_SKO',4,4],
  ['KTS','KTS_PVTT',13,13],['KTS','KTS_PVTT_SKO',3,3],['KTS','KTS_PVTT_TC',0,3],
  ['KTS','KTS_WORKSHOP_SC',7,0]]
 .flatMap(([unit,role_code,m,n])=>[{unit,role_code,shift:'SÁNG',quantity:m,confirmed_at:'ok'},
 {unit,role_code,shift:'ĐÊM',quantity:n,confirmed_at:'ok'}]):[];
 return {date:day,revision,author:'Phòng Điều hành',
  arrivals:cfg.arr,departures:cfg.dep,domestic:0,international:0,
  rows,sourcePayload:{source_detail:{departures:charter}},
  firstPayload:first,prior:null,note:{},controls:[],unitPlans,staff,cargoPlans:cargo,
  equipmentIssues:[],gse:[],contracts:[],minimumNorms:[],flightCargo:[],transport:[],
  additionalRows:[],quickReports:[],sourceFile:'Book4.xlsx'};
}
for(const day of Object.keys(schedule))for(const rev of [1,2]){
 const obj=data(day,rev),r=mod.build(obj),html=mod.renderHtml(r),cfg=schedule[day];
 assert.equal(r.topics.length,10,'All ten subjects present');
 assert.ok(html.includes('v321-executive')&&html.includes('v321-report-block'),'Executive layout active');
 assert.ok(!html.includes('Nguồn: quân số xác nhận')&&!html.includes('Nguồn Lần 2: Book4.xlsx'));
 assert.ok(!html.includes('Lần 1 được giữ làm mốc so sánh'),'Hidden raw source only');
 assert.ok(!html.includes('II. BẢNG KIỂM SOÁT'),'Dense four-column analysis removed');
 assert.ok(html.includes('II. NHẬN ĐỊNH VÀ PHƯƠNG ÁN'));
 assert.ok(html.includes('class="v321-key"')&&html.includes('class="v321-value"'));
 assert.ok(!html.includes('Chưa có nội dung bổ sung từ các phòng.'),'No empty boilerplate heading');
 assert.ok(!html.includes('Đề nghị các phòng chủ động bố trí lực lượng'),'No generic AI recommendation');
 assert.ok(r.topics[0].observation.includes(cfg.arr+' chuyến đến'));
 assert.ok(r.topics[0].observation.includes(cfg.dep+' chuyến đi'));
 if(rev===1){
   assert.ok(r.topics[3].observation.includes('Lần 1 chưa có vị trí đỗ'),'Never infer L1 stands');
   assert.ok(!r.topics[3].observation.includes('K2 '+cfg.z[1]));
 }else{
   for(const [i,k] of ['K1','K2','K3'].entries())
     assert.ok(r.topics[3].observation.includes(k+' '+cfg.z[i]),'Wrong stand zone '+day+'/'+k);
   assert.ok(r.topics[3].action.includes('PVSĐ'));
   if(cfg.z[1]+cfg.z[2])assert.ok(r.topics[3].action.includes('ATC'),'PVSĐ coordinates with ATC');
   if(day==='2026-11-01'){
     assert.ok(r.topics[0].observation.includes('giảm 1 chuyến'));
     assert.ok(r.topics[6].observation.includes('17.000 kg'));
   }else{
     assert.ok(r.topics[0].observation.includes('không đổi so với Lần 1'));
   }
 }
 if(day==='2026-10-31'){
   assert.ok(r.topics[4].observation.includes('đánh dấu hạn chế'));
   assert.ok(r.topics[2].observation.includes('QQE530'));
   assert.ok(r.topics[2].observation.includes('chưa thống nhất'));
   assert.ok(!r.topics[2].observation.includes('Charter: QQE530. Ferry: QQE530'));
   assert.ok(!r.topics[2].observation.includes('Charter: .'));
 }
 if(day==='2026-11-02'){
   assert.ok(r.topics[4].observation.includes('3/3 nhóm'));
   assert.ok(r.topics[5].observation.includes('xe 30703')||r.topics[5].observation.includes('Xe XINFA'));
   assert.ok(!r.topics[5].observation.includes('đã được thay thế'),'Never invent device repair');
 }
 if(day!=='2026-11-01')assert.ok(!r.topics[6].observation.includes('17.000 kg'));
 assert.ok(r.topics[7].action.includes('OTP'));
}
const manual=data('2026-11-02',2);
manual.controls=[{topic:4,observation:'Bãi tàu theo thông báo AOC đã chốt.',action:'Phục vụ sân đỗ áp dụng tuyến công vụ đã duyệt.'}];
const r=mod.build(manual);
assert.equal(r.topics[3].observation,manual.controls[0].observation);
assert.equal(r.topics[3].action,manual.controls[0].action);
const editor=fs.readFileSync('v321-executive-editorial.js','utf8');
assert.ok(editor.includes('const changeWord=')&&editor.includes('conflicting'));
const index=fs.readFileSync('index.html','utf8');
assert.ok(index.includes("APP_VERSION='V3.21'"));
assert.ok(index.indexOf('v321-executive-editorial.js?v=3.21')<index.indexOf('v19-report.js?v=3.21'));
assert.ok(index.includes('v300-workspace.css?v=3.21'));
console.log('PASS V3.21: 6 actual-date L1/L2 scenarios, concise executive presentation, no source footer, correct stand/cargo/ATC, overrides');
