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
   const [s,n,cp,gi,bus,shuttleRows,unitInputs,quickReports,s2,contracts,flightCargo,minimumNorms,staffToday]=await Promise.all([
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
    sb.from('ops_flights').select('arrival,departure,cargo_status').eq('service_date',day),
     sb.from('ops_minimum_service_norms').select('*'),
     sb.from('ops_staff_capacity').select('service_date,unit,role_code,shift,start_min,end_min,quantity,confirmed_at').eq('service_date',day)
   ]);
   if(s.error)throw Error('Không tải được nguồn Lần 1: '+s.error.message);
   if(s2.error)throw Error('Không tải được lịch bay Lần 2: '+s2.error.message);
   if(contracts.error)throw Error('Không đọc được định mức hãng do PVHK xác nhận: '+contracts.error.message);
   if(flightCargo.error)throw Error('Không đọc được tình trạng cargo phục vụ dự báo nguồn lực: '+flightCargo.error.message);
    if(minimumNorms.error)throw Error('Không đọc được định mức phục vụ tối thiểu: '+minimumNorms.error.message);
   if(n.error)throw Error('Không tải được ghi chú: '+n.error.message);
   if(cp.error)throw Error('Không tải được kế hoạch Kho Hàng: '+cp.error.message);
   if(gi.error)throw Error('Không tải được danh sách xe hỏng: '+gi.error.message);
   if(bus.error)throw Error('Không tải được xe giao ca: '+bus.error.message);
   if(shuttleRows.error)throw Error('Không tải được các dòng xe bổ sung: '+shuttleRows.error.message);
   if(unitInputs.error)throw Error('Không tải được xác nhận các phòng: '+unitInputs.error.message);
   if(staffToday.error)throw Error('Không tải được quân số đã nhập: '+staffToday.error.message);
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
    prior:prevTotals,controls,unitPlans:unitInputs.data||[],quickReports:quickReports.data||[],contracts:contracts.data||[],flightCargo:flightCargo.data||[],minimumNorms:minimumNorms.data||[],staff:staffToday.data||[],gse};
 }
 function build(c){
   const total=c.arrivals+c.departures,prev=c.prior,priorTotal=prev?.arrival_count!=null&&prev?.departure_count!=null?prev.arrival_count+prev.departure_count:null;
   const trend=(n,label)=>n>0?label+' tăng '+n+' lượt':n<0?label+' giảm '+Math.abs(n)+' lượt':label+' không đổi';
   const difference=priorTotal==null?'Chưa có số liệu xác nhận của ngày trước để so sánh.':
     'So với ngày trước: '+trend(c.arrivals-prev.arrival_count,'chuyến đến')+'; '+
     trend(c.departures-prev.departure_count,'chuyến đi')+'. Tổng '+
     (total>priorTotal?'tăng '+(total-priorTotal):total<priorTotal?'giảm '+(priorTotal-total):'không đổi')+
     ' lượt'+(priorTotal?' ('+Math.abs((total-priorTotal)/priorTotal*100).toFixed(1).replace('.',',')+'%)':'')+'.';
   const l1=c.firstPayload||null;
   const priorL1=c.revision===2&&Number.isInteger(l1?.arrival_count)&&Number.isInteger(l1?.departure_count);
   const l2Delta=priorL1?'Đối chiếu Lần 1 → Lần 2: đến '+l1.arrival_count+' → '+c.arrivals+
     ', đi '+l1.departure_count+' → '+c.departures+' (chênh '+
     (c.arrivals+c.departures-l1.arrival_count-l1.departure_count)+' lượt).':null;
   const summary='Đến: '+c.arrivals+' | Đi: '+c.departures+' | Quốc nội: '+(c.domestic??'CHỜ XÁC NHẬN')+
    ' lượt | Quốc tế: '+(c.international??'CHỜ XÁC NHẬN')+' lượt.';
   const previousDayComparison=priorTotal==null?'Không có dữ liệu đã xác nhận của ngày liền trước để so sánh.':
     'Ngày '+dateVN(prevDate(c.date))+': '+prev.departure_count+' đi, '+prev.arrival_count+
     ' đến ('+priorTotal+' lượt).\nNgày '+dateVN(c.date)+': '+
     c.departures+' đi, '+c.arrivals+' đến ('+total+' lượt).\n'+difference;
   // A completed L2 schedule has its own verified L1 baseline. Do not lead a
   // finalized report with an unrelated missing previous-day total.
   const comparison=priorL1?(l2Delta+(priorTotal==null?'':'\n'+previousDayComparison)):previousDayComparison;
   const w=wide(c.rows),p=peaks(c.rows),short=lowGround(c.rows);
   const staffDetails=(()=> {
     const units=[['DH','ĐH'],['PVHK','PVHK'],['KTS','PVSĐ']];
     const roles={
       COORD:'Điều phối',PVHK_DEPARTURE_TEAM:'Đội khách đi / làm thủ tục',
       PVHK_ARRIVAL_TEAM:'Đội khách đến',
       BAGGAGE:'Bốc xếp',GSE_DRIVER:'Lái xe GSE',COBUS_DRIVER:'Lái xe Cobus',
       SKYONE_BAGGAGE:'SKYONE (thuê ngoài)',TERMINAL_BAGGAGE:'Hành lý nhà ga',
       GATE:'Cửa boarding',BUSGATE:'Busgate',AIRCRAFT_BOARDING:'Phục vụ tại tàu',ARRIVAL:'Đón khách đến'
     };
     const records=(c.staff||[]).filter(x=>x.confirmed_at&&
       ['DH','PVHK','KTS'].includes(x.unit)&&['SÁNG','ĐÊM'].includes(x.shift)&&
       Number.isInteger(Number(x.quantity))&&Number(x.quantity)>=0);
     const output=[];
     for(const [unit,label] of units){
       const own=records.filter(x=>x.unit===unit),keys=[...new Set(own.map(x=>x.role_code))]
         .sort((a,b)=>Object.keys(roles).indexOf(a)===-1?1:
              Object.keys(roles).indexOf(b)===-1?-1:
              Object.keys(roles).indexOf(a)-Object.keys(roles).indexOf(b));
       for(const role_code of keys){
         const locate=shift=>own.find(x=>x.role_code===role_code&&x.shift===shift);
         output.push({unit,label,role:roles[role_code]||role_code,
           morning:locate('SÁNG')?Number(locate('SÁNG').quantity):null,
           night:locate('ĐÊM')?Number(locate('ĐÊM').quantity):null});
       }
     }
     return output;
   })();
   // One compact PVSĐ result cell, retaining four *separate* sourced counts.
   // PVSĐ total comes from the confirmed departmental snapshot, never from
   // adding PVHLNG, bốc xếp and SKYONE (those groups may overlap the total).
   const pvsdPlan=(c.unitPlans||[]).find(x=>x.unit==='KTS'&&x.status==='CONFIRMED');
   const pvsdCount=(value)=>{
     if(value==null||String(value).trim()==='')return null;
     const num=Number(value);
     return Number.isInteger(num)&&num>=0?num:null;
   };
   const pvsdByRole=role=>staffDetails.find(x=>x.unit==='KTS'&&x.role===role);
   const pvsdSummary=[
     {name:'PVSĐ',morning:pvsdCount(pvsdPlan?.details?.pvb_morning),
       night:pvsdCount(pvsdPlan?.details?.pvb_night)},
     {name:'PVHLNG',morning:pvsdByRole('Hành lý nhà ga')?.morning??null,
       night:pvsdByRole('Hành lý nhà ga')?.night??null},
     {name:'BỐC XẾP PVSĐ',morning:pvsdByRole('Bốc xếp')?.morning??null,
       night:pvsdByRole('Bốc xếp')?.night??null},
     {name:'SKYONE',morning:pvsdByRole('SKYONE (thuê ngoài)')?.morning??null,
       night:pvsdByRole('SKYONE (thuê ngoài)')?.night??null}
   ];
   // Three department rows only: one verified morning cell + one evening cell.
   // PVHK and PVSĐ groups stay separate *inside* each shift cell. Never add
   // PVSĐ subgroups to its confirmed departmental total.
   const deptRole=(unit,name)=>staffDetails.find(x=>x.unit===unit&&x.role===name);
   const staffByShift=[
     {label:'ĐH',groups:[
       {name:'Nhân sự',morning:pvsdCount((c.unitPlans||[]).find(x=>x.unit==='DH'&&x.status==='CONFIRMED')?.details?.pvb_morning),
         night:pvsdCount((c.unitPlans||[]).find(x=>x.unit==='DH'&&x.status==='CONFIRMED')?.details?.pvb_night)}
     ]},
     {label:'PVHK',groups:[
       {name:'Đội đến',morning:deptRole('PVHK','Đội khách đến')?.morning??null,
         night:deptRole('PVHK','Đội khách đến')?.night??null},
       {name:'Đội đi',morning:deptRole('PVHK','Đội khách đi / làm thủ tục')?.morning??null,
         night:deptRole('PVHK','Đội khách đi / làm thủ tục')?.night??null}
     ]},
     {label:'PVSĐ',groups:pvsdSummary}
   ];
   const roster=window.SagsStaffRosterV320;
   if(roster){
     const fill=(unit)=>{
       const sections=roster.TEAMS[unit]||[];
       const morning=roster.groups(c.staff||[],unit,'SÁNG');
       const evening=roster.groups(c.staff||[],unit,'ĐÊM');
       return sections.map((section,i)=>({
         name:section.label,formatted:true,
         morning:roster.pretty(morning[i]),night:roster.pretty(evening[i])
       }));
     };
     staffByShift[1].groups=fill('PVHK');
     staffByShift[2].groups=fill('KTS');
     const legacyMorning=roster.legacy(c.staff||[],'KTS','SÁNG');
     const legacyNight=roster.legacy(c.staff||[],'KTS','ĐÊM');
     if(legacyMorning!=null||legacyNight!=null)
       staffByShift[2].groups.push({
         name:'SKO chung (dữ liệu cũ, chưa phân nhóm)',morning:legacyMorning,night:legacyNight
       });
   }
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
     c.note.weather_note||'Chưa nhận được báo cáo cụ thể về thời tiết, an ninh hoặc an toàn trong nguồn cập nhật cho ngày khai thác; các thông tin mới phát sinh sẽ được tổng hợp và chuyển ngay đến đơn vị liên quan.',
     c.note.previous_issue||'Chưa ghi nhận tồn tại từ ca trước cần xử lý trong ngày.'
   ];
   const actions=[
     'Phòng ĐH theo dõi giờ đến, giờ đi và các chuyến tập trung; phối hợp PVSĐ chuẩn bị nhân lực, trang thiết bị. PVHK sắp xếp nhân sự làm thủ tục tại quầy check-in, phục vụ tại cửa ra tàu bay (gate/boarding), đón khách chuyến đến và tiễn khách chuyến đi tại tàu bay theo lịch từng chuyến. Khi lịch thay đổi, các đơn vị điều chỉnh kế hoạch phục vụ.',
     'Phòng ĐH ưu tiên các chuyến quay đầu ngắn và các chuyến sát giờ khởi hành. PVSĐ tập trung nhân sự, thiết bị làm dứt điểm từng chuyến rồi điều chuyển sau khi hoàn tất công đoạn. PVHK rà soát quân số theo giờ mở quầy check-in, giờ boarding tại gate và lượt đón, tiễn khách tại tàu bay; bố trí tăng cường khi các công đoạn chồng lấn, không điều người khỏi vị trí còn đang phục vụ.'+nightGuidance,
     'Phòng ĐH cập nhật vị trí đỗ sau thông tin AOC, lưu ý các bãi xa khu vực trung tâm nếu có. PVSĐ chủ động tuyến di chuyển xe, thiết bị; PVHK căn cứ bãi đỗ, gate và lịch bay để sắp xếp nhân sự phục vụ boarding tại cửa ra tàu bay, đón khách đến và tiễn khách đi tại tàu bay, đồng thời duy trì công tác làm thủ tục tại quầy.',
     'Phòng ĐH tổng hợp quân số từng phòng theo ca sáng và ca đêm; các đơn vị chủ động sắp xếp lực lượng theo giờ cao điểm và tăng cường cho những chuyến quay đầu ngắn.',
     activeIssues.length?
       'PVSĐ rà soát các xe đang hạn chế sử dụng, bố trí thiết bị thay thế và ưu tiên chuyến có thời gian quay đầu ngắn.'+(issueAlternatives?' Phương án thay thế đã báo: '+issueAlternatives+'.':' ĐH phối hợp điều chỉnh thiết bị khi cần.'):
       'PVSĐ kiểm tra thiết bị sẵn sàng trước ca, ưu tiên xe cho các chuyến quay đầu ngắn và chủ động chuyển sang chuyến kế tiếp sau khi hoàn tất phục vụ.',
     plans.length?
       'Kho Hàng ưu tiên chuẩn bị, bàn giao hàng cho '+(heavyCargo.length?heavyCargo[0][1].map(x=>x.flight_no).join(', '):plans.slice(0,3).map(x=>x.flight_no).join(', '))+'; PVSĐ bố trí xe kéo hàng và nhân sự tiếp nhận theo tiến độ từng chuyến. ĐH phối hợp khi các chuyến dồn giờ.':
       'Kho Hàng cập nhật hàng sẵn sàng trước giờ phục vụ; PVSĐ chủ động xe kéo và người nhận hàng. ĐH phối hợp điều chỉnh khi nhiều chuyến tập trung.',
     'Phòng ĐH theo dõi giờ đáp thực tế, chủ động điều phối khi tàu về muộn. PVSĐ ưu tiên hoàn tất công đoạn tại tàu bay; PVHK kiểm soát tiến độ làm thủ tục tại quầy, boarding ở gate và bố trí người đón, tiễn khách tại tàu bay, báo sớm khi nguy cơ ảnh hưởng giờ đi.',
     'Phòng Điều hành làm đầu mối tiếp nhận và kiểm chứng thông tin an ninh, an toàn, thời tiết và các sự việc phát sinh trong khai thác; tổng hợp mức độ ảnh hưởng, phát cảnh báo kịp thời đến các phòng/đơn vị liên quan trong toàn công ty, đồng thời theo dõi việc tiếp nhận và phối hợp xử lý. Các đơn vị chuyên môn chịu trách nhiệm triển khai biện pháp phòng ngừa, phản hồi kết quả để ĐH cập nhật tình hình chung.',
     'Các phòng tiếp tục xử lý các tồn tại đã được xác nhận từ ca trước, ưu tiên những nội dung ảnh hưởng trực tiếp đến chuyến bay; báo ĐH kết quả và khó khăn phát sinh.'
   ];
   const core=LABELS.map((label,i)=>({title:label,observation:observations[i],action:actions[i]}));
   const enhanced=window.SagsReportInsightsV211?.enrich(c,core);
   // Keep all ten sections even if the optional insights module is not loaded
   // (e.g., a stale device cache or a partial module load). Index 4 must always
   // remain "Nhân lực khai thác", and index 9 the last follow-up section.
   const prepared=enhanced||(()=>{
     const out=core.slice(),wideRows=wide(c.rows||[]);
     out.splice(2,0,{
       title:'Tàu thân rộng/chuyến đặc biệt',
       observation:wideRows.length?'Theo lịch có '+wideRows.length+
         ' cặp liên quan A330/B777: '+wideRows.map(f=>f.departure||f.arrival).join(', ')+'.':
         'Theo lịch không ghi nhận cặp A330/B777.',
       action:'PVSĐ chuẩn bị thiết bị phù hợp đăng bạ; PVHK sắp xếp người tại quầy, gate/boarding và tại tàu bay theo chuyến.',
       owner:'PVSĐ · PVHK · ĐH'
     });
     return out;
   })();
   // The user-facing report can paginate. L2 analysis must not cut a sentence
   // or erase evidence just to fit an earlier narrow table layout.
   const reportText=(value,max)=>c.revision===2?String(value??'').trim():crop(value,max);
   const topics=prepared.map((x,i)=>{
     const override=(c.controls||[]).find(row=>row.topic===i+1)||{};
     return {title:String(i+1).padStart(2,'0')+'. '+x.title.replace(/^\d+\.\s*/,''),owner:x.owner||'ĐH phối hợp các phòng',
       observation:reportText(known(override.observation)||x.observation||'CHỜ XÁC NHẬN',490),
       action:reportText(known(override.action)||x.action||'ĐH yêu cầu đơn vị liên quan xác nhận.',620)};
   });
   if(window.SagsPersonnelV212){
     const people=window.SagsPersonnelV212.summarize(c.unitPlans||[]);
     topics[4].observation=people.headcountsConfirmed?
       'ĐH, PVHK và PVSĐ đã cập nhật quân số thực tế theo từng ca; chi tiết từng vị trí được trình bày tại bảng quân số bên dưới.':
       'Bảng quân số bên dưới thể hiện số người đã xác nhận theo từng vị trí và từng ca; những ô chưa có thông tin được ghi CHỜ XÁC NHẬN.';
     topics[4].action=people.lines.map((line,i)=>i===2&&staffDetails.some(x=>x.unit==='KTS')?
       '- Phòng PVSĐ: đã xác nhận số người theo từng nhóm công việc và ca trong bảng chi tiết bên dưới. Chưa cộng thành tổng nhân sự độc lập do cần loại trừ khả năng kiêm nhiệm.':line).join('\n');
     topics[4].owner='ĐH · PVHK · KTSĐ';
   }
   let l2Details=null,l2Changes=[];
   if(c.revision===2&&window.SagsSecondForecast&&c.sourcePayload?.source_detail){
     const api=window.SagsSecondForecast,review=api.analyze(c.sourcePayload);
     const dep=c.sourcePayload.source_detail.departures||[];
     l2Changes=api.compare(c.sourcePayload,c.firstPayload||{});
     const z2=dep.filter(x=>['KHU 2','KHU 3'].includes(api.zone(x.bay)));
     if(z2.length){
       topics[2].observation=reportText('Lần 2: '+z2.length+' chuyến đi dự kiến đỗ khu vực 2–3, gồm '+
         z2.slice(0,6).map(x=>x.no+' vị trí '+x.bay).join(', ')+'. Cần lưu ý tuyến di chuyển xe và trang thiết bị.',490);
       topics[2].action=reportText('Phòng ĐH cập nhật bãi đỗ và hướng di chuyển phục vụ. PVSĐ bố trí xe, thiết bị phù hợp từng khu vực; khi tàu lăn hoặc đẩy lùi, chủ động điều chỉnh thứ tự di chuyển theo hướng dẫn khu bay.',620);
     }
     if(review.high.length){
       topics[6].observation=reportText('Theo booking đã có, các chuyến cần chú ý lượng khách đặt chỗ gồm '+
         review.high.slice(0,6).map(x=>x.no+' ('+x.booking+')').join(', ')+'. Booking là dữ liệu dự kiến, không phải số khách thực đi.',490);
       topics[6].action=reportText('PVHK dựa trên booking để bố trí nhân sự làm thủ tục tại quầy check-in, phục vụ tại cửa boarding và đón, tiễn khách tại tàu bay theo từng chuyến; Kho Hàng và PVSĐ phối hợp công đoạn hành lý, tăng cường theo tình hình khách thực tế.',620);
     }
     if(review.ferry.length){
       topics[8].observation=reportText('Lần 2 ghi nhận chuyến có ký hiệu FERRY: '+review.ferry.map(x=>x.no).join(', ')+
         '. Đối chiếu lại FlightType, SSR và nhu cầu phục vụ.',490);
       topics[8].action=reportText('Phòng ĐH xác nhận tính chất chuyến với hãng/AOC; PVHK và PVSĐ bố trí lực lượng, xe và thiết bị theo yêu cầu thực tế được xác nhận, không áp dụng máy móc phương án chuyến chở khách.',620);
     }
     const pick=new Map();
     for(const d of [...review.wide,...review.high,...review.ferry,...review.night,...z2])pick.set(d.no,d);
     const notable=[...pick.values()].sort((a,b)=>a.t-b.t).slice(0,22);
     l2Details={
       rows:notable.map(d=>{
         const risks=[];
         if(/A330|B777/i.test(d.type))risks.push('Tàu thân rộng: PVSĐ kiểm tra thiết bị phù hợp; PVHK rà soát người làm thủ tục tại quầy, gate/boarding và đón, tiễn tại tàu');
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
   if(c.revision===2){
     const assigned=(c.rows||[]).filter(x=>x.bay!=null);
     const zoneFor=b=>[31,32,33,34,35,36,37,51,52,53,54,55].includes(Number(b))?'K1':
       [38,39,40,41,42].includes(Number(b))?'K2':Number(b)>=56&&Number(b)<=71?'K3':'Khác';
     const group=Object.fromEntries(['K1','K2','K3','Khác'].map(z=>[z,assigned.filter(x=>zoneFor(x.bay)===z)]));
     const standOverride=(c.controls||[]).find(x=>x.topic===4)||{};
     if(!known(standOverride.observation)){
     topics[3].observation='Lịch Lần 2 đã có bãi cho '+assigned.length+'/'+c.rows.length+
       ' hồ sơ chuyến: khu vực 1 '+group.K1.length+', khu vực 2 '+group.K2.length+
       ', khu vực 3 '+group.K3.length+
       (group.Khác.length?', vị trí khác '+group.Khác.length:'')+'.'+
       (assigned.length<c.rows.length?' Còn '+(c.rows.length-assigned.length)+' hồ sơ chưa có bãi xác nhận.':'');
     if(group.K2.length||group.K3.length)topics[3].observation+=
       ' Các vị trí 38–42 và 56–71 cần chủ động thời gian di chuyển trang thiết bị khi tàu bay lăn.';
     }
     if(!known(standOverride.action))topics[3].action='PVSĐ chủ động bố trí nhân lực, xe thang và trang thiết bị tại khu vực phục vụ trước khi tàu bay lăn; liên hệ ATC nắm thứ tự tàu ra/vào bãi, xin phép đi qua đường công vụ khi cần theo quy trình. ĐH theo dõi các cụm chuyến ảnh hưởng và phối hợp điều chỉnh.';
     if(!known(c.note?.weather_note)&&!known((c.controls||[]).find(x=>x.topic===9)?.observation))
       topics[8].observation='Căn cứ lịch Lần 2, ưu tiên kiểm soát an toàn tuyến di chuyển người và phương tiện tại các khu bãi có tàu bay lăn; tiếp nhận các cảnh báo thời tiết/an ninh khi có thông tin chính thức.';
     if(!known(c.note?.previous_issue)&&!known((c.controls||[]).find(x=>x.topic===10)?.observation)){
       const ktsPlan=(c.unitPlans||[]).find(x=>x.unit==='KTS'&&x.status==='CONFIRMED');
       const risk=String(ktsPlan?.details?.gse_risk||'').trim();
       topics[9].observation=risk?'PVSĐ đã báo nội dung thiết bị cần theo dõi: '+risk:
         'ĐH theo dõi kết quả xử lý các vấn đề phát sinh trong ca trên cơ sở báo cáo của từng đơn vị.';
     }
     // The saved cargo KG is actionable without PCS/ready-by estimates. Do not
     // repeat optional missing metadata as a general unfinished report verdict.
     if((c.cargoPlans||[]).some(x=>x.cargo_kg!=null)&&!known(c.note?.cargo_note)&&
       !known((c.controls||[]).find(x=>x.topic===7)?.observation)){
       const booked=(c.cargoPlans||[]).filter(x=>x.cargo_kg!=null);
       const totalKg=booked.reduce((n,x)=>n+Number(x.cargo_kg),0);
       topics[6].observation='Kho Hàng đã cập nhật booking trọng lượng cho '+
         booked.length+' chuyến, tổng '+totalKg.toLocaleString('vi-VN')+' kg. '+
         booked.slice().sort((a,b)=>Number(b.cargo_kg)-Number(a.cargo_kg)).slice(0,5)
           .map(x=>x.flight_no+' '+Number(x.cargo_kg).toLocaleString('vi-VN')+' kg').join('; ')+'.';
     }
   }
   if(c.note.special_operation_note)topics[0].observation+='\nĐH bổ sung: '+c.note.special_operation_note;
   const peakRows=p.map(x=>({
     slot:clock(x.minute)+' – '+clock(x.minute+30),
     flight:x.items.map(y=>(y.arrival||'—')+'/'+(y.departure||'—')).join(', '),
     risk:'Có '+x.items.length+' cặp chuyến tập trung trong cùng thời điểm'+
       (x.items.some(y=>/330|777/i.test(y.aircraft_type||''))?', gồm tàu thân rộng.':'.')+
       (x.items.some(isTightGround)?' Một số chuyến có thời gian quay đầu ngắn.':''),
     action:'Phòng ĐH theo dõi giờ đến thực tế và thống nhất thứ tự ưu tiên. PVSĐ hoàn tất từng chuyến trước khi điều chuyển người, thiết bị; PVHK bố trí nhân sự tại quầy check-in, gate/boarding và điểm đón, tiễn khách tại tàu bay, tránh điều người khi công đoạn vẫn đang phục vụ.'+
       (x.minute>=1080&&x.items.some(f=>['AK','FD'].includes(flightCarrier(f))||KOREAN_CARRIERS.includes(flightCarrier(f)))?
         ' Ca tối ưu tiên '+nightGroups(x.items)+' trong khung giờ này.':'')
   }));
   if(!peakRows.length)peakRows.push({slot:'Chưa xác định',flight:'Chưa có',risk:'Chưa đủ lịch giờ để xác định khung cao điểm.',action:'ĐH tiếp tục cập nhật và đối chiếu lịch bay.'});
   const coord=[
    ['Cao điểm và các chuyến quay đầu sát','PVHK rà soát quân số thực tế ở quầy check-in, cửa boarding và đội đón, tiễn khách tại tàu bay theo khung giờ; PVSĐ xác nhận nhân lực, thiết bị tại bãi. Chỉ điều chuyển khi công đoạn đang phục vụ đã kết thúc.','ĐH · PVHK · PVSĐ','Trước giờ cao điểm; cập nhật khi lịch thay đổi'],
    ['Tàu rộng A330/B777','PVSĐ kiểm tra xe, thiết bị và nhân sự đáp ứng tàu A330/B777; PVHK dự kiến người làm thủ tục tại quầy, phục vụ gate/boarding và đón, tiễn khách tại tàu bay theo booking, giờ khai thác từng chuyến.','PVSĐ · PVHK · ĐH','Trước khi phục vụ chuyến tàu thân rộng'],
    ['Bãi đỗ, cầu ống và đường công vụ','Sau họp AOC, cập nhật bãi đỗ và thông báo sớm các vị trí cần bố trí lại tuyến xe, thiết bị.','ĐH · AOC/Cảng · PVSĐ','Sau thông tin AOC, trước giờ phục vụ'],
    ['Hành lý, cargo và tồn tại từ ca trước','Kho Hàng báo giờ hàng sẵn sàng; PVHK, PVSĐ phối hợp theo tiến độ phục vụ; QA/IT cập nhật vấn đề an toàn hoặc tồn tại cần lưu ý.','Kho · PVHK · PVSĐ · QA/IT','Trước ca và khi có thay đổi']
   ];
   const alerts=(window.SagsMissingV27?.analyze({transport:c.transport,additionalRows:c.additionalRows,staff,gse,cargoPlans:c.cargoPlans})||[]).filter(x=>x.type!=='XE GIAO CA');
   const cargo=new Map((c.flightCargo||[]).flatMap(x=>[x.arrival,x.departure].filter(Boolean).map(no=>[no,x.cargo_status])));
   // Confirmed outbound cargo bookings also prove the flight has cargo even when
   // the operational flight row has not yet been tagged with a cargo_status.
   for(const plan of c.cargoPlans||[]){
     if(plan.flight_no&&Number(plan.cargo_kg)>0)cargo.set(plan.flight_no,'CARGO');
   }
   const enhancedPairs=(c.rows||[]).map(x=>({...x,
     cargo_status:cargo.get(x.departure)==='CARGO'||cargo.get(x.arrival)==='CARGO'?'CARGO':
       cargo.get(x.departure)||cargo.get(x.arrival)||x.cargo_status||'UNKNOWN'}));
   const operationalSource=c.sourcePayload?{...c.sourcePayload,flights:enhancedPairs}:null;
   const confirmedContracts=(c.contracts||[]).filter(x=>window.SagsL2BriefV223?.verifiedContract(x));
   const operational=window.SagsOpsForecastV219?.summarize(operationalSource,enhancedPairs,c.staff,c.gse,confirmedContracts)||null;
   const dailyBrief=window.SagsL2BriefV223?.make({c,operational,changes:l2Changes})||null;
   const minimumAssessment=c.revision===2?window.SagsMinimumV231?.assess({
     pairs:enhancedPairs,sourcePayload:c.sourcePayload,profiles:c.minimumNorms,staff:c.staff
   })||null:null;

   if(c.revision===2&&dailyBrief){
     const topicIndex={peak:1,stands:3,gate:7,checkin:4,resource:5,wide:2,cargo:6,change:0};
     for(const item of dailyBrief.entries){
       const idx=topicIndex[item.key];if(idx==null)continue;
       const ctrl=(c.controls||[]).find(x=>x.topic===idx+1)||{};
       if(item.key==='checkin'){
         // Booking is a contextual PVHK workload signal, not a replacement for
         // the confirmed staffing observation or a sufficiency verdict.
         if(!known(ctrl.observation))topics[idx].observation+=
           '\nTổ chức quầy/gate: '+item.observation;
         continue;
       }
       if(item.key==='resource'){
         const kts=(c.unitPlans||[]).find(x=>x.unit==='KTS'&&x.status==='CONFIRMED');
         const note=String(kts?.details?.gse_risk||'').trim();
         if(!known(ctrl.observation)){
           topics[idx].observation=reportText(item.observation,490)+
             (note?'\nPVSĐ đã cập nhật lưu ý thiết bị: '+note:'');
         }
         if(!known(ctrl.action))topics[idx].action=reportText(item.action,620);
         continue;
       }
       if(item.key==='stands'){
         // Keep the complete verified zone distribution, then detail the risk windows.
         if(!known(ctrl.observation))topics[idx].observation+=
           '\nKhung luồng xe cần lưu ý: '+item.observation;
         if(!known(ctrl.action))topics[idx].action=item.action;
         continue;
       }
       if(!known(ctrl.observation))topics[idx].observation=reportText(item.observation,490);
       // The staffing row must always keep the exact signed-off headcounts from Personnel,
       // while the situation-specific check-in advice is printed in the L2 table above.
       if(!known(ctrl.action))topics[idx].action=reportText(item.action,620);
       if(!ctrl.owner)topics[idx].owner=item.owner;
     }
   }
   // Apply the same technical editorial rules to L1 and L2, after all legacy
   // derived notes, without overriding observations explicitly signed off by DH.
   window.SagsReportEditorialV319?.refine(c,topics,{
     peaks:p,tight:short,wide:w,changes:l2Changes,operational,staffByShift
   });
   return {c,alerts,summary,comparison,keyPoints,topics,peakRows,coord,staffDetails,pvsdSummary,staffByShift,quickReports:c.quickReports||[],l2Details,l2Changes,operational,dailyBrief,minimumAssessment,recommendation:c.note.executive_recommendation||'Đề nghị các phòng chủ động bố trí lực lượng, trang thiết bị theo lịch bay, đặc biệt trong giờ cao điểm và các chuyến quay đầu ngắn. Trường hợp phát sinh khó khăn vượt khả năng xử lý, Phòng ĐH tổng hợp, báo cáo Ban TGĐ để xem xét chỉ đạo.'};
 }

 function html(data){
   // Lần 2 giữ nguyên biểu mẫu Lần 1 và bổ sung ngay dưới mục liên quan.
   const fmtBay=b=>b==null?'CHỜ XÁC NHẬN':'Bãi '+b;
   const isL2=data.c.revision===2;
   const brief=isL2?data.dailyBrief?.entries||[]:[];
   const related={
     0:['change'],1:['peak'],2:['wide'],3:['stands'],
     4:['checkin'],5:['resource'],6:['cargo'],7:['gate'],8:[],9:[]
   };
   // The L2 build already chooses the matching facts and verified overrides.
   // Never prepend a 195-character excerpt or clip an existing sentence.
   const updateTopic=x=>x;
   const tr=(arr,th)=>'<tr>'+arr.map(x=>(th?'<th>':'<td>')+esc(x).replace(/\n/g,'<br>')+(th?'</th>':'</td>')).join('')+'</tr>';
   // Executive-facing document: one issue per aligned block, never a dense
   // four-column wall of prose. All text escaped, including manual notes.
   const readable=(raw)=>{
     const text=String(raw??'').trim();
     if(!text)return '<span class="v321-muted">Không có nội dung được xác nhận.</span>';
     const items=text.split(/(?:\r?\n+|;\s+(?=[A-ZÀ-ỸĐ0-9])|(?<=[.!?])\s+(?=[A-ZÀ-ỸĐ]))/u)
       .map(x=>x.trim()).filter(Boolean);
     return items.map(x=>'<div class="v321-content-line">'+esc(x)+'</div>').join('');
   };
   const executiveBlock=(heading,rows,kind='topic')=>
     '<section class="v321-report-block v321-'+kind+'"><h4 class="v321-block-heading">'+esc(heading)+'</h4>'+
     '<table class="v321-detail-table"><tbody>'+
       rows.filter(x=>String(x[1]??'').trim()).map(([label,content])=>
         '<tr><td class="v321-key">'+esc(label)+'</td><td class="v321-value">'+readable(content)+'</td></tr>').join('')+
     '</tbody></table></section>';
   const topicBlocks=(data.topics||[]).map((x,i)=>{
     const y=updateTopic(x,i);
     return executiveBlock(y.title||String(i+1),[
       ['Nhận định',y.observation],['Phương án tổ chức phục vụ',y.action],['Đơn vị thực hiện',y.owner]
     ]);
   }).join('');
   const peakBlocks=(data.peakRows||[]).map(x=>executiveBlock(x.slot,[
     ['Cặp chuyến',x.flight],['Nguy cơ',x.risk],['Phương án',x.action]
   ],'peak')).join('');
   const coordinationBlocks=(data.coord||[]).map(x=>executiveBlock(x[0],[
     ['Yêu cầu phối hợp',x[1]],['Đơn vị',x[2]],['Mốc xác nhận',x[3]]
   ],'coord')).join('');

   return '<div class="v19-report-sheet v211-compact v321-executive"><div class="v216-report-brand"><img class="v216-report-logo" src="./assets/logo-sags.png" alt="Logo SAGS"><div><strong>CÔNG TY CỔ PHẦN PHỤC VỤ MẶT ĐẤT SÀI GÒN CAM RANH</strong><h2>BÁO CÁO DỰ BÁO ĐIỀU HÀNH KHAI THÁC HẰNG NGÀY</h2></div></div>'+
    '<div class="v218-revision-banner"><strong>'+(data.c.revision===2?'BÁO CÁO PHÂN TÍCH LẦN 2 · ĐÃ DUYỆT':'BẢN DỰ BÁO LẦN 1 · CHỜ NGUỒN LẦN 2')+'</strong><span>'+(data.c.revision===2?'Bãi đỗ, gate, booking và các mốc khai thác được phân tích theo dữ liệu Lần 2, đối chiếu Lần 1; boarding chỉ được đánh giá khi nguồn có giờ.':'Sau khi ĐH duyệt và lưu lịch ARRIVAL/DEPARTURE, phân tích Lần 2 sẽ có ở đây.')+'</span></div>'+'<p>Ngày khai thác: <b>'+esc(dateVN(data.c.date))+'</b><br>Người lập báo cáo: <b>'+esc(data.c.author)+'</b></p>'+
    '<div class="v27-inline-report-warning">'+(data.alerts?.length?'<h3>THÔNG TIN CHƯA XÁC NHẬN – YÊU CẦU CÁC ĐƠN VỊ BỔ SUNG</h3><ul>'+data.alerts.map(a=>'<li><strong>'+esc(a.unit)+' – '+esc(a.type)+':</strong> '+esc(a.detail)+'</li>').join('')+'</ul>':'')+'</div><h3>I. TÓM TẮT KHAI THÁC</h3><table>'+tr(['Chỉ tiêu','Dự báo / Biến động so với ngày trước'],true)+tr(['Sản lượng',data.summary])+tr([(isL2?'Đối chiếu Lần 1 / Lần 2':'Biến động so với ngày hôm trước'),data.comparison])+tr(['Trọng điểm',data.keyPoints])+'</table>'+
    (data.operational?'<h3>PEAK HOURS · CAO ĐIỂM LƯỢT CHUYẾN THEO TỪNG GIỜ</h3>'+
       '<p>Bốn nhóm quốc tế đến/đi, quốc nội đến/đi theo giờ STA/STD, không cộng cặp đến–đi thành một. Đỉnh giờ: '+
         esc(data.operational.hours.peak.filter(x=>x.total>0).slice(0,3).map(x=>x.label+' ('+x.total+' lượt)').join('; ')||'chưa có giờ xác định')+
         '. Tổng lượt có đủ phân loại: '+data.operational.hours.verified+
         (data.operational.hours.unverified.length?'; '+data.operational.hours.unverified.length+' lượt chưa đủ chặng/giờ để phân loại.':'.')+'</p>'+
       '<div class="r28-chart v219-hourly-chart">'+window.SagsOpsForecastV219.svg(data.operational.hours)+'</div>':'')+
    '<h3>II. NHẬN ĐỊNH VÀ PHƯƠNG ÁN TỔ CHỨC PHỤC VỤ</h3>'+topicBlocks+
    '<h4>QUÂN SỐ THEO CA ĐÃ XÁC NHẬN – ĐH / PVHK / PVSĐ</h4>'+
    '<table class="v318-staff-by-shift"><thead><tr><th>Bộ phận</th><th>CA SÁNG</th><th>CA TỐI</th></tr></thead><tbody>'+
      (data.staffByShift||[]).map(x=>'<tr><th scope="row">'+esc(x.label)+'</th>'+
        ['morning','night'].map(shift=>'<td class="v318-staff-shift-cell">'+
          x.groups.map(g=>'<span class="v318-staff-inline v320-staff-line"><b>'+esc(g.name)+':</b> '+
            (g[shift]==null?'CHỜ XÁC NHẬN':esc(g[shift])+(g.formatted?'':' người'))+'</span>').join('')+
        '</td>').join('')+'</tr>').join('')+
      '</tbody></table>'+

    (data.quickReports?.length?'<h3>THÔNG TIN CÁC PHÒNG GỬI BỔ SUNG</h3>':'')+
    (data.quickReports?.length?'<table>'+tr(['Đơn vị gửi','Nội dung chuyển ĐH'],true)+data.quickReports.map(x=>tr([({'DH':'Phòng ĐH','KTS':'PVSĐ','PVHK':'PVHK','KHO':'Kho Hàng','QA_IT':'QA/IT'}[x.unit]||x.unit),x.report_text])).join('')+'</table>':'')+
    '<h3>III. KHUNG GIỜ CẦN ƯU TIÊN ĐIỀU PHỐI</h3>'+peakBlocks+
    '<h3>IV. PHÂN CÔNG PHỐI HỢP VÀ MỐC KIỂM SOÁT</h3>'+coordinationBlocks+
    '<h3>V. KIẾN NGHỊ BAN TGĐ</h3><p>'+esc(data.recommendation)+'</p>'+
    '</div>';
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
       p('SAGS-CXR | Phòng Điều hành',{size:17,before:150})
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