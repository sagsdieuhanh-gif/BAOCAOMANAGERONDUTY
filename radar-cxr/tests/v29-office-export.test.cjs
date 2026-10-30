'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {TextEncoder}=require('node:util');
const source=fs.readFileSync(path.join(__dirname,'..','office-export-v29.js'),'utf8');
const window={};
vm.runInNewContext(source,{window,TextEncoder,Blob,Uint8Array,atob:global.atob},{filename:'office-export-v29.js'});
const e=window.SagsOfficeExportV29;
assert.ok(e&&e.exportDocx&&e.exportPdf&&e.exportElement);
const str=Buffer.from('123456789');
assert.equal(e._test.crc32(str),0xCBF43926);
(async()=>{
 const blocks=[
  {kind:'heading',level:2,text:'BÁO CÁO THỬ'},
  {kind:'paragraph',text:'Tiếng Việt: Cảng hàng không quốc tế Cam Ranh'},
  {kind:'table',header:true,rows:[['Chuyến','Vị trí'],['VJ101 / VJ102','CHỜ XÁC NHẬN']]}
 ];
 const blob=await e.exportDocx(blocks);
 assert.ok(blob.size>1500);
 const b=Buffer.from(await blob.arrayBuffer());
 assert.equal(b.readUInt32LE(0),0x04034b50,'DOCX must be ZIP');
 assert.ok(b.includes(Buffer.from('word/document.xml')),'DOCX must include document part');
 assert.ok(b.includes(Buffer.from('BÁO CÁO THỬ')),'DOCX must include Unicode text');
 assert.ok(b.includes(Buffer.from('CHỜ XÁC NHẬN')),'DOCX must preserve unconfirmed warning');
 assert.equal(b.readUInt32LE(b.length-22),0x06054b50,'ZIP central directory must end in EOCD');
 // Real JPEG bytes are unnecessary for structural PDF serialization smoke test.
 const pdf=e._test.pdfFromJpegs([{bytes:Uint8Array.from([0xff,0xd8,0xff,0xd9]),width:1,height:1}]);
 const p=Buffer.from(await pdf.arrayBuffer());
 assert.ok(p.subarray(0,8).toString('latin1').startsWith('%PDF-1.4'));
 assert.ok(p.includes(Buffer.from('/Type /Catalog')));
 assert.ok(p.includes(Buffer.from('/Type /Pages')));
 assert.ok(p.includes(Buffer.from('/Type /Page')));
 assert.ok(p.includes(Buffer.from('%%EOF')));
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 assert.ok(html.includes('id="tab-radar-report"'));
 assert.ok(html.includes('id="tab-shuttle-report"'));
 assert.ok(html.includes('id="v29MainPdf"'));
 assert.ok(html.includes('id="r28ExportPdf"'));
 assert.ok(html.indexOf('office-export-v29.js')<html.indexOf('radar-report-v28.js'));
 assert.ok(html.indexOf('radar-report-v28.js')<html.indexOf('report-export-v29.js'));
 const main=fs.readFileSync(path.join(__dirname,'..','report-export-v29.js'),'utf8');
 const radar=fs.readFileSync(path.join(__dirname,'..','radar-report-v28.js'),'utf8');
 assert.ok(main.includes('base.exportOne=word;base.exportPdf=pdf'));
 assert.ok(!radar.includes('base.exportOne=exportWord'),'Radar must not overwrite main export function');
 assert.ok(!radar.includes("base.preview=preview"),'Radar must not overwrite V2.7 preview');
 console.log('PASS V2.9 Word/PDF format and separated report navigation');
})().catch(err=>{console.error(err);process.exitCode=1;});