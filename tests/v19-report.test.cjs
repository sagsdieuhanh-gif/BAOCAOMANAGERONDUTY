const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const globals={
 window:{},
 staff:[{service_date:'2026-10-30',unit:'KTS',role_code:'BAGGAGE',shift:'SÁNG',quantity:74,start_min:495,end_min:1095}],
 gse:[{code:'STAIRS',ready_count:null,catalog_total:11,note:''}],
 GSE_NAMES:{STAIRS:'Thang hành khách'},
 prevDate:d=>{const z=new Date(d+'T12:00:00Z');z.setUTCDate(z.getUTCDate()-1);return z.toISOString().slice(0,10)},
 setTimeout,console
};
vm.runInNewContext(fs.readFileSync('radar-cxr/v211-report-insights.js','utf8'),globals);
vm.runInNewContext(fs.readFileSync('radar-cxr/v19-report.js','utf8'),globals);
const api=globals.window.SagsReportV19;
assert.equal(typeof api.build,'function');
assert.equal(typeof api._testCreateWord,'function');
const c={
 date:'2026-10-30',author:'Nhân viên điều hành',sourceFile:'LICH BAY SAGS 30OCT26.xlsx',
 arrivals:29,departures:28,domestic:27,international:30,
 prior:{arrival_count:34,departure_count:36},
 rows:[
 {arrival:'VJ781',departure:'VJ782',sta_min:570,std_min:600,airline:'VJ',cargo_status:'UNKNOWN',aircraft_type:'A321'},
 {arrival:'FD646',departure:'FD647',sta_min:580,std_min:610,airline:'FD',cargo_status:'UNKNOWN',aircraft_type:'A330'}
 ],note:{},controls:[]
};
const data=api.build(c);
assert.equal(data.topics.length,10);
assert.equal(data.coord.length,4);
assert.ok(data.peakRows.length>0);
assert.ok(data.summary.includes('Đến: 29'));
assert.ok(data.comparison.includes('Ngày 29/10/2026'));
const D={Paragraph:class{constructor(v){Object.assign(this,v)}},
 TextRun:class{constructor(v){Object.assign(this,v)}},
 Table:class{constructor(v){Object.assign(this,v)}},
 TableRow:class{constructor(v){Object.assign(this,v)}},
 TableCell:class{constructor(v){Object.assign(this,v)}},
 Document:class{constructor(v){Object.assign(this,v)}},
 BorderStyle:{SINGLE:'single'},AlignmentType:{CENTER:'center',LEFT:'left'},WidthType:{DXA:'dxa'}};
const document=api._testCreateWord(data,D);
const nodes=document.sections[0].children;
assert.equal(nodes.filter(x=>x instanceof D.Table).length,4);
const words=JSON.stringify(nodes);
for(const title of ['I. TÓM TẮT KHAI THÁC','II. BẢNG KIỂM SOÁT','III. CẢNH BÁO CAO ĐIỂM','IV. PHỐI HỢP THỰC HIỆN','V. KIẾN NGHỊ BAN TGĐ'])assert.ok(words.includes(title));
console.log('Radar V1.9 Word report five-section structure: OK');
