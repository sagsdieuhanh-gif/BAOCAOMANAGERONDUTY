'use strict';
const assert=require('node:assert/strict');
globalThis.window=globalThis;
globalThis.staff=[];globalThis.gse=[];globalThis.GSE_NAMES={};
globalThis.prevDate=d=>{const n=new Date(d+'T00:00:00Z');n.setUTCDate(n.getUTCDate()-1);return n.toISOString().slice(0,10);};
require('../v211-report-insights.js');
require('../v223-l2-brief.js');
require('../v19-report.js');
const report=globalThis.SagsReportV19;
const flights=[
 {arrival:'VJ700',departure:'VJ701',airline:'VJ',aircraft_type:'A321',sta_min:590,std_min:635,bay:39},
 {arrival:'VJ702',departure:'VJ703',airline:'VJ',aircraft_type:'A321',sta_min:598,std_min:642,bay:40}
];
const base={
 date:'2026-11-01',author:'Điều hành',arrivals:2,departures:2,domestic:4,international:0,
 rows:flights,prior:null,note:{},controls:[],revision:1,sourceFile:'LICH BAY',
 staff:[],gse:[],minimumNorms:[],cargoPlans:[],equipmentIssues:[],contracts:[],unitPlans:[],
 flightCargo:[],transport:[],additionalRows:[],quickReports:[]
};
const l1=report.build(base);
const text=l1.topics[0].action;
for(const phrase of ['quầy check-in','gate/boarding','đón khách chuyến đến','tiễn khách chuyến đi','tại tàu bay'])
 assert.ok(text.includes(phrase),'Lần 1 thiếu công đoạn PVHK: '+phrase);
assert.ok(l1.topics[1].action.includes('giờ mở quầy check-in'));
assert.ok(l1.peakRows[0].action.includes('quầy check-in'));
assert.ok(!text.includes('PVHK bố trí người đón, tiễn khách.'),'Remove truncated legacy sentence');
const op={
 hours:{peak:[],verified:0,unverified:[]},
 top:[{start:600,total:2,active:['VJ701','VJ703']}],handoffs:[],stand:[],
 windows:[{start:600,total:2,active:['VJ701','VJ703'],checkin:{openFlights:['VJ701','VJ703'],required:4,available:3,shortage:1},
   gse:[],baggage:{shortage:0},driver:{shortage:0},cobusDrivers:{shortage:0},gateStaff:{shortage:0},unknownCargo:0}],
 gate:{warnings:[{gate:'G2',a:'VJ701',b:'VJ703',start:600,verified:true}],risky:[]}
};
globalThis.SagsOpsForecastV219={summarize:()=>op,svg:()=>'<svg></svg>'};
const l2=report.build({...base,revision:2,sourcePayload:{flights,source_detail:{
 arrivals:[],departures:[{no:'VJ701',carrier:'VJ',t:635,gate:'G2',booking_sum:125},
 {no:'VJ703',carrier:'VJ',t:642,gate:'G2',booking_sum:120}]} }});
assert.ok(l2.dailyBrief,'Lần 2 should generate contextual work assignments');
for(const key of ['peak','gate','checkin']){
 const item=l2.dailyBrief.entries.find(x=>x.key===key);
 assert.ok(item,'Missing L2 situation '+key);
 for(const fragment of ['quầy check-in','boarding','tại tàu bay'])
   assert.ok(item.action.includes(fragment),key+' missing real PVHK phase: '+fragment);
}
assert.ok(l2.topics[1].action.includes('quầy check-in')&&l2.topics[1].action.includes('tại tàu bay'));
const rendered=report.renderHtml(l2);
assert.ok(rendered.includes('quầy check-in')&&rendered.includes('tại tàu bay'),
 'Report preview/Word/PDF source must not truncate PVHK operational duties');
assert.ok(rendered.includes('PVHK phân bổ người theo giờ mở quầy'),
 'Preserve complete L2 peak action, not just its first clipped phrase');
const manual=report.build({...base,revision:2,controls:[{topic:2,action:'Phương án điều hành đã duyệt'}],
 sourcePayload:{flights,source_detail:{arrivals:[],departures:[{no:'VJ701',carrier:'VJ',t:635,gate:'G2',booking_sum:125}]}}});
assert.equal(manual.topics[1].action,'Phương án điều hành đã duyệt');
assert.ok(report.renderHtml(manual).includes('Phương án điều hành đã duyệt'),
 'Confirmed editorial override must take precedence over generated prose');
console.log('PASS V3.12: PVHK check-in, gate/boarding, aircraft service in L1/L2 and export source; manual override kept');
