'use strict';
/* Book4-style second forecast: inspect both sheets, compare L1, human approval, one atomic L2 RPC. */
(function(){
 const core=window.SagsSecondForecast,select=document.getElementById('exFile');
 if(!core||!select)return;
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const notice=(msg,error=false)=>{const el=$('exMessage');if(el){el.textContent=msg;el.style.color=error?'#b92835':'#346279';}};
 let delegated=false,busy=false,staged=null;
 async function library(){
   if(window.XLSX)return;
   await new Promise((ok,fail)=>{const s=document.createElement('script');s.src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
     s.onload=ok;s.onerror=()=>fail(Error('Không tải được thư viện Excel.'));document.head.appendChild(s);});
   if(!window.XLSX)throw Error('Chưa thể đọc file Excel.');
 }
 const fmt=x=>x==null?'CHỜ XÁC NHẬN':String(x);
 function table(headers,rows){
   return '<div class="v217-table-wrap"><table><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr>'+
     rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(fmt(v))+'</td>').join('')+'</tr>').join('')+'</table></div>';
 }
 function render(parsed,base,filename){
   const {stats,payload,issues,fatal}=parsed,analysis=core.analyze(payload),diff=base?core.compare(payload,base.payload):[];
   const missing=!base?.payload?.flights?.length;
   const blockers=core.validateForSave(parsed,base);
   const id=parsed.meta.service_date;
   const wide=analysis.wide.slice(0,12).map(x=>[x.no,core.clock(x.t),x.type,fmt(x.bay),fmt(x.gate),
     x.booking||'CHỜ XÁC NHẬN','PVSĐ chuẩn bị thiết bị tàu thân rộng; PVHK chủ động theo booking đã xác nhận']);
   const ferry=analysis.ferry.map(x=>[x.no,core.clock(x.t),x.ssr||'—',x.flight_type||'—',
     'Xác minh FERRY và nhu cầu phục vụ thực tế; không mặc định boarding như chuyến chở khách']);
   const night=analysis.night.slice(0,15).map(x=>[x.no,core.clock(x.t),x.type,fmt(x.bay),fmt(x.gate),fmt(x.booking)]);
   const incidents=[...blockers.map(v=>'KHÔNG THỂ LƯU: '+v),...issues];
   const isReady=blockers.length===0;
   $('exMapping')?.classList.add('hidden');
   $('forecastRevision').value='2';
   $('forecastSourceName').value=filename;
   $('exSheet').innerHTML='<option value="combined">ARRIVAL + DEPARTURE · đọc đồng thời</option>';
   $('exDiff').innerHTML='<div class="v217-panel"><h3>LẦN NHẬP 2 · '+esc(id)+' · PHÂN TÍCH SAU KHI CÓ BẾN BÃI/GATE/BOOKING</h3>'+
     '<p>Đã nhận đúng hai bảng ARRIVAL và DEPARTURE. Nguồn Lần 1 '+(missing?'chưa có để đối chiếu.':'được giữ nguyên làm bản gốc để so sánh.')+
     ' Kiểm tra kết quả trước khi duyệt lưu.</p>'+
     '<div class="quickTags">'+[['Đến',stats.arrival_count],['Đi',stats.departure_count],['Ghép theo đăng bạ',stats.matched_reg],
       ['Ghép theo chặng',stats.matched_route],['Chưa ghép',stats.unmatched],['Tàu rộng đi',stats.widebody],
       ['Booking 3 thành phần',stats.booked],['FERRY',stats.ferry],['Thay đổi so L1',diff.length]]
       .map(([label,n])=>'<span class="quickTag">'+esc(label)+': <b>'+n+'</b></span>').join('')+'</div>'+
     (incidents.length?'<div class="issue"><b>CẦN KIỂM TRA TRƯỚC KHI PHÁT HÀNH:</b><ul>'+incidents.slice(0,48).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>':'')+
     '<h4>1. Tàu thân rộng – bố trí bãi, gate và booking</h4>'+
     (wide.length?table(['Chuyến','STD','Tàu','Bãi','Gate','Booking nguồn','Lưu ý'],wide):'<p>Không ghi nhận chuyến đi A330/B777.</p>')+
     '<h4>2. Chuyến có ký hiệu FERRY / tính chất đặc biệt</h4>'+
     (ferry.length?table(['Chuyến','STD','SSR','FlightType','Phương án cần xác minh'],ferry):'<p>Chưa ghi nhận FERRY trong bảng đi.</p>')+
     '<h4>3. Khung tối – gate, bãi đỗ và booking</h4>'+
     (night.length?table(['Chuyến','STD','Tàu','Bãi','Gate','Booking'],night):'<p>Không có chuyến đi từ 18:00 theo file.</p>')+
     '<h4>4. Kiểm tra khả năng dồn gate / thay đổi so Lần 1</h4>'+
     (analysis.gateCheck.length?table(['Gate','Chuyến 1','Chuyến 2','Chênh STD (phút)','Nhận định'],
       analysis.gateCheck.slice(0,20).map(x=>[x.gate,x.a,x.b,x.minutes,x.kind]))+
       '<p>Hệ thống sử dụng BDG Start/Finish khi có dữ liệu; trường hợp chưa đủ mốc boarding chỉ nhắc kiểm tra các chuyến gần giờ, không tự kết luận trùng gate.</p>':
       '<p>Chưa thấy các chuyến đi cách nhau tối đa 45 phút cùng gate đã xác nhận.</p>')+
     (diff.length?table(['Chuyến','Loại thay đổi','Cũ','Mới'],diff.slice(0,30).map(x=>[x.flight,x.type,x.from,x.to])):'<p>Chưa có thay đổi xác định được từ các trường đã đối chiếu.</p>')+
     '<p><b>Nguyên tắc:</b> Booking được giữ nguyên dạng nguồn (vd. 0/10/365); tổng ba thành phần không được coi là PAX thực đi. Bãi khu 2/3 cần kiểm tra đường xe, thiết bị; không tự suy ra xe sẵn sàng tại STD.</p>'+
     '<div class="btnbar"><button type="button" class="primary" id="v218PreviewL2">XEM TRƯỚC BÁO CÁO LẦN 2 (CHƯA LƯU)</button><button class="primary" id="v217Approve" '+(isReady?'':'disabled')+'>DUYỆT VÀ LƯU LẦN 2</button>'+
     '<span id="v217State">'+(isReady?'Đã đủ điều kiện kỹ thuật; ĐH kiểm tra và xác nhận lưu.':'Có '+blockers.length+' điều kiện chặn lưu; xem chi tiết phía trên.')+'</span></div><div id="v218DraftPreview"></div></div>';
   const draft=$('v218PreviewL2');if(draft)draft.onclick=async()=>{
     if(!staged?.parsed)return;
     const panel=$('v218DraftPreview');
     try{
       draft.disabled=true;draft.textContent='ĐANG LẬP BẢN XEM TRƯỚC…';
       const base=window.SagsReportV19;
       if(!base?.renderHtml||!base?.build)throw Error('Chưa tải module báo cáo Lần 2.');
       const context=await base.source();
       const src=staged.parsed.payload;
       const input={...context,revision:2,sourcePayload:src,firstPayload:staged.baseline?.payload||null,
         sourceFile:staged.filename,rows:src.flights,arrivals:src.arrival_count,departures:src.departure_count,
         domestic:src.domestic_count,international:src.international_count};
       const report=base.renderHtml(base.build(input));
       if(panel){panel.innerHTML='<div class="v218-draft-warning">BẢN XEM TRƯỚC LẦN 2 · CHƯA ĐƯỢC DUYỆT / CHƯA LƯU · KHÔNG DÙNG PHÁT HÀNH</div>'+report;panel.scrollIntoView?.({behavior:'smooth',block:'start'});}
     }catch(e){if(panel)panel.innerHTML='<div class="issue">Chưa lập được bản xem trước Lần 2: '+esc(e.message)+'</div>';}
     finally{draft.disabled=false;draft.textContent='XEM TRƯỚC BÁO CÁO LẦN 2 (CHƯA LƯU)';}
   };
   const approve=$('v217Approve');if(approve)approve.onclick=()=>saveL2();
   notice('Đã phân tích '+stats.arrival_count+' đến / '+stats.departure_count+' đi từ '+filename+'. '+
     (isReady?'Chưa ghi dữ liệu; kiểm tra và duyệt Lần 2.':'Có thông tin cần sửa hoặc xác nhận, chưa được phép lưu.'));
   return isReady;
 }
 async function saveL2(){
   if(!staged||busy)return;
   if(!canEdit(['DH','ADMIN']))return alert('Chỉ ĐH/ADMIN được phát hành Lần 2.');
   const {parsed,hash,filename,baseline}=staged;
   const blockers=core.validateForSave(parsed,baseline);
   if(blockers.length)return alert('Chưa đủ điều kiện lưu Lần 2:\n- '+blockers.slice(0,8).join('\n- '));
   if($('day')?.value!==parsed.meta.service_date)return alert('Ngày đang chọn khác ngày của file; vui lòng đọc lại Excel.');
   if(!confirm('Xác nhận lưu LẦN 2 cho '+parsed.meta.service_date+'? Bản Lần 1 được giữ nguyên; lịch hiện hành sẽ nhận dữ liệu mới đã đối chiếu.'))return;
   const b=$('v217Approve'),state=$('v217State');busy=true;if(b)b.disabled=true;
   try{
     if(state)state.textContent='Đang lưu Lần 2…';
     const p=parsed.payload;
     const {data,error}=await sb.rpc('ops_import_sags_schedule',{
       p_date:parsed.meta.service_date,p_revision:2,p_filename:filename,
       p_sheet:'ARRIVAL+DEPARTURE',p_hash:hash,p_payload:p
     });
     if(error){
       const errors={
         SECOND_FORECAST_NEEDS_STANDS:'Lần 2 chưa có vị trí đỗ; kiểm tra cột ParkingBay.',
         SECOND_FORECAST_NEEDS_FIRST_FORECAST:'Chưa có lịch bay Lần 1 được lưu cùng ngày.',
         INVALID_FLIGHT_ROW:'Có chuyến ghi sai giờ, số hiệu hoặc thứ tự STA/STD. Kiểm tra các chuyến đi qua ngày (+1).',
         COUNT_MISMATCH:'Số chuyến đến/đi không khớp tổng chuyến đã ghép.',
         DUPLICATE_FLIGHT:'Có số hiệu chuyến bay trùng trong lịch.',
         NOT_AUTHORIZED:'Tài khoản này không có quyền nhập lịch; chỉ ĐH/ADMIN được thực hiện.',
         ALREADY_IMPORTED:'File này đã có trong lịch sử nhập.'
       };
       throw Error(errors[error.message]||error.message);
     }
     const saved=await sb.from('ops_forecast_snapshots').select('payload,source_filename')
       .eq('service_date',parsed.meta.service_date).eq('revision',2).maybeSingle();
     if(saved.error||!saved.data?.payload?.flights?.length)throw Error(
       'Máy chủ chưa xác nhận đã có bản Lần 2 để xuất báo cáo. '+(saved.error?.message||'Vui lòng kiểm tra dữ liệu đã duyệt.'));
     if(state)state.textContent='ĐÃ LƯU LẦN 2 · '+String(data?.status||'IMPORTED')+
       '. Đã xác nhận bản Lần 2 trên máy chủ; có thể xuất báo cáo.';
     if(typeof load==='function')await load();
     if(typeof renderRadar==='function')renderRadar();
     window.SagsReportV19?.preview?.();
     notice('Đã lưu nguồn Lần 2; Lần 1 vẫn được giữ làm mốc so sánh.');
   }catch(e){if(state)state.textContent='CHƯA LƯU ĐƯỢC: '+e.message;alert('Không lưu được Lần 2: '+e.message);if(b)b.disabled=false;}
   finally{busy=false}
 }
 select.addEventListener('change',async ev=>{
   if(delegated){delegated=false;return;}
   ev.stopImmediatePropagation();
   const file=select.files?.[0];if(!file)return;
   if(busy)return;
   if(file.size>12*1024*1024){notice('File Excel vượt 12 MB.',true);return;}
   busy=true;staged=null;
   try{
     await library();
     const bytes=await file.arrayBuffer(),book=window.XLSX.read(bytes,{type:'array',cellDates:false});
     const both=core.detectWorkbook(book,window.XLSX);
     if(!both){
       delegated=true;select.dispatchEvent(new Event('change',{bubbles:true}));return;
     }
     const parsed=core.parseTables(both.ARRIVAL,both.DEPARTURE);
     const now=$('day');if(now)now.value=parsed.meta.service_date;
     const q=await sb.from('ops_forecast_snapshots').select('payload,source_filename').eq('service_date',parsed.meta.service_date).eq('revision',1).maybeSingle();
     if(q.error)throw Error('Không đọc được Lần 1: '+q.error.message);
     const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
     staged={parsed,hash,filename:file.name,baseline:q.data||null};
     render(parsed,q.data,file.name);
   }catch(e){notice('Không phân tích được file Lần 2: '+e.message,true);}
   finally{busy=false}
 },true);
})();
