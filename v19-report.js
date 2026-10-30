'use strict';
(function(){
 const LABELS=['Lịch bay và sản lượng','Khung giờ cao điểm','Vị trí đỗ và hạ tầng','Nhân lực khai thác','GSE trọng yếu','Hành lý – hàng hóa','OTP và chất lượng','An toàn – an ninh','Kết quả xử lý tồn tại'];
 const SITE='https://sagsdieuhanh-gif.github.io/BAOCAOMANAGERONDUTY/';
 const dateVN=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';
 const txt=x=>String(x==null?'':x);
 const esc=x=>txt(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nsign=n=>n>0?'+'+n:String(n);
 const clock=n=>n==null?'—':String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0')+(n>=1440?' (+1)':'');
 const has=(x,k)=>Number.isInteger(x?.[k]);
 const known=x=>String(x||'').trim();
 const crop=(x,max)=>{const t=String(x??'').trim();if(t.length<=max)return t;return t.slice(0,max-1).replace(/\s+\S*$/,'').trimEnd()+'…';};
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
   const [s,n,cp,gi,bus,shuttleRows,unitInputs,quickReports,s2,contracts,flightCargo]=await Promise.all([
    sb.from('ops_forecast_snapshots').select('payload,source_filename').eq('service_date',day).eq('revision',1).maybeSingle(),
    sb.from('ops_report_notes').select('*').eq('service_date',day).maybeSingle(),
    sb.from('ops_warehouse_cargo_plan').select('*').eq('service_date',day),
    sb.from('ops_gse_issues').select('*').eq('service_date',day),
    sb.from('ops_shift_transport_v2').select('*').eq('service_date',day),
    sb.from('ops_shift_transport_rows').select('direction,departure_min,line_no').eq('service_date',day),
    sb.from('ops_unit_forecasts').select('*').eq('service_date',day),
    sb.from('ops_unit_quick_reports').select('unit,report_text,updated_at').eq('service_date',day),
    sb.from('ops_forecast_snapshots').select('payload,source_filename').eq('service_date',day).eq('revision',2).maybeSingle(),
    sb.from('ops_service_contracts').select('*').eq('service_date',day),
    sb.from('ops_flights').select('arrival,departure,cargo_status').eq('service_date',day)
   ]);
   if(s.error)throw Error('Không tải được nguồn Lần 1: '+s.error.message);
   if(s2.error)throw Error('Không tải được lịch bay Lần 2: '+s2.error.message);
   if(contracts.error)throw Error('Không đọc được định mức hãng do PVHK xác nhận: '+contracts.error.message);
   if(flightCargo.error)throw Error('Không đọc được tình trạng cargo phục vụ dự báo nguồn lực: '+flightCargo.error.message);
   if(n.error)throw Error('Không tải được ghi chú: '+n.error.message);
   if(cp.error)throw Error('Không tải được kế hoạch Kho Hàng: '+cp.error.message);
   if(gi.error)throw Error('Không tải được danh sách xe hỏng: '+gi.error.message);
   if(bus.error)throw Error('Không tải được xe giao ca: '+bus.error.message);
   if(shuttleRows.error)throw Error('Không tải được các dòng xe bổ sung: '+shuttleRows.error.message);
   if(unitInputs.error)throw Error('Không tải được xác nhận các phòng: '+unitInputs.error.message);
   if(quickReports.error)throw Error('Không tải được nội dung các phòng gửi nhanh: '+quickReports.error.message);
   const payload=s2.data?.payload||s.data?.payload||null,arr=payload?.flights?.length?payload.flights:flights;
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
    note:n.data||{},cargoPlans:cp.data||[],equipmentIssues:gi.data||[],transport:bus.data||[],additionalRows:shuttleRows.data||[],sourceFile:(s2.data||s.data)?.source_filename||'',revision:s2.data?2:1,sourcePayload:payload,firstPayload:s.data?.payload||null,
    prior:prevTotals,controls,unitPlans:unitInputs.data||[],quickReports:quickReports.data||[],contracts:contracts.data||[],flightCargo:flightCargo.data||[],staff,gse};
 }
 function build(c){
   const total=c.arrivals+c.departures,prev=c.prior,priorTotal=prev?.arrival_count!=null&&prev?.departure_count!=null?prev.arrival_count+prev.departure_count:null;
   const trend=(n,label)=>n>0?label+' tăng '+n+' lượt':n<0?label+' giảm '+Math.abs(n)+' lượt':label+' không đổi';
   const difference=priorTotal==null?'Chưa có số liệu xác nhận của ngày trước để so sánh.':
     'So với ngày trước: '+trend(c.arrivals-prev.arrival_count,'chuyến đến')+'; '+
     trend(c.departures-prev.departure_count,'chuyến đi')+'. Tổng '+
     (total>priorTotal?'tăng '+(total-priorTotal):total<priorTotal?'giảm '+(priorTotal-total):'không đổi')+
     ' lượt'+(priorTotal?' ('+Math.abs((total-priorTotal)/priorTotal*100).toFixed(1).replace('.',',')+'%)':'')+'.';
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
   const hasAfterMidnight=c.rows.some(f=>(f.sta_min!=null&&f.sta_min>=1440)||(f.std_min!=null&&f.std_min>=1440));
   const keyPoints=(p.length?'Khung phục vụ tập trung '+clock(p[0].minute)+'–'+clock(p[0].minute+30)+' ('+p[0].items.length+' cặp)':'Chưa xác định cao điểm')+
      (w.length?'; tàu A330/B777 '+w.slice(0,4).map(f=>f.arrival||f.departure).join(', '):'')+
      (short.length?'; '+short.length+' cặp quay đầu sát':'')+
      (priorityNight?'; ưu tiên '+nightGroups(priorityNight.items)+' tại '+clock(priorityNight.minute)+'–'+clock(priorityNight.minute+30):'')+
      (hasAfterMidnight?'; chuyến qua ngày (+1)':'')+'.';
   const nightGuidance=priorityNight?
     ' Trong cao điểm tối '+clock(priorityNight.minute)+'–'+clock(priorityNight.minute+30)+', ưu tiên '+priorityNightList+' ('+nightGroups(priorityNight.items)+').':
     '';

   const observations=[
     'Theo lịch, dự kiến phục vụ '+total+' lượt chuyến bay'+(priorTotal==null?'. Chưa có số liệu ngày trước để so sánh.':
       (total>priorTotal?', tăng '+(total-priorTotal)+' lượt so với ngày trước.':total<priorTotal?', giảm '+(priorTotal-total)+' lượt so với ngày trước.':', tương đương ngày trước.'))+
       (w.length?' Trong ngày có tàu thân rộng '+w.slice(0,4).map(x=>x.arrival||x.departure).join(', ')+'.':''),
     (p.length?'Các chuyến tập trung trong khung '+sourcePeak+'. ':'Theo lịch, chưa ghi nhận khung có nhiều chuyến phục vụ đồng thời. ')+
       (short.length?'Các chuyến quay đầu ngắn cần chú ý: '+shortF+'.':'Chưa có chuyến quay đầu ngắn cần lưu ý theo lịch hiện có.')+
       (priorityNight?' Buổi tối lưu ý nhóm chuyến '+priorityNightList+'.':''),
     c.note.aoc_note||'Vị trí đỗ và các thay đổi khai thác đang chờ thông tin cập nhật từ AOC.',
     'Quân số phục vụ bay của các phòng được tổng hợp theo ca sáng và ca đêm ở cột Phương án phục vụ.',
     activeIssues.length?'PVSĐ báo có '+activeIssues.length+' xe, thiết bị đang hạn chế sử dụng: '+issuesSummary+'.':
       'Chưa ghi nhận thiết bị hư hỏng được PVSĐ báo về; tiếp tục kiểm tra khả năng đáp ứng trước cao điểm.',
     plans.length?'Kho Hàng đã cập nhật hàng hóa của '+plans.length+' chuyến'+(kgKnown?', tổng '+cargoKg.toLocaleString('vi-VN')+' KG đã kê khai. ':'. ')+
       (cargoRush?'Hàng tập trung: '+cargoRush+'. ':'')+
       (needConfirmed?'Còn '+needConfirmed+' chuyến chờ xác nhận giờ hàng sẵn sàng.':''):
       'Kho Hàng chưa cập nhật kế hoạch hàng hóa; cần bổ sung trước các chuyến có hàng.',
     short.length?'Theo lịch, các chuyến '+shortF+' có thời gian quay đầu sát. Nếu tàu về muộn, công tác phục vụ và giờ khởi hành có thể bị ảnh hưởng.':
       'Chưa có chuyến quay đầu ngắn nổi bật theo lịch; tiếp tục theo dõi thay đổi giờ đến và giờ đi.',
     c.note.weather_note||'Chưa có thông tin thời tiết, an ninh, an toàn bất thường được các đơn vị báo về.',
     c.note.previous_issue||'Chưa ghi nhận tồn tại từ ca trước cần xử lý trong ngày.'
   ];
   const actions=[
     'Phòng ĐH theo dõi giờ đến, giờ đi và các chuyến tập trung; phối hợp PVSĐ chuẩn bị trang thiết bị, PVHK bố trí người đón, tiễn khách. Khi lịch thay đổi, điều chỉnh thứ tự phục vụ phù hợp.',
     'Phòng ĐH ưu tiên các chuyến quay đầu ngắn và các chuyến sát giờ khởi hành. PVSĐ tập trung nhân sự, thiết bị làm dứt điểm từng chuyến; làm xong chuyến trước rồi điều chuyển quân số, thiết bị cuốn chiếu sang chuyến tiếp theo. PVHK phối hợp để bảo đảm tiến độ đón, tiễn khách.'+nightGuidance,
     'Phòng ĐH cập nhật vị trí đỗ sau thông tin AOC, lưu ý các bãi xa khu vực trung tâm nếu có. PVSĐ chủ động tuyến di chuyển xe, thiết bị; PVHK bố trí lực lượng tại khu vực phục vụ phù hợp.',
     'Phòng ĐH tổng hợp quân số từng phòng theo ca sáng và ca đêm; các đơn vị chủ động sắp xếp lực lượng theo giờ cao điểm và tăng cường cho những chuyến quay đầu ngắn.',
     activeIssues.length?
       'PVSĐ rà soát các xe đang hạn chế sử dụng, bố trí thiết bị thay thế và ưu tiên chuyến có thời gian quay đầu ngắn.'+(issueAlternatives?' Phương án thay thế đã báo: '+issueAlternatives+'.':' ĐH phối hợp điều chỉnh thiết bị khi cần.'):
       'PVSĐ kiểm tra thiết bị sẵn sàng trước ca, ưu tiên xe cho các chuyến quay đầu ngắn và chủ động chuyển sang chuyến kế tiếp sau khi hoàn tất phục vụ.',
     plans.length?
       'Kho Hàng ưu tiên chuẩn bị, bàn giao hàng cho '+(heavyCargo.length?heavyCargo[0][1].map(x=>x.flight_no).join(', '):plans.slice(0,3).map(x=>x.flight_no).join(', '))+'; PVSĐ bố trí xe kéo hàng và nhân sự tiếp nhận theo tiến độ từng chuyến. ĐH phối hợp khi các chuyến dồn giờ.':
       'Kho Hàng cập nhật hàng sẵn sàng trước giờ phục vụ; PVSĐ chủ động xe kéo và người nhận hàng. ĐH phối hợp điều chỉnh khi nhiều chuyến tập trung.',
     'Phòng ĐH theo dõi giờ đáp thực tế, chủ động điều phối khi tàu về muộn. PVSĐ và PVHK ưu tiên hoàn thành công việc cho chuyến quay đầu ngắn, báo sớm khi có nguy cơ ảnh hưởng giờ đi.',
     'Phòng ĐH cập nhật các cảnh báo thời tiết, an toàn và thông báo kịp thời cho đơn vị phục vụ. PVSĐ kiểm soát an toàn xe, thiết bị; PVHK chuẩn bị phương án điều chỉnh khi cần.',
     'Các phòng tiếp tục xử lý các tồn tại đã được xác nhận từ ca trước, ưu tiên những nội dung ảnh hưởng trực tiếp đến chuyến bay; báo ĐH kết quả và khó khăn phát sinh.'
   ];
   const core=LABELS.map((label,i)=>({title:label,observation:observations[i],action:actions[i]}));
   const enhanced=window.SagsReportInsightsV211?.enrich(c,core);
   const topics=(enhanced||core).map((x,i)=>{
     const override=(c.controls||[]).find(row=>row.topic===i+1)||{};
     return {title:String(i+1).padStart(2,'0')+'. '+x.title.replace(/^\d+\.\s*/,''),owner:x.owner||'ĐH phối hợp các phòng',
       observation:crop(known(override.observation)||x.observation||'CHỜ XÁC NHẬN',490),
       action:crop(known(override.action)||x.action||'ĐH yêu cầu đơn vị liên quan xác nhận.',620)};
   });
   if(window.SagsPersonnelV212){
     const people=window.SagsPersonnelV212.summarize(c.unitPlans||[]);
     topics[3].observation=people.complete?
       'Các phòng đã xác nhận quân số phục vụ bay theo ca. Phương án bố trí cụ thể sẽ điều chỉnh theo lịch bay thực tế.':
       'Các phòng đã cập nhật hoặc đang rà soát quân số phục vụ bay cho từng ca; số liệu chưa xác nhận được ghi rõ bên cạnh.';
     topics[3].action=people.lines.join('\n');
     topics[3].owner='ĐH · PVHK · PVSĐ';
   }
   let l2Details=null,l2Changes=[];
   if(c.revision===2&&window.SagsSecondForecast&&c.sourcePayload?.source_detail){
     const api=window.SagsSecondForecast,review=api.analyze(c.sourcePayload);
     const dep=c.sourcePayload.source_detail.departures||[];
     l2Changes=api.compare(c.sourcePayload,c.firstPayload||{});
     const z2=dep.filter(x=>['KHU 2','KHU 3'].includes(api.zone(x.bay)));
     if(z2.length){
       topics[2].observation=crop('Lần 2: '+z2.length+' chuyến đi dự kiến đỗ khu vực 2–3, gồm '+
         z2.slice(0,6).map(x=>x.no+' vị trí '+x.bay).join(', ')+'. Cần lưu ý tuyến di chuyển xe và trang thiết bị.',490);
       topics[2].action=crop('Phòng ĐH cập nhật bãi đỗ và hướng di chuyển phục vụ. PVSĐ bố trí xe, thiết bị phù hợp từng khu vực; khi tàu lăn hoặc đẩy lùi, chủ động điều chỉnh thứ tự di chuyển theo hướng dẫn khu bay.',620);
     }
     if(review.high.length){
       topics[6].observation=crop('Theo booking đã có, các chuyến cần chú ý lượng khách đặt chỗ gồm '+
         review.high.slice(0,6).map(x=>x.no+' ('+x.booking+')').join(', ')+'. Booking là dữ liệu dự kiến, không phải số khách thực đi.',490);
       topics[6].action=crop('PVHK chủ động lực lượng tại quầy và cửa ra tàu theo booking; Kho Hàng và PVSĐ phối hợp vận chuyển hành lý, tăng cường theo diễn biến thực tế khi khách tập trung.',620);
     }
     if(review.ferry.length){
       topics[8].observation=crop('Lần 2 ghi nhận chuyến có ký hiệu FERRY: '+review.ferry.map(x=>x.no).join(', ')+
         '. Đối chiếu lại FlightType, SSR và nhu cầu phục vụ.',490);
       topics[8].action=crop('Phòng ĐH xác nhận tính chất chuyến với hãng/AOC; PVHK và PVSĐ bố trí lực lượng, xe và thiết bị theo yêu cầu thực tế được xác nhận, không áp dụng máy móc phương án chuyến chở khách.',620);
     }
     const pick=new Map();
     for(const d of [...review.wide,...review.high,...review.ferry,...review.night,...z2])pick.set(d.no,d);
     const notable=[...pick.values()].sort((a,b)=>a.t-b.t).slice(0,22);
     l2Details={
       rows:notable.map(d=>{
         const risks=[];
         if(/A330|B777/i.test(d.type))risks.push('Tàu thân rộng: PVSĐ kiểm tra thiết bị phù hợp; PVHK chủ động nhân sự phục vụ');
         if(d.ferry)risks.push('Có ký hiệu FERRY: xác nhận tính chất chuyến và phương án phục vụ');
         if(d.booking_sum>=300)risks.push('Booking cao: ưu tiên bố trí quầy, gate và hành lý theo thực tế');
         if(['KHU 2','KHU 3'].includes(api.zone(d.bay)))risks.push('Bãi xa: lưu ý tuyến xe, thiết bị');
         if(d.t>=1080&&['AK','FD','KE','OZ','BX','TW','RF','LJ','WE','ZE','7C'].includes(d.carrier))risks.push('Chuyến tối: chủ động chuẩn bị nhân sự, thiết bị trước giờ phục vụ');
         return {flight:d.no,clock:api.clock(d.t),type:d.type,bay:d.bay,gate:d.gate||'CHỜ XÁC NHẬN',
           booking:d.booking||'CHỜ XÁC NHẬN',checkin:d.checkin_row?'Quầy '+d.checkin_row+(d.checkin_open!=null?', mở '+api.clock(d.checkin_open):''):'Chưa có quầy Ck-in',
           boarding:d.boarding_start!=null?'Boarding '+api.clock(d.boarding_start)+(d.boarding_finish!=null?'–'+api.clock(d.boarding_finish):''):'Chưa có giờ boarding',
           nature:d.ferry?'FERRY · CẦN XÁC NHẬN':d.flight_type||'CHƯA XÁC NHẬN',
           action:risks.join('. ')+'.'};
       }),
       gateCheck:review.gateCheck.slice(0,10),source:c.sourceFile,
       bookingCount:review.booked,wideCount:review.wide.length,ferryCount:review.ferry.length
     };
   }
   if(c.note.special_operation_note)topics[0].observation+='\nĐH bổ sung: '+c.note.special_operation_note;
   const peakRows=p.map(x=>({
     slot:clock(x.minute)+' – '+clock(x.minute+30),
     flight:x.items.map(y=>(y.arrival||'—')+'/'+(y.departure||'—')).join(', '),
     risk:'Có '+x.items.length+' cặp chuyến tập trung trong cùng thời điểm'+
       (x.items.some(y=>/330|777/i.test(y.aircraft_type||''))?', gồm tàu thân rộng.':'.')+
       (x.items.some(isTightGround)?' Một số chuyến có thời gian quay đầu ngắn.':''),
     action:'Phòng ĐH theo dõi giờ đến thực tế và thống nhất thứ tự ưu tiên. PVSĐ tập trung làm dứt điểm từng chuyến rồi điều chuyển nhân sự, thiết bị sang chuyến tiếp theo; PVHK phối hợp đón, tiễn khách.'+
       (x.minute>=1080&&x.items.some(f=>['AK','FD'].includes(flightCarrier(f))||KOREAN_CARRIERS.includes(flightCarrier(f)))?
         ' Ca tối ưu tiên '+nightGroups(x.items)+' trong khung giờ này.':'')
   }));
   if(!peakRows.length)peakRows.push({slot:'Chưa xác định',flight:'Chưa có',risk:'Chưa đủ lịch giờ để xác định khung cao điểm.',action:'ĐH tiếp tục cập nhật và đối chiếu lịch bay.'});
   const coord=[
    ['Cao điểm và các chuyến quay đầu sát','PVHK, PVSĐ xác nhận quân số và phương án tăng cường; tập trung phục vụ dứt điểm từng chuyến, sau đó điều chuyển lực lượng sang chuyến kế tiếp.','ĐH · PVHK · PVSĐ','Trước giờ cao điểm; cập nhật khi lịch thay đổi'],
    ['Tàu rộng A330/B777','PVSĐ kiểm tra xe, thiết bị và nhân sự đáp ứng tàu A330/B777; PVHK chủ động người phục vụ khách và hành lý theo từng chuyến.','PVSĐ · PVHK · ĐH','Trước khi phục vụ chuyến tàu thân rộng'],
    ['Bãi đỗ, cầu ống và đường công vụ','Sau họp AOC, cập nhật bãi đỗ và thông báo sớm các vị trí cần bố trí lại tuyến xe, thiết bị.','ĐH · AOC/Cảng · PVSĐ','Sau thông tin AOC, trước giờ phục vụ'],
    ['Hành lý, cargo và tồn tại từ ca trước','Kho Hàng báo giờ hàng sẵn sàng; PVHK, PVSĐ phối hợp theo tiến độ phục vụ; QA/IT cập nhật vấn đề an toàn hoặc tồn tại cần lưu ý.','Kho · PVHK · PVSĐ · QA/IT','Trước ca và khi có thay đổi']
   ];
   const alerts=(window.SagsMissingV27?.analyze({transport:c.transport,additionalRows:c.additionalRows,staff,gse,cargoPlans:c.cargoPlans})||[]).filter(x=>x.type!=='XE GIAO CA');
   const cargo=new Map((c.flightCargo||[]).flatMap(x=>[x.arrival,x.departure].filter(Boolean).map(no=>[no,x.cargo_status])));
   const enhancedPairs=(c.rows||[]).map(x=>({...x,cargo_status:cargo.get(x.departure)||cargo.get(x.arrival)||x.cargo_status||'UNKNOWN'}));
   const operationalSource=c.sourcePayload?{...c.sourcePayload,flights:enhancedPairs}:null;
   const confirmedContracts=(c.contracts||[]).filter(x=>window.SagsL2BriefV223?.verifiedContract(x));
   const operational=window.SagsOpsForecastV219?.summarize(operationalSource,enhancedPairs,c.staff,c.gse,confirmedContracts)||null;
   const dailyBrief=window.SagsL2BriefV223?.make({c,operational,changes:l2Changes})||null;
   if(c.revision===2&&dailyBrief){
     const topicIndex={peak:1,stands:2,gate:6,checkin:3,resource:4,wide:0,cargo:5,change:8};
     for(const item of dailyBrief.entries){
       const idx=topicIndex[item.key];if(idx==null)continue;
       const ctrl=(c.controls||[]).find(x=>x.topic===idx+1)||{};
       if(!known(ctrl.observation))topics[idx].observation=crop(item.observation,490);
       if(!known(ctrl.action))topics[idx].action=crop(item.action,620);
       if(!ctrl.owner)topics[idx].owner=item.owner;
     }
   }
   return {c,alerts,summary,comparison,keyPoints,topics,peakRows,coord,quickReports:c.quickReports||[],l2Details,l2Changes,operational,dailyBrief,recommendation:c.note.executive_recommendation||'Đề nghị các phòng chủ động bố trí lực lượng, trang thiết bị theo lịch bay, đặc biệt trong giờ cao điểm và các chuyến quay đầu ngắn. Trường hợp phát sinh khó khăn vượt khả năng xử lý, Phòng ĐH tổng hợp, báo cáo Ban TGĐ để xem xét chỉ đạo.'};
 }
 function html(data){
   const fmtBay=b=>b==null?'CHỜ XÁC NHẬN':'Bãi '+b;
   const tr=(arr,th)=>'<tr>'+arr.map(x=>(th?'<th>':'<td>')+esc(x).replace(/\n/g,'<br>')+(th?'</th>':'</td>')).join('')+'</tr>';
   return '<div class="v19-report-sheet v211-compact"><div class="v216-report-brand"><img class="v216-report-logo" src="./assets/logo-sags.png" alt="Logo SAGS"><div><strong>CÔNG TY CỔ PHẦN PHỤC VỤ MẶT ĐẤT SÀI GÒN CAM RANH</strong><h2>BÁO CÁO DỰ BÁO ĐIỀU HÀNH KHAI THÁC HẰNG NGÀY</h2></div></div>'+
    '<div class="v218-revision-banner"><strong>'+(data.c.revision===2?'BÁO CÁO PHÂN TÍCH LẦN 2 · ĐÃ DUYỆT':'BẢN DỰ BÁO LẦN 1 · CHỜ NGUỒN LẦN 2')+'</strong><span>'+(data.c.revision===2?'Bãi đỗ, gate, check-in, boarding, booking và ferry được phân tích theo lịch mới, đối chiếu Lần 1.':'Sau khi ĐH duyệt và lưu lịch ARRIVAL/DEPARTURE, phân tích Lần 2 sẽ có ở đây.')+'</span></div>'+'<p>Ngày khai thác: <b>'+esc(dateVN(data.c.date))+'</b><br>Người lập báo cáo: <b>'+esc(data.c.author)+'</b></p>'+
    '<div class="v27-inline-report-warning">'+(data.alerts?.length?'<h3>THÔNG TIN CHƯA XÁC NHẬN – YÊU CẦU CÁC ĐƠN VỊ BỔ SUNG</h3><ul>'+data.alerts.map(a=>'<li><strong>'+esc(a.unit)+' – '+esc(a.type)+':</strong> '+esc(a.detail)+'</li>').join('')+'</ul>':'')+'</div><h3>I. TÓM TẮT KHAI THÁC</h3><table>'+tr(['Chỉ tiêu','Dự báo / Biến động so với ngày trước'],true)+tr(['Sản lượng',data.summary])+tr(['Biến động so với ngày hôm trước',data.comparison])+tr(['Trọng điểm',data.keyPoints])+'</table>'+
    (data.operational?'<h3>PEAK HOURS · CAO ĐIỂM LƯỢT CHUYẾN THEO TỪNG GIỜ</h3>'+
       '<p>Bốn nhóm quốc tế đến/đi, quốc nội đến/đi theo giờ STA/STD, không cộng cặp đến–đi thành một. Đỉnh giờ: '+
         esc(data.operational.hours.peak.filter(x=>x.total>0).slice(0,3).map(x=>x.label+' ('+x.total+' lượt)').join('; ')||'chưa có giờ xác định')+
         '. Tổng lượt có đủ phân loại: '+data.operational.hours.verified+
         (data.operational.hours.unverified.length?'; '+data.operational.hours.unverified.length+' lượt chưa đủ chặng/giờ để phân loại.':'.')+'</p>'+
       '<div class="r28-chart v219-hourly-chart">'+window.SagsOpsForecastV219.svg(data.operational.hours)+'</div>':'')+
    (data.dailyBrief?'<h3>PHƯƠNG ÁN PHỤC VỤ LẦN 2 · NHẬN ĐỊNH THEO TÌNH HÌNH NGÀY</h3>'+
      '<p>'+esc(data.dailyBrief.lead)+'</p>'+
      '<table>'+tr(['Nội dung cần tập trung','Đánh giá từ lịch và dữ liệu các phòng','Phương án phục vụ / Đơn vị thực hiện'],true)+
      data.dailyBrief.entries.map(x=>tr([x.title,x.observation,x.action+'\n'+x.owner])).join('')+'</table>'+
      '<p><b>Thông tin cần xác nhận thêm:</b> '+esc(data.dailyBrief.closing)+'</p>':'')+
    '<h3>II. BẢNG KIỂM SOÁT – 10 NỘI DUNG</h3><table>'+tr(['Nội dung','Nhận định / Rủi ro','Phương án phục vụ dự kiến','Đơn vị liên quan'],true)+data.topics.map(x=>tr([x.title,x.observation,x.action,x.owner])).join('')+'</table>'+
    '<h3>THÔNG TIN CÁC PHÒNG GỬI BỔ SUNG</h3>'+
    (data.quickReports?.length?'<table>'+tr(['Đơn vị gửi','Nội dung chuyển ĐH'],true)+data.quickReports.map(x=>tr([({'DH':'Phòng ĐH','KTS':'PVSĐ','PVHK':'PVHK','KHO':'Kho Hàng','QA_IT':'QA/IT'}[x.unit]||x.unit),x.report_text])).join('')+'</table>':'<p>Chưa có nội dung bổ sung từ các phòng.</p>')+
    '<h3>III. CẢNH BÁO CAO ĐIỂM (Theo khung 30 phút)</h3><table>'+tr(['Khung giờ','Các cặp chuyến','Nguy cơ','Phương án xử lý'],true)+data.peakRows.map(x=>tr([x.slot,x.flight,x.risk,x.action])).join('')+'</table>'+
    '<h3>IV. PHỐI HỢP THỰC HIỆN</h3><table>'+tr(['Nội dung phối hợp','Yêu cầu, phương án','Đơn vị','Thời hạn xác nhận'],true)+data.coord.map(x=>tr(x)).join('')+'</table>'+
    '<h3>V. KIẾN NGHỊ BAN TGĐ</h3><p>'+esc(data.recommendation)+'</p>'+
    '<p class="v19-footnote">Nguồn '+(data.c.revision===2?'Lần 2':'Lần 1')+': '+esc(data.c.sourceFile||'Lịch đã lưu; chờ xác nhận tên file')+'. Lần 1 được giữ làm mốc so sánh.</p></div>';
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
       p('CÔNG TY CỔ PHẦN PHỤC VỤ MẶT ĐẤT SÀI GÒN CAM RANH',{bold:true,center:true,color:'167398',size:18,after:90}),
       p('DỰ BÁO KHAI THÁC HẰNG NGÀY · LẦN 1',{bold:true,center:true,color:'15435F',size:28,after:140}),
       p('Ngày khai thác: '+dateVN(data.c.date),{size:22}),
       p('Người lập báo cáo: '+data.c.author,{size:22}),
       ...(data.alerts?.length?[hd('THÔNG TIN CHƯA XÁC NHẬN – YÊU CẦU BỔ SUNG'),...data.alerts.map(a=>p(a.unit+' / '+a.type+': '+a.detail,{color:'B91C1C',size:18}))]:[]),
       hd('I. TÓM TẮT KHAI THÁC'),
       t(['Chỉ tiêu','Dự báo / Biến động so với ngày trước'],[['Sản lượng',data.summary],['Biến động so với ngày hôm trước',data.comparison],['Trọng điểm',data.keyPoints]],[2350,8150]),
       hd('II. BẢNG KIỂM SOÁT'),
       t(['Nội dung','Nhận định / Rủi ro','Phương án phục vụ','Đơn vị'],data.topics.map(x=>[x.title,x.observation,x.action,x.owner]),[1900,3800,3600,1200]),
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
   try{const result=build(await source());el.innerHTML=html(result);const banner=document.getElementById('v218ReportStatus');if(banner)banner.textContent=result.c.revision===2?'LẦN 2 ĐÃ DUYỆT · BẢN PHÂN TÍCH BÃI ĐỖ / GATE / BOOKING / FERRY / SO SÁNH LẦN 1':'CHƯA CÓ LẦN 2 ĐÃ DUYỆT · Vào LỊCH BAY để nhập, phân tích và duyệt file ARRIVAL/DEPARTURE.';}catch(e){el.innerHTML='<div class="v19-callout">'+esc(e.message)+'</div>'}
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
 window.SagsReportV19={source,build,renderHtml:html,preview,exportOne,loadNotes,saveNotes,_testCreateWord:word};
})();