const assert=require('node:assert/strict');
(async()=>{
 await import('../v21-shuttle-model.js');
 await import('../v24-shuttle-grid.js');
 const core=globalThis.SagsShuttleGridV24._test;
 assert.equal(core.fieldOf('QA'),'QA_IT');
 assert.equal(core.fieldOf('IT'),'QA_IT');
 assert.equal(core.editable('QA','QA_IT'),true);
 assert.equal(core.editable('IT','QA_IT'),true);
 assert.equal(core.editable('QA','PVHK'),false);
 assert.equal(core.editable('KTS','KTS'),true);
 assert.equal(core.editable('KTS','QA_IT'),false);
 assert.equal(core.editable('DH','KTS'),false);
 assert.equal(core.editable('ADMIN','PVHK'),true);
 const base=[
  {direction:'NHA_CXR',departure_min:420,line_no:0,unit:'DH',quantity:2,confirmed_at:'2026-10-30T08:01:00Z'},
  {direction:'NHA_CXR',departure_min:420,line_no:0,unit:'KTS',quantity:15,confirmed_at:'2026-10-30T08:02:00Z'},
  {direction:'NHA_CXR',departure_min:420,line_no:0,unit:'PVHK',quantity:5,confirmed_at:'2026-10-30T08:03:00Z'},
  {direction:'NHA_CXR',departure_min:420,line_no:0,unit:'KHO',quantity:2,confirmed_at:'2026-10-30T08:04:00Z'},
  {direction:'NHA_CXR',departure_min:420,line_no:0,unit:'QA_IT',quantity:5,confirmed_at:'2026-10-30T08:05:00Z'},
  {direction:'NHA_CXR',departure_min:420,line_no:1,unit:'QA_IT',quantity:0,confirmed_at:'2026-10-30T08:05:00Z'}
 ];
 const extra=[{direction:'NHA_CXR',departure_min:420,line_no:1}];
 const rows=core.assemble(base,extra);
 assert.equal(rows.length,11);
 const main=rows.find(x=>x.direction==='NHA_CXR'&&x.departure_min===420&&x.line_no===0);
 assert.equal(main.total,29);
 assert.equal(main.confirmed,5);
 assert.equal(core.classify(main).label,'29 CHỖ');
 const child=rows.find(x=>x.direction==='NHA_CXR'&&x.departure_min===420&&x.line_no===1);
 assert.equal(child.total,0);
 assert.equal(child.confirmed,1);
 assert.equal(core.classify(child).kind,'pending');
 const outstanding=[...base.filter(x=>x.line_no===0),{direction:'NHA_CXR',departure_min:420,line_no:0,unit:'QA_IT',quantity:45}];
 assert.equal(core.classify({...main,total:46}).label,'CẦN BỔ SUNG XE');
 assert.equal(core.classify({...main,total:30}).label,'45 CHỖ');
 assert.equal(core.classify({...main,total:0}).label,'KHÔNG CẦN XE');
 assert.ok(rows.findIndex(x=>x.line_no===1)===rows.findIndex(x=>x.line_no===0&&x.departure_min===420)+1);
 console.log('V2.4 QA/IT shared column, permissions, in-grid child rows, 29/45 seat rules: OK');
})().catch(e=>{console.error(e);process.exitCode=1});