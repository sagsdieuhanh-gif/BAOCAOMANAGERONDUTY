'use strict';
/* Preserve original V2.7 five-section report and supply reliable DOCX/PDF exports.
   No external package download and no mutation of saved flight records. */
(function(root){
 const $=id=>document.getElementById(id);
 const base=root.SagsReportV19;
 if(!base)return;
 async function exportMain(format){
   if(!['ADMIN','DH'].includes(unit)){alert('Chỉ ĐH/ADMIN được xuất báo cáo.');return;}
   const buttons=[...document.querySelectorAll(format==='docx'?'[data-v19-export]':'[data-main-pdf]')];
   const status=$('v19ExportMessage');
   buttons.forEach(b=>{b.disabled=true;b.dataset.originalText=b.textContent;b.textContent='ĐANG XUẤT '+format.toUpperCase()+'…'});
   try{
     if(!root.SagsOfficeExportV29)throw Error('Chưa nạp thư viện xuất file nội bộ.');
     await base.preview();
     const node=$('v19ReportPreview')?.querySelector('.v19-report-sheet');
     if(!node)throw Error('Không tạo được bản xem trước V2.7. Vui lòng kiểm tra lịch bay Lần 1 và dữ liệu nguồn.');
     const date=$('day')?.value||'UNKNOWN';
     const filename='SAGS_CXR_DU_BAO_LAN_1_'+date.replaceAll('-','')+'.'+format;
     const result=await root.SagsOfficeExportV29.exportElement(node,format,filename);
     if(status)status.textContent='Đã tạo '+filename+' ('+Math.round(result.bytes/1024)+' KB).';
   }catch(err){
     if(status)status.textContent='CHƯA XUẤT ĐƯỢC: '+err.message;
     alert('Không thể xuất báo cáo '+format.toUpperCase()+': '+err.message);
   }finally{
     buttons.forEach(b=>{b.disabled=false;b.textContent=b.dataset.originalText||'XUẤT BÁO CÁO';delete b.dataset.originalText;});
   }
 }
 const word=()=>exportMain('docx'),pdf=()=>exportMain('pdf');
 base.exportOne=word;base.exportPdf=pdf;
 document.querySelectorAll('[data-v19-export]').forEach(b=>b.onclick=word);
 document.querySelectorAll('[data-main-pdf]').forEach(b=>b.onclick=pdf);
 root.SagsMainReportV29={exportWord:word,exportPdf:pdf};
})(window);