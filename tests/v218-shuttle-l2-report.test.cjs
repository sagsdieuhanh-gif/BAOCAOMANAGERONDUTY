'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
require('../v21-shuttle-export.js');
const m=globalThis.SagsShuttleModel,g=globalThis.SagsShuttleGridV24._test,e=globalThis.SagsShuttleExport._test;
assert.deepEqual(m.defaults.map(x=>[x.direction,x.departure_min]),[
 ['NHA_CXR',420],['NHA_CXR',1050],['NHA_CXR',1170],['CXR_NHA',990],['CXR_NHA',1110],['CXR_NHA',1560],['CXR_NHA',1935]
],'All seven confirmed fixed times');
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
assert.ok(index.includes('v21-shuttle-model.js?v=3.07'));
const output=fs.readFileSync('v21-shuttle-export.js','utf8');
assert.ok(output.includes("'TỔNG SỐ NGƯỜI'")&&output.includes('53,complete?C.navy'));
const report=fs.readFileSync('v19-report.js','utf8');
const early=report.indexOf("    (data.dailyBrief?'<h3>PHƯƠNG ÁN PHỤC VỤ LẦN 2");
const ten=report.indexOf("    '<h3>II. BẢNG KIỂM SOÁT");
assert.ok(early===-1&&ten>=0,'L2 must preserve the original ten-topic table rather than add a parallel analysis section');
assert.ok(report.includes("renderHtml:html")&&report.includes('v218ReportStatus'));
const exporter=fs.readFileSync('report-export-v29.js','utf8');
assert.ok(exporter.includes("(active.revision===2?'2':'1')"),'Official file must be labeled L1/L2');
const draft=fs.readFileSync('v217-second-ui.js','utf8');
assert.ok(draft.includes('v218PreviewL2')&&draft.includes('CHƯA ĐƯỢC DUYỆT / CHƯA LƯU'));
console.log('PASS V3.07 clock labels, four-unit vehicle totals, retained custom rows, L2 preview/export distinctions');
