'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const js=fs.readFileSync('v220-friendly-ui.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('v220-friendly-ui.css','utf8');
const logo=fs.readFileSync('v19-report.js','utf8');
const radar=fs.readFileSync('radar-report-v28.js','utf8');
const shuttle=fs.readFileSync('v21-shuttle-export.js','utf8');
const grid=fs.readFileSync('v24-shuttle-grid.js','utf8');
const context={window:{},document:{readyState:'loading',addEventListener(){}}};
vm.runInNewContext(js,context);
const api=context.window.SagsFriendlyUIV220;
assert.ok(api,'Friendly UI module must initialize');
assert.deepEqual(Array.from(api.groups),['overview','input','analysis','report'],'Keep exactly four primary groups');
const routes=api.routes.flatMap(x=>Array.from(x.tabs));
assert.equal(new Set(routes).size,routes.length,'Every tab must appear only once in visible navigation');
for(const name of ['home','sources','pvhk','pvsd','staff','gse','warehouse','qa_it','doorclose','radar','report','quick','shuttle-report','radar-report','admin']){
 assert.ok(routes.includes(name),'Missing original workflow: '+name);
}
assert.ok(js.includes('v220Advanced'),'Specialist tasks must be in advanced drawer');
assert.ok(js.includes("tab==='admin'&&!isAdmin()"),'ADMIN permission must be enforced by navigation');
assert.ok(html.includes('v220Hub')&&html.includes('v220-friendly-ui.js'),'Root app must load friendly shell');
assert.ok(html.includes('v220-friendly-ui.css'),'Root app must load friendly styles');
assert.ok(css.includes('@media(max-width:720px)'),'Phone layouts required');
assert.ok(html.includes('CÔNG TY CỔ PHẦN PHỤC VỤ MẶT ĐẤT SÀI GÒN CAM RANH'),'Full company title in header');
assert.ok(logo.includes('CÔNG TY CỔ PHẦN PHỤC VỤ MẶT ĐẤT SÀI GÒN CAM RANH'),'Management report branding');
assert.ok(radar.includes('CÔNG TY CỔ PHẦN PHỤC VỤ MẶT ĐẤT SÀI GÒN CAM RANH'),'Radar export branding');
assert.ok(shuttle.includes('CÔNG TY CỔ PHẦN PHỤC VỤ MẶT ĐẤT SÀI GÒN CAM RANH'),'Shuttle PNG/PDF branding');
for(const file of ['assets/logo-sags.png','assets/shuttle-29.webp','assets/shuttle-45.webp']){
 assert.ok(fs.statSync(file).size>1500,'Missing genuine image asset '+file);
}
for(const file of ['assets/shuttle-29.webp','assets/shuttle-45.webp']){
 const b=fs.readFileSync(file);assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WEBP');
}
assert.ok(shuttle.includes("loadVehicleIcons()"),'Real vehicle photo needs to load for every export');
assert.ok(shuttle.includes('draw(data,logo,vehicles)'),'PNG/PDF and preview must share the same image with vehicles');
assert.ok(grid.includes("shuttle-'+x.seats+'.webp")&&grid.includes('cls.units'),'Input suggestions must show every 29/45 coach dynamically');
assert.ok(shuttle.includes('GỢI Ý LOẠI XE'),'Full shuttle export must retain suggestion');
for(const p of ['report-export-v29.js','office-export-v29.js'])assert.ok(fs.existsSync(p),'Keep full Word/PDF export mechanism '+p);
assert.ok(html.includes('v21ShuttleExportStatus')&&html.includes('v19ReportPreview'),'Keep original export buttons');
console.log('PASS V2.20: four unique workflow groups, admin role, mobile UI, full report/shuttle exports, verified bus assets and branding');
