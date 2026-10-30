const assert=require('node:assert/strict');
(async()=>{
 await import('../v21-shuttle-model.js');
 const m=globalThis.SagsShuttleModel;
 assert.equal(m.defaults.length,10);
 assert.deepEqual(m.defaults.filter(x=>x.direction==='NHA_CXR').map(x=>x.departure_min),[390,420,540,1050,1170]);
 assert.deepEqual(m.defaults.filter(x=>x.direction==='CXR_NHA').map(x=>x.departure_min),[495,540,990,1125,1500]);
 assert.equal(m.clock(1500),'01:00 (+1)');
 assert.equal(m.clock(540),'09:00');
 assert.equal(m.parseClock('01:00',true),1500);
 assert.equal(m.parseClock('23:40',true),2860);
 assert.equal(m.parseClock('25:00',false),null);
 assert.equal(m.isDefault('CXR_NHA',540),true);
 assert.equal(m.isDefault('CXR_NHA',570),false);
 assert.ok(m.defaults.find(x=>x.direction==='CXR_NHA'&&x.departure_min===540).note.includes('họp chuyên môn'));
 console.log('V2.1 ten default routes, custom routes and next-day controls: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
