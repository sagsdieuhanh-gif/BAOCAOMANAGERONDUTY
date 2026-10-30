'use strict';
(function(root){
 const model=()=>root.SagsShuttleModel, $=id=>document.getElementById(id);
 const name=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';
 const when=s=>s?new Date(s).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Chưa xác nhận';
 const navy='#15405F',blue='#116C93',ink='#233D51',border='#DDE9EF',muted='#6C8797',green='#16735B';
 const W=1490;
 const UNITS=['DH','KTS','PVHK','KHO','QA_IT'];
 const UNIT_LABELS=['ĐH','PVSĐ','PVHK','Kho Hàng','QA/IT'];
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
   const sorted=[...keys.values()].sort((a,b)=>
      (a.direction===b.direction?0:a.direction==='NHA_CXR'?-1:1)||
      a.departure_min-b.departure_min||a.line_no-b.line_no);
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
 function draw(input,logo){
   if(!logo||!logo.naturalWidth)throw Error('Chưa có logo SAGS để xuất báo cáo.');
   const rows=input.rows, left=rows.filter(x=>x.direction==='NHA_CXR'),right=rows.filter(x=>x.direction==='CXR_NHA');
   const count=Math.max(left.length,right.length);
   if(count>65)throw Error('Quá nhiều mốc xe, cần rút gọn dữ liệu trước khi xuất.');
   const W=1600,cardH=167,startY=410,step=177;
   const bottomY=startY+count*step+24,H=bottomY+194;
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
   const c=canvas.getContext('2d');if(!c)throw Error('Thiết bị không hỗ trợ xuất ảnh.');
   const colors={
     background:'#F3F7FA',paper:'#FFFFFF',navy:'#113852',ink:'#203B50',
     steel:'#6A8192',teal:'#077F9E',line:'#DCE7ED',soft:'#EAF3F7',
     mint:'#E9F6F2',green:'#178166',warning:'#A85F29',warnbg:'#FFF2E7'
   };
   const cardW=738,leftX=49,rightX=813,pad=18;
   const t=(s,x,y,sz=18,color=colors.ink,bold=false,align='left',max)=>{
     c.fillStyle=color;c.font=(bold?'700 ':'400 ')+sz+'px Arial, sans-serif';
     c.textAlign=align;c.textBaseline='middle';
     if(max)c.fillText(String(s),x,y,max);else c.fillText(String(s),x,y);
     c.textAlign='left';
   };
   const shape=(x,y,w,h,r,fill,stroke)=>{
     r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);
     c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);
     c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
     c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);
     c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
     if(fill){c.fillStyle=fill;c.fill();}
     if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
   };
   const line=(x1,y1,x2,y2,color=colors.line,width=1)=>{
     c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
   };
   function coast(x,y){
     c.save();c.strokeStyle=colors.teal;c.lineWidth=4;c.lineCap='round';
     for(let i=0;i<3;i++){c.beginPath();c.moveTo(x,y+i*12);
       c.bezierCurveTo(x+13,y-11+i*12,x+24,y+11+i*12,x+38,y+i*12);
       c.bezierCurveTo(x+48,y-8+i*12,x+60,y+8+i*12,x+72,y+i*12);c.stroke();}
     c.fillStyle='#EEBE72';c.beginPath();c.arc(x+62,y-26,11,0,Math.PI*2);c.fill();c.restore();
   }
   function airport(x,y){
     c.save();c.strokeStyle=colors.teal;c.lineWidth=3;c.lineCap='round';
     // terminal + control tower silhouette, rather than emoji fonts
     c.strokeRect(x+7,y+9,72,29);line(x,y+42,x+90,y+42,colors.teal,3);
     for(let i=0;i<4;i++)shape(x+16+i*16,y+19,9,11,2,'#C9E5EE');
     line(x+73,y+9,x+73,y-9,colors.teal,3);
     line(x+66,y-9,x+80,y-9,colors.teal,3);
     // small aircraft silhouette at upper-left
     c.beginPath();c.moveTo(x+23,y-22);c.lineTo(x+34,y-18);
     c.lineTo(x+52,y-32);c.lineTo(x+58,y-29);c.lineTo(x+42,y-14);
     c.lineTo(x+47,y-6);c.lineTo(x+41,y-4);c.lineTo(x+31,y-12);
     c.lineTo(x+22,y-10);c.closePath();c.fillStyle=colors.navy;c.fill();c.restore();
   }
   function vehicle(x,y,seats,alert=false){
     const w=seats===45?88:68;
     c.save();c.translate(x,y);
     c.lineWidth=2;c.strokeStyle=alert?colors.warning:colors.teal;
     shape(-w/2,-18,w,31,7,alert?'#FFF0E1':'#D9EBF1',alert?colors.warning:colors.teal);
     const n=seats===45?6:4;for(let k=0;k<n;k++){
       shape(-w/2+7+k*(w-17)/n,-10,(w-23)/n,9,2,alert?'#E4BD97':'#7EAFC1');
     }
     c.fillStyle=colors.navy;for(const xx of [-w/2+17,w/2-17]){
       c.beginPath();c.arc(xx,14,5.5,0,Math.PI*2);c.fill();
     }
     c.restore();
   }
   const roleNames=['ĐH','PVSĐ','PVHK','KHO HÀNG','QA / IT'];
   const confirmedTime=s=>{
     if(!s)return 'Chưa xác nhận';
     const dt=new Date(s);
     if(!Number.isFinite(dt.getTime()))return 'Chưa xác nhận';
     return dt.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
   };
   function tripCard(r,x,y){
     const done=r.confirmed===5;
     const special=r.is_custom||r.line_no>0;
     shape(x,y,cardW,cardH,15,special?'#FFF8ED':colors.paper,special?'#DEAE67':colors.line);
     shape(x+1,y+1,5,cardH-2,3,special?'#C47C26':done?colors.green:'#D7A467');
     t(model().clock(r.departure_min),x+22,y+30,27,colors.navy,true);
     if(special)shape(x+142,y+15,96,24,12,'#FCE2B9');
     if(special)t(r.line_no>0?'BỔ SUNG '+r.line_no:'GIỜ THÊM',x+190,y+27,11,'#A45F15',true,'center');
     const totalX=x+280;
     t(done?String(r.total):'~'+r.total,totalX,y+30,29,done?colors.navy:colors.warning,true,'center');
     t(done?'ĐÃ CHỐT 5/5':'CHƯA ĐỦ '+r.confirmed+'/5',totalX,y+53,12,done?colors.green:colors.steel,true,'center');
     const iconX=x+465,wordX=x+555;
     if(done){
       if(r.total===0){
         t('KHÔNG CẦN XE',iconX,y+32,14,colors.steel,true);
       }else if(r.total<=29){
         vehicle(iconX+34,y+38,29);
         t('29 CHỖ',wordX,y+28,17,colors.teal,true);
         t('GỢI Ý',wordX,y+50,11,colors.steel);
       }else if(r.total<=45){
         vehicle(iconX+34,y+38,45);
         t('45 CHỖ',wordX,y+28,17,colors.teal,true);
         t('GỢI Ý',wordX,y+50,11,colors.steel);
       }else{
         vehicle(iconX+34,y+38,45,true);
         t('TRÊN 45',wordX,y+27,15,colors.warning,true);
         t('BỔ SUNG XE',wordX,y+50,12,colors.warning,true);
       }
     }else{
       shape(x+450,y+18,cardW-470,39,9,'#FFF0F0');
       t('CHƯA ĐỦ 5 ĐƠN VỊ',x+465,y+37,13,'#B12B31',true);
     }
     line(x+22,y+69,x+cardW-22,y+69);
     const colW=(cardW-44)/5;
     for(let i=0;i<5;i++){
       const u=r.units[i],ux=x+22+i*colW;
       if(i)line(ux-8,y+82,ux-8,y+125,'#E4ECF1');
       t(roleNames[i],ux,y+83,11,colors.steel,true);
       t(u?String(u.quantity):'—',ux,y+107,23,u?colors.ink:'#A3B2BC',!!u);
       t(u?confirmedTime(u.confirmed_at):'CHƯA NHẬP',ux+32,y+109,10,u?colors.green:'#B12B31',false,'left',colW-35);
     }
     line(x+22,y+130,x+cardW-22,y+130,special?'#E6C48F':'#E2EAF0');
     if(r.missing?.length){
       t('CHƯA XÁC NHẬN: '+r.missing.join(', '),x+22,y+144,13,'#AD313B',true,'left',cardW-44);
     }else t('Đã có số liệu của đủ 5 đơn vị',x+22,y+144,12,colors.green,false,'left',cardW-44);
     if(special){
       t('LÝ DO THÊM XE: '+(r.note||'Chưa ghi lý do'),x+22,y+159,12,'#AC671D',true,'left',cardW-44);
     }else if(r.note){
       t('GHI CHÚ: '+String(r.note).slice(0,80),x+22,y+159,10,colors.steel,false,'left',cardW-44);
     }
   }
   // Print-white canvas, no gradients/large decorative icons
   c.fillStyle=colors.background;c.fillRect(0,0,W,H);
   shape(30,23,W-60,H-46,22,colors.paper,'#E1E9EE');
   shape(30,23,W-60,9,4,colors.navy);
   // Official SAGS identity
   const maxW=126,maxH=117,ratio=Math.min(maxW/logo.naturalWidth,maxH/logo.naturalHeight);
   c.drawImage(logo,55+(maxW-logo.naturalWidth*ratio)/2,45+(maxH-logo.naturalHeight*ratio)/2,logo.naturalWidth*ratio,logo.naturalHeight*ratio);
   line(205,53,205,154,colors.line,2);
   t('PHÒNG ĐIỀU HÀNH KHAI THÁC · CXR',232,66,15,colors.teal,true);
   t('BẢNG TỔNG HỢP XE GIAO CA',232,113,35,colors.navy,true);
   t('Số liệu xác nhận từ 05 đơn vị  /  Phát hành bởi ĐH',232,151,17,colors.steel);
   shape(1292,62,226,84,14,colors.soft);
   t('NGÀY KHAI THÁC',1405,83,13,colors.steel,true,'center');
   t(name(input.date),1405,118,26,colors.navy,true,'center');
   line(50,177,1550,177);
   // Place markers at both ends; route-direction explicitly repeated below
   shape(49,195,1502,115,16,'#F0F7F9');
   coast(90,254);
   t('NHA TRANG',201,234,21,colors.navy,true);
   t('THÀNH PHỐ',201,260,13,colors.steel);
   c.strokeStyle='#A3C5D2';c.lineWidth=3;c.setLineDash([6,9]);
   line(450,251,1110,251,'#7DAFC3',3);c.setLineDash([]);
   shape(734,228,132,44,22,colors.paper,'#C9DFE8');
   t('NHA  ↔  CXR',800,250,18,colors.teal,true,'center');
   airport(1280,244);
   t('SÂN BAY CAM RANH',1240,233,20,colors.navy,true,'right');
   t('CẢNG HKQT CXR',1240,260,13,colors.steel,false,'right');
   const hdr=(x,code,nameText,sub,qty)=>{
     shape(x,336,cardW,58,11,code==='NHA_CXR'?'#E8F3F7':'#EAF4F0');
     shape(x,336,6,58,3,code==='NHA_CXR'?colors.teal:colors.green);
     t(nameText,x+20,357,19,colors.navy,true);
     t(sub,x+20,378,13,colors.steel);
     t(qty+' mốc xe',x+cardW-20,368,16,colors.teal,true,'right');
   };
   hdr(leftX,'NHA_CXR','NHA TRANG → CAM RANH','CHIỀU ĐI LÀM',left.length);
   hdr(rightX,'CXR_NHA','CAM RANH → NHA TRANG','CHIỀU XE VỀ',right.length);
   left.forEach((r,i)=>tripCard(r,leftX,startY+i*step));
   right.forEach((r,i)=>tripCard(r,rightX,startY+i*step));
   const confirmed=rows.filter(r=>r.confirmed===5).length;
   const incomplete=rows.length-confirmed;
   const warn=rows.filter(r=>r.confirmed===5&&r.total>45).length;
   shape(49,bottomY,1502,98,15,'#EDF4F8');
   const metrics=[
     ['SỐ MỐC XE',String(rows.length)],
     ['ĐÃ XÁC NHẬN 5/5',String(confirmed)],
     ['CHỜ PHÒNG XÁC NHẬN',String(incomplete)],
     ['MỐC TRÊN 45 NGƯỜI',String(warn)]
   ];
   const metW=1502/4;
   metrics.forEach((m,i)=>{
     const x=70+metW*i;if(i)line(x-17,bottomY+18,x-17,bottomY+80,'#CCDCE6');
     t(m[0],x,bottomY+30,13,colors.steel,true);
     t(m[1],x,bottomY+64,29,i===3&&warn?colors.warning:colors.navy,true);
   });
   t('29 CHỖ  ·  45 CHỖ  ·  Trên 45 người: TBĐH phải xác nhận phương án bổ sung xe.',60,bottomY+131,16,colors.navy,true);
   t('Dấu ~: tổng tạm tính; mỗi mốc ghi rõ phòng chưa xác nhận. Giờ xe bổ sung và lý do được tô màu cam.',60,bottomY+162,14,colors.steel);
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
     const [data,logo]=await Promise.all([fetchData(),loadLogo()]);
     const img=draw(data,logo),base='SAGS_CXR_XE_GIAO_CA_'+data.date.replaceAll('-','');
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
     const [data,logo]=await Promise.all([fetchData(),loadLogo()]);
     const canvas=draw(data,logo);
     const image=document.createElement('img');
     image.alt='Bảng tổng hợp xe giao ca đúng bản xuất PNG/PDF, gồm ĐH, PVSĐ, PVHK, Kho Hàng, QA / IT.';
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
