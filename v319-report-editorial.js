'use strict';
/* V3.19 – Evidence-led operational reporting in SAGS CXR terminology.
   Identical factual inputs produce identical prose. No random wording, no
   assumption of staffing sufficiency, cargo, boarding times or GSE release. */
(function(root){
 const CARRIER_FAST=new Set(['VJ','VU','9G','AK','FD']);
 const CARRIER_KOREAN=new Set(['KE','OZ','BX','TW','RF','LJ','ZE','RS','7C','YP','WE']);
 const clock=n=>n==null?'—':String(Math.floor((n%1440)/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')+(n>=1440?' (+1)':'');
 const list=(rows,n=5)=>[...new Set(rows.filter(Boolean))].slice(0,n).join(', ');
 const show=n=>Number(n).toLocaleString('vi-VN');
 const known=v=>v!=null&&String(v).trim()!=='';
 const carrier=f=>String(f.airline||f.departure||f.arrival||'').match(/^[A-Z0-9]{2}(?=\d)/)?.[0]||String(f.airline||'').toUpperCase();
 const ground=f=>Number.isFinite(f.sta_min)&&Number.isFinite(f.std_min)?
   (f.std_min<f.sta_min?f.std_min+1440-f.sta_min:f.std_min-f.sta_min):null;
 const tight=f=>{
   if(!f.arrival||!f.departure)return false;
   const g=ground(f),cr=carrier(f),norm=CARRIER_FAST.has(cr)?30:CARRIER_KOREAN.has(cr)?60:null;
   // Other carriers follow confirmed schedule ground-time; never invent a 30/35-minute benchmark.
   return norm!=null&&g!=null&&g>0&&g<=norm+5;
 };
 const name=f=>f.departure||f.arrival||'—';
 const area=b=>[31,32,33,34,35,36,37,51,52,53,54,55].includes(Number(b))?'K1':
   Number(b)>=38&&Number(b)<=42?'K2':Number(b)>=56&&Number(b)<=71?'K3':null;
 const record=(value,action,owner)=>({observation:value,action,owner});
 function refine(c,topics,context={}){
   if(!c||!topics||topics.length<10)return topics;
   const pairs=c.rows||[],prev=c.firstPayload||null,rev=c.revision===2,peaks=context.peaks||[],
     wide=context.wide||pairs.filter(x=>/A\s?330|B\s?777/i.test(x.aircraft_type||'')),
     turns=context.tight||pairs.filter(tight),plans=c.cargoPlans||[],issues=(c.equipmentIssues||[]).filter(x=>x.issue_status!=='RETURNED'),
     details=c.sourcePayload?.source_detail||{},deps=details.departures||[],
     booking=deps.filter(x=>Number.isFinite(Number(x.booking_sum))&&Number(x.booking_sum)>0&&!x.ferry)
       .sort((a,b)=>Number(b.booking_sum)-Number(a.booking_sum)||Number(a.t)-Number(b.t));
   const today=(c.unitPlans||[]).filter(x=>x.status==='CONFIRMED');
   const unit=u=>today.find(x=>x.unit===u)?.details||{};
   const zones={K1:[],K2:[],K3:[]};
   for(const p of pairs){const a=area(p.bay);if(a)zones[a].push(p);}
   const affected=[...zones.K2,...zones.K3],unknown=pairs.filter(x=>x.bay==null);
   const priority=peaks.slice().sort((a,b)=>b.items.length-a.items.length||a.minute-b.minute)[0];
   const cargoModel=root.SagsCargoBookingV320;
   const cargoSides=cargoModel?.split(plans,pairs,details)||{departure:plans,arrival:[],unmatched:[]};
   const cargos=cargoSides.departure.filter(x=>x.flight_no&&known(x.cargo_kg)&&Number.isFinite(Number(x.cargo_kg)));
   const inboundCargo=cargoSides.arrival.filter(x=>x.flight_no&&known(x.cargo_kg)&&Number.isFinite(Number(x.cargo_kg)));
   const topCargo=cargos.slice().sort((a,b)=>Number(b.cargo_kg)-Number(a.cargo_kg)).slice(0,4);
   const cargoHeavy=cargos.filter(x=>Number(x.cargo_kg)>=2500);
   const staffDetails=context.staffByShift||[];
   const count=shift=>staffDetails.filter(x=>x.groups.some(g=>g[shift]!=null)).length;
   const result=[];
   // Volume + revision: evidence tied to real snapshot, not previous day's assumptions.
   const delta=rev&&Number.isInteger(prev?.arrival_count)&&Number.isInteger(prev?.departure_count)?
     'So với Lần 1, lượt đến '+prev.arrival_count+' → '+c.arrivals+
     ', lượt đi '+prev.departure_count+' → '+c.departures+'.':'';
   result[0]=record(
     'Lịch '+(rev?'Lần 2 đã duyệt':'Lần 1 đã nhập')+' ghi nhận '+c.arrivals+' lượt đến, '+
       c.departures+' lượt đi, '+pairs.length+' hồ sơ/cặp khai thác.'+
       (delta?' '+delta:'')+
       (priority?' Cụm phục vụ lớn nhất tại '+clock(priority.minute)+'–'+clock(priority.minute+30)+
         ' ('+priority.items.length+' cặp).':''),
     (rev?'ĐH phát hành mốc lịch Lần 2, rà soát các thay đổi STA/STD và bãi đỗ so với Lần 1; ':
       'ĐH đối chiếu số hiệu, chặng, STA/STD và cặp đến–đi trên lịch; ')+
       'thông tin điều chỉnh phải được chuyển tới PVHK và PVSĐ trước khi bố trí quầy, vị trí phục vụ và thiết bị.',
     'ĐH chủ trì · PVHK · PVSĐ');
   // One 30-minute pairing is one workload object, not separate in/out counts.
   const focus=priority?.items||[];
   result[1]=record(priority?
     'Khung '+clock(priority.minute)+'–'+clock(priority.minute+30)+' có '+focus.length+
     ' cặp chồng lấn phục vụ: '+list(focus.map(name),7)+'.'+
     (turns.length?' Các cặp có thời gian quay đầu sát ngưỡng chuẩn: '+
       list(turns.map(x=>name(x)+' ('+ground(x)+' phút)'),5)+'.':''):
     'Các lượt phục vụ được phân bố theo STA/STD hiện có; chưa xác định cụm phục vụ tập trung từ dữ liệu thời gian.',
     priority?'ĐH phân tuyến giám sát và ưu tiên các chuyến '+list(focus.map(name),4)+
       '; PVSĐ bố trí tổ, xe thang và GSE tại bãi trước giờ tàu vào; PVHK duy trì lực lượng tại quầy check-in, gate/boarding và vị trí đón/tiễn tại tàu bay theo từng công đoạn. Chỉ luân chuyển khi hoàn tất phục vụ và đã xác nhận thiết bị khả dụng.':
       'ĐH rà soát các mốc STA/STD, PVHK kiểm tra giờ mở quầy và gate; PVSĐ điều phối thiết bị theo thứ tự tàu đến thực tế.',
     'ĐH · PVSĐ · PVHK');
   const charter=deps.filter(x=>x.charter||String(x.no||'').startsWith('##'));
   const ferry=deps.filter(x=>x.ferry&&!x.charter);
   result[2]=record(
     (wide.length?'Tàu thân rộng A330/B777: '+list(wide.map(f=>name(f)+
       (f.bay!=null?' (bãi '+f.bay+')':'')),5)+'.':'Không ghi nhận loại A330/B777 trong lịch đã nhập.')+
     (charter.length?' Charter/##: '+list(charter.map(x=>x.no),5)+'.':'')+
     (ferry.length?' Chuyến có ký hiệu ferry: '+list(ferry.map(x=>x.no),5)+'.':''),
     (wide.length?'PVSĐ chuẩn bị xe thang, phương tiện và GSE đúng cấu hình tàu; PVHK phân bổ nhân sự làm thủ tục, boarding và phục vụ khách tại tàu bay theo booking đã xác nhận. ':
       'Các đơn vị sử dụng danh mục trang thiết bị tương ứng loại tàu trên lịch. ')+
     (charter.length?'Chuyến charter tiếp tục phục vụ bình thường theo lịch, trừ khi hãng có yêu cầu được xác nhận. ':'')+
     (ferry.length?'ĐH xác nhận phạm vi dịch vụ ferry với hãng, không mặc định áp dụng định mức chuyến chở khách.':''),
     'ĐH · PVSĐ · PVHK · Kho Hàng');
   result[3]=record(
     (pairs.length?'Đã có vị trí đỗ cho '+(pairs.length-unknown.length)+'/'+pairs.length+
       ' hồ sơ/cặp: K1 '+zones.K1.length+', K2 '+zones.K2.length+', K3 '+zones.K3.length+'.':
       'Chưa có hồ sơ chuyến để phân tích khu vực bãi đỗ.')+
     (affected.length?' Các chuyến ở K2/K3: '+
       list(affected.map(x=>name(x)+' bãi '+x.bay),6)+'.':'')+
     (unknown.length?' '+unknown.length+' cặp chưa có bãi trên nguồn lịch.':''),
     affected.length?
       'PVSĐ chủ trì lập tuyến di chuyển thiết bị và lực lượng tại bãi 38–42, 56–71; chủ động liên hệ ATC nắm thứ tự tàu lăn ra/vào, thực hiện xin phép qua đường công vụ theo quy trình. Tập kết thiết bị trước giờ tàu lăn để hạn chế dừng chờ. ĐH theo dõi thay đổi bãi và thông báo PVHK.':
       'ĐH cập nhật bãi đỗ theo lịch/AOC; PVSĐ xác nhận tuyến thiết bị tiếp cận, PVHK bố trí nhân sự đón/tiễn và boarding theo bãi được phân.',
     'PVSĐ chủ trì · ĐH · PVHK');
   const dh=unit('DH'),pv=unit('PVHK'),kts=unit('KTS');
   const showShift=d=>{
     const a=known(d.pvb_morning)?d.pvb_morning:'chưa nhập';
     const b=known(d.pvb_night)?d.pvb_night:'chưa nhập';
     return 'sáng '+a+', tối '+b;
   };
   const roster=root.SagsStaffRosterV320;
   const breakdown=u=>roster&&(
     unit(u).personnel_structure==='V3.20'||(c.staff||[]).some(r=>r.unit===u&&
       (u==='PVHK'?r.role_code==='PVHK_OFFICE':
         ['KTS_OFFICE','KTS_RAMP_TEAM','KTS_HLSD_SKO','KTS_PVTT'].includes(r.role_code))));
   const teamText=(u)=>u==='PVHK'?'PVHK':'PVSĐ';
   const teamFacts=(u)=>{
     if(!roster||!breakdown(u))return teamText(u)+' ('+showShift(unit(u))+')';
     const getShift=(shift,label)=>roster.groups(c.staff||[],u,shift)
       .filter(x=>x.members.some(m=>m.count!=null))
       .map(g=>g.label+' '+roster.pretty(g)).join('; ');
     const m=getShift('SÁNG','sáng'),n=getShift('ĐÊM','tối');
     return teamText(u)+' theo tổ/đội: sáng ['+(m||'chưa xác nhận')+']; tối ['+
       (n||'chưa xác nhận')+']';
   };
   result[4]=record(
     'Quân số theo ca: Phòng ĐH ('+showShift(dh)+'); '+teamFacts('PVHK')+
       '; '+teamFacts('KTS')+'. '+
     (booking.length?'Các chuyến có booking cao: '+list(booking.slice(0,3).map(x=>x.no+' '+x.booking_sum+' khách'),3)+
       ' (booking, không phải PAX thực đi).':'Không suy diễn tải hành khách khi lịch không có booking xác nhận.'),
     'ĐH đối chiếu tổng quân số phòng và phân bổ nhiệm vụ trực; PVHK dự kiến nhân lực làm thủ tục check-in, gate/boarding và đón/tiễn tại tàu bay theo từng khung giờ có booking. PVSĐ lập tổ phục vụ từng bãi. Không đánh giá đủ/thiếu nhân sự từ tổng đầu người nếu chưa đối chiếu định mức áp dụng.',
     'ĐH · PVHK · PVSĐ');
   const confirmedGse=(c.gse||[]).filter(x=>x.confirmed_at&&x.ready_count!=null);
   result[5]=record(
     issues.length?'PVSĐ ghi nhận '+issues.length+' phương tiện/GSE đang hạn chế hoặc ngưng khai thác: '+
       list(issues.map(x=>x.equipment_id+' ('+(x.issue_status||'').toLowerCase()+')'),5)+'.'+
       (known(kts.gse_risk)?' Ghi chú đơn vị: '+kts.gse_risk:''):
       confirmedGse.length?'PVSĐ đã cập nhật số lượng khả dụng của '+confirmedGse.length+' nhóm GSE.':
         'Số lượng GSE khả dụng theo nhóm chưa được xác nhận trên nguồn cho ngày khai thác.',
     issues.length?'PVSĐ kiểm tra tình trạng kỹ thuật, xác nhận thiết bị thay thế đúng năng lực và bãi phục vụ; không phân bổ xe đang ngưng sử dụng. Ưu tiên hỗ trợ các cặp quay đầu sát, chỉ điều xe khi công đoạn trước hoàn tất.':
       'PVSĐ kiểm tra phương tiện theo danh mục khả dụng và đối chiếu yêu cầu tàu thân rộng/cao điểm; chỉ đưa thiết bị vào phương án khi đã kiểm tra tình trạng và thời gian điều chuyển.',
     'PVSĐ chủ trì · ĐH');
   const cargoSummary=(listRows,kind)=>listRows.length?
     kind+': '+listRows.length+' chuyến, '+show(listRows.reduce((v,x)=>v+Number(x.cargo_kg),0))+' kg'+
       ' ('+show(listRows.reduce((v,x)=>v+Number(x.cargo_kg),0)/1000)+' tấn). '+
       listRows.slice().sort((a,b)=>Number(b.cargo_kg)-Number(a.cargo_kg)).slice(0,6)
         .map(x=>x.flight_no+' '+show(x.cargo_kg)+' kg').join('; ')+'.':'';
   result[6]=record(
     (cargoSummary(cargos,'Hàng đi đã xác nhận')||
       'Chưa có booking KG hàng đi được Kho Hàng xác nhận.')+
     (inboundCargo.length?' '+cargoSummary(inboundCargo,'Hàng đến đã xác nhận'):'')+
     (cargoSides.unmatched.length?' '+cargoSides.unmatched.length+
       ' booking chưa đối chiếu được chiều chuyến với lịch, không cộng vào hai tổng.':''),
     (cargos.length?'Kho Hàng xác nhận thời điểm bàn giao hàng đi và bố trí vận chuyển cho '+
       list(topCargo.map(x=>x.flight_no),4)+
       '; PVSĐ chuẩn bị phương tiện, nhân sự nhận hàng trước công đoạn xếp hàng tại tàu bay.':
       'Kho Hàng kiểm tra booking hàng đi theo chuyến đã xác nhận; PVSĐ chỉ lập phương án xe kéo/xếp hàng đi khi có nguồn.')+
     (cargoHeavy.length?' Các chuyến hàng đi từ 2,5 tấn ('+list(cargoHeavy.map(x=>x.flight_no),4)+
       ') cần đối chiếu phương án theo thỏa thuận hãng.':'')+
     (cargos.length?' Booking hàng đi dưới 2,5 tấn chỉ áp dụng phương án phù hợp nếu thỏa thuận hiện hành cho phép.':'')+
     (inboundCargo.length?' Đối với hàng đến, Kho Hàng phối hợp PVSĐ tiếp nhận, dỡ và vận chuyển từ tàu bay về khu vực bàn giao theo booking xác nhận; không dùng hàng đến để đánh giá năng lực xếp hàng đi.':''),
     'Kho Hàng · PVSĐ · ĐH');
   result[7]=record(
     turns.length?'Các cặp có thời gian đỗ theo lịch sát chuẩn phục vụ: '+
       list(turns.map(f=>name(f)+' '+ground(f)+' phút'),7)+'. Nếu STA thực tế thay đổi, nguy cơ ảnh hưởng STD cần được theo dõi.':
       'Không xác định cặp quay đầu sát chuẩn phục vụ từ những STA/STD đã nhập; vẫn theo dõi thay đổi giờ thực tế.',
     turns.length?'ĐH theo dõi ETA/ATA và thay đổi STD/ETD; PVSĐ theo dõi mốc hoàn tất bốc dỡ, vệ sinh, cấp phương tiện và điều kiện giải phóng thiết bị; PVHK kiểm soát đóng quầy, gate/boarding và bàn giao khách tại tàu bay. Khi nguy cơ chậm giờ ảnh hưởng OTP, thông báo các đơn vị và hãng theo kênh khai thác.':
       'ĐH đối chiếu giờ đến thực tế với lịch; các đơn vị cập nhật tiến độ công đoạn để nhận diện sớm nguy cơ ảnh hưởng OTP.',
     'ĐH · PVSĐ · PVHK');
   const qa=unit('QA_IT');
   result[8]=record(
     known(qa.weather_fod)?'QA/IT cập nhật: '+qa.weather_fod:
       affected.length?'Kế hoạch có '+affected.length+' cặp phục vụ tại K2/K3, yêu cầu kiểm soát giao cắt đường công vụ khi tàu bay lăn.':
         'Kế hoạch phục vụ yêu cầu giám sát an toàn tiếp cận tàu và vận hành phương tiện theo quy trình hiện hành.',
     'PVSĐ thực hiện kiểm tra FOD, phân luồng xe GSE/xe thang, tuân thủ hướng dẫn ATC tại đường công vụ; PVHK kiểm soát an toàn hành khách tại cửa lên tàu và khu vực đón/tiễn. ĐH ghi nhận, truyền đạt ngay các thông tin thời tiết, an ninh/an toàn chính thức khi phát sinh.',
     'PVSĐ · PVHK · ĐH · QA/IT');
   const openNotes=[known(qa.open_capa)?'QA/IT: '+qa.open_capa:null,
     known(kts.gse_risk)?'PVSĐ: '+kts.gse_risk:null].filter(Boolean);
   result[9]=record(openNotes.length?'Nội dung đang theo dõi theo cập nhật của đơn vị: '+openNotes.join('; '):
     'Tiếp nhận các công việc tồn đọng có ảnh hưởng khai thác từ đầu mối từng phòng; không tự xác nhận đã xử lý nếu chưa có phản hồi.',
     openNotes.length?'Đơn vị phát sinh tồn tại xác nhận người phụ trách, biện pháp và thời điểm khắc phục; ĐH theo dõi mức độ ảnh hưởng tới chuyến được nêu và tổng hợp khi cần chỉ đạo.':
       'Các đơn vị ghi nhận vấn đề phát sinh bằng thông tin chuyến, bãi, thời điểm và bộ phận phụ trách; ĐH tổng hợp đúng nguồn trước khi trình lãnh đạo.',
     'Các đơn vị liên quan · ĐH theo dõi');
   result.forEach((proposal,i)=>{
     const override=(c.controls||[]).find(x=>x.topic===i+1)||{};
     const noteOverrides={
       2:known(c.note?.special_operation_note),3:known(c.note?.aoc_note),
       6:known(c.note?.cargo_note),8:known(c.note?.weather_note),9:known(c.note?.previous_issue)
     };
     if(!known(override.observation)&&!noteOverrides[i])topics[i].observation=proposal.observation;
     if(!known(override.action))topics[i].action=proposal.action;
     if(!override.owner)topics[i].owner=proposal.owner;
   });
   return topics;
 }
 root.SagsReportEditorialV319={refine,_test:{tight,ground,area}};
})(typeof window!=='undefined'?window:globalThis);
