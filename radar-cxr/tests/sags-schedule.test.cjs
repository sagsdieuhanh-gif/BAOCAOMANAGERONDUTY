const assert=require('node:assert/strict');
(async()=>{
 await import('../sags-schedule.js');
 const core=globalThis.SagsSchedule;
 assert.ok(core&&typeof core.parse==='function');
 const rows=[
 ['GROUND OPERATION DEPARTMENT'],['29/10/2026 (SAGS-CXR)'],
 ['ARRIVAL FLIGHT',null,null,null,null,null,null,'DEPARTURE FLIGHT'],
 [1,'VJ602','VNA543','A321','SGN-CXR','0920',136,1,'VJ5208','VNA815','A330','CXR-SVO','0615','TBA'],
 [2,'AK204',null,'A320','KUL-CXR','1130','TBA',2,'VJ603','VNA543','A321','CXR-SGN','0950',213],
 [3,'TW037',null,'B737','TAE-CXR','2335','TBA',3,'AK205',null,'A320','CXR-KUL','1200','TBA'],
 [null,null,null,null,null,null,null,4,'TW038',null,'B737','CXR-TAE','0035+','TBA']
 ];
 const r=core.parse(rows);
 assert.equal(r.payload.service_date,'2026-10-29');
 assert.equal(r.stats.arrival_count,3);assert.equal(r.stats.departure_count,4);
 assert.equal(r.stats.matched_reg,1);assert.equal(r.stats.matched_route,2);
 assert.equal(r.stats.unmatched,1);assert.equal(r.stats.total_records,4);
 assert.equal(r.payload.flights.find(x=>x.departure==='TW038').std_min,1475);
 assert.equal(r.payload.flights.find(x=>x.departure==='VJ5208').match_method,'DEPARTURE_ONLY');
 assert.equal(r.payload.flights.find(x=>x.arrival==='AK204').arrival_pax,null);
 assert.equal(r.payload.flights.find(x=>x.arrival==='VJ602').arrival_pax,136);
 assert.equal(r.payload.flights.find(x=>x.arrival==='VJ602').aircraft_reg,'VNA543');
 assert.throws(()=>core.parse([['Wrong Header']]));
 console.log('SAGS LB template parser: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
