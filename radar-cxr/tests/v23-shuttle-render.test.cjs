const assert=require('node:assert/strict');
(async()=>{
 await import('../v21-shuttle-model.js');
 await import('../v21-shuttle-export.js');
 const m=globalThis.SagsShuttleModel,exp=globalThis.SagsShuttleExport;
 const stamp='2026-10-30T02:32:00Z';
 const roles=['DH','KTS','PVHK','KHO'];
 const input=[];
 for(const [minute,qty] of [[390,5],[420,9],[540,14],[1050,16],[1170,1]]){
   roles.forEach((unit,i)=>input.push({unit,direction:'NHA_CXR',departure_min:minute,quantity:unit==='DH'?0:qty,confirmed_at:stamp}));
 }
 const rows=exp._test.normalize(input);
 assert.equal(rows.length,10);
 const out=[];
 const c={};
 for(const method of ['beginPath','moveTo','lineTo','quadraticCurveTo','closePath','fill','stroke','fillRect','drawImage','save','restore','translate','arc','bezierCurveTo','setLineDash'])
   c[method]=()=>{};
 c.fillText=(s)=>out.push(String(s));
 let canvas;
 globalThis.document={createElement:(tag)=>{
   assert.equal(tag,'canvas');canvas={width:0,height:0,getContext:()=>c};return canvas;
 }};
 const logo={naturalWidth:500,naturalHeight:200};
 const final=exp._test.draw({date:'2026-10-30',rows},logo);
 assert.equal(final,canvas);
 assert.equal(final.width,1600);
 assert.ok(final.height>1000&&final.height<2500);
 assert.ok(out.includes('BẢNG TỔNG HỢP XE GIAO CA'));
 assert.ok(out.includes('NHA TRANG → CAM RANH'));
 assert.ok(out.includes('CAM RANH → NHA TRANG'));
 assert.ok(out.includes('29 CHỖ'));
 assert.ok(out.includes('45 CHỖ'));
 assert.ok(out.includes('BỔ SUNG XE'));
 assert.ok(out.includes('ĐH'));
 assert.ok(out.includes('KHO HÀNG'));
 assert.ok(out.includes('NGÀY KHAI THÁC'));
 assert.throws(()=>exp._test.draw({date:'2026-10-30',rows},null),/logo/);
 console.log('V2.3 preview / PNG / PDF shared artwork, SAGS logo, 29/45 types: OK');
})().catch(e=>{console.error(e);process.exitCode=1});
