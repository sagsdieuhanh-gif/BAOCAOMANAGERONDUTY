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
     const units=['KTS','PVHK','KHO'].map(u=>data.find(v=>v.unit===u&&v.direction===x.direction&&v.departure_min===x.departure_min)||null);
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
   const rows=input.rows,H=600+rows.length*70;
   if(H>14000)throw Error('Có quá nhiều chuyến xe tự chọn trong một ngày.');
   const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
   const c=canvas.getContext('2d');if(!c)throw Error('Thiết bị không hỗ trợ ảnh Canvas.');
   const box=(x,y,w,h,fill,stroke)=>{
     c.fillStyle=fill;c.fillRect(x,y,w,h);
     if(stroke){c.lineWidth=1;c.strokeStyle=stroke;c.strokeRect(x+.5,y+.5,w-1,h-1);}
   };
   const txt=(s,x,y,size=18,color=ink,bold=false,align='left',maxWidth)=>{
     c.fillStyle=color;c.font=(bold?'700 ':'400 ')+size+'px Arial, sans-serif';
     c.textAlign=align;c.textBaseline='middle';c.fillText(String(s),x,y,maxWidth);c.textAlign='left';
   };
   box(0,0,W,H,'#F2F7FA');
   box(0,0,W,152,navy);box(0,152,W,7,blue);
   txt('SAGS  /  CẢNG HÀNG KHÔNG QUỐC TẾ CAM RANH',46,47,19,'#B6E1F0',true);
   txt('TỔNG HỢP XE GIAO CA',46,99,35,'#FFFFFF',true);
   txt('NGÀY '+name(input.date),W-46,101,26,'#FFFFFF',true,'right');
   box(46,178,W-92,72,'#FFFFFF',border);
   txt('CHIỀU XE  ·  GIỜ KHỞI HÀNH  ·  QUÂN SỐ TỪNG PHÒNG',64,200,19,blue,true);
   txt('NHA → CXR: ĐI LÀM     |     CXR → NHA: XE VỀ',64,230,18,ink);
   txt('DỮ LIỆU ĐÃ XÁC NHẬN',W-64,217,17,green,true,'right');
   const x=[46,216,387,608,829,1050,1192,1444];
   let y=271,prev='';
   box(x[0],y,x.at(-1)-x[0],55,blue);
   const header=['CHIỀU XE','GIỜ','PVSĐ','PVHK','KHO HÀNG','TỔNG','GHI CHÚ'];
   header.forEach((h,i)=>txt(h,(x[i]+x[i+1])/2,y+28,18,'#FFFFFF',true,'center'));
   y+=55;
   for(let i=0;i<rows.length;i++){
     const r=rows[i];
     if(prev!==r.direction){
       box(46,y,W-92,38,r.direction==='NHA_CXR'?'#D8EBF5':'#DDF2E9');
       txt(model().directionLabel[r.direction],62,y+19,20,navy,true);y+=38;prev=r.direction;
     }
     box(46,y,W-92,70,i%2?'#F7FAFC':'#FFFFFF',border);
     for(let j=1;j<7;j++){c.strokeStyle=border;c.beginPath();c.moveTo(x[j],y);c.lineTo(x[j],y+70);c.stroke();}
     txt(r.direction==='NHA_CXR'?'NHA → CXR':'CXR → NHA',(x[0]+x[1])/2,y+32,17,navy,true,'center');
     txt(model().clock(r.departure_min),(x[1]+x[2])/2,y+32,22,blue,true,'center');
     r.units.forEach((v,j)=>{
       const cx=(x[j+2]+x[j+3])/2;
       txt(v?String(v.quantity):'—',cx,y+22,25,v?ink:muted,!!v,'center');
       txt(v?when(v.confirmed_at):'CHƯA XÁC NHẬN',cx,y+52,12,v?green:muted,false,'center');
     });
     if(r.confirmed!==3)box(x[5]+1,y+1,x[6]-x[5]-2,68,'#FFF4CE');
     txt(r.confirmed===3?String(r.total):'~'+r.total,(x[5]+x[6])/2,y+22,24,r.confirmed===3?navy:'#9C6500',true,'center');
     txt(r.confirmed+'/3 phòng',(x[5]+x[6])/2,y+52,13,muted,false,'center');
     const note=r.note||(r.is_custom?'Xe bổ sung':'—');
     txt(note.slice(0,34),x[6]+8,y+23,14,ink,false,'left',x[7]-x[6]-12);
     if(note.length>34)txt(note.slice(34,70),x[6]+8,y+51,12,muted,false,'left',x[7]-x[6]-12);
     y+=70;
   }
   box(46,y+15,W-92,67,'#DCEEF6');
   txt('TỔNG LƯỢT ĐÃ NHẬP THEO CÁC MỐC XE',63,y+49,20,navy,true);
   txt(rows.reduce((n,v)=>n+v.total,0).toLocaleString('vi-VN')+' lượt',W-65,y+49,26,blue,true,'right');
   txt('— = chưa xác nhận; 0 = xác nhận không có người; ~ = tổng tạm tính khi chưa đủ 3 phòng.',46,y+108,17,ink);
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
         '<td>'+((r.confirmed===3)?r.total:'~'+r.total)+'<small>'+r.confirmed+'/3 phòng</small></td></tr>';
     };
     const heads='<tr><th>Chiều xe</th><th>Giờ</th><th>PVSĐ</th><th>PVHK</th><th>Kho Hàng</th><th>Tổng</th></tr>';
     el.innerHTML='<div class="v21-report-note">Bảng xe giao ca ngày <b>'+escapeHTML(name(data.date))+'</b>. Dấu ~ là tổng tạm tính khi chưa đủ ba phòng xác nhận. 0 là số người bằng không đã được xác nhận.</div>'+
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
