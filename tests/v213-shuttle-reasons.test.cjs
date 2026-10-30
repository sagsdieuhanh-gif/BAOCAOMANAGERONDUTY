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
 assert.ok(outputs.some(x=>x.text.includes('CHƯA XÁC NHẬN: PVSĐ, QA & IT')));
 assert.ok(outputs.some(x=>x.text.includes('LÝ DO THÊM XE: Xe hỗ trợ họp chuyên môn')));
 assert.ok(outputs.some(x=>x.text==='GIỜ THÊM'));
 assert.ok(outputs.filter(x=>x.text.includes('LÝ DO THÊM XE')).every(x=>/^#B16D26$/i.test(x.color)),'reason must use orange-highlight color');
 const gcode=require('node:fs').readFileSync('v24-shuttle-grid.js','utf8');
 assert.ok(gcode.includes('data-v28-custom-reason'));
 assert.ok(gcode.includes('data-v24-save-all'));
 assert.ok(gcode.includes('ops_set_shuttle_reason'));
 assert.ok(gcode.includes('v28-extra-slot'));
 const index=require('node:fs').readFileSync('index.html','utf8');
 assert.ok(index.includes('v24-shuttle-grid.js?v=2.23'));
 assert.ok(index.includes('v21-shuttle-export.js?v=2.23'));
 console.log('PASS V2.13 missing-unit roster, extra bus reason, orange highlight and export canvas');
})().catch(e=>{console.error(e);process.exitCode=1});