const assert=require('node:assert/strict');
(async()=>{
 await import('../v21-shuttle-model.js');
 await import('../v21-shuttle-export.js');
 const m=globalThis.SagsShuttleModel,e=globalThis.SagsShuttleExport;
 assert.ok(m&&e&&e._test);
 const records=[
  {unit:'DH',direction:'NHA_CXR',departure_min:390,quantity:5,confirmed_at:'2026-10-30T02:00:00Z'},
  {unit:'KTS',direction:'NHA_CXR',departure_min:390,quantity:17,confirmed_at:'2026-10-30T02:00:00Z'},
  {unit:'PVHK',direction:'NHA_CXR',departure_min:390,quantity:9,confirmed_at:'2026-10-30T02:01:00Z'},
  {unit:'KHO',direction:'NHA_CXR',departure_min:390,quantity:0,confirmed_at:'2026-10-30T02:02:00Z'},
  {unit:'KHO',direction:'CXR_NHA',departure_min:1380,quantity:7,confirmed_at:'2026-10-30T02:03:00Z',is_custom:true}
 ];
 const rows=e._test.normalize(records);
 assert.equal(rows.length,11);
 const first=rows.find(x=>x.direction==='NHA_CXR'&&x.departure_min===390);
 assert.equal(first.total,31);
 assert.equal(first.confirmed,4);
 assert.equal(first.units[3].quantity,0);
 assert.equal(first.units[0].quantity,5);
 const custom=rows.find(x=>x.direction==='CXR_NHA'&&x.departure_min===1380);
 assert.equal(custom.total,7);
 assert.equal(custom.is_custom,true);
 assert.equal(m.clock(1500),'01:00 (+1)');
 assert.equal(typeof e.exportFile,'function');
 console.log('V2.2 four-department shuttle assembly, direction and export: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
