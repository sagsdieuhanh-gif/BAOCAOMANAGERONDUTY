'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {TextEncoder}=require('node:util');
const source=fs.readFileSync('office-export-v29.js','utf8');
const window={},made=[];
function canvas(){
  const item={width:0,height:0,drawn:[],toDataURL(){return 'data:image/jpeg;base64,/9j/2Q==';}};
  const ctx={
    font:'16px Arial',fillStyle:'#000',strokeStyle:'#000',lineWidth:1,
    fillRect(){},strokeRect(){},drawImage(){},
    measureText(s){return {width:String(s).length*9};},
    fillText(str,x,y){item.drawn.push({text:String(str),x,y});}
  };
  item.getContext=()=>ctx;made.push(item);return item;
}
const document={createElement(t){assert.equal(t,'canvas');return canvas();}};
vm.runInNewContext(source,{window,document,TextEncoder,Blob,Uint8Array,atob:global.atob},{filename:'office-export-v29.js'});
const e=window.SagsOfficeExportV29;
(async()=>{
 const layout=e._test.paper;
 assert.deepEqual([layout.width,layout.height],[1190,1684]);
 const words='PVHK bố trí nhân sự làm thủ tục tại quầy check-in, phục vụ cửa boarding và đón tiễn khách tại tàu bay. ';
 const tableRows=[['Nội dung','Nhận định / Rủi ro','Phương án phục vụ dự kiến','Đơn vị liên quan']];
 for(let i=0;i<9;i++){
  tableRows.push(['Công đoạn '+i,'Cao điểm khách tập trung. '+words.repeat(9),
    'Bố trí quầy, gate, người tại tàu bay: '+words.repeat(9)+' DONG CUOI '+i,
    'PVHK · ĐH · PVSĐ']);
 }
 const blocks=[
   {kind:'heading',level:2,text:'BÁO CÁO DỰ BÁO ĐIỀU HÀNH KHAI THÁC HẰNG NGÀY'},
   {kind:'paragraph',text:'Ngày khai thác: 01/11/2026. Chỉ hiển thị thông tin đã xác nhận.'},
   {kind:'table',rows:tableRows,header:true},
   {kind:'heading',level:3,text:'IV. PHỐI HỢP THỰC HIỆN'},
   {kind:'table',header:true,rows:[
      ['Nội dung phối hợp','Yêu cầu, phương án','Đơn vị','Thời hạn'],
      ['PVHK quầy và gate',words.repeat(14)+' KET THUC PHAN PHOI HOP','PVHK','Trước giờ mở quầy']
   ]}
 ];
 const pages=await e._test.renderPdfPages(blocks);
 assert.ok(pages.length>=3,'Long report must paginate rather than shrink or overflow');
 assert.ok(pages.every(x=>x.width<x.height&&x.width===1190&&x.height===1684));
 for(const p of pages)for(const item of p.drawn){
   assert.ok(item.x>=0&&item.x<=p.width,'Text x overflow: '+item.x);
   assert.ok(item.y>=0&&item.y<=p.height,'Text y overflow: '+item.y);
 }
 const all=pages.flatMap(x=>x.drawn.map(z=>z.text));
 assert.ok(all.some(x=>x.includes('DONG CUOI 8')),'The final row must not be cut off');
 assert.ok(all.some(x=>x.includes('KET THUC PHAN PHOI HOP')),'The final coordination cell must not be cut off');
 assert.ok(all.filter(x=>x.includes('Nhận định / Rủi ro')).length>=2,'Repeat table headings on later pages');
 assert.ok(all.some(x=>x.includes('TRANG 1/')),'Footer pagination must be visible');
 const portrait=Buffer.from(await (await e.exportPdf(blocks)).arrayBuffer()).toString('latin1');
 assert.ok(portrait.includes('/MediaBox [0 0 595 842]'),'Reports must export true portrait A4');
 assert.ok(portrait.includes('q 595 0 0 842 0 0 cm'),'Portrait JPEG must occupy full A4 without rotation');
 const landscape=Buffer.from(await e._test.pdfFromJpegs([
   {bytes:Uint8Array.from([255,216,255,217]),width:100,height:200}
 ]) .arrayBuffer()).toString('latin1');
 assert.ok(landscape.includes('/MediaBox [0 0 842 595]'),'Shuttle image PDFs still use landscape paper');
 const index=fs.readFileSync('index.html','utf8');
 assert.ok(index.includes("APP_VERSION='V3.22'"));
 assert.ok(index.includes('office-export-v29.js?v=3.22'));
 assert.ok(index.includes('v300-workspace.js?v=3.22'));
 console.log('PASS V3.13: A4 portrait, compact text, full-content multiline table pagination, repeated headers, landscape shuttle retained');
})().catch(e=>{console.error(e);process.exitCode=1});
