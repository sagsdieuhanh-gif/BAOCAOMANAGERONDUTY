'use strict';
const assert=require('node:assert/strict');
(async()=>{
 await import('../v21-shuttle-model.js');
 await import('../v21-shuttle-export.js');
 await import('../v24-shuttle-grid.js');
 const exp=globalThis.SagsShuttleExport._test,grid=globalThis.SagsShuttleGridV24._test;
 const stamp='2026-10-30T02:32:00Z';
 const values=[
  {unit:'DH',direction:'CXR_NHA',departure_min:1020,line_no:0,quantity:3,note:'',confirmed_at:stamp},
  {unit:'PVHK',direction:'CXR_NHA',departure_min:1020,line_no:0,quantity:4,note:'',confirmed_at:stamp}
 ];
 const extras=[{direction:'CXR_NHA',departure_min:1020,line_no:0,reason:'Xe hỗ trợ họp chuyên môn',created_by:'operator-1'}];
 const row=grid.assemble(values,extras).find(x=>x.direction==='CXR_NHA'&&x.departure_min===1020);
 assert.ok(row);
 assert.equal(row.defaultTime,false);
 assert.equal(row.reason,'Xe hỗ trợ họp chuyên môn');
 assert.equal(row.confirmed,2);
 assert.equal(row.total,7);
 assert.deepEqual([...row.missing],['KTS','QA_IT']);
 const all=exp.normalize(values,extras);
 const specific=all.find(x=>x.direction==='CXR_NHA'&&x.departure_min===1020);
 assert.ok(specific.is_custom);
 assert.equal(specific.note,'Xe hỗ trợ họp chuyên môn');
 assert.deepEqual([...specific.missing],['PVSĐ','QA & IT']);
 const sameTime=exp.normalize([],[{direction:'NHA_CXR',departure_min:390,line_no:1,reason:'Tăng cường ca sáng'}]);
 assert.ok(sameTime.find(x=>x.line_no===1).note==='Tăng cường ca sáng');
 const outputs=[];
 const ctx={};
 for(const method of ['beginPath','moveTo','lineTo','quadraticCurveTo','closePath','fill','stroke','fillRect','strokeRect','drawImage','save','restore','translate','arc','bezierCurveTo','setLineDash'])ctx[method]=()=>{};
 ctx.fillText=(s,x,y,max)=>outputs.push({text:String(s),color:ctx.fillStyle});
 let canvas;
 globalThis.document={createElement:tag=>{assert.equal(tag,'canvas');canvas={width:0,height:0,getContext:()=>ctx};return canvas;}};
 const image=exp.draw({date:'2026-10-30',rows:all},{naturalWidth:200,naturalHeight:100});
 assert.equal(image,canvas);
 assert.ok(outputs.some(x=>x.text==='TẠM TÍNH 2/4'),
  'New compact export must clearly mark partially confirmed extra trip');
 assert.ok(outputs.some(x=>x.text==='GIỜ BỔ SUNG'),
  'Extra bus marker is visible without large reason paragraphs');
 assert.ok(outputs.some(x=>x.text.startsWith('GỢI Ý XE: ')),
  'Capacity suggestion is concise on the card');
 assert.ok(!outputs.some(x=>x.text.startsWith('LÝ DO THÊM XE: ')),
  'Detailed extra-bus reason is stored in source data, not repeated on simplified image');
 const gcode=require('node:fs').readFileSync('v24-shuttle-grid.js','utf8');
 assert.ok(gcode.includes('data-v28-custom-reason'));
 assert.ok(gcode.includes('data-v24-save-all'));
 assert.ok(gcode.includes('ops_set_shuttle_reason'));
 assert.ok(gcode.includes('v28-extra-slot'));
 const index=require('node:fs').readFileSync('index.html','utf8');
 assert.ok(index.includes('v24-shuttle-grid.js?v=3.11'));
 assert.ok(index.includes('v21-shuttle-export.js?v=3.39'));
 console.log('PASS V3.36: extra bus reason retained in source, compact export shows provisional status and short vehicle suggestion');
})().catch(e=>{console.error(e);process.exitCode=1});