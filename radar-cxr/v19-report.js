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
 const KOREAN_CARRIERS=['KE','OZ','BX','TW','RF','LJ','ZE','RS','7C','YP'];
 const FAST_CARRIERS=['VJ','9G','VU','AK','FD'];
 const flightCarrier=f=>(f.airline||String(f.arrival||f.departure||'').match(/^[A-Z0-9]+?(?=\d)/)?.[0]||'').toUpperCase();
 const groundMinutes=f=>{
   if(!Number.isFinite(f.sta_min)||!Number.isFinite(f.std_min))return null;
   const duration=f.std_min<f.sta_min?f.std_min+1440-f.sta_min:f.std_min-f.sta_min;
   return duration>=0&&duration<=1440?duration:null;
 };
 const serviceBenchmark=f=>FAST_CARRIERS.includes(flightCarrier(f))?30:KOREAN_CARRIERS.includes(flightCarrier(f))?60:null;
 // Ngắn/sát: chuẩn 30/60 phút + 5 phút dự phòng; hãng khác chỉ cảnh báo khi ground-time <=35 phút.
 // Đây là tín hiệu ưu tiên kiểm tra, không phải kết luận chuyến không thể phục vụ hoặc GSE sẽ rảnh tại STD.
 const isTightGround=f=>{
   const g=groundMinutes(f),standard=serviceBenchmark(f);
   return !!(f.arrival&&f.departure&&g!=null&&g>0&&g<=(standard==null?35:standard+5));
 };
 const lowGround=rs=>rs.filter(isTightGround)
   .sort((a,b)=>groundMinutes(a)-groundMinutes(b)).slice(0,12);
 function services(f,s){
   const a=f.sta_min,b=f.std_min,carrier=flightCarrier(f);
   let n=FAST_CARRIERS.includes(carrier)?30:KOREAN_CARRIERS.includes(carrier)?60:a!=null&&b!=null?Math.max(0,b-a):0;
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
   const [s,n,cp,gi,bus,shuttleRows]=await Promise.all([
    sb.from('ops_forecast_snapshots').select('payload,source_filename').eq('service_date',day).eq('revision',1).maybeSingle(),
    sb.from('ops_report_notes').select('*').eq('service_date',day).maybeSingle(),
    sb.from('ops_warehouse_cargo_plan').select('*').eq('service_date',day),
    sb.from('ops_gse_issues').select('*').eq('service_date',day),
    sb.from('ops_shift_transport_v2').select('*').eq('service_date',day),
    sb.from('ops_shift_transport_rows').select('direction,departure_min,line_no').eq('service_date',day)
   ]);
   if(s.error)throw Error('Không tải được nguồn Lần 1: '+s.error.message);
   if(n.error)throw Error('Không tải được ghi chú: '+n.error.message);
   if(cp.error)throw Error('Không tải được kế hoạch Kho Hàng: '+cp.error.message);
   if(gi.error)throw Error('Không tải được danh sách xe hỏng: '+gi.error.message);
   if(bus.error)throw Error('Không tải được xe giao ca: '+bus.error.message);
   if(shuttleRows.error)throw Error('Không tải được các dòng xe bổ sung: '+shuttleRows.error.message);
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
    note:n.data||{},cargoPlans:cp.data||[],equipmentIssues:gi.data||[],transport:bus.data||[],additionalRows:shuttleRows.data||[],sourceFile:s.data?.source_filename||'',prior:prevTotals,controls};
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

   const plans=(c.cargoPlans||[]),activeIssues=(c.equipmentIssues||[]).filter(x=>x.issue_status!=='RETURNED');
   const cargoKg=plans.reduce((n,x)=>n+(x.cargo_kg==null?0:Number(x.cargo_kg)),0);
   const kgKnown=plans.filter(x=>x.cargo_kg!=null).length;
   const cargoSlots=new Map();
   for(const x of plans){
     const f=c.rows.find(z=>z.departure===x.flight_no||z.arrival===x.flight_no);
     if(!f)continue;
     const minute=f.departure===x.flight_no?f.std_min:f.sta_min;
     if(minute==null)continue;
     const slot=Math.floor(minute/30)*30;
     if(!cargoSlots.has(slot))cargoSlots.set(slot,[]);
     cargoSlots.get(slot).push(x);
   }
   const heavyCargo=[...cargoSlots].filter(x=>x[1].length>=2)
    .sort((a,b)=>b[1].length-a[1].length||a[0]-b[0]).slice(0,3);
   const cargoRush=heavyCargo.map(x=>clock(x[0])+'–'+clock(x[0]+30)+': '+
      x[1].map(y=>y.flight_no+(y.cargo_kg==null?'':' '+Number(y.cargo_kg).toLocaleString('vi-VN')+' KG')).join(', ')).join('; ');
   const needConfirmed=plans.filter(x=>x.ready_by_min==null).length;
   const issuesSummary=activeIssues.slice(0,5).map(x=>x.equipment_id+' ('+
     (x.issue_status==='OUT_OF_SERVICE'?'tạm dừng':x.issue_status==='REPAIR'?'đang sửa':'hạn chế')+'): '+
     x.fault+(x.impact?' – '+x.impact:'')+(x.expected_return?' – dự kiến '+x.expected_return:'')).join('; ');
   const issueAlternatives=activeIssues.filter(x=>x.workaround).slice(0,3).map(x=>x.equipment_id+': '+x.workaround).join('; ');
   const transportSummary=['DH','KTS','PVHK','KHO','QA_IT'].map(u=>{
     const label=u==='DH'?'ĐH':u==='KTS'?'PVSĐ':u==='PVHK'?'PVHK':u==='QA_IT'?'QA / IT':'KHO HÀNG';
     const part=(c.transport||[]).filter(x=>x.unit===u);
     if(!part.length)return label+': chưa xác nhận xe giao ca';
     const segments=['NHA_CXR','CXR_NHA'].map(dir=>{
       const selection=part.filter(x=>x.direction===dir).sort((a,b)=>a.departure_min-b.departure_min);
       if(!selection.length)return (dir==='NHA_CXR'?'NHA→CXR':'CXR→NHA')+': chưa có';
       const names=selection.map(x=>clock(x.departure_min)+(x.line_no>0?' [Bổ sung '+x.line_no+']':'')+' '+x.quantity+' người').join(', ');
       return (dir==='NHA_CXR'?'NHA→CXR':'CXR→NHA')+' ('+names+')';
     });
     const last=part.map(x=>x.confirmed_at).sort().at(-1);
     return label+': '+segments.join('; ')+(last?' (xác nhận '+new Date(last).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})+')':'');
   }).join('. ');
      const sourcePeak=p.length?clock(p[0].minute)+'–'+clock(p[0].minute+30)+' ('+
      p[0].items.map(z=>z.arrival||z.departure||'—').slice(0,7).join(', ')+')':'chưa xác định';
   const shortF=short.slice(0,5).map(x=>x.arrival+'/'+x.departure).join(', ');
   const nightWindows=Array.from({length:12},(_,i)=>{
     const minute=1080+i*30;
     return {minute,items:c.rows.filter(f=>services(f,minute))};
   }).filter(x=>x.items.length>=4);
   const priorityNight=nightWindows.filter(x=>x.items.some(f=>['AK','FD'].includes(flightCarrier(f))||KOREAN_CARRIERS.includes(flightCarrier(f))))
     .sort((a,b)=>b.items.length-a.items.length||a.minute-b.minute)[0];
   const priorityNightFlights=priorityNight?.items.filter(f=>['AK','FD'].includes(flightCarrier(f))||KOREAN_CARRIERS.includes(flightCarrier(f)))||[];
   const priorityNightList=priorityNightFlights.slice(0,5).map(f=>(f.arrival||'—')+'/'+(f.departure||'—')).join(', ');
   const nightGroups=items=>[
     ...(['AK','FD'].filter(airline=>items.some(f=>flightCarrier(f)===airline))),
     ...(items.some(f=>KOREAN_CARRIERS.includes(flightCarrier(f)))?['hãng Hàn Quốc']:[])
   ].join(', ');
   const nightGuidance=priorityNight?
     ' Khung tối '+clock(priorityNight.minute)+'–'+clock(priorityNight.minute+30)+' ưu tiên '+priorityNightList+' ('+nightGroups(priorityNight.items)+'); tập trung xử lý từng chuyến rồi chuyển nguồn lực khi hoàn tất.':
     '';

   const observations=[
     'Dự kiến '+total+' lượt; '+(priorTotal==null?'chưa có số liệu ngày trước':nsign(total-priorTotal)+' lượt so ngày trước')+
      '. '+(w.length?'Tàu A330/B777: '+w.slice(0,4).map(x=>x.arrival||x.departure).join(', ')+'.':'Chưa có tàu thân rộng được xác định.'),
     'Khung tập trung: '+sourcePeak+'. '+(short.length?'Cặp ground-time ngắn/sát thời lượng quy ước: '+shortF+'.':'Chưa xác định cặp ground-time ngắn theo tiêu chí dự báo.')+(priorityNight?' Cao điểm tối cần ưu tiên '+priorityNightList+' lúc '+clock(priorityNight.minute)+'–'+clock(priorityNight.minute+30)+'.':''),
     'Lần 1 chưa có bãi; '+(c.note.aoc_note||'chờ AOC xác nhận vị trí đỗ, tuyến xe công vụ và cầu ống lồng.'),
     staffInfo+' Xe giao ca: '+transportSummary+'.',
     activeIssues.length?'Có '+activeIssues.length+' xe/thiết bị bị hạn chế: '+issuesSummary+'.':
       'Chưa có thiết bị hư hỏng được PVSĐ khai báo; số xe khả dụng phải được PVSĐ xác nhận.',
     plans.length?'Kho đã có kế hoạch '+plans.length+' chuyến; '+(kgKnown?cargoKg.toLocaleString('vi-VN')+' KG của '+kgKnown+' chuyến có số KG. ':'KG chưa xác nhận. ')+
       (cargoRush?'Tập trung '+cargoRush+'.':'Chưa có ≥2 chuyến cargo cùng khung 30 phút.')+
       (needConfirmed?' '+needConfirmed+' chuyến chưa có mốc hàng sẵn sàng.':''):
       'Kho Hàng chưa nhập kế hoạch cargo theo chuyến; không thể xác định điểm nghẽn KG/giờ kéo hàng.',
     short.length?'Các cặp có ground-time ngắn/sát thời lượng phục vụ quy ước: '+shortF+'. Cần theo dõi giờ đến thực tế và mức hoàn tất công đoạn; không suy ra GSE rảnh tại STD.':
       'Chưa xác định cặp có ground-time ngắn theo tiêu chí dự báo; tiếp tục cập nhật giờ đến/đi.',
     c.note.weather_note||'Chưa có cảnh báo an ninh, an toàn hoặc thời tiết được xác minh; chờ thông tin TBĐH/AOC.',
     c.note.previous_issue||'Chưa có tồn tại ca trước được xác nhận.'
   ];
   const actions=[
     'ĐH xác định các mốc phục vụ chồng lấn theo STA/STD; PVSĐ chuẩn bị GSE phù hợp loại tàu, PVHK chuẩn bị lực lượng đón khách/boarding theo giờ; điều chỉnh thứ tự ưu tiên khi lịch thay đổi.',
     'ĐH khoanh vùng '+sourcePeak+' và chốt thứ tự ưu tiên theo STD; PVSĐ tập trung bốc xếp, lái xe và GSE hoàn thành dứt điểm từng tàu, xác nhận công đoạn xong mới điều chuyển cuốn chiếu sang chuyến kế tiếp; PVHK phối hợp đón khách, cửa ra tàu và boarding.'+nightGuidance,
     'ĐH đối chiếu vị trí sau AOC, ưu tiên theo dõi cụm bãi 38–42, 56–71 nếu có; PVSĐ tính trước tuyến điều chuyển thiết bị giữa các chuyến, tránh dồn xe vào khu vực đường công vụ có khả năng phải dừng chờ; PVHK chủ động vị trí đón/boarding.',
     'ĐH cân đối quân số PVSĐ/PVHK theo khung giờ chồng lấn; PVSĐ tổ chức nhóm bốc xếp và lái GSE phục vụ lần lượt từng chuyến, chỉ chuyển nhóm sau khi kết thúc công đoạn; PVHK ưu tiên đội đến, gate và boarding cho chuyến có giờ quay đầu sát.'+(priorityNight?' Tăng cường phối hợp ca tối cho '+nightGroups(priorityNight.items)+'.':''),
     activeIssues.length?
       'PVSĐ xác nhận xe còn khả dụng, phương tiện thay thế và GSE phù hợp tàu trước cao điểm; ĐH ưu tiên cấp cho chuyến sát giờ quay đầu, điều chuyển cuốn chiếu khi thiết bị được xác nhận có thể rời tàu.'+(issueAlternatives?' Phương án dự phòng đã khai báo: '+issueAlternatives+'.':''):
       'PVSĐ kiểm tra số xe và chủng loại GSE thực sự khả dụng trước cao điểm; ĐH ưu tiên thiết bị cho cặp quay đầu sát giờ, điều chuyển sau khi xác nhận hoàn tất công đoạn, không lấy STD làm mốc xe rảnh.',
     plans.length?
       'Kho Hàng chủ động chuẩn bị, bàn giao hàng theo thứ tự STD, ưu tiên '+(heavyCargo.length?heavyCargo[0][1].map(x=>x.flight_no).join(', '):plans.slice(0,3).map(x=>x.flight_no).join(', '))+'; PVSĐ bố trí lái xe/thiết bị nhận và kéo hàng nối tiếp, tránh tập trung nhiều chuyến cùng lúc; ĐH theo dõi mốc hàng sẵn sàng.':
       'Kho Hàng cập nhật kế hoạch hàng và giờ sẵn sàng từng chuyến; PVSĐ chuẩn bị lái xe/xe kéo để nhận hàng theo thứ tự ưu tiên; ĐH theo dõi, điều chỉnh trình tự khi các chuyến chồng lấn.',
     'ĐH theo dõi giờ đáp, tiến độ quay đầu và Door Close; PVSĐ/PVHK tập trung hoàn thành từng công đoạn chuyến có ground-time sát, báo ngay nguy cơ kéo dài để ĐH điều chỉnh trình tự phục vụ chuyến tiếp theo. Chỉ ghi nhận nguyên nhân đã xác minh.',
     'ĐH nhận thông tin thời tiết/an toàn chính thức, xác định các khung có thể ảnh hưởng và thông báo điều chỉnh; PVSĐ kiểm soát GSE, tuyến di chuyển an toàn; PVHK chủ động phương án đón/boarding khi điều kiện khai thác thay đổi.',
     'ĐH rà soát tồn tại đã xác nhận từ ca trước, ưu tiên việc ảnh hưởng trực tiếp đến chuyến cao điểm; PVSĐ/PVHK/Kho Hàng xác nhận phần việc liên quan và phương án thay thế trước khi tiếp nhận chuyến.'
   ];
   const topics=LABELS.map((label,i)=>{
     const override=c.controls.find(x=>x.topic===i+1)||{};
     return {title:String(i+1).padStart(2,'0')+'. '+label,
       observation:(known(override.observation)||observations[i]).slice(0,420),action:(known(override.action)||actions[i]).slice(0,620)};
   });
   if(c.note.special_operation_note)topics[0].observation+='\nĐH bổ sung: '+c.note.special_operation_note;
   const peakRows=p.map(x=>({
     slot:clock(x.minute)+' – '+clock(x.minute+30),
     flight:x.items.map(y=>(y.arrival||'—')+'/'+(y.departure||'—')).join(', '),
     risk:x.items.length+' cặp/chuyến đang phục vụ quy ước; kiểm tra chồng lấn '+(x.items.some(y=>/330|777/i.test(y.aircraft_type||''))?'và tàu thân rộng.':'.'),
     action:'ĐH chốt thứ tự theo STD; PVSĐ tập trung bốc xếp/GSE hoàn tất từng tàu rồi điều chuyển cuốn chiếu khi đủ điều kiện; PVHK ưu tiên đón khách, gate/boarding theo tiến độ.'+
       (x.items.some(isTightGround)?' Chú ý chuyến ground-time ngắn/sát.':'')+
       (x.minute>=1080&&x.items.some(f=>['AK','FD'].includes(flightCarrier(f))||KOREAN_CARRIERS.includes(flightCarrier(f)))?
         ' Ưu tiên '+nightGroups(x.items)+' trong khung tối.':'')
   }));
   if(!peakRows.length)peakRows.push({slot:'Chưa xác định',flight:'Chưa có',risk:'Thiếu giờ lịch bay.',action:'Kiểm tra lại Excel nguồn.'});
   const coord=[
    ['Xác nhận năng lực cao điểm, quay đầu ngắn','Rà soát nhân sự, định mức, GSE, SKYONE, phương án bổ sung.','PVHK; KTSĐ; ĐH','Trước 16:00 ngày '+dateVN(prevDate(c.date))+'; cập nhật 08:30 ngày '+dateVN(c.date)+'.'],
    ['Cập nhật quầy, kệ, bãi đỗ; hạn chế','Sau AOC kiểm tra bãi đỗ, tuyến GSE và phát hành Lần 2.','TBĐH; các đơn vị','Sau AOC; xác nhận trước 08:30 ngày '+dateVN(c.date)+'.']
   ];
   const alerts=window.SagsMissingV27?.analyze({transport:c.transport,additionalRows:c.additionalRows,staff,gse,cargoPlans:c.cargoPlans})||[];
   return {c,alerts,summary,comparison,topics,peakRows,coord,recommendation:c.note.executive_recommendation||'Chưa có kiến nghị bổ sung được nhập.'};
 }
 function html(data){
   const tr=(arr,th)=>'<tr>'+arr.map(x=>(th?'<th>':'<td>')+esc(x).replace(/\n/g,'<br>')+(th?'</th>':'</td>')).join('')+'</tr>';
   return '<div class="v19-report-sheet"><h2>DỰ BÁO KHAI THÁC HẰNG NGÀY – LẦN 1</h2>'+
    '<p>Ngày khai thác: <b>'+esc(dateVN(data.c.date))+'</b><br>Người lập báo cáo: <b>'+esc(data.c.author)+'</b></p>'+
    '<div class="v27-inline-report-warning">'+(data.alerts?.length?'<h3>THÔNG TIN CHƯA XÁC NHẬN – YÊU CẦU CÁC ĐƠN VỊ BỔ SUNG</h3><ul>'+data.alerts.map(a=>'<li><strong>'+esc(a.unit)+' – '+esc(a.type)+':</strong> '+esc(a.detail)+'</li>').join('')+'</ul>':'')+'</div><h3>I. TÓM TẮT KHAI THÁC</h3><table>'+tr(['Chỉ tiêu','Dự báo / Biến động so với ngày trước'],true)+tr(['Sản lượng',data.summary])+tr(['Biến động so với ngày hôm trước',data.comparison])+'</table>'+
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
      children:String(s??'').split('\n').map((line,i)=>new D.TextRun({text:line,font:'Aptos',color:opts.color||'233B4B',size:opts.size||20,bold:!!opts.bold,break:i?1:0}))});
   }
   function c(s,head){
     return new D.TableCell({borders:edges,shading:head?{fill:'174865'}:undefined,margin:{top:62,bottom:62,left:77,right:77},
      children:[p(s,{bold:head,size:head?19:19,center:head,color:head?'FFFFFF':'223746'})]});
   }
   function t(headers,rows,widths){
     return new D.Table({width:{size:10500,type:D.WidthType.DXA},columnWidths:widths,
      rows:[new D.TableRow({children:headers.map(x=>c(x,true))})]
       .concat(rows.map(row=>new D.TableRow({children:row.map(x=>c(x,false))})))});
   }
   const hd=s=>new D.Paragraph({shading:{fill:'E7F2F7'},spacing:{before:175,after:90},border:{bottom:{style:D.BorderStyle.SINGLE,size:9,color:'1594B5'}},children:[new D.TextRun({text:s,font:'Aptos',bold:true,size:24,color:'154660'})]});
   return new D.Document({creator:'SAGS-CXR',title:'Dự báo khai thác hằng ngày - Lần 1',
    styles:{default:{document:{run:{font:'Aptos',size:20}}}},
    sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:600,bottom:600,left:600,right:600}}},
     children:[
       p('SAGS · CẢNG HÀNG KHÔNG QUỐC TẾ CAM RANH',{bold:true,center:true,color:'167398',size:18,after:90}),
       p('DỰ BÁO KHAI THÁC HẰNG NGÀY · LẦN 1',{bold:true,center:true,color:'15435F',size:28,after:140}),
       p('Ngày khai thác: '+dateVN(data.c.date),{size:22}),
       p('Người lập báo cáo: '+data.c.author,{size:22}),
       ...(data.alerts?.length?[hd('THÔNG TIN CHƯA XÁC NHẬN – YÊU CẦU BỔ SUNG'),...data.alerts.map(a=>p(a.unit+' / '+a.type+': '+a.detail,{color:'B91C1C',size:18}))]:[]),
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
   if(!['ADMIN','DH'].includes(unit)){alert('Chỉ tài khoản ĐH/ADMIN được phát hành bản tin.');return;}
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