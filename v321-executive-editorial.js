'use strict';
/* V3.21 – executive review of D+1 SAGS/CXR reports.
 * Three verified schedules used for regression: 31/10, 01/11, 02/11/2026.
 * No invented event, sufficiency judgement, equipment availability or booking.
 * Manual controls and signed unit notes always take precedence. */
(function(root){
 const FAST=new Set(['VJ','9G','VU','AK','FD']);
 const KR=new Set(['KE','OZ','BX','TW','RF','LJ','ZE','RS','7C','YP','WE']);
 const has=x=>x!=null&&String(x).trim()!=='';
 const nf=x=>Number(x).toLocaleString('vi-VN',{maximumFractionDigits:2});
 const hh=x=>x==null?'—':String(Math.floor((x%1440)/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0')+(x>=1440?' (+1)':'');
 const unique=(list,n=5)=>[...new Set(list.filter(Boolean))].slice(0,n).join(', ');
 const flight=f=>f.departure||f.arrival||'—';
 const carrier=f=>String(f.airline||f.departure||f.arrival||'').toUpperCase().match(/^[A-Z0-9]{2}/)?.[0]||'';
 const duration=f=>Number.isFinite(f.sta_min)&&Number.isFinite(f.std_min)?
   (f.std_min<f.sta_min?f.std_min+1440-f.sta_min:f.std_min-f.sta_min):null;
 const nearTurn=f=>{
   if(!f.arrival||!f.departure)return false;
   const cr=carrier(f),norm=FAST.has(cr)?30:KR.has(cr)?60:null,d=duration(f);
   return norm!=null&&d!=null&&d>0&&d<=norm+5;
 };
 const zone=x=>{
   const n=Number(x);
   if(x==null||x==='')return null;
   return [31,32,33,34,35,36,37,51,52,53,54,55].includes(n)?'K1':
     n>=38&&n<=42?'K2':n>=56&&n<=71?'K3':null;
 };
 function refine(c,topics,ctx={}){
   if(!c||!Array.isArray(topics)||topics.length<10)return topics;
   const rs=c.rows||[],source=c.sourcePayload?.source_detail||{},deps=source.departures||[],
     revision=c.revision===2,prev=c.firstPayload||{},
     sections={K1:[],K2:[],K3:[]},missing=[];
   for(const f of rs){const a=zone(f.bay);if(a)sections[a].push(f);else missing.push(f);}
   const risky=[...sections.K2,...sections.K3],full=rs.length;
   const peak=(ctx.peaks||[]).slice().sort((a,b)=>b.items.length-a.items.length||a.minute-b.minute)[0];
   const near=rs.filter(nearTurn).sort((a,b)=>duration(a)-duration(b));
   const wide=rs.filter(x=>/A\s?330|B\s?777/i.test(x.aircraft_type||''));
   const charter=deps.filter(x=>x.charter||String(x.no||'').startsWith('##'));
   const ferry=deps.filter(x=>x.ferry);
   const saved=(c.unitPlans||[]).filter(x=>x.status==='CONFIRMED');
   const dept=u=>saved.find(x=>x.unit===u)?.details||{};
   const dh=dept('DH'),pv=dept('PVHK'),kts=dept('KTS'),qa=dept('QA_IT');
   const staff=c.staff||[],roster=root.SagsStaffRosterV320;
   const roleSummary=u=>roster&&(
     dept(u).personnel_structure==='V3.20'||staff.some(x=>x.unit===u&&
       (u==='PVHK'?x.role_code==='PVHK_OFFICE':
         ['KTS_OFFICE','KTS_RAMP_TEAM','KTS_PVTT'].includes(x.role_code))));
   const staffUnit=(u,d)=>{
     const a=has(d.pvb_morning)?String(d.pvb_morning):'chưa xác nhận',
       b=has(d.pvb_night)?String(d.pvb_night):'chưa xác nhận';
     return u+': sáng '+a+', tối '+b;
   };
   const coverage=u=>{
     if(!roster)return null;
     const g=['SÁNG','ĐÊM'].map(sh=>roster.groups(staff,u,sh));
     return {count:g.map(rows=>rows.filter(x=>x.members.some(y=>y.count!=null)).length),
       expected:roster.TEAMS[u]?.length||0};
   };
   const cargoSide=root.SagsCargoBookingV320?.split(c.cargoPlans||[],rs,source)||
     {departure:c.cargoPlans||[],arrival:[],unmatched:[]};
   const kgOnly=rows=>rows.filter(x=>has(x.flight_no)&&has(x.cargo_kg)&&Number.isFinite(Number(x.cargo_kg)));
   const outbound=kgOnly(cargoSide.departure),inbound=kgOnly(cargoSide.arrival);
   const totalKg=rows=>rows.reduce((a,b)=>a+Number(b.cargo_kg),0);
   const highCargo=outbound.filter(x=>Number(x.cargo_kg)>=2500);
   const heavyOutbound=outbound.slice().sort((a,b)=>b.cargo_kg-a.cargo_kg).slice(0,4);
   const issue=(c.equipmentIssues||[]).filter(x=>x.issue_status!=='RETURNED');
   const gseNotes=has(kts.gse_risk)?String(kts.gse_risk).split(/\r?\n/)
     .map(x=>x.replace(/^\s*[-+•]\s*/,'').trim()).filter(Boolean):[];
   const hasGse=issue.length||gseNotes.length;
   const changes=revision&&Number.isInteger(prev.arrival_count)&&Number.isInteger(prev.departure_count);
   const arrivedChange=changes?c.arrivals-prev.arrival_count:0,
     departedChange=changes?c.departures-prev.departure_count:0;
   const facts=[];
   const a=(observation,action,owner)=>({observation,action,owner});
   facts[0]=a(
     'Dự kiến '+c.arrivals+' chuyến đến, '+c.departures+' chuyến đi ('+full+
       ' hồ sơ/cặp khai thác).'+
       (changes?' So với Lần 1: đến '+(arrivedChange===0?'không đổi':(arrivedChange>0?'+':'')+arrivedChange)+
         ', đi '+(departedChange===0?'không đổi':(departedChange>0?'+':'')+departedChange)+' chuyến.':''),
     revision?'ĐH đối chiếu danh sách chuyến và các điều chỉnh STA/STD, vị trí đỗ, gate trên lịch Lần 2; chuyển những thay đổi liên quan đến bộ phận phục vụ trước khi triển khai.':
       'ĐH rà soát số hiệu, chặng và STA/STD theo lịch Lần 1; cập nhật thay đổi từ AOC để chuẩn bị phân bổ bãi, nhân sự và thiết bị.',
     'ĐH chủ trì; PVHK và PVSĐ phối hợp');
   facts[1]=a(
     peak&&peak.items.length>=2?'Khung '+hh(peak.minute)+'–'+hh(peak.minute+30)+
       ' dự kiến chồng lấn '+peak.items.length+' cặp phục vụ'+
       (peak.items.length?' ('+unique(peak.items.map(flight),5)+').':''):
       'Chưa hình thành khung có từ hai cặp phục vụ đồng thời theo lịch và thời lượng phục vụ quy ước.',
     peak&&peak.items.length>=2?'ĐH ưu tiên theo dõi tiến độ trong khung '+hh(peak.minute)+'–'+hh(peak.minute+30)+
       '; PVSĐ bố trí trước tổ phục vụ và GSE theo vị trí tàu; PVHK giữ lực lượng tại các công đoạn check-in, gate/boarding có giờ chồng lấn. Thiết bị chỉ điều sang chuyến khác sau khi hoàn tất phục vụ và xác nhận khả dụng.':
       'ĐH theo dõi thay đổi giờ đến/đi; PVSĐ cập nhật khả năng điều chuyển thiết bị giữa các lượt phục vụ.',
     'ĐH điều phối; PVSĐ và PVHK thực hiện');
   facts[2]=a(
     (wide.length?'Tàu thân rộng: '+unique(wide.map(x=>flight(x)+
       (x.bay!=null?' bãi '+x.bay:'')),5)+'.':'Theo lịch chưa ghi nhận lượt A330/B777.')+
       (charter.length?' Charter: '+unique(charter.map(x=>x.no),5)+'.':'')+
       (ferry.length?' Ferry: '+unique(ferry.map(x=>x.no),5)+'.':''),
     (wide.length?'PVSĐ kiểm tra cấu hình xe thang/GSE theo loại tàu, đối chiếu thiết bị khả dụng trước thời điểm phục vụ; PVHK bố trí nhân lực theo tải khách và mốc boarding được xác nhận.':
       'Phục vụ theo loại tàu và yêu cầu hãng đã có trong lịch.')+
       (charter.length?' ĐH xác nhận yêu cầu đặc thù charter với hãng và chuyển PVSĐ, Kho Hàng khi có phát sinh.':'')+
       (ferry.length?' Với ferry, ĐH xác nhận phạm vi phục vụ, không mặc định như chuyến chở khách.':''),
     'ĐH; PVSĐ; PVHK; Kho Hàng khi có liên quan');
   facts[3]=a(
     missing.length===full?
       'Lịch Lần 1 chưa có vị trí đỗ; chưa đủ căn cứ xác định chuyến chịu ảnh hưởng tại K2/K3.':
       'Vị trí đỗ: K1 '+sections.K1.length+', K2 '+sections.K2.length+', K3 '+
       sections.K3.length+' hồ sơ/cặp.'+
       (risky.length?' Các bãi có nguy cơ gián đoạn đường công vụ: '+
         unique(risky.map(x=>flight(x)+' bãi '+x.bay),5)+'.':'')+
       (missing.length?' Còn '+missing.length+' hồ sơ chưa xác định khu/bãi.':''),
     risky.length?'PVSĐ lập phương án tập kết xe thang, GSE và lực lượng trước giờ tàu bay lăn tại '+
       (sections.K2.length&&sections.K3.length?'K2/K3':sections.K2.length?'K2':'K3')+
       '; chủ động trao đổi ATC về thứ tự tàu lăn và xin phép qua đường công vụ khi cần. ĐH cập nhật các thay đổi bãi đến PVHK.':
       missing.length?'Sau khi AOC xác nhận bãi, PVSĐ hoàn thiện tuyến di chuyển GSE và nhân lực; ĐH thông báo PVHK các vị trí phục vụ liên quan.':
       'PVSĐ bố trí tuyến xe và phương tiện theo bãi đã công bố; ĐH theo dõi điều chỉnh vị trí khi có thay đổi.',
     'PVSĐ chủ trì; ĐH và PVHK phối hợp');
   const dhStaff=has(dh.pvb_morning)||has(dh.pvb_night);
   const pvCoverage=coverage('PVHK'),ktCoverage=coverage('KTS');
   const pvFact=roleSummary('PVHK')?
     'PVHK đã nhập '+(pvCoverage?.count[0]||0)+'/'+(pvCoverage?.expected||0)+' nhóm ca sáng, '+
       (pvCoverage?.count[1]||0)+'/'+(pvCoverage?.expected||0)+' nhóm ca tối':
       (has(pv.pvb_morning)||has(pv.pvb_night)?staffUnit('PVHK',pv):'PVHK chưa có xác nhận quân số theo ca');
   const ktFact=roleSummary('KTS')?
     'PVSĐ đã nhập '+(ktCoverage?.count[0]||0)+'/'+(ktCoverage?.expected||0)+' nhóm ca sáng, '+
       (ktCoverage?.count[1]||0)+'/'+(ktCoverage?.expected||0)+' nhóm ca tối':
       (has(kts.pvb_morning)||has(kts.pvb_night)?staffUnit('PVSĐ',kts):'PVSĐ chưa có xác nhận quân số theo ca');
   const peakPax=deps.filter(x=>x.booking_sum!=null&&Number.isFinite(Number(x.booking_sum))&&Number(x.booking_sum)>0&&!x.ferry)
     .sort((a,b)=>Number(b.booking_sum)-Number(a.booking_sum)).slice(0,3);
   facts[4]=a(
     (dhStaff?staffUnit('ĐH',dh):'ĐH chưa có xác nhận tổng nhân sự theo ca')+
       '. '+pvFact+'. '+ktFact+'.'+
       (peakPax.length?' Booking khách đáng chú ý: '+
         unique(peakPax.map(x=>x.no+' '+x.booking_sum+' khách'),3)+'.':''),
     'PVHK phân bổ nhân sự đội đi/đến theo lịch check-in, gate và tàu bay; PVSĐ bố trí tổ HLSĐ, HLNG, PVTT theo các cụm chuyến. ĐH phối hợp điều chỉnh phân công khi thời gian phục vụ chồng lấn; không đánh giá đủ/thiếu nhân sự chỉ từ quân số tổng.',
     'ĐH phối hợp; PVHK và PVSĐ bố trí lực lượng');
   facts[5]=a(hasGse?
     'PVSĐ báo '+(issue.length?issue.length+' thiết bị hạn chế/ngưng khai thác'+
       (gseNotes.length?'; kèm ghi chú kỹ thuật: ':'. '):'nội dung kỹ thuật: ')+
       (gseNotes.length?unique(gseNotes,3):unique(issue.map(x=>x.equipment_id+
         (x.fault?' – '+x.fault:'')),4))+'.':
     'Chưa có cập nhật hạn chế kỹ thuật cụ thể; số lượng GSE khả dụng chưa đủ căn cứ để kết luận mức đáp ứng.',
     hasGse?
       'PVSĐ xác minh tình trạng sử dụng và kế hoạch thay thế các xe được nêu; kiểm tra thiết bị khả dụng trước khi phân công cho lượt phục vụ chồng giờ hoặc quay đầu ngắn. Không coi thông tin báo sửa chữa là xác nhận đã khắc phục.':
       'PVSĐ đối chiếu danh mục GSE khả dụng với loại tàu và các mốc phục vụ đã lập; thông báo ĐH khi có hạn chế ảnh hưởng chuyến.',
     'PVSĐ chủ trì; ĐH theo dõi ảnh hưởng');
   facts[6]=a(
     outbound.length?'Hàng đi: '+outbound.length+' chuyến, '+nf(totalKg(outbound))+' kg ('+
       nf(totalKg(outbound)/1000)+' tấn). Chuyến cần ưu tiên theo booking: '+
       unique(heavyOutbound.map(x=>x.flight_no+' '+nf(x.cargo_kg)+' kg'),4)+'.':
       'Chưa có booking trọng lượng hàng đi được Kho Hàng xác nhận trong hồ sơ.'+
       (inbound.length?'':' Không đồng nghĩa xác nhận không có hàng.')+
       (inbound.length?' Hàng đến: '+inbound.length+' chuyến, '+nf(totalKg(inbound))+' kg.':''),
     outbound.length?
       'Kho Hàng xác nhận tiến độ bàn giao hàng đi cho '+unique(heavyOutbound.map(x=>x.flight_no),4)+
         '; PVSĐ chuẩn bị xe kéo và tổ bốc xếp trước thời điểm phục vụ. Với booking từ 2,5 tấn, đối chiếu phương án theo thỏa thuận hãng.':
       'Kho Hàng bổ sung booking hàng đi đã xác nhận trước khi lập phương án xếp hàng; PVSĐ không giả định khối lượng khi chưa có nguồn.'+
         (inbound.length?' Đối với hàng đến, bố trí tiếp nhận, dỡ và vận chuyển về khu vực bàn giao.':''),
     'Kho Hàng chủ trì booking; PVSĐ phục vụ tàu bay');
   // Inbound is always reported separately even if outbound exists.
   if(outbound.length&&inbound.length){
     facts[6].observation+=' Hàng đến: '+inbound.length+' chuyến, '+nf(totalKg(inbound))+' kg.';
     facts[6].action+=' Kho Hàng và PVSĐ tổ chức dỡ, vận chuyển hàng đến độc lập với khối lượng xếp hàng đi.';
   }
   if(cargoSide.unmatched.length)facts[6].observation+=' '+cargoSide.unmatched.length+
     ' booking chưa xác định đúng chiều chuyến, chưa cộng vào tổng đi/đến.';
   facts[7]=a(
     near.length?'Các cặp có ground time sát thời lượng phục vụ quy ước: '+
       unique(near.map(x=>flight(x)+' '+duration(x)+' phút'),6)+'. Rủi ro chậm STD tăng nếu ATA muộn hoặc tiến độ công đoạn kéo dài.':
       'Chưa xác định cặp quay đầu sát chuẩn 30/60 phút đối với các hãng có thời lượng phục vụ quy ước; các hãng khác theo STA–STD của lịch.',
     near.length?
       'ĐH theo dõi ETA/ATA và STD/ETD các chuyến '+unique(near.map(flight),4)+
         '; PVHK kiểm soát đóng quầy/boarding; PVSĐ theo dõi hoàn tất từng công đoạn trước khi điều chuyển GSE. Báo nguy cơ ảnh hưởng OTP khi có thay đổi thực tế.':
       'ĐH kiểm tra thay đổi ETA/ATA, STD/ETD; các đơn vị báo ngay khi tiến độ công đoạn có nguy cơ ảnh hưởng OTP.',
     'ĐH theo dõi; PVHK và PVSĐ cập nhật tiến độ');
   facts[8]=a(
     risky.length?'Có '+risky.length+' cặp tại K2/K3, cần kiểm soát nguy cơ dừng chờ xe tại các giao cắt đường công vụ khi tàu bay lăn.':
       missing.length?'Chưa có phân bãi đầy đủ để xác định cụ thể giao cắt đường công vụ; không suy đoán rủi ro theo bãi.':
       'Kế hoạch không có cặp được phân tại K2/K3; kiểm soát FOD và an toàn tiếp cận tàu theo quy trình.',
     risky.length?'PVSĐ kiểm tra FOD và phạm vi an toàn khi đưa xe qua khu vực công vụ; xe chỉ di chuyển khi được ATC cho phép. PVHK kiểm soát an toàn khách tại điểm đón/tiễn và cầu thang tàu.':
       'PVSĐ kiểm tra FOD và luồng tiếp cận tàu; PVHK kiểm soát khách tại gate và vị trí phục vụ.',
     'PVSĐ; PVHK; ĐH tiếp nhận thông tin');
   const follow=has(c.note?.previous_issue)?String(c.note.previous_issue):
     has(qa.open_capa)?'QA/IT cập nhật tồn tại: '+String(qa.open_capa):
     hasGse?'Nội dung kỹ thuật PVSĐ đang theo dõi đã được nêu tại mục GSE; kết quả khắc phục chưa được xác nhận tại hồ sơ này.':'';
   facts[9]=a(follow||'Chưa có tồn tại cụ thể được các đơn vị ghi trong mục theo dõi của hồ sơ ngày.',
     follow?'Đơn vị phụ trách xác nhận thời hạn xử lý, phương án dự phòng và tình trạng khắc phục; ĐH chỉ báo cáo kết quả hoàn tất khi có xác nhận.':
       'Các đầu mối chỉ bổ sung tồn tại có ảnh hưởng khai thác kèm mã chuyến/thiết bị và thời điểm cần xử lý.',
     'Đơn vị liên quan; ĐH theo dõi');
   for(let i=0;i<10;i++){
     const proposal=facts[i],override=(c.controls||[]).find(x=>x.topic===i+1)||{};
     const noteOverride={2:has(c.note?.special_operation_note),3:has(c.note?.aoc_note),
       6:has(c.note?.cargo_note),8:has(c.note?.weather_note),9:has(c.note?.previous_issue)};
     if(!has(override.observation)&&!noteOverride[i])topics[i].observation=proposal.observation;
     if(!has(override.action))topics[i].action=proposal.action;
     if(!has(override.owner))topics[i].owner=proposal.owner;
   }
   return topics;
 }
 root.SagsExecutiveEditorialV321={refine,_test:{nearTurn,duration,zone}};
})(typeof window!=='undefined'?window:globalThis);
