'use strict';
(function(root){
 const model=()=>root.SagsShuttleModel, $=id=>document.getElementById(id);
 const name=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';
 const when=s=>s?new Date(s).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Chưa xác nhận';
 const navy='#15405F',blue='#116C93',ink='#233D51',border='#DDE9EF',muted='#6C8797',green='#16735B';
 const W=1490;
 const UNITS=['DH','PVHK','KTS','QA_IT'];
 const UNIT_LABELS=['ĐH','PVHK','PVSĐ','QA & IT'];
 const missingUnits=row=>UNIT_LABELS.filter((_,i)=>!row.units[i]);
 function normalize(data,children=[]){
   const getkey=x=>x.direction+'|'+x.departure_min+'|'+Number(x.line_no||0);
   const keys=new Map(model().defaults.map(x=>[getkey({...x,line_no:0}),{...x,line_no:0,is_custom:false}]));
   for(const x of [...data,...children]){
     const k=getkey(x);
     if(!keys.has(k))keys.set(k,{direction:x.direction,departure_min:x.departure_min,line_no:Number(x.line_no||0),is_custom:!model().isDefault(x.direction,x.departure_min)});
     const item=keys.get(k);
     if(x.reason) item.reason=x.reason;
     if(x.created_by)item.created_by=x.created_by;
     if(Number(x.line_no||0)>0){
       const primary=getkey({...x,line_no:0});
       if(!keys.has(primary))keys.set(primary,{direction:x.direction,departure_min:x.departure_min,line_no:0,is_custom:true});
     }
   }
   // Match the live input table: fixed + newly added departure times are
   // chronologically interleaved on both PNG and PDF outputs.
   const sorted=model().order([...keys.values()]);
   return sorted.map(x=>{
     const units=UNITS.map(u=>data.find(v=>v.unit===u&&getkey(v)===getkey(x))||null);
     return {...x,units,confirmed:units.filter(Boolean).length,
       total:units.reduce((sum,v)=>sum+(v?.quantity||0),0),
       note:x.reason||units.map(v=>v?.note||'').filter(Boolean).join('; '),
       missing:UNIT_LABELS.filter((_,i)=>!units[i])};
   });
 }
 async function fetchData(){
   if(typeof sb==='undefined'||typeof me==='undefined'||!sb||!me)throw Error('Cần đăng nhập bằng tài khoản được cấp quyền Radar.');
   const day=$('day')?.value;
   if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Chưa chọn ngày khai thác.');
   const [dataResult,rowsResult]=await Promise.all([
     sb.from('ops_shift_transport_v2').select('service_date,unit,direction,departure_min,line_no,quantity,is_custom,note,confirmed_at').eq('service_date',day),
     sb.from('ops_shift_transport_rows').select('direction,departure_min,line_no,reason,created_by').eq('service_date',day)
   ]);
   if(dataResult.error||rowsResult.error)throw Error((dataResult.error||rowsResult.error).message);
   return {date:day,rows:normalize(dataResult.data||[],rowsResult.data||[])};
 }

 const LOGO_PATH='./assets/logo-sags.png';
 let logoPromise=null;
 function loadLogo(){
   if(logoPromise)return logoPromise;
   logoPromise=new Promise((resolve,reject)=>{
     const image=new Image();
     image.onload=()=>{if(image.naturalWidth>0)resolve(image);else reject(Error('Logo SAGS không hợp lệ.'))};
     image.onerror=()=>reject(Error('Chưa tải được logo SAGS trong ứng dụng. Vui lòng tải lại trang.'));
     image.src=LOGO_PATH;
   }).catch(e=>{logoPromise=null;throw e});
   return logoPromise;
 }
 let vehiclePromise=null;
 function loadVehicleIcons(){
   if(vehiclePromise)return vehiclePromise;
   const get=src=>new Promise(resolve=>{
     const image=new Image();
     image.onload=()=>resolve(image.naturalWidth?image:null);
     image.onerror=()=>resolve(null);
     image.src=src;
   });
   vehiclePromise=Promise.all([get('./assets/shuttle-29.webp'),get('./assets/shuttle-45.webp')]).then(([small,big])=>({small,big}));
   return vehiclePromise;
 }
 function draw(input,logo,vehicles={}){
   if(!logo||!logo.naturalWidth)throw Error('Chưa có logo SAGS để xuất bảng xe giao ca.');
   const rows=input.rows||[],a=rows.filter(x=>x.direction==='NHA_CXR'),b=rows.filter(x=>x.direction==='CXR_NHA');
   const max=Math.max(a.length,b.length);
   if(max>65)throw Error('Quá nhiều mốc xe cho một ảnh, vui lòng kiểm tra các giờ bổ sung.');
   const W=1420,outer=34,col=660,gap=30,cardH=158,step=169,startY=294;
   const footY=startY+step*max+12,H=footY+190;
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
   const c=canvas.getContext('2d');if(!c)throw Error('Thiết bị không hỗ trợ xuất ảnh.');
   const C={navy:'#173C56',blue:'#136D90',ink:'#203D53',muted:'#637D8D',line:'#D9E5EB',
     soft:'#F0F6F9',green:'#18715B',red:'#A93740',orange:'#B16D26',pale:'#FFF5E6',white:'#FFFFFF'};
   const shape=(x,y,w,h,r,fill,stroke)=>{
     c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);
     c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
     c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
     if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
   };
   const t=(v,x,y,size=16,color=C.ink,bold=false,align='left',maxWidth)=>{
     c.fillStyle=color;c.font=(bold?'700 ':'400 ')+size+'px Arial, sans-serif';c.textAlign=align;c.textBaseline='middle';
     if(maxWidth)c.fillText(String(v??''),x,y,maxWidth);else c.fillText(String(v??''),x,y);
     c.textAlign='left';
   };
   const line=(x,y,w,color=C.line)=>{c.beginPath();c.strokeStyle=color;c.lineWidth=1;c.moveTo(x,y);c.lineTo(w,y);c.stroke();};
   const day=input.date?input.date.slice(8,10)+'/'+input.date.slice(5,7)+'/'+input.date.slice(0,4):'—';
   c.fillStyle='#F4F8FA';c.fillRect(0,0,W,H);
   shape(18,18,W-36,H-36,18,C.white,'#D9E4EB');
   shape(18,18,W-36,7,4,C.blue);
   const ratio=Math.min(90/logo.naturalWidth,87/logo.naturalHeight);
   c.drawImage(logo,54+(90-logo.naturalWidth*ratio)/2,41+(87-logo.naturalHeight*ratio)/2,logo.naturalWidth*ratio,logo.naturalHeight*ratio);
   t('CÔNG TY CỔ PHẦN PHỤC VỤ MẶT ĐẤT SÀI GÒN CAM RANH',166,52,17,C.blue,true);
   t('BẢNG TỔNG HỢP XE GIAO CA',166,89,32,C.navy,true);
   t('04 đơn vị: ĐH · PVHK · PVSĐ · QA & IT',166,125,16,C.muted);
   shape(1139,44,232,95,11,C.soft);
   t('NGÀY KHAI THÁC',1255,70,14,C.muted,true,'center');
   t(day,1255,110,26,C.navy,true,'center');
   line(48,157,1374);
   // Show only REAL headcounts from this service day: never put a generic
   // 20-person/29-seat example above a 40+ person departure in the export.
   // Largest occupied slots appear first in the compact preview strip;
   // each departure's own card below also contains its individual proposal.
   const highlights=rows.filter(r=>r.confirmed>0&&Number.isSafeInteger(Number(r.total)))
     .sort((x,y)=>y.total-x.total||model().compareSlots(x,y)).slice(0,4);
   shape(outer,164,W-outer*2,57,11,'#E6F7F1','#9ED8CB');
   t('GỢI Ý XE',outer+14,181,16,C.green,true);
   t('THEO GIỜ',outer+14,204,15,C.navy,true);
   if(!highlights.length){
     t('Chưa nhập số người — hình xe chỉ hiện sau khi có quân số từng giờ.',
       outer+230,193,16,C.muted,true);
   }
   highlights.forEach((v,i)=>{
     const px=outer+213+i*278,plan=model().suggestVehicles(v.total);
     if(!plan)return;
     shape(px,169,267,47,8,C.white,'#D0E8E4');
     const hour=model().clock(v.departure_min);
     t(hour+' · '+v.total+' NGƯỜI',px+9,181,12,C.navy,true);
     plan.units.forEach((entry,j)=>{
       const bus=entry.seats===45?vehicles.big:vehicles.small;
       const x=px+116+j*57;
       if(bus?.naturalWidth)c.drawImage(bus,x,169,52,32);
       if(entry.quantity>1)t('×'+entry.quantity,x+49,180,11,C.navy,true,'right');
     });
     t((v.confirmed===UNITS.length?'':'TẠM TÍNH · ')+plan.label,
       px+9,203,12,v.confirmed===UNITS.length?C.green:C.orange,true,'left',248);
   });
   function heading(x,title,sub,count){
     shape(x,228,col,51,10,C.soft);
     shape(x,228,5,51,2,C.blue);
     t(title,x+17,246,21,C.navy,true);
     t(sub+' · '+count+' mốc',x+17,268,14,C.muted);
   }
   heading(outer,'NHA TRANG → CAM RANH','XE ĐI LÀM',a.length);
   heading(outer+col+gap,'CAM RANH → NHA TRANG','XE VỀ',b.length);
   function card(v,x,y){
     const special=v.is_custom||v.line_no>0,complete=v.confirmed===UNITS.length;
     const total=Number(v.total)||0;
     shape(x,y,col,cardH,11,special?C.pale:C.white,special?'#D6AC73':C.line);
     shape(x,y,5,cardH,2,special?C.orange:complete?C.green:C.blue);
     t(model().clock(v.departure_min),x+18,y+30,29,C.navy,true);
     if(model().isNextDay(v.departure_min))
       t('NGÀY HÔM SAU',x+18,y+57,12,C.orange,true);
     if(special){shape(x+151,y+14,96,28,10,'#FCE4C0');t(v.line_no>0?'BỔ SUNG':'GIỜ THÊM',x+199,y+29,12,C.orange,true,'center');}
     const plan=v.confirmed>0?model().suggestVehicles(total):null;
     if(plan?.units.length){
       const start=x+col-(plan.units.length>1?359:321);
       plan.units.forEach((entry,i)=>{
         const image=entry.seats===45?vehicles.big:vehicles.small;
         const ix=start+i*137;
         if(image?.naturalWidth)c.drawImage(image,ix,y+4,118,72);
         if(entry.quantity>1)t('×'+entry.quantity,ix+107,y+20,18,C.navy,true,'right');
       });
     }
     t(String(total),x+col-26,y+35,53,complete?C.navy:C.orange,true,'right');
     t(complete?'TỔNG SỐ NGƯỜI':'NGƯỜI · TẠM TÍNH',x+col-26,y+67,12,complete?C.green:C.orange,true,'right');
     line(x+18,y+74,x+col-18,'#E0E9EE');
     const bandW=(col-40)/4;
     for(let i=0;i<4;i++){
       const unit=v.units[i],ux=x+20+i*bandW;
       if(i){c.beginPath();c.strokeStyle='#E5EDF1';c.lineWidth=1;c.moveTo(ux-9,y+81);c.lineTo(ux-9,y+117);c.stroke();}
       t(UNIT_LABELS[i],ux,y+87,12,C.muted,true);
       t(unit?String(unit.quantity):'—',ux,y+110,24,unit?C.ink:'#AAB8C1',!!unit);
     }
     if(v.missing?.length){
       t('CHƯA XÁC NHẬN: '+v.missing.join(', '),x+19,y+131,12,C.red,true,'left',col-220);
     }else t('Đã đủ 4 đơn vị xác nhận',x+19,y+131,12,C.green,true);
     if(plan){
       t((complete?'GỢI Ý: ':'TẠM TÍNH: ')+plan.label,
         x+col-16,y+128,13,complete?C.blue:C.orange,true,'right',270);
       if(plan.count)t(plan.details,x+col-16,y+146,12,C.muted,false,'right',230);
     }
     if(special){
       t('LÝ DO THÊM XE: '+(v.note||'Chưa ghi lý do'),x+19,y+148,12,C.orange,true,'left',col-40);
     }
   }
   a.forEach((v,i)=>card(v,outer,startY+i*step));
   b.forEach((v,i)=>card(v,outer+col+gap,startY+i*step));
   const confirmed=rows.filter(x=>x.confirmed===4).length,custom=rows.filter(x=>x.is_custom||x.line_no>0).length;
   const overload=rows.filter(x=>x.confirmed===4&&x.total>45).length;
   shape(outer,footY,W-outer*2,84,11,C.soft);
   const stats=[['TỔNG MỐC XE',rows.length],['ĐỦ 4/4 ĐƠN VỊ',confirmed],['CHỜ XÁC NHẬN',rows.length-confirmed],['XE THÊM',custom],['TRÊN 45 NGƯỜI',overload]];
   stats.forEach(([label,n],i)=>{
     const x=outer+25+i*260;
     t(label,x,footY+24,13,C.muted,true);
     t(n,x,footY+58,29,i===4&&n?C.orange:C.navy,true);
   });
   t('TẠM TÍNH: dựa trên số người đã nhập. ĐỦ DỮ LIỆU: đã có 4/4 phòng xác nhận.',outer+10,footY+109,15,C.ink);
   t('Giờ xe bổ sung có nền vàng. Xe ngày hôm sau có nhãn riêng. ĐH quyết định điều xe.',outer+10,footY+136,14,C.muted);
   t('Hình ảnh và gợi ý chỉ là phương án sức chứa, không xác nhận xe khả dụng.',outer+10,footY+162,13,C.blue,true);
   return canvas;
 }
 function download(url,filename){
   const a=document.createElement('a');a.href=url;a.download=filename;
   document.body.appendChild(a);a.click();a.remove();
 }
 let promise=null;
 async function pdfLib(){
   if(root.jspdf?.jsPDF)return root.jspdf.jsPDF;
   if(!promise)promise=new Promise((resolve,reject)=>{
     const s=document.createElement('script');
     s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
     s.onload=()=>root.jspdf?.jsPDF?resolve(root.jspdf.jsPDF):reject(Error('Không tạo được PDF.'));
     s.onerror=()=>reject(Error('Không tải được thư viện PDF; có thể xuất PNG.'));
     document.head.appendChild(s);
   });
   return promise;
 }
 async function exportFile(type){
   if(typeof unit==='undefined'||!['DH','ADMIN'].includes(unit))throw new Error('Chỉ tài khoản ĐH/ADMIN được xuất bản báo cáo xe giao ca.');
   const buttons=[...document.querySelectorAll('[data-v21-export]')];
   const status=document.getElementById('v21ShuttleExportStatus');
   buttons.forEach(b=>b.disabled=true);
   if(status)status.textContent='Đang tạo '+type.toUpperCase()+'…';
   try{
     const [data,logo,vehicles]=await Promise.all([fetchData(),loadLogo(),loadVehicleIcons()]);
     const img=draw(data,logo,vehicles),base='SAGS_CXR_XE_GIAO_CA_'+data.date.replaceAll('-','');
     if(type==='png'){
       const blob=await new Promise((resolve,reject)=>{if(typeof img.toBlob!=='function')return reject(Error('Trình duyệt không hỗ trợ xuất ảnh PNG.'));img.toBlob(x=>x?resolve(x):reject(Error('Không tạo được ảnh PNG.')),'image/png');});
       const url=URL.createObjectURL(blob);try{download(url,base+'.png');}finally{setTimeout(()=>URL.revokeObjectURL(url),15000);}
       if(status)status.textContent='Đã tạo ảnh PNG xe giao ca ('+Math.round(blob.size/1024)+' KB).';return;
     }
     if(type!=='pdf')throw Error('Định dạng không hợp lệ.');
     if(root.SagsOfficeExportV29?.exportCanvasPdf){const result=root.SagsOfficeExportV29.exportCanvasPdf(img,base+'.pdf');if(status)status.textContent='Đã tạo PDF xe giao ca ('+Math.round(result.bytes/1024)+' KB, '+result.pages+' trang).';return;}
     const jsPDF=await pdfLib();
     const single=img.height<=2000;
     // For an ordinary day, preserve exactly the preview image's dimensions and aspect.
     const pageH=420*img.height/img.width;
     const pdf=new jsPDF({orientation:single?(pageH>420?'portrait':'landscape'):'landscape',unit:'mm',format:single?[420,pageH]:'a3',compress:true});
     const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),m=8;
     const availW=pw-m*2,availH=ph-m*2;
     if(single){
       pdf.addImage(img.toDataURL('image/png'),'PNG',0,0,pw,ph);
     }else{
       // Exceptional long custom schedule: preserve image layout on successive A3 pages.
       const capacity=Math.floor(availH*img.width/availW);
       const pages=Math.ceil(img.height/capacity);
       for(let i=0;i<pages;i++){
         if(i)pdf.addPage();
         const from=i*capacity,height=Math.min(capacity,img.height-from);
         const part=document.createElement('canvas');part.width=img.width;part.height=height;
         part.getContext('2d').drawImage(img,0,from,img.width,height,0,0,img.width,height);
         pdf.addImage(part.toDataURL('image/png'),'PNG',m,m,availW,height*availW/img.width);
         pdf.setFontSize(9);pdf.setTextColor(70,88,105);
         pdf.text('SAGS-CXR  ·  '+name(data.date)+'  ·  Trang '+(i+1)+'/'+pages,pw-m,ph-3,{align:'right'});
       }
     }
          pdf.save(base+'.pdf');
   }catch(e){if(status)status.textContent='CHƯA XUẤT ĐƯỢC: '+e.message;alert('Không xuất được '+type.toUpperCase()+': '+e.message);}
   finally{buttons.forEach(b=>b.disabled=false);}
 }

 function escapeHTML(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));}

 async function renderPreview(){
   const el=$('v21ShuttlePreview');if(!el)return;
   el.innerHTML='<p class="v21-report-loading">Đang tạo ảnh xem trước từ dữ liệu đã xác nhận…</p>';
   try{
     const [data,logo,vehicles]=await Promise.all([fetchData(),loadLogo(),loadVehicleIcons()]);
     const canvas=draw(data,logo,vehicles);
     const image=document.createElement('img');
     image.alt='Bảng tổng hợp xe giao ca đúng bản xuất PNG/PDF, gồm ĐH, PVHK, PVSĐ, QA & IT.';
     const blob=await new Promise((resolve,reject)=>{if(typeof canvas.toBlob!=='function')return reject(Error('Thiết bị không hỗ trợ ảnh PNG.'));canvas.toBlob(x=>x?resolve(x):reject(Error('Không tạo được ảnh xem trước.')),'image/png');});
     const url=URL.createObjectURL(blob);image.src=url;
     image.onload=()=>URL.revokeObjectURL(url);
     image.onerror=()=>URL.revokeObjectURL(url);
     image.className='v23-preview-image';
     const wrap=document.createElement('div');wrap.className='v23-preview-container';wrap.appendChild(image);
     el.replaceChildren(wrap);
   }catch(e){
     const p=document.createElement('p');p.className='v21-report-loading';
     p.textContent='Không tạo được bản xem trước: '+e.message;el.replaceChildren(p);
   }
 }
 function bind(){
   document.querySelectorAll('[data-v21-export]').forEach(b=>{
     if(b.dataset.v21Bound)return;
     b.dataset.v21Bound='1';b.onclick=()=>exportFile(b.dataset.v21Export);
   });
 }
 root.SagsShuttleExport={exportFile,bind,renderPreview,_test:{normalize,draw}};
})(typeof window!=='undefined'?window:globalThis);
