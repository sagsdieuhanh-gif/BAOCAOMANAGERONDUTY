'use strict';
/* Deterministic situational report remarks. Every assertion is sourced from
   flight schedules, confirmed departmental inputs or explicitly declared capacities. */
(function(root){
 const clock=m=>m==null?'—':String(Math.floor((m%1440)/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')+(m>=1440?' (+1)':'');
 const pair=f=>(f.arrival||'—')+'/'+(f.departure||'—');
 const isWide=f=>/A\s?330|B\s?777/i.test(f.aircraft_type||'');
 const is777=f=>/B\s?777/i.test(f.aircraft_type||'');
 const is330=f=>/A\s?330/i.test(f.aircraft_type||'');
 const zone=bay=>[31,32,33,34,35,36,37,51,52,53,54,55].includes(Number(bay))?'K1':[38,39,40,41,42].includes(Number(bay))?'K2':Number(bay)>=56&&Number(bay)<=71?'K3':'?';
 const shorten=(s,n=340)=>String(s||'').trim().slice(0,n);
 const plans=c=>new Map((c.unitPlans||[]).filter(r=>r.status==='CONFIRMED').map(r=>[r.unit,r.details||{}]));
 const values=(c,unit)=>plans(c).get(unit)||null;
 const flag=(data,key)=>data?.[key]==='READY'?'ĐÃ XÁC NHẬN SẴN SÀNG':data?.[key]==='LIMITED'?'CÓ HẠN CHẾ ĐÃ KHAI BÁO':'CHỜ XÁC NHẬN';
 const clean=s=>String(s||'').trim();
 const append=(base,extra,max=470)=>extra?shorten(base+' '+extra,max):shorten(base,max);
 function widebody(c){
   const rows=c.rows||[],wide=rows.filter(isWide),a=wide.filter(is330),b=wide.filter(is777);
   const kts=values(c,'KTS'),pvhk=values(c,'PVHK');
   if(!wide.length){
     const unknown=rows.filter(x=>!x.aircraft_type).length;
     return {
       observation:unknown?'Chưa xác định A330/B777 trong các hồ sơ đã có loại tàu; '+unknown+' hồ sơ thiếu loại tàu – CHỜ XÁC NHẬN.':'Theo lịch nguồn chưa ghi nhận A330/B777; tiếp tục theo dõi đổi loại tàu hoặc bổ sung chuyến.',
       action:'ĐH tiếp tục theo dõi thay đổi loại tàu; PVSĐ/PVHK chỉ kích hoạt phương án riêng khi có chuyến thân rộng được xác nhận.',
       owner:'ĐH · PVSĐ · PVHK'
     };
   }
   const group=(name,items)=>items.length?name+': '+items.slice(0,7).map(pair).join(', ')+(items.length>7?'…':'')+'. ':'';
   const high=wide.flatMap(f=>([
     Number.isInteger(f.arrival_pax)&&f.arrival_pax>=300?{no:f.arrival||'—',pax:f.arrival_pax,kind:'đến'}:null,
     Number.isInteger(f.departure_pax)&&f.departure_pax>=300?{no:f.departure||'—',pax:f.departure_pax,kind:'đi'}:null
   ].filter(Boolean)));
   const noPax=wide.filter(f=>f.arrival&&f.arrival_pax==null||f.departure&&f.departure_pax==null);
   const night=wide.filter(f=>(f.sta_min!=null&&f.sta_min>=1080)||(f.std_min!=null&&f.std_min>=1080));
   const observed=[
     group('A330',a),group('B777',b),
     high.length?'Tải PAX đáng chú ý: '+high.slice(0,4).map(x=>x.no+' '+x.pax+' khách '+x.kind).join(', ')+'. ':'',
     noPax.length?noPax.length+' hồ sơ còn PAX chưa xác nhận. ':'',
     night.length?'Có '+night.length+' hồ sơ thân rộng liên quan khung tối/qua ngày. ':''
   ].join('');
   const ktsFlags=[...(a.length?['A330: '+flag(kts,'a330_ready')]:[]),...(b.length?['B777: '+flag(kts,'b777_ready')]:[])].join('; ');
   const actions=[
    'ĐH dự kiến kiểm soát riêng '+wide.slice(0,4).map(pair).join(', ')+', ưu tiên giám sát mốc STA/STD, stand và luồng GSE.',
    'PVSĐ xác nhận năng định, xe thang/loader/kéo đẩy, khả dụng theo đúng cấu hình tàu; '+ktsFlags+'.',
    'PVHK đối chiếu tải khách, đội đón/gate/boarding và khả năng xử lý hành lý; '+flag(pvhk,'widebody_ready')+'.'
   ];
   if(a.length&&b.length)actions.push('Nếu trùng khung A330/B777, tách GSE tương thích và bố trí phục vụ lần lượt theo tiến độ, không tự coi thiết bị dùng chung là sẵn sàng.');
   if(night.length)actions.push('Ca tối chuẩn bị người, GSE và thời gian di chuyển trước khi tàu đến.');
   if(kts?.widebody_note)actions.push('PVSĐ xác nhận: '+shorten(kts.widebody_note,160)+'.');
   if(pvhk?.widebody_note)actions.push('PVHK xác nhận: '+shorten(pvhk.widebody_note,140)+'.');
   return {observation:shorten(observed,500),action:shorten(actions.join(' '),630),owner:'ĐH · PVSĐ · PVHK'};
 }
 function enrich(c,baseTopics){
   const wide=widebody(c),rows=c.rows||[],caps=c.staff||[],eq=c.gse||[];
   const topics=[...baseTopics];
   topics.splice(2,0,{title:'03. Tàu thân rộng/chuyến đặc biệt',observation:wide.observation,action:wide.action,owner:wide.owner});
   const owners=[
     'ĐH · PVHK · PVSĐ','ĐH chủ trì · PVHK · PVSĐ','ĐH · PVSĐ · PVHK',
     'ĐH · PVSĐ · Cảng/AOC','PVSĐ · PVHK · ĐH','PVSĐ · ĐH',
     'Kho Hàng · PVSĐ · PVHK','ĐH · PVSĐ · PVHK',
     'QA/IT · ĐH · các đội','Các phòng phụ trách · ĐH theo dõi'
   ];
   const pts=topics.map((t,i)=>({...t,title:String(i+1).padStart(2,'0')+'. '+(t.title.replace(/^\d+\.\s*/,'')||'Đang cập nhật'),owner:owners[i]}));
   const get=u=>values(c,u),dh=get('DH'),kts=get('KTS'),pv=get('PVHK'),kho=get('KHO'),qa=get('QA_IT');
   const readyCount=eq.filter(x=>x.ready_count!=null&&x.confirmed_at).length,confirmedStaff=caps.filter(x=>x.confirmed_at&&x.quantity!=null).length;
   const affectedWide=rows.filter(isWide).length;
   const noStand=rows.filter(f=>f.bay==null).length,farStand=rows.filter(f=>['K2','K3'].includes(zone(f.bay)));
   const longWide=rows.filter(isWide);
   const highPax=rows.flatMap(f=>[Number.isInteger(f.arrival_pax)&&f.arrival_pax>=300?f.arrival:null,Number.isInteger(f.departure_pax)&&f.departure_pax>=300?f.departure:null].filter(Boolean));
   if(highPax.length)pts[6].observation=append(pts[6].observation,'Khách dự kiến từ 300 người/chuyến: '+highPax.slice(0,5).join(', ')+'.',440);
   if(!readyCount)pts[5].observation=append(pts[5].observation,'CHỜ XÁC NHẬN số lượng GSE khả dụng theo ca.',440);
   else pts[5].observation=append(pts[5].observation,readyCount+' nhóm GSE có số khả dụng đã xác nhận; cần đối chiếu theo khung khai thác.',440);
   if(affectedWide)pts[5].action=append(pts[5].action,'Ưu tiên rà soát GSE tương thích '+(longWide.some(is777)?'B777':'A330')+' trước các khung phục vụ tàu rộng.',520);
   if(noStand===rows.length&&rows.length)pts[3].observation='CHỜ XÁC NHẬN vị trí đỗ cho '+noStand+' hồ sơ lịch; chưa thể xác định khu vực ảnh hưởng di chuyển GSE.';
   else if(farStand.length)pts[3].observation='Theo vị trí đỗ đã có, '+farStand.length+' hồ sơ thuộc khu 2–3 ('+farStand.slice(0,5).map(f=>pair(f)+' bãi '+f.bay).join('; ')+'); '+(noStand?noStand+' hồ sơ còn CHỜ XÁC NHẬN bãi.':'chưa tự kết luận đường công vụ đang gián đoạn.');
   if(dh?.stand_notes)pts[3].observation=append(pts[3].observation,'ĐH xác nhận: '+shorten(dh.stand_notes,160)+'.',470);
   if(dh?.peak_priority)pts[1].action=append(pts[1].action,'ĐH bổ sung: '+shorten(dh.peak_priority,140)+'.',620);
   if(kts?.rolling_support)pts[1].action=append(pts[1].action,'PVSĐ xác nhận: '+shorten(kts.rolling_support,140)+'.',620);
   if(pv?.peak_staff)pts[4].action=append(pts[4].action,'PVHK xác nhận: '+shorten(pv.peak_staff,160)+'.',600);
   if(kts?.staff_shortage)pts[4].observation=append(pts[4].observation,'PVSĐ báo: '+shorten(kts.staff_shortage,150)+'.',480);
   if(!confirmedStaff)pts[4].observation=append(pts[4].observation,'CHỜ XÁC NHẬN quân số theo ca.',485);
   if(kts?.gse_risk)pts[5].observation=append(pts[5].observation,'PVSĐ xác nhận: '+shorten(kts.gse_risk,140)+'.',470);
   if(kho?.special_cargo)pts[6].observation=append(pts[6].observation,'Kho xác nhận: '+shorten(kho.special_cargo,150)+'.',480);
   if(kho?.handover_priority)pts[6].action=append(pts[6].action,'Kho Hàng ưu tiên: '+shorten(kho.handover_priority,150)+'.',565);
   if(pv?.bag_risk)pts[6].action=append(pts[6].action,'PVHK: '+shorten(pv.bag_risk,120)+'.',565);
   if(pv?.special_pax)pts[6].observation=append(pts[6].observation,'Khách đặc biệt: '+shorten(pv.special_pax,110)+'.',480);
   if(qa?.weather_fod)pts[8].observation=append(pts[8].observation,'QA/IT xác nhận: '+shorten(qa.weather_fod,170)+'.',470);
   if(qa?.followup)pts[8].action=append(pts[8].action,'QA/IT: '+shorten(qa.followup,140)+'.',580);
   if(qa?.open_capa)pts[9].observation=append(pts[9].observation,'Tồn tại xác nhận: '+shorten(qa.open_capa,170)+'.',490);
   if(qa?.operational_impact)pts[9].action=append(pts[9].action,'QA/IT: '+shorten(qa.operational_impact,150)+'.',530);
   if(dh?.escalation)pts[9].action=append(pts[9].action,'ĐH kiến nghị xem xét: '+shorten(dh.escalation,120)+'.',540);
   return pts;
 }
 root.SagsReportInsightsV211={widebody,enrich,_test:{isWide,zone,flag,values}};
})(window);