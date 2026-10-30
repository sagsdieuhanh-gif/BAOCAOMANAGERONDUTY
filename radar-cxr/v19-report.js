'use strict';
(function(){
 const LABELS=['Lịch bay','Khung giờ cao điểm cần lưu ý','Vị trí đỗ và hạ tầng','Nhân sự','Trang thiết bị','Hành lý - Hàng hóa','OTP và chất lượng','An ninh - An toàn','Kết quả xử lý tồn tại trước đó'];
 const SITE='https://sagsdieuhanh-gif.github.io/EREPORT/radar-cxr/';
 const dateVN=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';
 const txt=x=>String(x==null?'':x);
 const esc=x=>txt(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nsign=n=>n>0?'+'+n:String(n);
 const clock=n=>n==null?'—':String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0')+(n>=1440?' (+1)':'');
 const has=(x,k)=>Number.isInteger(x?.[k]);
 const known=x=>String(x||'').trim();
 const byRole=(u,role,shift)=>staff.find(x=>x.unit===u&&x.role_code===role&&x.shift===shift)?.quantity;
 const shown=x=>x==null?'chưa xác nhận':x+' người';
 const uStaff=(u,role)=>'Sáng '+shown(byRole(u,role,'SÁNG'))+', Đêm '+shown(byRole(u,role,'ĐÊM'));
 const wide=rs=>rs.filter(x=>/A\s?330|B\s?777/i.test(x.aircraft_type||''));
 const lowGround=rs=>rs.filter(x=>x.arrival&&x.departure&&x.sta_min!=null&&x.std_min!=null&&x.std_min-x.sta_min>=0&&x.std_min-x.sta_min<=35)
   .sort((a,b)=>(a.std_min-a.sta_min)-(b.std_min-b.sta_min)).slice(0,12);
 function services(f,s){
   const a=f.sta_min,b=f.std_min,carrier=(f.airline||String(f.arrival||f.departure||'').slice(0,2)).toUpperCase();
   let n=['VJ','9G','VU','AK','FD'].includes(carrier)?30:['KE','BX','TW','RF','LJ','ZE','RS','7C','YP'].includes(carrier)?60:a!=null&&b!=null?Math.max(0,b-a):0;
   if(!n)return false;
   const start=a!=null?a:b!=null?b-n:null;
   const end=start!=null?(b!=null?Math.min(b,start+n):start+n):null;
   return start!=null&&end!=null&&start<s+30&&end>s;
 }
 function peaks(rs){
   const candidates=Array.from({length:60},(_,i)=>({minute:i*30,items:rs.filter(x=>services(x,i*30))}))
     .filter(x=>x.items.length).sort((a,b)=>b.items.length-a.items.length||a.minute-b.minute);
   const chosen=[];
   for(const x of candidates){if(chosen.every(y=>Math.abs(y.minute-x.minute)>=60)){chosen.push(x);if(chosen.length===3)break}}
   return chosen;
 }
 async function source(){
   const day=E('day').value;
   const [s,n]=await Promise.all([
    sb.from('ops_forecast_snapshots').select('payload,source_filename').eq('service_date',day).eq('revision',1).maybeSingle(),
    sb.from('ops_report_notes').select('*').eq('service_date',day).maybeSingle()
   ]);
   if(s.error)throw Error('Không tải được nguồn Lần 1: '+s.error.message);
   if(n.error)throw Error('Không tải được ghi chú: '+n.error.message);
   const payload=s.data?.payload||null,arr=payload?.flights?.length?payload.flights:flights;
   if(!arr.length)throw Error('Chưa có lịch bay cho ngày '+dateVN(day)+'. Cần tải Excel trước khi xuất báo cáo.');
   if(!payload&&arr.some(x=>x.bay!=null))throw Error('Không có ảnh chụp lịch Lần 1; không dùng lịch có bãi để tái tạo Lần 1.');
   const count=(field,fallback)=>Number.isInteger(payload?.[field])?payload[field]:Number.isInteger(payload?.totals?.[field])?payload.totals[field]:fallback;
   const arrived=arr.filter(x=>x.arrival).length,departed=arr.filter(x=>x.departure).length;
   let qn=count('domestic_count',null),qt=count('international_count',null);
   if(qn==null&&arr.every(x=>typeof x.international==='boolean')){
    qn=arr.reduce((t,x)=>t+(x.international?0:Number(!!x.arrival)+Number(!!x.departure)),0);
    qt=arr.reduce((t,x)=>t+(x.international?Number(!!x.arrival)+Number(!!x.departure):0),0);
   }
   return {date:day,rows:arr,arrivals:count('arrival_count',arrived),departures:count('departure_count',departed),
    domestic:qn,international:qt,author:E('sessionLabel').textContent.split(' · ')[0]||me?.email||'Trực ban Điều hành',
    note:n.data||{},sourceFile:s.data?.source_filename||'',prior:prevTotals,controls};
 }
 function build(c){
   const total=c.arrivals+c.departures,prev=c.prior,priorTotal=prev?.arrival_count!=null&&prev?.departure_count!=null?prev.arrival_count+prev.departure_count:null;
   const difference=priorTotal==null?'Chưa đủ dữ liệu xác nhận để tính chênh lệch.':
    'Đến ('+nsign(c.arrivals-prev.arrival_count)+') | Đi ('+nsign(c.departures-prev.departure_count)+
    '). Tổng ('+nsign(total-priorTotal)+') lượt ('+(priorTotal?((total-priorTotal)/priorTotal*100).toFixed(1).replace('.',',')+'%':'chưa tính tỷ lệ')+').';
   const summary='Đến: '+c.arrivals+' | Đi: '+c.departures+' | Quốc nội: '+(c.domestic??'CHỜ XÁC NHẬN')+
    ' lượt | Quốc tế: '+(c.international??'CHỜ XÁC NHẬN')+' lượt.';
   const comparison='Ngày '+dateVN(prevDate(c.date))+': '+(priorTotal==null?'Chưa có số liệu đã xác nhận.':
    prev.departure_count+' đi, '+prev.arrival_count+' đến ('+priorTotal+' lượt).')+
    '\nNgày '+dateVN(c.date)+': '+c.departures+' đi, '+c.arrivals+' đến ('+total+' lượt).\n'+difference;
   const w=wide(c.rows),p=peaks(c.rows),short=lowGround(c.rows);
   const staffSky=staff.filter(x=>x.unit==='KTS'&&x.role_code==='SKYONE_BAGGAGE');
   const staffInfo='Phòng KTSĐ: Bốc xếp công ty ('+uStaff('KTS','BAGGAGE')+'); Lái xe GSE ('+uStaff('KTS','GSE_DRIVER')+'). SKYONE thuê ngoài: '+
    (staffSky.length?staffSky.slice(0,6).map(x=>clock(x.start_min)+'–'+clock(x.end_min)+': '+x.quantity+' người').join('; '):'chưa có khung giờ xác nhận')+
    '.\nPhòng PVHK: Đội đến ('+uStaff('PVHK','PVHK_ARRIVAL_TEAM')+'); Đội đi ('+uStaff('PVHK','PVHK_DEPARTURE_TEAM')+').';
   const notesGse=gse.filter(x=>x.note&&x.note.trim()).map(x=>(GSE_NAMES[x.code]||x.code)+': '+x.note).slice(0,7);
   const cargoKnown=c.rows.filter(x=>x.cargo_status==='CARGO').length,cargoUnknown=c.rows.filter(x=>!x.cargo_status||x.cargo_status==='UNKNOWN').length;
   const observations=[
    'Dự kiến '+total+' lượt bay. '+(priorTotal!=null?'So ngày trước '+nsign(total-priorTotal)+' lượt. ':'Chưa có số liệu ngày trước để đối chiếu. ')+
      (w.length?'Có '+w.length+' hồ sơ A330/B777: '+w.slice(0,7).map(x=>(x.arrival||'—')+'/'+(x.departure||'—')).join(', '):'Chưa xác định lượt A330/B777 từ dữ liệu hiện tại')+'.',
    p.length?p.map(x=>clock(x.minute)+'–'+clock(x.minute+30)+': '+x.items.length+' cặp/chuyến').join('; ')+'.':'Chưa đủ lịch STA/STD để xác định khung cao điểm.',
    'Lần 1 chưa có bãi đỗ. '+(c.note.aoc_note||'Chờ xác nhận vị trí đỗ sau cuộc họp AOC; chưa thể kết luận rủi ro theo khu vực bãi.'),
    staffInfo,
    notesGse.length?notesGse.join('; '):'Chưa có thông tin cụ thể về xe hỏng/xe tạm dừng. Có '+gse.filter(x=>x.ready_count==null).length+'/'+gse.length+' nhóm thiết bị chưa xác nhận khả dụng.',
    'Có '+cargoKnown+' hồ sơ xác nhận có cargo; '+cargoUnknown+' hồ sơ chưa rõ cargo. Lịch bay không cung cấp KG hàng hóa: chờ dữ liệu từ đơn vị liên quan.',
    short.length?'Các cặp ground-time theo lịch ≤35 phút: '+short.map(x=>x.arrival+'/'+x.departure+' ('+(x.std_min-x.sta_min)+' phút)').join('; ')+'. Cần theo dõi nguy cơ OTP.':'Chưa phát hiện cặp có ground-time theo lịch ≤35 phút trong dữ liệu hiện có; chưa kết luận OTP thực tế.',
    c.note.weather_note||'Chưa có thông tin cảnh báo thời tiết, an ninh hoặc an toàn đã được xác nhận cho ngày dự báo.',
    c.note.previous_issue||'Chưa có dữ liệu xác nhận về tồn tại của ca trước.'
   ];
   const actions=[
    'Phòng ĐH: Phối hợp đảm bảo ground-time, rà soát biến động lịch và phục vụ tàu thân rộng; điều động theo giờ thực tế.',
    'Phòng ĐH: Ưu tiên các mốc chồng lấn. KTSĐ kiểm tra GSE; PVHK bố trí đội đến/đi theo khung, chỉ chốt năng lực khi đã xác nhận.',
    'Sau AOC cập nhật lịch có bãi (Dự báo Lần 2), kiểm tra tuyến đường công vụ, bãi ngoài và nhu cầu di chuyển thiết bị.',
    'ĐH, KTSĐ và PVHK rà soát nhân sự thật; xác nhận bốc xếp, lái xe, SKYONE và hai đội PVHK theo ca/khung giờ.',
    'KTSĐ xác nhận số thiết bị khả dụng, khả năng phục vụ tàu thân rộng, thiết bị hỏng và phương án thay thế; ĐH phối hợp ưu tiên chuyến.',
    'ĐH và KTSĐ xác minh khối lượng hàng hóa; chủ động chuẩn bị kéo, chất xếp theo công đoạn, không tự giả định KG.',
    'ĐH theo dõi giờ đáp thực tế, ưu tiên quay đầu ngắn và phối hợp khi mốc khai thác thay đổi.',
    'TBĐH theo dõi cảnh báo đã xác nhận, thông báo kịp thời cho các đơn vị trong trường hợp điều kiện bất lợi hoặc divert.',
    'Các đơn vị báo cáo kết quả khắc phục tồn tại nếu có; chưa xác minh thì ghi chờ xác nhận.'
   ];
   const topics=LABELS.map((label,i)=>{
     const override=c.controls.find(x=>x.topic===i+1)||{};
     return {title:String(i+1).padStart(2,'0')+'. '+label,
       observation:known(override.observation)||observations[i],action:known(override.action)||actions[i]};
   });
   if(c.note.special_operation_note)topics[0].observation+='\nĐH bổ sung: '+c.note.special_operation_note;
   const peakRows=p.map(x=>({
     slot:clock(x.minute)+' – '+clock(x.minute+30),
     flight:x.items.map(y=>(y.arrival||'—')+'/'+(y.departure||'—')).join(', '),
     risk:x.items.length+' cặp/chuyến đang phục vụ quy ước; kiểm tra chồng lấn '+(x.items.some(y=>/330|777/i.test(y.aircraft_type||''))?'và tàu thân rộng.':'.'),
     action:'TBĐH rà soát; KTSĐ kiểm tra GSE/nhân lực; PVHK xác nhận đội đến/đi.'
   }));
   if(!peakRows.length)peakRows.push({slot:'Chưa xác định',flight:'Chưa có',risk:'Thiếu giờ lịch bay.',action:'Kiểm tra lại Excel nguồn.'});
   const coord=[
    ['Xác nhận năng lực cao điểm, quay đầu ngắn','Rà soát nhân sự, định mức, GSE, SKYONE, phương án bổ sung.','PVHK; KTSĐ; ĐH','Trước 16:00 ngày '+dateVN(prevDate(c.date))+'; cập nhật 08:30 ngày '+dateVN(c.date)+'.'],
    ['Cập nhật quầy, kệ, bãi đỗ; hạn chế','Sau AOC kiểm tra bãi đỗ, tuyến GSE và phát hành Lần 2.','TBĐH; các đơn vị','Sau AOC; xác nhận trước 08:30 ngày '+dateVN(c.date)+'.']
   ];
   return {c,summary,comparison,topics,peakRows,coord,recommendation:c.note.executive_recommendation||'Chưa có kiến nghị bổ sung được nhập.'};
 }
 function html(data){
   const tr=(arr,th)=>'<tr>'+arr.map(x=>(th?'<th>':'<td>')+esc(x).replace(/\n/g,'<br>')+(th?'</th>':'</td>')).join('')+'</tr>';
   return '<div class="v19-report-sheet"><h2>DỰ BÁO KHAI THÁC HẰNG NGÀY – LẦN 1</h2>'+
    '<p>Ngày khai thác: <b>'+esc(dateVN(data.c.date))+'</b><br>Người lập báo cáo: <b>'+esc(data.c.author)+'</b></p>'+
    '<h3>I. TÓM TẮT KHAI THÁC</h3><table>'+tr(['Chỉ tiêu','Dự báo / Biến động so với ngày trước'],true)+tr(['Sản lượng',data.summary])+tr(['Biến động so với ngày hôm trước',data.comparison])+'</table>'+
    '<h3>II. BẢNG KIỂM SOÁT</h3><table>'+tr(['Nội dung','Nhận định','Phương án phục vụ'],true)+data.topics.map(x=>tr([x.title,x.observation,x.action])).join('')+'</table>'+
    '<h3>III. CẢNH BÁO CAO ĐIỂM (Theo khung 30 phút)</h3><table>'+tr(['Khung giờ','Các cặp chuyến','Nguy cơ','Phương án xử lý'],true)+data.peakRows.map(x=>tr([x.slot,x.flight,x.risk,x.action])).join('')+'</table>'+
    '<h3>IV. PHỐI HỢP THỰC HIỆN</h3><table>'+tr(['Nội dung phối hợp','Yêu cầu, phương án','Đơn vị','Thời hạn xác nhận'],true)+data.coord.map(x=>tr(x)).join('')+'</table>'+
    '<h3>V. KIẾN NGHỊ BAN TGĐ</h3><p>'+esc(data.recommendation)+'</p>'+
    '<p class="v19-footnote">Nguồn Lần 1: '+esc(data.c.sourceFile||'Lịch đã lưu, chưa có snapshot')+'<br>Xem Radar và phân tích trực tuyến: '+esc(SITE)+'</p></div>';
 }
 let lib=null;
 async function ensureDocx(){
   if(window.docx?.Document)return window.docx;
   if(!lib)lib=new Promise((resolve,reject)=>{
     const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/docx@9.4.1/dist/index.umd.cjs';
     s.onload=()=>window.docx?.Document?resolve(window.docx):reject(Error('Không khởi tạo được thư viện Word.'));
     s.onerror=()=>reject(Error('Không tải được bộ xuất Word. Vui lòng kiểm tra mạng.'));
     document.head.appendChild(s);
   });
   return lib;
 }
 function word(data,D){
   const one={style:D.BorderStyle.SINGLE,size:5,color:'6C7C88'};
   const edges={top:one,bottom:one,left:one,right:one};
   function p(s,opts){
     opts=opts||{};
     return new D.Paragraph({alignment:opts.center?D.AlignmentType.CENTER:D.AlignmentType.LEFT,
      spacing:{before:opts.before||0,after:opts.after??40},
      children:String(s??'').split('\n').map((line,i)=>new D.TextRun({text:line,font:'Times New Roman',size:opts.size||20,bold:!!opts.bold,break:i?1:0}))});
   }
   function c(s,head){
     return new D.TableCell({borders:edges,shading:head?{fill:'E9EFF3'}:undefined,margin:{top:62,bottom:62,left:77,right:77},
      children:[p(s,{bold:head,size:head?20:20,center:head})]});
   }
   function t(headers,rows,widths){
     return new D.Table({width:{size:10500,type:D.WidthType.DXA},columnWidths:widths,
      rows:[new D.TableRow({children:headers.map(x=>c(x,true))})]
       .concat(rows.map(row=>new D.TableRow({children:row.map(x=>c(x,false))})))});
   }
   const hd=s=>p(s,{bold:true,size:24,before:160,after:65});
   return new D.Document({creator:'SAGS-CXR',title:'Dự báo khai thác hằng ngày - Lần 1',
    styles:{default:{document:{run:{font:'Times New Roman',size:20}}}},
    sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:600,bottom:600,left:600,right:600}}},
     children:[
       p('DỰ BÁO KHAI THÁC HẰNG NGÀY',{bold:true,center:true,size:28,after:170}),
       p('Ngày khai thác: '+dateVN(data.c.date),{size:22}),
       p('Người lập báo cáo: '+data.c.author,{size:22}),
       hd('I. TÓM TẮT KHAI THÁC'),
       t(['Chỉ tiêu','Dự báo / Biến động so với ngày trước'],[['Sản lượng',data.summary],['Biến động so với ngày hôm trước',data.comparison]],[2350,8150]),
       hd('II. BẢNG KIỂM SOÁT'),
       t(['Nội dung','Nhận định','Phương án phục vụ'],data.topics.map(x=>[x.title,x.observation,x.action]),[2120,4150,4230]),
       hd('III. CẢNH BÁO CAO ĐIỂM (Theo khung 30 phút)'),
       t(['Khung giờ','Các cặp chuyến','Nguy cơ','Phương án xử lý'],data.peakRows.map(x=>[x.slot,x.flight,x.risk,x.action]),[1730,3150,2620,3000]),
       hd('IV. PHỐI HỢP THỰC HIỆN'),
       t(['Nội dung phối hợp','Yêu cầu, phương án','Đơn vị','Thời hạn xác nhận'],data.coord,[2650,3150,1650,3050]),
       hd('V. KIẾN NGHỊ BAN TGĐ'),
       p(data.recommendation),
       p('Nguồn Dự báo Lần 1: '+(data.c.sourceFile||'Chưa chốt')+'. Xem Radar trực tuyến: '+SITE,{size:17,before:150})
     ]}]
   });
 }
 async function exportOne(){
   const buttons=[...document.querySelectorAll('[data-v19-export]')];
   buttons.forEach(b=>{b.disabled=true;b.textContent='ĐANG TẠO WORD…'});
   try{
     const data=build(await source()),D=await ensureDocx();
     const blob=await D.Packer.toBlob(word(data,D));
     if(!blob||blob.size<3000)throw Error('File Word không hợp lệ.');
     const a=document.createElement('a');a.href=URL.createObjectURL(blob);
     a.download='SAGS_CXR_DU_BAO_LAN_1_'+data.c.date.replaceAll('-','')+'.docx';
     document.body.appendChild(a);a.click();a.remove();
     setTimeout(()=>URL.revokeObjectURL(a.href),3000);
     const status=document.getElementById('v19ExportMessage');
     if(status)status.textContent='Đã tạo báo cáo Word đủ 5 mục theo mẫu và link Radar trực tuyến.';
   }catch(e){alert('Chưa xuất được Dự báo Lần 1: '+e.message);}
   finally{buttons.forEach(b=>{b.disabled=false;b.textContent='XUẤT DỰ BÁO LẦN 1 (.DOCX)'})}
 }
 async function preview(){
   const el=document.getElementById('v19ReportPreview');if(!el)return;
   el.innerHTML='<p class="v19-small">Đang tổng hợp dữ liệu…</p>';
   try{el.innerHTML=html(build(await source()));}catch(e){el.innerHTML='<div class="v19-callout">'+esc(e.message)+'</div>'}
 }
 async function loadNotes(){
   const {data,error}=await sb.from('ops_report_notes').select('*').eq('service_date',E('day').value).maybeSingle();
   if(error)throw error;
   for(const k of ['aoc_note','weather_note','previous_issue','executive_recommendation','special_operation_note']){
     const el=document.querySelector('[data-v19-note="'+k+'"]');if(el)el.value=data?.[k]||'';
   }
 }
 async function saveNotes(){
   if(!['ADMIN','DH'].includes(unit))return;
   const obj={service_date:E('day').value,updated_by:me.id,updated_at:new Date().toISOString()};
   for(const k of ['aoc_note','weather_note','previous_issue','executive_recommendation','special_operation_note']){
      const el=document.querySelector('[data-v19-note="'+k+'"]');obj[k]=el?.value.trim()||'';
   }
   const {error}=await sb.from('ops_report_notes').upsert(obj,{onConflict:'service_date'});
   const hint=document.getElementById('v19NotesHint');
   if(hint)hint.textContent=error?'Chưa lưu: '+error.message:'Đã lưu ghi chú bổ sung, không cần nhập lại nếu không phát sinh.';
   if(error)throw error;
   await preview();
 }
 window.SagsReportV19={source,build,preview,exportOne,loadNotes,saveNotes,_testCreateWord:word};
})();