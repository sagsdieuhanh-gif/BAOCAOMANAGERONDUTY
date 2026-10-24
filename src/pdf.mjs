// Source-accurate PDF: original template PNG + a transparent overlay on the SAME coordinates.
// Preview always opens the same PDF Blob returned by createPdf; no second renderer is involved.
import {classifyField} from './core.mjs';
import {sourceImage,loadImage} from './assets.mjs';
import {containRect,fieldRect,formPageFields,pageGeometry,pdfFileName} from './pdf-geometry.mjs';

let pdfLibPromise=null, activePreview=null;
async function pdfLib(){
  if(window.PDFLib)return window.PDFLib;
  if(!pdfLibPromise)pdfLibPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    script.crossOrigin='anonymous';
    script.onload=()=>window.PDFLib?resolve(window.PDFLib):reject(Error('PDF engine tải xong nhưng không khởi tạo được'));
    script.onerror=()=>reject(Error('Không tải được PDF engine. Kiểm tra mạng và thử lại.'));
    document.head.append(script);
  }).catch(e=>{pdfLibPromise=null;throw e});
  return pdfLibPromise;
}

function wrapText(ctx,text,maxWidth,maxLines){
  const lines=[];
  for(const paragraph of String(text).replace(/\r/g,'').split('\n')){
    let line='';
    for(const word of paragraph.split(/\s+/).filter(Boolean)){
      const next=line?line+' '+word:word;
      if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word}else line=next;
    }
    lines.push(line);
  }
  return lines.slice(0,maxLines);
}
function fieldText(value,type){
  if(type==='checkbox')return value===true?'✓':String(value);
  return String(value);
}
function fieldFont(field,size){
  const style=field.fontStyle==='italic'?'italic ':'';
  const weight=/^(bold|normal|[1-9]00)$/.test(String(field.fontWeight))?field.fontWeight:'700';
  const family=String(field.fontFamily||'Arial').replace(/["\\]/g,'');
  return `${style}${weight} ${size}px "${family}"`;
}
async function pngBlob(canvas){
  if(canvas.toBlob)return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Không tạo được lớp dữ liệu PDF')),'image/png'));
  return await (await fetch(canvas.toDataURL('image/png'))).blob();
}
async function createOverlay(form,page,values,width,height){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)throw Error('Thiết bị không hỗ trợ Canvas để xuất PDF');
  try{
    for(const field of formPageFields(form,page)){
      const value=values[field.key];
      if(value===undefined||value===null||value===''||value===false)continue;
      const area=fieldRect(field,width,height);
      if(!area||area.width<1||area.height<1)continue;
      const {x,y,width:fw,height:fh}=area;
      const type=classifyField(field);
      ctx.save();
      ctx.beginPath();ctx.rect(x,y,fw,fh);ctx.clip();
      if(type==='signature'){
        // Invalid signature must FAIL the export rather than silently omitting a signed field.
        if(typeof value!=='string'||!/^data:image\/(?:png|jpeg|webp);base64,/i.test(value)){
          throw Error('Chữ ký không hợp lệ tại '+String(field.label||field.key));
        }
        let img;
        try{img=await loadImage(value)}catch(e){throw Error('Không đọc được chữ ký tại '+String(field.label||field.key))}
        const signature=containRect(img.naturalWidth||img.width,img.naturalHeight||img.height,x,y,fw,fh);
        ctx.drawImage(img,signature.x,signature.y,signature.width,signature.height);
        ctx.restore();continue;
      }
      const str=fieldText(value,type);
      const px=Number(field.fontSize||18);
      let size=Math.max(7,Math.min(Number.isFinite(px)?px:18,width/45,fh*0.95));
      ctx.font=fieldFont(field,size);
      ctx.fillStyle=field.textColor||'#003b8e';
      ctx.textAlign=['center','right'].includes(field.align)?field.align:'left';
      ctx.textBaseline='middle';
      const textX=ctx.textAlign==='center'?x+fw/2:ctx.textAlign==='right'?x+fw-2:x+2;
      if(str.length>100||str.includes('\n')){
        ctx.textBaseline='top';
        const maxLines=Math.max(1,Math.floor((fh-2)/(size*1.06)));
        const lines=wrapText(ctx,str,Math.max(1,fw-4),maxLines);
        lines.forEach((line,i)=>ctx.fillText(line,textX,y+1+i*size*1.06,Math.max(1,fw-4)));
      }else{
        while(size>7&&ctx.measureText(str).width>fw-4){size--;ctx.font=fieldFont(field,size)}
        ctx.fillText(str,textX,y+fh/2,Math.max(1,fw-4));
      }
      ctx.restore();
    }
    return await pngBlob(canvas);
  }finally{
    // Release large native canvas buffers on iOS after encoding.
    canvas.width=1;canvas.height=1;
  }
}

export async function createPdf(form,values,flight,onProgress=()=>{}){
  if(!form?.pages?.length)throw Error('Biểu mẫu không có trang gốc');
  const PDF=await pdfLib();
  const doc=await PDF.PDFDocument.create();
  doc.setTitle(`${form.code||form.id} - ${flight.departure||flight.arrival||''}`);
  doc.setSubject('SAGS FORM LITE - PDF from original E-Report layout');
  const snapshot=structuredClone(values||{});
  for(let i=0;i<form.pages.length;i++){
    const page=form.pages[i];const {width,height,pdfWidth,pdfHeight,placement}=pageGeometry(page);
    onProgress(`Đang tạo PDF trang ${i+1}/${form.pages.length}…`);
    const source=await sourceImage(page.image);
    const response=await fetch(source);
    if(!response.ok)throw Error(`Không tải được nền mẫu ${form.code} trang ${i+1} (HTTP ${response.status})`);
    const sourceBytes=new Uint8Array(await response.arrayBuffer());
    const background=await doc.embedPng(sourceBytes);
    const sheet=doc.addPage([pdfWidth,pdfHeight]);
    sheet.drawImage(background,placement);
    if(formPageFields(form,page).some(f=>snapshot[f.key]!==undefined&&snapshot[f.key]!==null&&snapshot[f.key]!==''&&snapshot[f.key]!==false)){
      const overlay=await createOverlay(form,page,snapshot,width,height);
      const overlayImage=await doc.embedPng(new Uint8Array(await overlay.arrayBuffer()));
      sheet.drawImage(overlayImage,placement);
    }
  }
  onProgress('Đang hoàn tất tệp PDF…');
  const bytes=await doc.save({useObjectStreams:true});
  return {blob:new Blob([bytes],{type:'application/pdf'}),name:pdfFileName(form,flight),pageCount:form.pages.length,formCode:form.code};
}

export function downloadPdf({blob,name}){
  const link=document.createElement('a'),url=URL.createObjectURL(blob);
  link.href=url;link.download=name;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}

/** Opens the exact PDF Blob that is downloaded. The browser's native PDF viewer
 *  is used, with a real link fallback for iOS/Android viewers that cannot embed. */
export function openPdfPreview(pdf,{title='',unsaved=false}={}){
  activePreview?.();
  const url=URL.createObjectURL(pdf.blob);
  const root=document.createElement('div');root.className='pdf-preview-backdrop';
  root.setAttribute('role','presentation');
  const panel=document.createElement('section');panel.className='pdf-preview-panel';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Xem trước PDF '+(title||pdf.formCode||''));
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  panel.innerHTML=`<header class="pdf-preview-toolbar"><div class="pdf-preview-title"><strong>📄 XEM TRƯỚC PDF · ${safe(title||pdf.formCode||'BIỂU MẪU')}</strong><small>${safe(pdf.name)} · ${Number(pdf.pageCount)||1} trang · giữ nền mẫu gốc</small></div><div class="pdf-preview-buttons"><a class="btn sm subtle" href="${url}" target="_blank" rel="noopener noreferrer" id="pdf-preview-open">↗ MỞ PDF</a><button type="button" class="btn sm" id="pdf-preview-download">⬇ LƯU PDF</button><button type="button" class="btn sm subtle" id="pdf-preview-close" aria-label="Đóng xem trước PDF">✕ ĐÓNG</button></div></header>${unsaved?'<div class="pdf-preview-unsaved" role="status">⚠ Bản xem trước chứa dữ liệu vừa nhập nhưng CHƯA LƯU lên Firebase. Hãy lưu biểu mẫu trước khi kết thúc thao tác.</div>':''}<div class="pdf-preview-content"><iframe title="Bản xem trước PDF gốc" src="${url}#toolbar=1&navpanes=0&view=FitH"></iframe></div><footer class="pdf-preview-footer">Nếu điện thoại không hiển thị PDF trong khung, bấm <b>MỞ PDF</b> để xem bằng ứng dụng PDF của thiết bị. Bản xem trước và bản tải xuống là cùng một tệp.</footer>`;
  root.append(panel);
  const hadScroll=document.body.classList.contains('pdf-preview-open');
  document.body.classList.add('pdf-preview-open');
  const before=document.activeElement;
  let closed=false;
  function close(){if(closed)return;closed=true;document.removeEventListener('keydown',onKey);root.remove();if(!hadScroll)document.body.classList.remove('pdf-preview-open');URL.revokeObjectURL(url);if(activePreview===close)activePreview=null;before?.focus?.()}
  function onKey(e){if(e.key==='Escape'){e.preventDefault();close()}}
  panel.querySelector('#pdf-preview-close').onclick=close;
  panel.querySelector('#pdf-preview-download').onclick=()=>downloadPdf(pdf);
  root.onclick=e=>{if(e.target===root)close()};
  document.addEventListener('keydown',onKey);
  document.body.append(root);
  panel.querySelector('#pdf-preview-close').focus();
  activePreview=close;
  return close;
}