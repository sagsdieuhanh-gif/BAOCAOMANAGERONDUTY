'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'..','radar-report-v28.js'),'utf8');
const scope={
  window:{SagsReportV19:{source:async()=>({}),build:x=>x}},
  document:{getElementById:()=>null},
};
vm.runInNewContext(code,scope,{filename:'radar-report-v28.js'});
const report=scope.window.SagsRadarReportV28;
assert.ok(report,'Radar V2.8 API must be registered');
const {interval,serviceMinutes,area,reportHtml}=report._test;
assert.equal(serviceMinutes({airline:'VJ',sta_min:300,std_min:400}),30);
assert.equal(serviceMinutes({airline:'KE',sta_min:300,std_min:400}),60);
assert.equal(serviceMinutes({airline:'TR',sta_min:300,std_min:345}),45);
assert.equal(area({bay:31}),'K1');assert.equal(area({bay:55}),'K1');
assert.equal(area({bay:40}),'K2');assert.equal(area({bay:70}),'K3');
assert.equal(interval({airline:'KE',sta_min:420,std_min:490}).end,480);
assert.equal(interval({airline:'VJ',sta_min:420,std_min:444}).end,444);
assert.equal(interval({airline:'VJ',sta_min:null,std_min:450}).estimated,true);
const flights=[
 {arrival:'VJ100',departure:'VJ101',sta_min:420,std_min:450,bay:31,airline:'VJ',cargo_status:'NO_CARGO'},
 {arrival:'VJ200',departure:'VJ201',sta_min:425,std_min:455,bay:38,airline:'VJ',cargo_status:'NO_CARGO'},
 {arrival:'KE300',departure:'KE301',sta_min:415,std_min:500,bay:56,airline:'KE',aircraft_type:'A330',cargo_status:'CARGO'},
 {arrival:'AK400',departure:'AK401',sta_min:430,std_min:460,bay:null,airline:'AK',cargo_status:'UNKNOWN'},
];
assert.equal(report.analyze(flights.slice(0,3),1).episodes.length,0,'3 pairs must not be included');
const r=report.analyze(flights,2);
assert.equal(r.peak.n,4);
assert.equal(r.episodes.length,1,'adjacent windows should merge');
assert.ok(r.episodes[0].last>r.episodes[0].from);
assert.equal(r.episodes[0].peak.n,4);
const alerts=r.episodes[0].alerts.map(x=>x.kind);
for(const key of ['Mật độ phục vụ','Bãi đỗ / đường công vụ','Tàu thân rộng','Vị trí đỗ','Hành lý / cargo'])assert.ok(alerts.includes(key),key);
assert.ok(r.halfHours.length===48,'whole day must have 48 half-hour blocks');
const later=flights.map(f=>({...f,sta_min:f.sta_min+300,std_min:f.std_min+300,arrival:f.arrival+'B',departure:f.departure+'B'}));
const two=report.analyze([...flights,...later],2);
assert.equal(two.episodes.length,2,'separated peaks must remain separate');
const noTime=report.analyze([{arrival:'XX1',departure:'XX2',airline:'TR',sta_min:null,std_min:null}],1);
assert.equal(noTime.unusable,1,'unusable source must be explicit');
assert.equal(noTime.episodes.length,0,'missing source times must not be invented');
const d={
  c:{date:'2026-10-31',revision:2,sourceFile:'lich.xlsx',author:'ĐH',arrivals:4,departures:4},
  summary:'Nguồn đã xác nhận',comparison:'Nguồn đã xác nhận',
  topics:[{title:'01. Lịch bay',observation:'Đã đối chiếu',action:'Kiểm tra'}],
  coord:[['Nội dung','Phương án','ĐH','Trước 16:00']],
  recommendation:'Chờ rà soát',
  alerts:[{unit:'KTS',type:'Chưa rõ xe',detail:'Cần xác minh'}],
  radar:r
};
const html=reportHtml(d);
for(const part of ['RADAR 30 PHÚT TOÀN NGÀY','CẢNH BÁO VÀ HÀNH ĐỘNG','TỔNG HỢP CẢNH BÁO','THÔNG TIN CHỜ CÁC ĐƠN VỊ XÁC NHẬN'])assert.ok(html.includes(part),part);
assert.ok(html.includes('VJ100 / VJ101'),'pair should appear once per row');
const malicious={...d,recommendation:'<script>alert("x")</script>'};
assert.ok(!reportHtml(malicious).includes('<script>'),'report text must be HTML escaped');
console.log('PASS Radar V2.8: threshold, merged episodes, zone, timing, alerts, report HTML and escaping');
