'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const m=globalThis.SagsShuttleModel,g=globalThis.SagsShuttleGridV24._test,e=globalThis.SagsShuttleExport._test;
assert.deepEqual(m.defaults.map(x=>[x.direction,x.departure_min]),[
 ['NHA_CXR',420],['NHA_CXR',1050],['NHA_CXR',1170],['CXR_NHA',990],['CXR_NHA',1110],['CXR_NHA',1560],['CXR_NHA',1935]
],'Seven confirmed fixed times');
assert.equal(m.clock(1935),'08:15');
assert.equal(m.clock(1560),'02:00');
assert.equal(m.isDefault('CXR_NHA',1560),true);
assert.equal(m.isDefault('CXR_NHA',1260),false,'Other bus time can be added');
assert.equal(m.isDefault('NHA_CXR',390),false);
assert.equal(m.isDefault('CXR_NHA',495),false);
assert.equal(m.isDefault('CXR_NHA',1125),false);
const v=[
 {unit:'DH',direction:'NHA_CXR',departure_min:420,line_no:0,quantity:10},
 {unit:'PVHK',direction:'NHA_CXR',departure_min:420,line_no:0,quantity:20},
 {unit:'KTS',direction:'NHA_CXR',departure_min:420,line_no:0,quantity:15},
 {unit:'QA_IT',direction:'NHA_CXR',departure_min:420,line_no:0,quantity:0},
 {unit:'KHO',direction:'NHA_CXR',departure_min:420,line_no:0,quantity:60},
 {unit:'DH',direction:'CXR_NHA',departure_min:1125,line_no:0,quantity:5}
];
const rows=g.assemble(v,[]);
const main=rows.find(x=>x.direction==='NHA_CXR'&&x.departure_min===420);
assert.equal(main.confirmed,4);
assert.equal(main.total,45,'Warehouse must not affect total');
assert.equal(main.cells.length,4);
assert.equal(g.classify(main).label,'45 CHỖ');
assert.equal(rows.filter(x=>x.direction==='NHA_CXR').length,3,'Three NHA fixed hours, including 19:30');
const oldTime=rows.find(x=>x.direction==='CXR_NHA'&&x.departure_min===1125);
assert.ok(oldTime&&!oldTime.defaultTime,'Old saved time must be extra, not deleted');
const exp=e.normalize(v);
const head=exp.find(x=>x.direction==='NHA_CXR'&&x.departure_min===420);
assert.equal(head.total,45);assert.equal(head.confirmed,4);assert.equal(head.units.length,4);
assert.deepEqual([...head.missing],[]);
assert.ok(exp.find(x=>x.direction==='CXR_NHA'&&x.departure_min===1935));
assert.ok(exp.find(x=>x.direction==='CXR_NHA'&&x.departure_min===1560&&!x.is_custom));
assert.equal(exp.find(x=>x.departure_min===1125).is_custom,true);
const src=fs.readFileSync('v24-shuttle-grid.js','utf8');
assert.ok(src.includes("['DH','PVHK','KTS','QA_IT']"));
assert.ok(!src.includes("['DH','KTS','PVHK','KHO','QA_IT']"));
const index=fs.readFileSync('index.html','utf8');
assert.ok(index.includes('v218ReportStatus')&&/V3\.\d{2}/.test(index));
assert.ok(index.includes('v21-shuttle-model.js?v=3.11'));
const output=fs.readFileSync('v21-shuttle-export.js','utf8');
assert.ok(output.includes("'NGƯỜI':'CHƯA NHẬP'")&&output.includes("v.confirmed===UNITS.length"),
 'Compact shuttle export distinguishes total entered people from absent confirmation');
const report=fs.readFileSync('v19-report.js','utf8');
const early=report.indexOf("    (data.dailyBrief?'<h3>PHƯƠNG ÁN PHỤC VỤ LẦN 2");
const ten=report.indexOf("    '<h3>II. NHẬN ĐỊNH VÀ PHƯƠNG ÁN");
assert.ok(early===-1&&ten>=0&&report.includes('topicsTable=')&&report.includes('v330-topic-block'),'L2 retains a unified ten-topic executive analysis in readable framed sections');
assert.ok(report.includes("renderHtml:html")&&report.includes('v218ReportStatus'));
const exporter=fs.readFileSync('report-export-v29.js','utf8');
assert.ok(exporter.includes('filenameFor(node.dataset.reportDate,format)'),'Export filename must use actual preview service date');
assert.ok(exporter.includes('DỰ BÁO KHAI THÁC NGÀY '));
assert.ok(exporter.includes("node.dataset.reportDate!==date"),'Do not export a different service day');
const sandbox={SagsReportV19:{}};require('node:vm').runInNewContext(exporter,{window:sandbox,document:{querySelectorAll:()=>[]}});
assert.equal(sandbox.SagsMainReportV29.filenameFor('2026-11-28','docx'),'DỰ BÁO KHAI THÁC NGÀY 28.11.2026.docx');
assert.equal(sandbox.SagsMainReportV29.filenameFor('2027-01-02','pdf'),'DỰ BÁO KHAI THÁC NGÀY 02.01.2027.pdf');
const draft=fs.readFileSync('v217-second-ui.js','utf8');
assert.ok(draft.includes('v218PreviewL2')&&draft.includes('CHƯA ĐƯỢC DUYỆT / CHƯA LƯU'));
console.log('PASS V3.11 clock labels, four-unit vehicle totals, retained custom rows, L2 preview/export distinctions');
