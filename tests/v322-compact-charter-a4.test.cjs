'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('v19-report.js','utf8'),editor=fs.readFileSync('v321-executive-editorial.js','utf8');
const parser=fs.readFileSync('v217-second-forecast.js','utf8');
const office=fs.readFileSync('office-export-v29.js','utf8');
const index=fs.readFileSync('index.html','utf8');
assert.ok(src.includes('v322-topic-table')&&src.includes('v322-peak-table')&&src.includes('v322-coord-table'));
assert.ok(src.includes('v322-two-page'));
assert.ok(!src.includes('v321-report-block'),'Ten tall cards must be replaced by compact table');
assert.ok(src.includes('topicsTable=')&&src.includes('data.topics||[]'));
assert.ok(src.includes("x.action+(x.owner?'\\nThực hiện: '+x.owner:'')"),'Word keeps action and responsible team');
assert.ok(!editor.includes('const conflicting=deps'),'No Charter/Ferry conflict because of ##');
assert.ok(editor.includes('Charter (##)')&&editor.includes('phục vụ bình thường'));
assert.ok(!editor.includes('cần xác nhận loại hình'));
assert.ok(!parser.includes("issues.push(kind+' '+provisional+': chuyến thuê chuyến"),'## must not raise an alert');
assert.ok(parser.includes('charter:rawNo!==provisional'),'Charter metadata remains available');
assert.ok(office.includes('renderPdfPages(blocks,{...options,density:1})'));
assert.ok(office.includes('if(attempt.length<=2)break'),'A4 compact attempt should target two pages');
assert.ok(office.includes("compact?'<w:pgSz w:w=\"11906\" w:h=\"16838\"/>'"),'Compact DOCX A4 portrait');
assert.ok(office.includes("const compactReport=el.classList?.contains('v322-two-page')"));
for(const x of ["APP_VERSION='V3.22'","v19-report.js?v=3.22","office-export-v29.js?v=3.22","v217-second-forecast.js?v=3.22","v300-workspace.css?v=3.22"])
 assert.ok(index.includes(x),'Uncached release asset missing '+x);
// Approximate print pagination with deterministic canvas text measurement.
// Tests that a representative 10-topic report can be laid out in <=2 A4 sheets,
// without discarding any row. Excessively long user notes may legitimately add a page.
const draws=[];
function canvas(){
 const ctx={
   font:'16px Arial',fillStyle:'#000',strokeStyle:'#000',lineWidth:1,
   fillRect(){},strokeRect(){},drawImage(){},
   measureText(s){let sz=Number(this.font.match(/(\d+(?:\.\d+)?)px/)?.[1]||16);return {width:String(s).length*sz*.49}},
   fillText(s){draws.push(String(s))}
 };
 return {width:0,height:0,getContext:()=>ctx,toDataURL:()=>'data:image/jpeg;base64,/9j/2Q=='};
}
const host={window:{},document:{createElement:tag=>tag==='canvas'?canvas():null}};
vm.runInNewContext(office,{...host,TextEncoder,Blob,Uint8Array,atob:globalThis.atob});
const {renderPdfPages}=host.window.SagsOfficeExportV29._test;
(async()=>{
 const obs='Lịch xác nhận khung phục vụ 09:30–10:00 có 5 cặp tại các bãi 31, 39 và 61; cần lưu ý xe thang và luồng đường công vụ.';
 const action='PVSĐ đưa trang thiết bị, nhân lực về bãi trước giờ tàu vào; trao đổi ATC khi phương tiện cần qua đường công vụ. ĐH thông báo thay đổi bãi và giờ cho PVHK.';
 const blocks=[
 {kind:'heading',level:2,text:'BÁO CÁO DỰ BÁO ĐIỀU HÀNH KHAI THÁC'},
 {kind:'paragraph',text:'Ngày khai thác 02/11/2026 · Người lập: Phòng ĐH'},
 {kind:'heading',level:3,text:'I. TÓM TẮT KHAI THÁC'},
 {kind:'table',header:true,rows:[['Chỉ tiêu','Số liệu'],['Sản lượng','26 đến · 25 đi'],['Bãi đỗ','K1 19 · K2 0 · K3 9']]},
 {kind:'heading',level:3,text:'II. NHẬN ĐỊNH VÀ PHƯƠNG ÁN TỔ CHỨC PHỤC VỤ'},
 {kind:'table',header:true,rows:[['Nội dung','Nhận định trọng tâm','Phương án / Đơn vị thực hiện'],
  ...Array.from({length:10},(_,i)=>[String(i+1)+'. '+['Sản lượng','Cao điểm','Tàu đặc thù','Bãi đỗ','Nhân sự','GSE','Hàng hóa','Quay đầu','An toàn','Tồn tại'][i],obs,action+' Thực hiện: PVSĐ · ĐH · PVHK'])]},
 {kind:'heading',level:4,text:'QUÂN SỐ THEO CA'},
 {kind:'table',header:true,rows:[['Bộ phận','Ca sáng','Ca tối'],
  ['ĐH','Nhân sự 14','Nhân sự 14'],
  ['PVHK','Cán bộ Phòng 1 · Đội đi 33 · Đội đến 14','Đội đi 33 · Đội đến 15'],
  ['PVSĐ','Cán bộ 1 · Đội PVSĐ 18 · HLSĐ 9 + 9 SKO · HLNG 11 + 4 SKO · PVTT 13 + 3 SKO · Xưởng SC 7',
    'Cán bộ 1 · Đội PVSĐ 16 · HLSĐ 7 + 11 SKO · HLNG 10 + 4 SKO · PVTT 13 + 3 TC + 3 SKO · Xưởng SC 0']]},
 {kind:'heading',level:3,text:'III. KHUNG GIỜ CẦN ƯU TIÊN ĐIỀU PHỐI'},
 {kind:'table',header:true,rows:[['Khung giờ','Cặp chuyến / Nguy cơ','Phương án'],['09:30–10:00','5 cặp, bãi 39/61','PVSĐ tập kết trước GSE; ATC điều phối phương tiện qua đường công vụ']]},
 {kind:'heading',level:3,text:'IV. PHỐI HỢP THỰC HIỆN'},
 {kind:'table',header:true,rows:[['Nội dung','Yêu cầu phối hợp','Đơn vị'],['Bãi K3','Tập kết trước','PVSĐ']]},
 {kind:'heading',level:3,text:'V. KIẾN NGHỊ BAN TGĐ'},
 {kind:'paragraph',text:'Chưa có kiến nghị riêng được các phòng gửi để trình Ban TGĐ.'}
 ];
 const normal=await renderPdfPages(blocks,{compactReport:false});
 const compact=await renderPdfPages(blocks,{compactReport:true,density:.86});
 assert.ok(compact.length<=normal.length,'Compact layout must never increase page count');
 assert.ok(compact.length<=2,'Representative operational report should fit two A4 portrait pages; got '+compact.length);
 assert.ok(draws.some(x=>x.includes('Xưởng SC')),'No confirmed staffing is clipped');
 assert.ok(draws.some(x=>x.includes('BÃI ĐỖ'))||draws.some(x=>x.includes('Bãi đỗ')));
 console.log('PASS V3.22: normal-service Charter, compact L1/L2 and ~2 A4 portrait sheet density');
})().catch(e=>{console.error(e);process.exitCode=1});
