'use strict';
const assert=require('node:assert/strict');
(async()=>{
 await import('../v21-shuttle-model.js');
 await import('../v21-shuttle-export.js');
 const messages=[], clicks=[], statuses={status:{textContent:''},preview:{innerHTML:'',replaceChildren(){}},day:{value:'2026-10-30'}};
 globalThis.unit='DH';globalThis.me={id:'test'};globalThis.alert=m=>messages.push(m);
 globalThis.Image=class{
   constructor(){this.naturalWidth=240;this.naturalHeight=158;}
   set src(v){this._src=v;if(this.onload)this.onload();}
   get src(){return this._src;}
 };
 const ctx={};
 for(const m of ['beginPath','moveTo','lineTo','quadraticCurveTo','closePath','fill','stroke','fillRect','strokeRect','drawImage','save','restore','translate','arc','bezierCurveTo','setLineDash','fillText'])ctx[m]=()=>{};
 let created=0;
 globalThis.document={
   getElementById:id=>id==='day'?statuses.day:id==='v21ShuttleExportStatus'?statuses.status:id==='v21ShuttlePreview'?statuses.preview:null,
   querySelectorAll:()=>[],
   createElement:tag=>{
     if(tag==='canvas'){created++;return {width:0,height:0,getContext:()=>ctx,toBlob:(fn,type)=>fn(new Blob([Buffer.from([0x89,0x50,0x4e,0x47])],{type}))};}
     if(tag==='a')return {href:'',download:'',click(){clicks.push(this.download)},remove(){}};
     if(tag==='img')return {src:'',className:'',alt:''};
     return {appendChild(){},className:'',textContent:''};
   },
   body:{appendChild(){}}
 };
 globalThis.sb={
   from:table=>({
     select:()=>({eq:async()=>({data:table==='ops_shift_transport_v2'?[]:[],error:null})})
   })
 };
 const realSetTimeout=globalThis.setTimeout;
 globalThis.setTimeout=fn=>{fn();return 0};
 try{
   await globalThis.SagsShuttleExport.exportFile('png');
   assert.deepEqual(messages,[],'PNG must not fail while canvas.toBlob runs');
   assert.ok(clicks.some(x=>x.endsWith('.png')),'PNG must trigger download');
   assert.ok(statuses.status.textContent.includes('Đã tạo ảnh PNG'),'PNG status must acknowledge creation');
   globalThis.SagsOfficeExportV29={exportCanvasPdf:()=>({bytes:2600,pages:1})};
   await globalThis.SagsShuttleExport.exportFile('pdf');
   assert.deepEqual(messages,[],'PDF must use in-app exporter without CDN');
   assert.ok(statuses.status.textContent.includes('Đã tạo PDF'),'PDF must acknowledge creation');
   assert.ok(created>=2,'Both exports must build the transport chart');
 }finally{globalThis.setTimeout=realSetTimeout;}
 console.log('PASS shuttle PNG Blob download and PDF handoff without premature rejection');
})().catch(e=>{console.error(e);process.exitCode=1;});