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
 const shorten=(s,n=340)=>{const t=String(s||'').trim();if(t.length<=n)return t;const head=t.slice(0,n-1);return head.replace(/\s+\S*$/,'').trimEnd()+'…';};
 const plans=c=>new Map((c.unitPlans||[]).filter(r=>r.status==='CONFIRMED').map(r=>[r.unit,r.details||{}]));
 const values=(c,unit)=>plans(c).get(unit)||null;
 const flag=(data,key)=>data?.[key]==='READY'?'đã chuẩn bị sẵn sàng':data?.[key]==='LIMITED'?'còn hạn chế, cần hỗ trợ':'chưa có xác nhận';
 const clean=s=>String(s||'').trim();
 const append=(base,extra,max=470)=>extra?shorten(base+' '+extra,max):shorten(base,max);
 function widebody(c){
   const rows=c.rows||[],wide=rows.filter(isWide),a=wide.filter(is330),b=wide.filter(is777);
   const kts=values(c,'KTS'),pvhk=values(c,'PVHK');
   if(!wide.length){
     const unknown=rows.filter(x=>!x.aircraft_type).length;
     return {
       observation:unknown?'Theo lịch, chưa ghi nhận A330/B777; còn '+unknown+' chuyến chưa có thông tin loại tàu.':'Theo lịch hiện có chưa ghi nhận tàu A330/B777.',
       action:'Phòng ĐH theo dõi thay đổi loại tàu; nếu có tàu thân rộng, PVSĐ chuẩn bị thiết bị phù hợp và PVHK bố trí người phục vụ.',
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
     high.length?'Số khách dự kiến: '+high.slice(0,4).map(x=>x.no+' '+x.pax+' khách '+x.kind).join(', ')+'. ':'',
     noPax.length?noPax.length+' chuyến chưa có số khách dự kiến. ':'',
     night.length?'Có '+night.length+' chuyến tàu thân rộng phục vụ ca tối. ':''
   ].join('');
   const ktsFlags=[...(a.length?['A330: '+flag(kts,'a330_ready')]:[]),...(b.length?['B777: '+flag(kts,'b777_ready')]:[])].join('; ');
   const actions=[
    'Phòng ĐH theo dõi sát '+wide.slice(0,4).map(pair).join(', ')+', lưu ý giờ tàu về, vị trí đỗ và tiến độ phục vụ.',
    'Phòng PVSĐ chuẩn bị nhân sự và thiết bị phù hợp tàu thân rộng. Tình hình: '+ktsFlags+'.',
    'Phòng PVHK chủ động đón khách, cửa ra tàu và xử lý hành lý theo lượng khách dự kiến; lực lượng phục vụ '+flag(pvhk,'widebody_ready')+'.'
   ];
   if(a.length&&b.length)actions.push('Nếu A330/B777 trùng giờ, PVSĐ ưu tiên thiết bị cho chuyến cần phục vụ trước, sau đó điều chuyển cuốn chiếu khi hoàn tất công việc.');
   if(night.length)actions.push('Ca tối chuẩn bị người và thiết bị trước khi tàu về, tránh bị động khi các chuyến tập trung.');
   if(kts?.widebody_note)actions.push('PVSĐ báo: '+shorten(kts.widebody_note,160)+'.');
   if(pvhk?.widebody_note)actions.push('PVHK báo: '+shorten(pvhk.widebody_note,140)+'.');
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
   if(highPax.length)pts[6].observation=append(pts[6].observation,'Các chuyến có số khách từ 300 người cần lưu ý phục vụ hành lý: '+highPax.slice(0,5).join(', ')+'.',440);
   if(!readyCount)pts[5].observation=append(pts[5].observation,'PVSĐ đang cập nhật số xe, thiết bị sẵn sàng phục vụ.',440);
   else pts[5].observation=append(pts[5].observation,readyCount+' nhóm xe, thiết bị; tiếp tục bố trí theo lịch bay.',440);
   if(affectedWide)pts[5].action=append(pts[5].action,'Ưu tiên chuẩn bị thiết bị phục vụ tàu '+(longWide.some(is777)?'B777':'A330')+' trước các chuyến thân rộng.',520);
   if(noStand===rows.length&&rows.length)pts[3].observation='Chưa có vị trí đỗ của '+noStand+' chuyến; Phòng ĐH sẽ cập nhật sau thông tin AOC.';
   else if(farStand.length)pts[3].observation='Theo lịch dự kiến, '+farStand.length+' chuyến phục vụ tại khu bãi 2–3 ('+farStand.slice(0,5).map(f=>pair(f)+' vị trí '+f.bay).join('; ')+'); '+(noStand?noStand+' chuyến còn chờ xác nhận vị trí đỗ.':'cần lưu ý thời gian di chuyển xe, thiết bị giữa các bãi.');
   if(dh?.stand_notes)pts[3].observation=append(pts[3].observation,'ĐH cập nhật: '+shorten(dh.stand_notes,160)+'.',470);
   if(dh?.peak_priority)pts[1].action=append(pts[1].action,'Phương án ĐH: '+shorten(dh.peak_priority,140)+'.',620);
   if(kts?.rolling_support)pts[1].action=append(pts[1].action,'PVSĐ báo: '+shorten(kts.rolling_support,140)+'.',620);
   if(pv?.peak_staff)pts[4].action=append(pts[4].action,'PVHK báo: '+shorten(pv.peak_staff,160)+'.',600);
   if(kts?.staff_shortage)pts[4].observation=append(pts[4].observation,'PVSĐ báo: '+shorten(kts.staff_shortage,150)+'.',480);
   if(!confirmedStaff)pts[4].observation=append(pts[4].observation,'Quân số từng ca đang được các phòng cập nhật.',485);
   if(kts?.gse_risk)pts[5].observation=append(pts[5].observation,'PVSĐ báo: '+shorten(kts.gse_risk,140)+'.',470);
   if(kho?.special_cargo)pts[6].observation=append(pts[6].observation,'Kho Hàng báo: '+shorten(kho.special_cargo,150)+'.',480);
   if(kho?.handover_priority)pts[6].action=append(pts[6].action,'Kho Hàng ưu tiên: '+shorten(kho.handover_priority,150)+'.',565);
   if(pv?.bag_risk)pts[6].action=append(pts[6].action,'PVHK: '+shorten(pv.bag_risk,120)+'.',565);
   if(pv?.special_pax)pts[6].observation=append(pts[6].observation,'Khách đặc biệt: '+shorten(pv.special_pax,110)+'.',480);
   if(qa?.weather_fod)pts[8].observation=append(pts[8].observation,'QA/IT báo: '+shorten(qa.weather_fod,170)+'.',470);
   if(qa?.followup)pts[8].action=append(pts[8].action,'QA/IT: '+shorten(qa.followup,140)+'.',580);
   if(qa?.open_capa)pts[9].observation=append(pts[9].observation,'Tồn tại từ ca trước: '+shorten(qa.open_capa,170)+'.',490);
   if(qa?.operational_impact)pts[9].action=append(pts[9].action,'QA/IT: '+shorten(qa.operational_impact,150)+'.',530);
   if(dh?.escalation)pts[9].action=append(pts[9].action,'ĐH kiến nghị xem xét: '+shorten(dh.escalation,120)+'.',540);
   return pts;
 }
 root.SagsReportInsightsV211={widebody,enrich,_test:{isWide,zone,flag,values}};
})(window);