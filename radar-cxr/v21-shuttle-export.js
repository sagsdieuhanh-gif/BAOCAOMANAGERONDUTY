'use strict';
(function(root){
 const model=()=>root.SagsShuttleModel, $=id=>document.getElementById(id);
 const name=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';
 const when=s=>s?new Date(s).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Chưa xác nhận';
 const navy='#15405F',blue='#116C93',ink='#233D51',border='#DDE9EF',muted='#6C8797',green='#16735B';
 const W=1490;
 function normalize(data){
   const keys=new Map(model().defaults.map(x=>[x.direction+'|'+x.departure_min,{...x,is_custom:false}]));
   for(const x of data)if(!keys.has(x.direction+'|'+x.departure_min))
     keys.set(x.direction+'|'+x.departure_min,{direction:x.direction,departure_min:x.departure_min,is_custom:true});
   return model().order([...keys.values()]).map(x=>{
     const units=['DH','KTS','PVHK','KHO'].map(u=>data.find(v=>v.unit===u&&v.direction===x.direction&&v.departure_min===x.departure_min)||null);
     return {...x,units,confirmed:units.filter(Boolean).length,total:units.reduce((n,v)=>n+(v?v.quantity:0),0),
       note:x.note||units.map(v=>v?.note||'').filter(Boolean).join('; ')};
   });
 }
 async function fetchData(){
   if(typeof sb==='undefined'||typeof me==='undefined'||!sb||!me)throw Error('Cần đăng nhập bằng tài khoản được cấp quyền Radar.');
   const day=$('day')?.value;
   if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Chưa chọn ngày khai thác.');
   const {data,error}=await sb.from('ops_shift_transport_v2')
     .select('service_date,unit,direction,departure_min,quantity,is_custom,note,confirmed_at')
     .eq('service_date',day);
   if(error)throw Error(error.message);
   return {date:day,rows:normalize(data||[])};
 }
 function draw(input){
   const rows=input.rows,H=545+rows.length*67+90;
   if(H>14500)throw Error('Quá nhiều chuyến xe trong một ngày.');
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
   const c=canvas.getContext('2d');if(!c)throw Error('Thiết bị không hỗ trợ xuất ảnh.');
   const box=(x,y,w,h,fill,stroke)=>{
     c.fillStyle=fill;c.fillRect(x,y,w,h);
     if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);}
   };
   const txt=(value,x,y,size=17,color=ink,bold=false,align='left',maxWidth)=>{
     c.fillStyle=color;c.font=(bold?'700 ':'400 ')+size+'px Arial, sans-serif';
     c.textAlign=align;c.textBaseline='middle';c.fillText(String(value),x,y,maxWidth);c.textAlign='left';
   };
   const coach=(x,y,size,emphasis=false)=>{
     const length=size===45?98:72;
     c.save();c.translate(x,y);
     c.strokeStyle=emphasis?'#AD6325':blue;c.lineWidth=3;
     c.fillStyle='#F1F7FB';c.beginPath();c.roundRect(-length/2,-18,length,31,6);c.fill();c.stroke();
     c.fillStyle='#5B9BBA';
     const windows=size===45?6:4;
     for(let j=0;j<windows;j++)c.fillRect(-length/2+8+j*((length-16)/windows),-11,(length-22)/windows,10);
     c.fillStyle=navy;
     for(const wx of [-length/2+18,length/2-18]){c.beginPath();c.arc(wx,16,6,0,Math.PI*2);c.fill();}
     c.restore();
   };
   box(0,0,W,H,'#F6F9FB');
   box(0,0,W,147,navy);
   box(0,147,W,5,'#0B94B5');
   txt('SAGS  /  ĐIỀU HÀNH KHAI THÁC',48,39,17,'#98D0E5',true);
   txt('XE GIAO CA  ·  BẢNG TỔNG HỢP',48,93,31,'#FFFFFF',true);
   txt(name(input.date),W-50,96,25,'#FFFFFF',true,'right');
   box(47,170,W-94,73,'#FFFFFF',border);
   // Understated Nha Trang shoreline and airport plane markers, no photos or invented identity imagery.
   c.strokeStyle='#1684AC';c.lineWidth=3;
   for(let j=0;j<3;j++){c.beginPath();c.arc(75+j*14,206,8,Math.PI,2*Math.PI);c.stroke();}
   txt('NHA TRANG',127,192,18,navy,true);
   txt('NHA → CXR  ·  ĐI LÀM',127,221,15,muted);
   txt('CXR → NHA  ·  XE VỀ',W-80,221,15,muted,false,'right');
   txt('CAM RANH AIRPORT',W-80,192,18,navy,true,'right');
   txt('✈',W-65,202,27,blue,true,'right');
   const x=[47,182,325,454,578,706,848,980,1125,1443];
   const head=['CHIỀU','GIỜ','ĐH','PVSĐ','PVHK','KHO','TỔNG','XE DỰ KIẾN','GHI CHÚ'];
   let y=266,prev='';
   box(47,y,1396,53,'#E9F0F4');
   head.forEach((v,i)=>txt(v,(x[i]+x[i+1])/2,y+27,15,navy,true,'center'));
   y+=53;
   for(const r of rows){
     if(r.direction!==prev){
       box(47,y,1396,39,r.direction==='NHA_CXR'?'#E0F0F5':'#E4F0EC');
       txt(r.direction==='NHA_CXR'?'NHA TRANG  →  CXR    |    XE ĐI LÀM':'CXR  →  NHA TRANG    |    XE VỀ',63,y+20,17,navy,true);
       y+=39;prev=r.direction;
     }
     const yRow=y;
     box(47,y,1396,67,'#FFFFFF',border);
     for(let j=1;j<9;j++){c.strokeStyle='#E5ECF0';c.lineWidth=1;c.beginPath();c.moveTo(x[j],y);c.lineTo(x[j],y+67);c.stroke();}
     txt(r.direction==='NHA_CXR'?'NHA → CXR':'CXR → NHA',(x[0]+x[1])/2,y+33,14,ink,true,'center');
     txt(model().clock(r.departure_min),(x[1]+x[2])/2,y+33,21,navy,true,'center');
     r.units.forEach((u,j)=>{
       const mid=(x[j+2]+x[j+3])/2;
       txt(u?u.quantity:'—',mid,y+23,23,u?navy:muted,!!u,'center');
       txt(u?when(u.confirmed_at):'CHỜ NHẬP',mid,y+52,9,u?green:muted,false,'center',x[j+3]-x[j+2]-5);
     });
     const complete=r.confirmed===4;
     txt(complete?r.total:'~'+r.total,(x[6]+x[7])/2,y+25,24,complete?navy:'#B27133',true,'center');
     txt(complete?'4/4 phòng':'Đã nhập '+r.confirmed+'/4',(x[6]+x[7])/2,y+51,12,complete?green:muted,false,'center');
     const cx=(x[7]+x[8])/2;
     if(!complete){
       txt('CHỜ CHỐT',cx,y+26,15,muted,true,'center');
       txt('Chưa đủ 4 phòng',cx,y+51,11,muted,false,'center');
     }else if(r.total===0){
       txt('KHÔNG CÓ NGƯỜI',cx,y+33,12,muted,true,'center');
     }else if(r.total<=29){
       coach(cx-30,y+27,29);
       txt('29C',cx+43,y+34,18,blue,true,'center');
     }else if(r.total<=45){
       coach(cx-30,y+27,45);
       txt('45C',cx+43,y+34,18,blue,true,'center');
     }else{
       coach(cx-34,y+27,45,true);
       txt('>45',cx+47,y+23,18,'#AD6325',true,'center');
       txt('CẦN THÊM XE',cx+47,y+48,10,'#AD6325',true,'center');
     }
     const note=r.note||(r.is_custom?'XE BỔ SUNG':'');
     if(note){
       txt(note.slice(0,30),x[8]+7,y+24,12,ink,false,'left',x[9]-x[8]-12);
       if(note.length>30)txt(note.slice(30,58),x[8]+7,y+49,10,muted,false,'left',x[9]-x[8]-12);
     }else txt('—',(x[8]+x[9])/2,y+34,14,muted,false,'center');
     y=yRow+67;
   }
   box(47,y+16,1396,70,'#E8F2F6');
   const num=rows.reduce((a,v)=>a+v.total,0);
   txt('TỔNG LƯỢT ĐÃ ĐƯỢC KHAI BÁO',65,y+46,19,navy,true);
   txt(num.toLocaleString('vi-VN')+' lượt',1426,y+46,23,blue,true,'right');
   txt('29C · xe 29 chỗ   |   45C · xe 45 chỗ   |   >45 · ĐH phải bố trí thêm xe.',48,y+117,15,ink);
   txt('Ký hiệu ~: tổng tạm tính khi chưa đủ 4 phòng; loại xe chỉ là gợi ý theo số người, không thay cho lệnh điều xe.',48,y+145,13,muted);
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
   buttons.forEach(b=>b.disabled=true);
   try{
     const data=await fetchData(),img=draw(data),base='SAGS_CXR_XE_GIAO_CA_'+data.date.replaceAll('-','');
     if(type==='png'){download(img.toDataURL('image/png'),base+'.png');return;}
     if(type!=='pdf')throw Error('Định dạng không hợp lệ.');
     const jsPDF=await pdfLib();
     const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
     const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),m=8;
     const width=pw-m*2,capacity=Math.floor((ph-m*2)*img.width/width);
     const pages=Math.ceil(img.height/capacity);
     for(let i=0;i<pages;i++){
       if(i)pdf.addPage();
       const from=i*capacity,height=Math.min(capacity,img.height-from);
       const part=document.createElement('canvas');part.width=img.width;part.height=height;
       part.getContext('2d').drawImage(img,0,from,img.width,height,0,0,img.width,height);
       pdf.addImage(part.toDataURL('image/png'),'PNG',m,m,width,height*width/img.width);
       pdf.setFontSize(9);pdf.setTextColor(70,88,105);
       pdf.text('SAGS-CXR · '+name(data.date)+' · Trang '+(i+1)+'/'+pages,pw-m,ph-3,{align:'right'});
     }
     pdf.save(base+'.pdf');
   }catch(e){alert('Không xuất được '+type.toUpperCase()+': '+e.message);}
   finally{buttons.forEach(b=>b.disabled=false);}
 }

 function escapeHTML(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));}
 async function renderPreview(){
   const el=$('v21ShuttlePreview');if(!el)return;
   el.textContent='Đang tải số người xe giao ca theo từng phòng…';
   try{
     const data=await fetchData(),rows=data.rows;
     const view=(r)=>{
       const td=r.units.map(x=>'<td><strong>'+(x?x.quantity:'—')+'</strong><small>'+(x?escapeHTML(when(x.confirmed_at)):'Chưa xác nhận')+'</small></td>').join('');
       return '<tr><td>'+escapeHTML(model().directionLabel[r.direction])+'</td><td><b>'+escapeHTML(model().clock(r.departure_min))+'</b>'+(r.is_custom?' <small>Bổ sung</small>':'')+'</td>'+td+
         '<td>'+((r.confirmed===4)?r.total:'~'+r.total)+'<small>'+r.confirmed+'/4 phòng</small></td><td>'+escapeHTML(r.confirmed<4?'Chờ chốt':r.total===0?'—':r.total<=29?'29C':r.total<=45?'45C':'45C + cần thêm xe')+'</td></tr>';
     };
     const heads='<tr><th>Chiều xe</th><th>Giờ</th><th>ĐH</th><th>PVSĐ</th><th>PVHK</th><th>Kho Hàng</th><th>Tổng</th><th>Gợi ý xe</th></tr>';
     el.innerHTML='<div class="v21-report-note">Bảng xe giao ca ngày <b>'+escapeHTML(name(data.date))+'</b>. Dấu ~ là tổng tạm tính khi chưa đủ bốn phòng xác nhận. 0 là số người bằng không đã được xác nhận. Chỉ có xe 29C và 45C; trên 45 người cần bố trí thêm xe.</div>'+
       '<div class="tablewrap"><table class="v21-report-table">'+heads+rows.map(view).join('')+'</table></div>';
   }catch(err){el.textContent='Chưa tải được bảng xe giao ca: '+err.message;}
 }

 function bind(){
   document.querySelectorAll('[data-v21-export]').forEach(b=>{
     if(b.dataset.v21Bound)return;
     b.dataset.v21Bound='1';b.onclick=()=>exportFile(b.dataset.v21Export);
   });
 }
 root.SagsShuttleExport={exportFile,bind,renderPreview,_test:{normalize}};
})(typeof window!=='undefined'?window:globalThis);
