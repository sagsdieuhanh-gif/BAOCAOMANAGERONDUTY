'use strict';
/* Daily, evidence-driven L2 operational briefing. Never vary wording at random:
   variation comes solely from the verified schedule, staffing, check-in contracts,
   gate and stand assignments, cargo and GSE entered for the date. */
(function(root){
 const clock=n=>n==null?'—':String(Math.floor((n%1440)/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')+(n>=1440?' (+1)':'');
 const short=(x,n=5)=>[...new Set(x.filter(Boolean))].slice(0,n).join(', ');
 const quantity=x=>x==null||String(x).trim()===''?null:Number.isFinite(Number(x))?Number(x):null;
 const cap=(a,n=580)=>a.length>n?a.slice(0,n-1).replace(/\s+\S*$/,'')+'…':a;
 const isWide=x=>/A\s?330|B\s?777/i.test(x.aircraft_type||x.type||'');
 const carrier=x=>String(x.airline||x.carrier||x.departure||x.no||'').match(/^[A-Z0-9]{2}(?=\d)/)?.[0]||String(x.airline||x.carrier||'').toUpperCase();
 const isKorean=x=>['KE','OZ','BX','TW','RF','LJ','ZE','RS','7C','YP','WE'].includes(carrier(x));
 const activeName=p=>p.departure||p.arrival||'—';
 const byClock=(a,b)=>a.start-b.start;
 const verifiedContract=r=>!!(r&&r.confirmed_by&&r.requirement_source?.trim()&&
   Number.isInteger(r.checkin_counters)&&r.checkin_counters>=0&&
   Number.isInteger(r.staff_per_counter)&&r.staff_per_counter>0&&
   Number.isInteger(r.checkin_open_lead)&&Number.isInteger(r.checkin_close_lead)&&
   r.checkin_open_lead>r.checkin_close_lead);
 function make(input){
   const {c,operational:op,changes=[]}=input||{};
   if(!c||c.revision!==2||!op)return null;
   const all=c.rows||[],details=c.sourcePayload?.source_detail||{};
   const deps=details.departures||[],arrs=details.arrivals||[];
   const windows=op.windows||[];
   const contract=(c.contracts||[]).filter(verifiedContract);
   const agreed=new Map(contract.map(x=>[x.airline,x]));
   const lead=[],entries=[];
   const staffNames={DH:'Phòng ĐH',PVHK:'PVHK',KTS:'PVSĐ'};
   const confirmedStaff=(c.unitPlans||[]).filter(x=>staffNames[x.unit]&&x.status==='CONFIRMED'&&x.details);
   const staffing=confirmedStaff.length?confirmedStaff.map(x=>{
      const d=x.details,parts=['morning','night'].map((shift,i)=>{
        const n=quantity(d['pvb_'+shift]),need=quantity(d['pvb_'+shift+'_required']),
          status=d['pvb_'+shift+'_status'];
        if(n==null)return null;
        const delta=need!=null?' (nhu cầu '+need+', '+(n<need?'thiếu '+(need-n):'đáp ứng theo số đã đăng ký')+' người)':
          status==='LIMITED'?' (phòng báo chưa đủ)':
          status==='READY'?' (phòng báo đủ)':' (chưa có nhu cầu đối chiếu)';
        return (i?'đêm ':'sáng ')+n+' người'+delta;
      }).filter(Boolean);
      return parts.length?staffNames[x.unit]+': '+parts.join(', '):null;
   }).filter(Boolean).join('; '):'';

   const push=(key,title,observation,action,owner,weight=0)=>
     entries.push({key,title,observation:cap(observation),action:cap(action,720),owner,weight});
   const top=(op.top||[]).filter(w=>w.total>=2).slice().sort((a,b)=>b.total-a.total||a.start-b.start);
   const topW=top[0];
   const pNight=(op.windows||[]).filter(w=>w.total>=2&&w.start>=1080&&w.active.some(no=>{
     const f=all.find(x=>activeName(x)===no);return f&&(isKorean(f)||['AK','FD'].includes(carrier(f)));
   })).sort((a,b)=>b.total-a.total||a.start-b.start)[0];
   if(topW){
     const flights=short(topW.active,5);
     lead.push((topW.total>=4?'Khung cao điểm':'Khung phục vụ có nhiều cặp nhất')+' vào '+clock(topW.start)+'–'+clock(topW.start+30)+' với '+topW.total+' cặp chuyến, gồm '+flights+'.');
     const priority=pNight&&pNight.start!==topW.start?' Đến '+clock(pNight.start)+'–'+clock(pNight.start+30)+
       ' cần chú ý thêm nhóm '+short(pNight.active,4)+' (có AK/FD hoặc hãng Hàn Quốc).':'';
     const overlaps=(op.handoffs||[]).filter(x=>x.gap<0&&topW.active.includes(x.from)).slice(0,3);
     const issue=overlaps.length?' Một số chuyến chồng thời gian phục vụ như '+
       overlaps.map(x=>x.from+'/'+x.to).join(', ')+', khó dùng chung một tổ hoặc một bộ thiết bị.':
       ' Các tổ cần bám sát tiến độ thực tế trước khi điều sang lượt tiếp theo.';
     push('peak','Điều phối trong giờ cao điểm',
       'Trong khoảng '+clock(topW.start)+'–'+clock(topW.start+30)+
         ', dự kiến có '+topW.total+' cặp cùng phục vụ ('+flights+').'+issue+priority,
       'ĐH thống nhất thứ tự ưu tiên các chuyến; PVSĐ chủ động tổ và trang thiết bị tại bãi. PVHK phân bổ người theo giờ mở quầy check-in, phục vụ cửa boarding/gate và đón khách đến, tiễn khách đi tại tàu bay; không rút người khỏi vị trí còn đang phục vụ. Chỉ điều chuyển người, thiết bị sau khi công đoạn trước hoàn tất và bảo đảm thời gian tiếp cận bãi.',
       'ĐH · PVSĐ · PVHK',3);
   }
   const bays=(op.stand||[]).filter(x=>['K2','K3'].includes(x.zone));
   const standBusy=bays.map(x=>({...x,pressure:all.filter(p=>{
      const n=p.sta_min??p.std_min;
      return n!=null&&Math.floor(n/60)===x.hour&&
        (String(x.zone)==='K2'&&Number(p.bay)>=38&&Number(p.bay)<=42||
         String(x.zone)==='K3'&&Number(p.bay)>=56&&Number(p.bay)<=71);
   }).length})).sort((a,b)=>b.pressure-a.pressure||a.hour-b.hour).slice(0,3);
   const mismatch=all.filter(p=>p.stand_mismatch);
   if(standBusy.length||mismatch.length){
     const focus=standBusy.map(z=>z.zone+' lúc '+clock(z.hour*60)+'–'+clock((z.hour+1)*60)+
       ' ('+short(z.flights,4)+')').join('; ');
     const discrepancy=mismatch.length?' Ngoài ra '+short(mismatch.map(p=>activeName(p)),3)+
       ' có bãi đến/đi chưa thống nhất, cần AOC xác nhận.':'';
     push('stands','Bãi đỗ và luồng xe công vụ',
       (focus?'Các lượt qua khu bãi xa tập trung tại '+focus+'. ':'')+
       'Khu vực 2–3 có nguy cơ làm gián đoạn tuyến di chuyển thiết bị khi tàu lăn, đặc biệt nếu nhiều chuyến đến sát nhau.'+discrepancy,
       'PVSĐ chủ động trao đổi với ATC (Đài Kiểm soát không lưu) để nắm thứ tự tàu bay lăn ra/vào bãi và xin phép cho xe, phương tiện, trang thiết bị đi qua khu vực đường công vụ có kiểm soát khi cần. PVSĐ bố trí xe thang, Cobus, trang thiết bị và lực lượng đến khu vực phục vụ trước khi tàu bay lăn, hạn chế dừng chờ; ĐH theo dõi nguy cơ ảnh hưởng để phối hợp xử lý.',
       'PVSĐ (chủ trì) · ĐH (phối hợp)',3);
   }
   const collisions=(op.gate?.warnings||[]).slice().sort((a,b)=>Number(b.verified)-Number(a.verified)||a.start-b.start);
   const arrivalRisk=(op.gate?.risky||[]).filter(x=>x.eta!=null&&x.eta>x.sta);
   if(collisions.length||arrivalRisk.length){
     const verified=collisions.filter(x=>x.verified),tentative=collisions.filter(x=>!x.verified);
     const phrases=[];
     if(verified.length)phrases.push('Theo giờ boarding đã nhập, '+short(verified.map(x=>'gate '+x.gate+' ('+x.a+'/'+x.b+')'),4)+' có khoảng chồng lấn.');
     if(tentative.length)phrases.push('Riêng '+short(tentative.map(x=>'gate '+x.gate+' ('+x.a+'/'+x.b+')'),3)+
       ' mới là nguy cơ theo giờ tham chiếu, chưa phải thời điểm boarding được xác nhận.');
     if(arrivalRisk.length)phrases.push('Các chuyến '+short(arrivalRisk.map(x=>x.flight+' ETA '+clock(x.eta)+' (STA '+clock(x.sta)+')'),3)+
       ' dự kiến về muộn, có thể kéo lùi tiến độ quay đầu.');
     push('gate','Gate, boarding và thời điểm tàu đến',
       phrases.join(' '),
       'PVHK đối chiếu gate và giờ boarding từng chuyến với AOC, phân công nhân sự kiểm tra thẻ lên tàu và hướng dẫn khách tại cửa boarding; đồng thời giữ người làm thủ tục ở quầy và đội đón, tiễn khách tại tàu bay. Khi hai chuyến chồng giờ boarding, rà soát điều tiết nhân sự thực có; nếu không đáp ứng thì báo ĐH phối hợp thống nhất phương án trước giờ mở cửa.',
       'PVHK · ĐH · AOC',verified.length?4:3);
   }
   const byBooking=deps.filter(x=>!x.ferry&&Number.isFinite(x.booking_sum)&&x.booking_sum>0)
     .sort((a,b)=>b.booking_sum-a.booking_sum||a.t-b.t);
   const busyBooking=byBooking.slice(0,3);
   const cWindows=windows.filter(x=>x.checkin?.openFlights?.length).sort((a,b)=>{
     const d=(b.checkin?.shortage||0)-(a.checkin?.shortage||0);
     return d||b.checkin.openFlights.length-a.checkin.openFlights.length||a.start-b.start;
   });
   const knownCount=deps.filter(x=>!x.ferry&&agreed.has(carrier(x))).length;
   const checkIssue=cWindows.find(x=>x.checkin.shortage>0)||cWindows[0];
   if(busyBooking.length||checkIssue){
     const bookings=busyBooking.length?'Các chuyến có booking cao nhất trong lịch là '+
       busyBooking.map(x=>x.no+' ('+x.booking_sum+' khách đặt chỗ'+(x.gate?', gate '+x.gate:'')+')').join(', ')+
       '. Đây là lượng đặt chỗ, chưa phải PAX thực đi. ':'';
     let counter='';
     if(checkIssue){
       const check=checkIssue.checkin;
       counter=' Tại '+clock(checkIssue.start)+'–'+clock(checkIssue.start+30)+', các quầy dự kiến phục vụ '+
         short(check.openFlights,5)+'.';
       if(check.required!=null&&check.available!=null)counter+=' Nhu cầu theo định mức đã nhập '+check.required+
         ' người, trong khi lực lượng đội đi khai báo cho khung này là '+check.available+' người'+
         (check.shortage>0?', chênh thiếu '+check.shortage+' người.':'; chưa ghi nhận thiếu theo phép đối chiếu này.');
       else counter+=' Chưa đủ định mức hoặc phân bổ quân số theo thời điểm để kết luận thiếu/đủ ở quầy.';
     }
     const unconfirmed=deps.filter(x=>!x.ferry&&!agreed.has(carrier(x)));
     if(unconfirmed.length)counter+=' Các hãng chưa đủ định mức đã duyệt: '+short(unconfirmed.map(x=>carrier(x)),5)+'.';
     push('checkin','Booking, quầy check-in và nhân sự PVHK',
       bookings+counter,
       checkIssue?.checkin?.shortage>0?
        'PVHK rà lại số người trực quầy theo giờ mở và đóng quầy của từng chuyến; điều tiết từ công đoạn ít áp lực nếu thực tế cho phép, hoặc báo ĐH phối hợp tăng cường trước giờ mở quầy. Đồng thời giữ lực lượng làm boarding tại gate và đón khách đến tại tàu bay đang phục vụ; không điều người sang quầy chỉ dựa trên tổng quân số cả ca.':
        'PVHK phân người làm thủ tục tại các quầy check-in mở đồng thời theo giờ từng chuyến, đồng thời bố trí đội gate/boarding và người đón, tiễn khách tại tàu bay. Theo dõi lượng khách thực tế để điều tiết, nhưng không rút người khỏi công đoạn đang phục vụ. ĐH yêu cầu xác nhận định mức và phân bổ từng vị trí trước khi nhận định đủ nhân lực.',
       'PVHK · ĐH',checkIssue?.checkin?.shortage>0?5:2);
   }
   const shortages=windows.filter(w=>w.total>0&&(
     w.gse?.some(x=>x.shortage>0)||w.baggage?.shortage>0||
     w.driver?.shortage>0||w.cobusDrivers?.shortage>0||w.gateStaff?.shortage>0
   )).sort((a,b)=>{
     const aCount=a.gse.filter(x=>x.shortage>0).length+
       [a.baggage,a.driver,a.cobusDrivers,a.gateStaff].filter(x=>x.shortage>0).length;
     const bCount=b.gse.filter(x=>x.shortage>0).length+
       [b.baggage,b.driver,b.cobusDrivers,b.gateStaff].filter(x=>x.shortage>0).length;
     return bCount-aCount||b.total-a.total||a.start-b.start;
   });
   const resource=shortages[0]||windows.filter(x=>x.total>=2).sort((a,b)=>b.total-a.total||a.start-b.start)[0];
   const equipment=(c.equipmentIssues||[]).filter(x=>x.issue_status!=='RETURNED');
   if(resource||equipment.length){
     const items=[];
     if(resource){
       const needed=resource.gse.filter(x=>x.shortage>0).map(x=>x.key+' thiếu '+x.shortage);
       for(const [obj,label] of [[resource.baggage,'bốc xếp'],[resource.driver,'lái GSE'],
         [resource.cobusDrivers,'lái Cobus'],[resource.gateStaff,'nhân sự gate']])
         if(obj?.shortage>0)needed.push(label+' thiếu '+obj.shortage+' người');
       items.push('Khung '+clock(resource.start)+'–'+clock(resource.start+30)+' có '+resource.total+
         ' cặp cần phục vụ'+(needed.length?'; đối chiếu theo số liệu đã khai báo ghi nhận '+needed.join(', ')+'.':
         ', chưa ghi nhận thiếu theo các chỉ tiêu đã có số liệu; vẫn phải xác nhận thời gian quay vòng xe.'));
       if(resource.unknownCargo)items.push(resource.unknownCargo+' chuyến chưa rõ yêu cầu cargo; nhu cầu bốc xếp theo kịch bản '+resource.baggage.scenarioMin+
         '–'+resource.baggage.scenarioMax+' người, chưa đủ căn cứ kết luận.');
     }
     if(equipment.length)items.push('PVSĐ đang báo '+equipment.length+' thiết bị hạn chế, trong đó có '+
       short(equipment.map(x=>x.equipment_id),4)+'.');
     push('resource','Xe thang, Cobus và lực lượng phục vụ sân đỗ',
       items.join(' '),
       shortages.length?
         'PVSĐ kiểm tra lại xe thực sự có thể huy động, ưu tiên cấp cho các chuyến đang chồng lấn và giữ thiết bị phù hợp với bãi đỗ. Nếu thiếu theo phương án bố trí, phân lại nhóm xe/nhân sự theo từng đợt và báo ĐH phương án tăng cường; không lấy STD làm mốc xe chắc chắn được giải phóng.':
         'PVSĐ rà soát thời gian hoàn tất từng công đoạn, vị trí để xe và đường di chuyển giữa các bãi; đưa thiết bị dự phòng tới nơi có thể tiếp cận nhanh. Số xe khai báo đang sẵn sàng chưa đồng nghĩa có thể dùng ngay ở bãi khác.',
       'PVSĐ · ĐH',shortages.length?5:2);
   }
   const wide=all.filter(isWide);
   if(wide.length){
     const focus=wide.slice(0,5).map(x=>activeName(x)+' ('+x.aircraft_type+
       (x.bay!=null?', bãi '+x.bay:'')+(x.booking_sum!=null?', booking '+x.booking_sum:'')+')');
     const wideNight=wide.some(x=>(x.sta_min??x.std_min??0)>=1080);
     push('wide','Tàu thân rộng và chuyến cần chuẩn bị riêng',
       'Lịch Lần 2 có '+wide.length+' lượt/cặp liên quan A330 hoặc B777: '+focus.join(', ')+'.'+
       (wideNight?' Có chuyến rơi vào ca tối, cần rà lại khả năng phối hợp với các chuyến lân cận.':''),
       'PVSĐ xác nhận loại xe thang, khả năng tiếp cận tàu và tổ bốc xếp phù hợp từng đăng bạ; PVHK rà soát nhân sự làm thủ tục ở quầy, boarding tại gate và đón, tiễn khách tại tàu bay theo booking, giờ bay và yêu cầu hãng. ĐH hạn chế điều cùng một bộ thiết bị sang hai chuyến thân rộng sát nhau khi chưa đủ thời gian quay vòng.',
       'PVSĐ · PVHK · ĐH',3);
   }
   const cargo=(c.cargoPlans||[]).filter(x=>x.flight_no);
   const cargoKnown=cargo.filter(x=>quantity(x.cargo_kg)!=null);
   const unfinished=cargo.filter(x=>x.ready_by_min==null);
   const ferry=deps.filter(x=>x.ferry);
   const charter=deps.filter(x=>x.charter);
   if(cargo.length||ferry.length||charter.length){
     const loaded=cargoKnown.length?cargoKnown.slice().sort((a,b)=>Number(b.cargo_kg)-Number(a.cargo_kg))
       .slice(0,3).map(x=>x.flight_no+' ('+Number(x.cargo_kg).toLocaleString('vi-VN')+' kg)'):[];
     const parts=[];
     const kgValue=x=>quantity(x.cargo_kg);
     const groupKg=predicate=>cargoKnown.filter(x=>predicate(kgValue(x))).map(x=>x.flight_no);
     const kgLight=groupKg(n=>n>=100&&n<=200),kgLow=groupKg(n=>n<2500&&(n<100||n>200)),kgHigh=groupKg(n=>n>=2500);
     if(cargo.length)parts.push('Kho Hàng đã khai báo '+cargo.length+' chuyến có kế hoạch hàng'+
       (loaded.length?'; trọng lượng đáng lưu ý: '+loaded.join(', '):'')+
       (kgLight.length?'; nhóm 100–200 kg: '+short(kgLight,4):'')+
       (kgLow.length?'; nhóm khác dưới 2,5 tấn: '+short(kgLow,4):'')+
       (kgHigh.length?'; từ 2,5 tấn: '+short(kgHigh,4):'')+
       (unfinished.length?'. Còn '+unfinished.length+' chuyến chưa chốt giờ hàng sẵn sàng.':'.'));
     if(ferry.length)parts.push('Có chuyến mang ký hiệu ferry: '+short(ferry.map(x=>x.no),5)+
       '; cần xác nhận phạm vi phục vụ thay vì áp dụng quy trình chuyến chở khách.');
     if(charter.length)parts.push('Lịch bay có '+charter.length+' chuyến thuê chuyến không thường lệ (CHARTER, ký hiệu ##): '+
       short(charter.map(x=>'##'+x.no),5)+'. CHARTER không đồng nghĩa FERRY; phải đối chiếu loại hình phục vụ thực tế.');
     push('cargo','Hàng hóa và chuyến có tính chất đặc biệt',parts.join(' '),
       'Sau khi Kho Hàng xác nhận có hàng đi và khối lượng booking, ưu tiên chuyến có hàng và thời gian quay đầu ngắn: PVSĐ chủ động đưa nhân lực, xe và trang thiết bị về khu vực phục vụ trước giờ khai thác. Với booking dưới 2,5 tấn, phương án phục vụ phải phù hợp thỏa thuận hiện hành với công ty và hãng, không tự áp dụng theo ngưỡng. Với FERRY, ĐH xác nhận phạm vi dịch vụ; với CHARTER (##), Phòng Điều hành chủ động trao đổi hãng hàng không về yêu cầu riêng rồi chuyển thông tin cho PVSĐ và Kho Hàng nếu liên quan để chuẩn bị.',
       'Kho Hàng · PVSĐ · ĐH',unfinished.length||ferry.length||charter.length?3:2);
   }
   const distinct=changes.filter(x=>/BÃI ĐỖ|STA|STD|GATE/i.test(x.type||'')).slice(0,4);
   if(distinct.length){
     push('change','Những điểm điều chỉnh sau Lần 1',
       'Lịch cập nhật có '+distinct.length+(changes.length>distinct.length?' trong số '+changes.length:'')+
       ' thay đổi cần kiểm tra lại kế hoạch, gồm '+
       distinct.map(x=>x.flight+' ('+x.type+')').join(', ')+'.',
       'ĐH thông báo thay đổi giờ, bãi đỗ hoặc gate cho PVHK và PVSĐ. PVHK cập nhật lịch trực quầy check-in, bố trí người tại cửa boarding và đội đón, tiễn khách ở tàu bay; PVSĐ rà lại vị trí tập kết người, thiết bị. Không giữ phương án Lần 1 khi nguồn lịch Lần 2 đã thay đổi.',
       'ĐH · PVHK · PVSĐ',3);
   }
   if(!entries.length){
     push('quiet','Đánh giá kế hoạch Lần 2',
       'Theo những thông tin đã được cập nhật, chưa ghi nhận cụm chuyến hoặc yêu cầu riêng nổi bật để tách phương án tăng cường.',
       'Các phòng thực hiện theo lịch được duyệt, kiểm tra lại mức sẵn sàng nhân lực và thiết bị trước ca; ĐH điều chỉnh khi có thay đổi giờ đến, vị trí đỗ hoặc yêu cầu hãng.',
       'ĐH · PVHK · PVSĐ',1);
   }
   const must=entries.filter(x=>x.weight>=4),normal=entries.filter(x=>x.weight<4);
   const order=['peak','stands','gate','checkin','resource','wide','cargo','change','quiet'];
   const sort=(a,b)=>b.weight-a.weight||order.indexOf(a.key)-order.indexOf(b.key);
   const chosen=[...must.sort(sort),...normal.sort(sort)].slice(0,7);
   if(!lead.length){
     if(standBusy.length)lead.push('Trong ngày, lưu ý luồng xe tại khu bãi '+short(standBusy.map(x=>x.zone),2)+' theo các cụm giờ có chuyến dự kiến.');
     else if(busyBooking.length)lead.push('Kế hoạch hôm nay cần bám sát giờ mở quầy và tiến độ boarding của các chuyến có booking cao.');
     else lead.push('Phương án được xây dựng từ lịch Lần 2 và các số liệu đơn vị đã nhập, chưa có cơ sở xác nhận thiếu nguồn lực trên toàn ca.');
   }
   const outstanding=[];
   if(!contract.length&&deps.some(x=>!x.ferry))outstanding.push('chưa có định mức quầy hãng đã xác nhận');
   if(windows.some(x=>x.checkin?.openFlights?.length&&x.checkin?.available==null))outstanding.push('chưa có phân bổ đội check-in theo thời gian');
   if(windows.some(x=>x.total&&x.gse?.some(t=>t.available==null)))outstanding.push('còn thiếu số lượng một số thiết bị khả dụng');
   if(arrs.length&&all.some(x=>x.bay==null))outstanding.push('còn chuyến chưa có bãi đỗ');
   const closing=outstanding.length?'Các nội dung cần chốt thêm trước ca: '+outstanding.slice(0,4).join('; ')+'.':
     'Những số liệu trên là dự kiến theo lịch đã cập nhật; ĐH tiếp tục đối chiếu tình hình thực tế trước từng đợt phục vụ.';
   return {lead:lead.join(' '),entries:chosen,closing,staffing,sourceDate:c.date,signalKeys:chosen.map(x=>x.key)};
 }
 root.SagsL2BriefV223={make,verifiedContract};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.SagsL2BriefV223;
})(typeof window!=='undefined'?window:globalThis);