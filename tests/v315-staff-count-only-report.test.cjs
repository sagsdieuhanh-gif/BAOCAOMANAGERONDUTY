'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {TextEncoder}=require('node:util');
const files={personnel:fs.readFileSync('v212-personnel.js','utf8'),report:fs.readFileSync('v19-report.js','utf8'),
 brief:fs.readFileSync('v223-l2-brief.js','utf8'),office:fs.readFileSync('office-export-v29.js','utf8'),
 native:fs.readFileSync('report-export-v29.js','utf8'),
 workspace:fs.readFileSync('v300-workspace.js','utf8'),index:fs.readFileSync('index.html','utf8')};
const context={window:{},staff:[],gse:[],GSE_NAMES:{},prevDate:d=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()-1);return x.toISOString().slice(0,10)}};
vm.runInNewContext(files.personnel,context);
const P=context.window.SagsPersonnelV212;
const rows=['DH','PVHK','KTS'].map((unit,i)=>({unit,status:'CONFIRMED',
 details:{pvb_morning:String([8,59,50][i]),pvb_night:String([8,75,51][i]),
 pvb_morning_status:i===0?'READY':i===1?'LIMITED':'PENDING',
 pvb_night_status:i===0?'READY':i===1?'LIMITED':'PENDING',
 pvb_morning_required:'200',pvb_night_required:'200'}}));
const summary=P.summarize(rows);
assert.equal(summary.headcountsConfirmed,true);
for(const line of summary.lines){
 assert.ok(line.includes('Quân số đã xác nhận'),line);
 assert.ok(!/thiếu|đủ|đảm bảo|đáp ứng|nhu cầu|định mức/i.test(line),'Norm-free count-only report: '+line);
}
assert.ok(summary.lines[0].includes('Sáng (8 NS)'));
assert.ok(summary.lines[1].includes('Đêm (75 NS)'));
assert.ok(P.summarize([]).lines.every(x=>x.includes('CHỜ XÁC NHẬN')));
context.window.SagsL2BriefV223={make:()=>null};
vm.runInNewContext(files.report,context);
const c={date:'2026-11-01',author:'Điều hành',arrivals:1,departures:1,domestic:2,international:0,
 rows:[{arrival:'VJ101',departure:'VJ102',sta_min:600,std_min:635,airline:'VJ',aircraft_type:'A321'}],
 prior:null,note:{},controls:[],revision:1,sourceFile:'Lich.xlsx',unitPlans:rows,
 staff:[{unit:'DH',role_code:'COORD',shift:'SÁNG',quantity:8,confirmed_at:'2026-10-31'},
 {unit:'DH',role_code:'COORD',shift:'ĐÊM',quantity:8,confirmed_at:'2026-10-31'}],
 gse:[],cargoPlans:[],equipmentIssues:[],contracts:[],minimumNorms:[],flightCargo:[],transport:[],
 additionalRows:[],quickReports:[]};
for(const revision of [1,2]){
 const report=context.window.SagsReportV19.build({...c,revision});
 const action=report.topics[4].action;
 assert.ok(action.includes('8 NS'));
 assert.ok(!/thiếu|đủ|đảm bảo|đáp ứng|định mức/i.test(action),'No rating in staffing section: '+action);
 const html=context.window.SagsReportV19.renderHtml(report);
 assert.ok(html.includes('QUÂN SỐ THEO CA ĐÃ XÁC NHẬN'));
 assert.ok(!html.includes('chưa phải kết luận đủ/thiếu'));
}
const office={window:{},TextEncoder,Blob,Uint8Array,atob:global.atob};
vm.runInNewContext(files.office,office);
const exp=office.window.SagsOfficeExportV29;
const fake=(tag,txt='',classes=[],children=[])=>({
 nodeType:1,tagName:tag,innerText:txt,textContent:txt,children,
 classList:{contains:c=>classes.includes(c)}
});
const warning=fake('DIV','',['v27-inline-report-warning'],[
 fake('H3','THÔNG TIN CHƯA XÁC NHẬN – YÊU CẦU CÁC ĐƠN VỊ BỔ SUNG'),
 fake('UL','',[],[fake('LI','PVSĐ – TRANG THIẾT BỊ: Chưa có xác nhận số GSE khả dụng'),
 fake('LI','KHO HÀNG – CARGO: Thiếu KG / PCS / giờ kho sẵn sàng')])
]);
const page=fake('DIV','',[],[warning,fake('H3','I. TÓM TẮT KHAI THÁC'),
 fake('P','Báo cáo nhân sự ĐH, PVHK và PVSĐ đã xác nhận')]);
const full=exp.blocksFromDOM(page),pdf=exp.blocksFromDOM(page,{hidePendingWarnings:true});
assert.ok(full.some(b=>b.text?.includes('KHO HÀNG – CARGO')));
assert.ok(pdf.some(b=>b.text?.includes('I. TÓM TẮT KHAI THÁC')));
assert.ok(pdf.some(b=>b.text?.includes('Báo cáo nhân sự')));
assert.ok(!pdf.some(b=>/KHO HÀNG|TRANG THIẾT BỊ|THÔNG TIN CHƯA XÁC NHẬN/.test(b.text||'')),
 'PDF option must hide complete unconfirmed-alert block');
assert.ok(files.office.includes("format==='pdf'?options:{}"),'Word should never use PDF filter');
assert.ok(files.native.includes("$('v315PdfHidePending')?.checked===true"));
assert.ok(files.workspace.includes("$('v315WorkspaceHidePending')?.checked===true"));
assert.ok(files.index.includes('id="v315PdfHidePending"'));
assert.ok(files.index.includes("APP_VERSION='V3.18'"));
assert.ok(files.index.includes('office-export-v29.js?v=3.15'));
assert.ok(files.index.includes('report-export-v29.js?v=3.15'));
console.log('PASS V3.15: report shows only confirmed headcounts; PDF-only optional hide warnings leaves Word and preview untouched');
