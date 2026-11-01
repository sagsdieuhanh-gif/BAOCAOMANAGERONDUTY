'use strict';
/* V3.00 – D+1 forecast workspace. Original auth, schedule import and report
 * engines remain the only data sources. One daily confirmation per unit.
 * No positive sufficiency verdict from missing staffing, cargo or GSE data. */
(function(root){
 const $=id=>document.getElementById(id);
 const H=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const num=x=>x==null||String(x).trim()===''?null:/^\d+$/.test(String(x))?Number(x):NaN;
 const date=()=> $('day')?.value||'';
 const role=()=>typeof unit==='undefined'?'':unit;
 const user=()=>typeof me==='undefined'?null:me;
 const db=()=>typeof sb==='undefined'?null:sb;
 const allowed=u=>['DH','ADMIN'].includes(role())||role()===u||(u==='QA_IT'&&['QA','IT'].includes(role()));
 const tagUnit={DH:'Phòng Điều hành',KTS:'Phục vụ sân đỗ',PVHK:'Phục vụ hành khách',KHO:'Kho hàng',QA_IT:'QA / IT'};
 const staffRoles={
   DH:[['COORD','Điều phối / CO (nhóm công việc)']],
   KTS:[['KTS_OFFICE','Cán bộ Phòng'],['KTS_RAMP_TEAM','Đội PVSĐ'],['BAGGAGE','HLSĐ – nhân sự chính'],['KTS_HLSD_SKO','HLSĐ – SKO'],
     ['TERMINAL_BAGGAGE','HLNG – nhân sự chính'],['KTS_HLNG_SKO','HLNG – SKO'],['KTS_PVTT','Đội PVTT – nhân sự chính'],
     ['KTS_PVTT_TC','Đội PVTT – tăng cường (TC)'],['KTS_PVTT_SKO','Đội PVTT – SKO'],
     ['KTS_WORKSHOP_SC','Xưởng SC'],['GSE_DRIVER','Lái xe GSE (dữ liệu cũ)'],
     ['COBUS_DRIVER','Lái COBUS (dữ liệu cũ)'],['SKYONE_BAGGAGE','SKYONE chưa phân nhóm (dữ liệu cũ)']],
   PVHK:[['PVHK_OFFICE','Cán bộ Phòng'],['PVHK_DEPARTURE_TEAM','Đội PVHK đi'],['PVHK_ARRIVAL_TEAM','Đội PVHK đến'],
     ['GATE','Gate / reader (dữ liệu cũ)'],['BUSGATE','Bus gate (dữ liệu cũ)'],
     ['AIRCRAFT_BOARDING','Tại tàu (dữ liệu cũ)']],
   KHO:[['WAREHOUSE_CARGO','Nhân viên kho/hàng']],
   QA_IT:[]
 };
 const noteFields={
   DH:[['stand_notes','Điều chỉnh vị trí đỗ/AOC'],['peak_priority','Ưu tiên điều hành hoặc yêu cầu hãng'],['escalation','Vấn đề cần xin chỉ đạo']],
   KTS:[['rolling_support','Phương án tăng cường PVHL sân đỗ / hỗ trợ Kho Hàng / PVTT'],['gse_risk','Hạn chế thiết bị/luồng công vụ']],
   PVHK:[['peak_staff','Phương án quầy/gate/boarding khi dồn chuyến'],['special_pax','Khách đặc biệt hoặc yêu cầu hãng']],
   KHO:[['handover_priority','Ưu tiên bàn giao hàng'],['cargo_bottleneck','Nguy cơ chậm bàn giao hàng']],
   QA_IT:[['weather_fod','Thời tiết/FOD/an toàn đã xác nhận'],['open_capa','Tồn tại ảnh hưởng ngày mai']]
 };
 const NAV=[
  ['overview','Tổng quan','layout-dashboard','Xem các điểm cần chuẩn bị'],
  ['sources','Lịch bay','calendar-days','Nhập Lần 1 / Lần 2','sources'],
  ['DH','Điều hành','headset','Thông tin AOC và phương án','home'],
  ['KTS','Phục vụ sân đỗ','truck','Nhân lực, GSE và luồng tuyến','pvsd'],
  ['PVHK','Phục vụ hành khách','users','Check-in, boarding, gate','pvhk'],
  ['KHO','Kho hàng','package','Booking và thời gian bàn giao','warehouse'],
  ['QA_IT','QA / IT','shield-check','Ngoại lệ an toàn','qa_it'],
  ['analysis','Phân tích nguy cơ','activity','Radar khai thác D+1','radar'],
  ['report','Báo cáo TGĐ','file-text','Xem, duyệt và xuất Word/PDF','report'],
  ['norms','Cấu hình định mức','settings-2','Chỉnh khi có thay đổi','norms'],
  ['shuttle','Xe giao ca','bus-front','Nhập số người và xuất bảng xe','shuttle-report'],
  ['admin','Quản lý tài khoản','shield','ADMIN','admin']
 ];
 const keyCode=n=>({'layout-dashboard':'◫','calendar-days':'▦',headset:'◉',truck:'▣',
  users:'♙',package:'▤','shield-check':'◇',activity:'◷','file-text':'▤','settings-2':'⚙',
  'bus-front':'▰',shield:'◎'}[n]||'•');
 const clock=n=>n==null?'—':String(Math.floor((n%1440)/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')+(n>=1440?' (+1)':'');
 const zone=b=>[31,32,33,34,35,36,37,51,52,53,54,55].includes(Number(b))?'K1':
  Number(b)>=38&&Number(b)<=42?'K2':Number(b)>=56&&Number(b)<=71?'K3':'?';
 let mounted=false,view='overview',state=null,loading=false, saving=false,serial=0, initialized=false;
 function canOpen(k){
   if(k==='overview'||k==='analysis'||k==='report'||k==='shuttle')return !!user();
   if(k==='sources')return ['DH','ADMIN'].includes(role());
   if(k==='norms')return ['DH','ADMIN','KTS','PVHK','KHO'].includes(role());
   if(k==='admin')return role()==='ADMIN';
   return allowed(k);
 }
 function status(m,isBad=false){
   const el=$('v300Status');if(el){el.textContent=m;el.dataset.bad=isBad?'1':'0';}
 }
 function showLoading(loadingNow){
   const el=$('v300Busy');if(el)el.hidden=!loadingNow;
 }
 function layout(){
   return '<div class="v300-shell"><aside class="v300-sidebar">'+
      '<div class="v300-logo"><span class="v300-emblem">S</span><div><strong>MANAGER ON DUTY</strong><small>SAGS · CXR</small></div></div>'+
      '<div class="v300-side-caption">KHÔNG GIAN DỰ BÁO</div><nav id="v300Nav" aria-label="Chức năng dự báo">'+
      (()=>{const button=([k,label,ico,sub])=>'<button type="button" data-v300-route="'+k+'" aria-label="'+H(label)+'">'+
       '<span class="v300-nav-icon">'+keyCode(ico)+'</span><span><strong>'+H(label)+'</strong><small>'+H(sub)+'</small></span></button>';
       const main=Object.fromEntries(NAV.map(x=>[x[0],x]));
       const departments=['DH','KTS','PVHK','KHO','QA_IT'].filter(canOpen).map(k=>button(main[k])).join('');
       const other=['norms','admin'].filter(canOpen).map(k=>button(main[k])).join('');
       return ['overview','sources'].filter(canOpen).map(k=>button(main[k])).join('')+
       (departments?'<details class="v300-nav-folder" open><summary>◎ &nbsp; CÁC PHÒNG</summary><div>'+departments+'</div></details>':'')+
       ['analysis','report','shuttle'].filter(canOpen).map(k=>button(main[k])).join('')+
       (other?'<details class="v300-nav-folder v300-nav-tools"><summary>⚙ &nbsp; CÔNG CỤ PHỤ</summary><div>'+other+'</div></details>':'');
      })()+
      '</nav><div class="v300-side-bottom"><span>Quy trình: dữ liệu → nguy cơ → phương án</span><b id="v300Version">V3.20</b></div></aside>'+
      '<div class="v300-main"><div class="v300-top"><div><span class="v300-kicker">DỰ BÁO ĐIỀU HÀNH · D+1</span>'+
      '<h1 id="v300Heading">Tổng quan ngày khai thác</h1><p id="v300Subheading">Thông tin cần chuẩn bị trước ngày khai thác.</p></div>'+
      '<div class="v300-tools"><div id="v300DaySlot"></div><button type="button" data-v300-command="refresh" class="v300-outline">↻ Đồng bộ</button></div></div>'+
      '<div id="v300Busy" class="v300-loading" hidden>Đang đối chiếu nguồn dữ liệu đã xác nhận…</div>'+
      '<div id="v300Page"></div><div id="v300LegacyDock" hidden></div><div class="v300-foot"><span id="v300Status" role="status" aria-live="polite"></span>'+
      '<span>Chưa đủ căn cứ = CHỜ XÁC NHẬN · Không tự kết luận đủ</span></div></div></div>';
 }
 function mount(){
   if(!user()||!db())return false;
   if(!mounted){
     const app=$('app');if(!app)return false;
     const rootNode=document.createElement('div');rootNode.id='v300Root';
     rootNode.innerHTML=layout();app.prepend(rootNode);
     const toolbar=app.querySelector(':scope > .panel.row.space');
     if(toolbar){$('v300DaySlot').appendChild(toolbar);}
     rootNode.addEventListener('click',handleClick);
     rootNode.addEventListener('input',event=>{
       if(event.target.closest('[data-v320-cargo-side]'))updateCargoTotals();
     });
     rootNode.addEventListener('change',event=>{
       if(event.target.closest('[data-v320-cargo-side]'))updateCargoTotals();
     });
     mounted=true;document.body.classList.add('v300-ready');
     $('day')?.addEventListener('change',()=>{draftReset();refresh()});
   }
   refresh();return true;
 }
 function draftReset(){const node=$('v300Page');if(node)node.innerHTML='';}
 function wrapPanel(title,subtitle,content,extra=''){
   return '<section class="v300-card '+extra+'"><div class="v300-card-head"><div><h2>'+title+'</h2>'+
    (subtitle?'<p>'+subtitle+'</p>':'')+'</div></div>'+content+'</section>';
 }
 function smallState(s){
  if(s==='CONFIRMED')return '<span class="v300-chip ok">Đã xác nhận</span>';
  if(s==='DRAFT')return '<span class="v300-chip pending">Nháp</span>';
  return '<span class="v300-chip neutral">Chưa xác nhận</span>';
 }
 function getUnitPlan(u){return (state?.plans||[]).find(x=>x.unit===u)||null;}
 function getStaff(u,code,sh){return (state?.staff||[]).find(x=>x.unit===u&&x.role_code===code&&x.shift===sh&&x.confirmed_at);}
 function getFlights(){return state?.snap2?.payload?.flights||state?.snap1?.payload?.flights||state?.flights||[];}
 function dataRows(){return state?.snap2?.payload?.source_detail?.departures||state?.snap1?.payload?.source_detail?.departures||[];}
 const numKnown=x=>x!==''&&x!=null&&Number.isFinite(Number(x));
 function forecast(){
   const pairs=getFlights(),records=[],service=root.SagsOpsForecastV219?.serviceM;
   const groups=new Map();
   for(let start=0;start<1800;start+=30){
     const active=pairs.filter(p=>{
       const dur=service?.(p),sta=p.sta_min,std=p.std_min;
       if(p.ferry||!Number.isFinite(sta)||dur==null)return false;
       const end=Math.min(sta+dur,Number.isFinite(std)?std:Infinity);
       return start<end&&start+30>sta;
     });
     if(active.length<2)continue;
     const area=active.filter(x=>['K2','K3'].includes(zone(x.bay)));
     const tight=active.filter(x=>Number.isFinite(x.std_min)&&Number.isFinite(x.sta_min)&&x.std_min-x.sta_min<=35);
     const unknown=active.filter(x=>x.bay==null);
     const score=active.length+area.length+(tight.length?2:0);
     records.push({start,active,area,tight,unknown,score,slot:clock(start)+'–'+clock(start+30)});
   }
   const byRank=records.sort((a,b)=>b.score-a.score||a.start-b.start);
   const winners=[];
   for(const rec of byRank){
     if(winners.every(x=>Math.abs(x.start-rec.start)>=60)){winners.push(rec);if(winners.length===3)break}
   }
   return {pairs,critical:winners,total:records.length};
 }

 function aircraftGroup(f){
   const s=String(f.aircraft_type||'').toUpperCase().replace(/\s/g,'');
   if(/A3(30|40|50|80)|B?7(47|67|77|87)/.test(s))return 'WIDE';
   if(/A(318|319|320|321|220)|B?7(17|27|37|57)|ATR|AT[47]|E(170|175|190|195)|DH8|DHC|C919/.test(s))return 'NARROW';
   return null;
 }
 function confirmedStaff(u,code,t){
   const rows=(state.staff||[]).filter(x=>x.unit===u&&x.role_code===code&&x.confirmed_at&&
     Number.isFinite(Number(x.quantity))&&Number(x.start_min)<=t&&Number(x.end_min)>=t+30);
   return rows.length?rows.reduce((sum,x)=>sum+Number(x.quantity),0):null;
 }
 function deficits(forecastData){
   const saved=(state.minimumNorms||[]).filter(x=>x.confirmed_by);
   const norms=new Map(saved.map(x=>[x.airline+'|'+x.aircraft_group+'|'+x.unit,x.norm||{}]));
   const out=[];
   const count=(x,k)=>Number.isInteger(x?.[k])&&x[k]>=0?x[k]:null;
   for(const w of forecastData.critical){
     const required={DH:{COORD:0},KTS:{BAGGAGE:0,GSE_DRIVER:0}},all={DH:true,KTS:true};
     for(const f of w.active){
       const a=String(f.airline||f.carrier||'').toUpperCase()||
         (String(f.departure||f.arrival||'').replace(/^##/,'').match(/^([A-Z0-9]{2})(?=\d)/)||[])[1];
       const group=aircraftGroup(f);
       if(!a||!group){all.DH=false;all.KTS=false;continue;}
       const dh=norms.get(a+'|'+group+'|DH'),kts=norms.get(a+'|'+group+'|KTS');
       const co=count(dh,'co_loading');
       if(co==null)all.DH=false;else required.DH.COORD+=co;
       const hold=count(kts,'hold_workers'),ground=count(kts,'ground_workers'),
         tractor=count(kts,'tractor_driver'),belt=count(kts,'belt_driver');
       if([hold,ground,tractor,belt].some(x=>x==null))all.KTS=false;
       else{required.KTS.BAGGAGE+=hold+ground;required.KTS.GSE_DRIVER+=tractor+belt;}
     }
     for(const u of ['DH','KTS']){
       if(!all[u])continue;
       const shortages=[];
       for(const [code,need] of Object.entries(required[u])){
         const available=confirmedStaff(u,code,w.start);
         if(need>0&&available!=null&&available<need){
           const label={COORD:'CO kiêm Loading',BAGGAGE:'Bốc xếp',GSE_DRIVER:'Lái GSE'}[code];
           shortages.push(label+' cần '+need+', có '+available+', thiếu '+(need-available));
         }
       }
       if(shortages.length)out.push({type:'shortage',unit:tagUnit[u],
         title:w.slot+' · Nhân lực có nguy cơ thiếu',
         desc:shortages.join('; ')+'. Tính theo '+w.active.length+' cặp đang phục vụ và định mức đã xác nhận.',
         action:u==='DH'?'Cán bộ trực chủ động rà soát phân công CO, đề xuất tăng cường người đủ năng định từ ca khác hoặc trực tiếp hỗ trợ theo điều kiện, phê duyệt.':
           'PVSĐ bố trí lại tổ phục vụ, tập kết nhân lực trước giờ tàu lăn và đề xuất bổ sung người đủ năng định.',
         weight:15});
     }
   }
   return out;
 }
 function highlights(){
   if(!state)return [];
   const list=[],f=forecast(),issues=(state.issues||[]).filter(x=>x.issue_status!=='RETURNED'),
      dep=dataRows(),cargo=state.cargo||[];
   for(const win of f.critical){
     const ids=win.active.map(x=>x.departure||x.arrival).filter(Boolean).slice(0,5).join(', ');
     let risk=win.active.length+' cặp phục vụ chồng lấn ('+ids+').';
     if(win.area.length)risk+=' '+win.area.length+' cặp ở khu bãi 2–3; lưu ý khả năng dừng chờ đường công vụ.';
     if(win.tight.length)risk+=' Có '+win.tight.length+' cặp quay đầu sát.';
     list.push({type:'peak',unit:'ĐH · PVSĐ · PVHK',title:win.slot+' · Cao điểm',
       desc:risk,action:win.area.length?
       'PVSĐ chủ động chuẩn bị người, thiết bị trước khi tàu lăn và phối hợp ATC về thứ tự tàu, phép qua đường công vụ theo quy trình. PVHK bố trí nhân sự quầy check-in, cửa boarding và đón, tiễn tại tàu bay theo từng chuyến. ĐH theo dõi các chuyến ưu tiên.':
       'ĐH xác định các chuyến quay đầu ngắn cần ưu tiên; PVSĐ tập kết người, thiết bị đúng bãi. PVHK rà soát nhân sự làm thủ tục ở quầy check-in, cửa boarding và điểm đón, tiễn tại tàu bay theo các chuyến chồng giờ; chỉ điều người khi công đoạn trước đã hoàn tất.',
       weight:win.score});
   }
   list.push(...deficits(f));
   if(issues.length)list.push({type:'gse',unit:'PVSĐ',title:'Thiết bị hạn chế',
     desc:issues.length+' thiết bị đang báo hỏng/hạn chế: '+issues.slice(0,3).map(x=>x.equipment_id).join(', ')+'.',
     action:'PVSĐ xác nhận xe thay thế khả dụng trước cao điểm; không tính xe đang sửa vào nguồn lực.',weight:6});
   const packed=cargo.filter(x=>numKnown(x.cargo_kg)&&Number(x.cargo_kg)>0);
   const booked=packed.filter(x=>f.pairs.some(p=>p.departure===x.flight_no));
   const shortCargo=booked.filter(x=>{
     const p=f.pairs.find(z=>z.departure===x.flight_no);
     return p&&Number.isFinite(p.std_min)&&Number.isFinite(p.sta_min)&&p.std_min-p.sta_min<=45;
   });
   if(shortCargo.length)list.push({type:'cargo',unit:'Kho · PVSĐ',title:'Hàng đi trên chuyến quay đầu sát',
     desc:shortCargo.slice(0,4).map(x=>x.flight_no+' '+x.cargo_kg+' kg').join(', ')+'.',
     action:'Kho xác nhận thời gian sẵn sàng theo booking; PVSĐ bố trí nhân lực và xe phù hợp trước thời điểm phục vụ, theo thỏa thuận áp dụng.',weight:7});
   const missing=Object.entries(tagUnit).filter(([u])=>!getUnitPlan(u)||getUnitPlan(u).status!=='CONFIRMED').map(([u])=>tagUnit[u]);
   if(missing.length)list.push({type:'pending',unit:'ĐH',title:'Chưa đủ xác nhận các phòng',
     desc:'Chưa có dữ liệu xác nhận ngày '+date()+': '+missing.join(', ')+'.',
     action:'Phòng Điều hành đề nghị cập nhật nội dung có ảnh hưởng; không kết luận thiếu/đủ nhân sự hoặc thiết bị khi thiếu nguồn.',weight:1});
   return list.sort((a,b)=>b.weight-a.weight).slice(0,5);
 }
 function renderOverview(){
   const rev=state?.snap2?'Lần 2 có bãi đỗ':state?.snap1?'Lần 1 đã lưu':'Chưa có lịch';
   const fl=getFlights(),needed=highlights();
   const statusCount=Object.keys(tagUnit).filter(x=>getUnitPlan(x)?.status==='CONFIRMED').length;
   const stats='<div class="v300-stats">'+[
    ['LỊCH BAY',fl.length?fl.length+' cặp':'Chờ nguồn',rev],
    ['NGUY CƠ ƯU TIÊN',needed.filter(x=>x.type!=='pending').length+' nhóm','Tự tính từ lịch đã lưu'],
    ['PHÒNG XÁC NHẬN',statusCount+'/5','Không tự dùng dữ liệu ca trước'],
    ['BÁO CÁO',state?.snap2?'Lần 2':state?.snap1?'Lần 1':'Chưa có','Giữ đúng mẫu hiện hành']
   ].map(x=>'<div class="v300-stat"><span>'+x[0]+'</span><strong>'+H(x[1])+'</strong><small>'+H(x[2])+'</small></div>').join('')+'</div>';
   const cards=needed.length?needed.slice(0,4).map(x=>'<article class="v300-alert"><div><strong>'+H(x.title)+'</strong><small>'+H(x.unit)+'</small>'+
     '<p>'+H(x.desc)+'</p><div class="v300-action-note">'+H(x.action)+'</div></div></article>').join(''):
     '<p class="v300-empty">Chưa có nguy cơ đủ căn cứ để hiển thị. Cần tải lịch và xác nhận dữ liệu các phòng.</p>';
   $('v300Page').innerHTML=stats+wrapPanel('Điểm cần chủ động chuẩn bị','Chỉ chọn nguy cơ có ý nghĩa điều hành; không liệt kê tất cả chuyến.',cards)+
    wrapPanel('Quy trình nhanh','Một ngày khai thác, mỗi phòng một lần xác nhận.', '<div class="v300-steps">'+
    [['1','Lịch bay','Lần 1 là nền; Lần 2 cập nhật bãi.','sources'],['2','Các phòng','Nhập nguồn lực và ngoại lệ.','KTS'],
     ['3','Phân tích','Tìm điểm nghẽn trước ca.','analysis'],['4','Báo cáo','Duyệt và xuất theo form gốc.','report']].map(x=>
     '<button data-v300-route="'+x[3]+'" class="v300-step" '+(!canOpen(x[3])?'disabled':'')+'><b>'+x[0]+'</b>'+
     '<span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></span><span>↗</span></button>').join('')+'</div>')+
    '<div class="v300-cta"><div><strong>Hoàn thiện dự báo D+1</strong><span>Kiểm tra những nguy cơ đã có căn cứ rồi phát hành báo cáo.</span></div>'+
    '<button class="v300-cta-btn" data-v300-route="report">XEM BÁO CÁO TGĐ →</button></div>';
 }
 // Read-only compact confirmation view. The underlying 5 role fields are
 // preserved and can always be reopened for corrections; nothing is re-summed
 // in this display to avoid counting shared duties twice.
 function savedTeamSummary(u){
   const plan=getUnitPlan(u),details=plan?.status==='CONFIRMED'?plan.details||{}:{};
   const count=(code,shift)=>getStaff(u,code,shift)?.quantity??null;
   const groups=u==='KTS'?[
     ['PVSĐ',details.pvb_morning??null,details.pvb_night??null],
     ['PVHLNG',count('TERMINAL_BAGGAGE','SÁNG'),count('TERMINAL_BAGGAGE','ĐÊM')],
     ['BỐC XẾP PVSĐ',count('BAGGAGE','SÁNG'),count('BAGGAGE','ĐÊM')],
     ['SKYONE',count('SKYONE_BAGGAGE','SÁNG'),count('SKYONE_BAGGAGE','ĐÊM')]
   ]:[
     ['Đội đến',count('PVHK_ARRIVAL_TEAM','SÁNG'),count('PVHK_ARRIVAL_TEAM','ĐÊM')],
     ['Đội đi',count('PVHK_DEPARTURE_TEAM','SÁNG'),count('PVHK_DEPARTURE_TEAM','ĐÊM')]
   ];
   const label=u==='KTS'?'PVSĐ':'PVHK';
   const show=x=>x==null||String(x).trim()===''?'CHỜ XÁC NHẬN':H(x)+' người';
   return '<div class="v317-pvsd-one-cell v318-shift-summary" role="group" aria-label="Quân số '+label+' theo ca">'+
     [['CA SÁNG',1],['CA TỐI',2]].map(([name,col])=>
       '<div class="v318-shift-cell" data-v318-shift="'+(col===1?'SÁNG':'ĐÊM')+'">'+
         '<strong>'+name+'</strong><div>'+
           groups.map(x=>'<span class="v318-shift-count"><b>'+H(x[0])+':</b> '+show(x[col])+'</span>').join(' · ')+
         '</div></div>').join('')+
     '<small>'+(u==='KTS'?'PVSĐ là tổng phòng đã xác nhận; các nhóm còn lại không cộng thêm vào tổng.':
       'Đội đến và đội đi hiển thị riêng trong mỗi ca, không cộng trùng số người.')+'</small></div>';
 }
 function pvsdSavedSummary(){return savedTeamSummary('KTS');}
 function pvhkSavedSummary(){return savedTeamSummary('PVHK');}
 function structuredStaffInputs(u){
   const schema=root.SagsStaffRosterV320?.TEAMS?.[u];
   if(!schema)return '';
   const defined=new Set(schema.flatMap(group=>group.parts.map(part=>part[0])));
   const extra=(staffRoles[u]||[]).filter(([code])=>!defined.has(code));
   const heading=u==='PVHK'?'PVHK – QUÂN SỐ THEO ĐỘI':'PVSĐ – QUÂN SỐ THEO BỘ PHẬN';
   const shiftColumn=(shift,label)=>'<section class="v320-shift-card" aria-label="'+label+'">'+
     '<h3>'+label+'</h3><div class="v320-shift-rows">'+schema.map(group=>
       '<div class="v320-staff-group"><strong>'+H(group.label)+'</strong><div class="v320-staff-parts">'+
       group.parts.map(([code,type])=>
         '<label><span>'+H(type==='Chính'?'Số người':type)+'</span>'+
         '<input type="number" min="0" max="9999" inputmode="numeric" '+
           'aria-label="'+H(group.label+' '+(type==='Chính'?'nhân sự chính':type)+' '+label)+'" '+
           'data-v300-staff="'+H(code)+'|'+shift+'" '+
           'value="'+H(getStaff(u,code,shift)?.quantity??'')+'" placeholder="—"></label>'
       ).join('')+'</div></div>').join('')+'</div></section>';
   const extraHtml=extra.length?'<details class="v300-details v320-legacy-staff">'+
     '<summary>Các nhóm nhập theo cấu trúc cũ / bổ sung ('+extra.length+') – mở khi cần</summary>'+
     '<p class="v300-hint">Dữ liệu SKYONE tổng của bản trước không tự chia vào HLSĐ, HLNG hoặc PVTT. Chỉ nhập vào ô SKO mới khi đã xác nhận đúng bộ phận.</p>'+
     '<div class="v300-table-wrap"><table class="v300-table"><thead><tr><th>Nhóm cũ</th><th>Ca sáng</th><th>Ca tối</th></tr></thead><tbody>'+
     extra.map(([code,txt])=>'<tr><th>'+H(txt)+'</th>'+
       ['SÁNG','ĐÊM'].map(shift=>'<td><input type="number" min="0" max="9999" '+
         'aria-label="'+H(txt+' '+shift)+'" data-v300-staff="'+H(code)+'|'+shift+'" '+
         'value="'+H(getStaff(u,code,shift)?.quantity??'')+'" placeholder="—"></td>').join('')+'</tr>').join('')+
     '</tbody></table></div></details>':'';
   return wrapPanel('01 · '+heading,
     'Nhập trực tiếp theo nhóm, tách CA SÁNG / CA TỐI; ô trống = chưa xác nhận, 0 = đã xác nhận bằng 0.',
     '<div class="v320-roster-grid">'+shiftColumn('SÁNG','CA SÁNG')+shiftColumn('ĐÊM','CA TỐI')+'</div>'+
     '<p class="v300-hint">SKO = SKYONE, TC = nhân sự tăng cường. Nhập riêng cho từng bộ phận; không cộng trùng hoặc suy đoán số người từ nhóm khác.</p>'+
     extraHtml+
     '<div class="v300-secondary-row"><button type="button" data-v300-command="copy-previous" data-unit="'+u+'">↶ Tham khảo hôm trước</button><span>Chỉ sao chép vào ô đang trống; kiểm tra lại trước khi lưu</span></div>');
 }
 function roleInputs(u){
   const roles=staffRoles[u]||[];
   if(!roles.length)return '';
   if(['PVHK','KTS'].includes(u)&&root.SagsStaffRosterV320)return structuredStaffInputs(u);
   const primary={DH:['COORD'],KTS:['BAGGAGE','GSE_DRIVER'],PVHK:['PVHK_ARRIVAL_TEAM','PVHK_DEPARTURE_TEAM'],KHO:['WAREHOUSE_CARGO']}[u]||[];
   const rows=items=>items.map(([code,label])=>'<tr><th scope="row">'+H(label)+'</th>'+
     ['SÁNG','ĐÊM'].map(shift=>'<td><input type="number" min="0" max="9999" inputmode="numeric" aria-label="'+H(label)+' ca '+shift+'" data-v300-staff="'+H(code)+'|'+shift+'" value="'+H(getStaff(u,code,shift)?.quantity??'')+'" placeholder="—"></td>').join('')+'</tr>').join('');
   const table=items=>'<div class="v300-table-wrap"><table class="v300-table"><thead><tr><th>Nhóm nhân sự</th><th>Ca sáng</th><th>Ca đêm</th></tr></thead><tbody>'+rows(items)+'</tbody></table></div>';
   const main=roles.filter(x=>primary.includes(x[0])),other=roles.filter(x=>!primary.includes(x[0]));
   const hasSaved=roles.some(([code])=>['SÁNG','ĐÊM'].some(sh=>getStaff(u,code,sh)));
   if(u==='DH'){
     const plan=getUnitPlan('DH'),d=plan?.details||{};
     const saved=(v)=>v==null||String(v).trim()===''?'CHỜ XÁC NHẬN':H(v)+' người';
     const summary='<div class="v318-shift-summary v319-dh-total">'+
       [['CA SÁNG','morning'],['CA TỐI','night']].map(([name,k])=>
         '<label class="v318-shift-cell"><strong>'+name+' · NHÂN SỰ PHÒNG ĐH</strong>'+
           '<input data-v319-dh-total="'+k+'" type="number" min="0" max="9999" inputmode="numeric" '+
             'aria-label="Tổng nhân sự Phòng ĐH '+name+'" placeholder="Nhập tổng nhân sự phòng" '+
             'value="'+H(d['pvb_'+k]??'')+'"><small>Đã lưu: '+saved(d['pvb_'+k])+'</small></label>'
       ).join('')+'</div>';
     return wrapPanel('01 · NHÂN SỰ PHÒNG ĐIỀU HÀNH',
       'Nhập tổng quân số thực tế của cả Phòng ĐH theo từng ca. Điều phối chỉ là một bộ phận, không được coi là toàn phòng.',
       summary+
       '<details class="v300-details v319-dh-role"><summary>Phân bổ chi tiết (tùy chọn) · Điều phối/CO</summary>'+
         table(roles)+'</details>'+
       '<div class="v300-secondary-row"><button type="button" data-v300-command="copy-previous" data-unit="DH">↶ Tham khảo hôm trước</button>'+
         '<span>Chỉ ghi nhận khi đã đối chiếu ca thực tế</span></div>'+
       '<p class="v300-hint">Quân số Phòng ĐH nhập riêng, không tự lấy từ số Điều phối; bỏ trống = chưa xác nhận, 0 = đã xác nhận không có.</p>');
   }
   const inputs=['KTS','PVHK'].includes(u)?
     (u==='KTS'?pvsdSavedSummary():pvhkSavedSummary())+
     '<details class="v300-details v317-pvsd-edit v318-team-edit" '+(!hasSaved?'open':'')+'><summary>NHẬP / CHỈNH SỬA QUÂN SỐ CHI TIẾT</summary>'+
     table(main)+(other.length?'<div class="v317-pvsd-extra">'+table(other)+'</div>':'')+'</details>':
     table(main)+(other.length?'<details class="v300-details v311-advanced"><summary>Nhóm nhân sự bổ sung ('+other.length+') · chỉ mở khi cần</summary>'+table(other)+'</details>':'');
   return wrapPanel('01 · Quân số theo ca','Chỉ nhập số người thực sự có thể bố trí; không nhập lại các số liệu lịch bay.',
     inputs+
     '<div class="v300-secondary-row"><button type="button" data-v300-command="copy-previous" data-unit="'+u+'">↶ Tham khảo hôm trước</button><span>Phải kiểm tra lại trước khi xác nhận ngày mới</span></div>'+
     '<p class="v300-hint">Ô trống = chưa xác nhận · 0 = xác nhận không có người · Không cộng trùng nhân sự kiêm nhiệm.</p>');
 }
 function cargoEntryRow(x={},side='departure'){
   const minute=x.ready_by_min,hasSaved=x.cargo_kg!=null&&x.flight_no;
   const weight=hasSaved?Number(x.cargo_kg):null;
   // Existing kg stay mathematically equivalent; large confirmed bookings show
   // tonnes for ease of reading (e.g. 2500 kg → 2.5 tấn).
   const unit=hasSaved&&weight>=1000?'TAN':hasSaved?'KG':side==='departure'?'TAN':'KG';
   const amount=hasSaved?(unit==='TAN'?weight/1000:weight):'';
   const ready=minute==null?'':String(Math.floor((Number(minute)%1440)/60)).padStart(2,'0')+
      ':'+String(Number(minute)%60).padStart(2,'0');
   const title=side==='departure'?'đi':'đến';
   return '<tr data-v300-cargo-row data-v320-cargo-side="'+side+'">'+
     '<td><input data-v300-cargo="flight" aria-label="Chuyến bay '+title+'" '+
       'list="v320CargoFlights'+side+'" maxlength="20" placeholder="Số chuyến" value="'+H(x.flight_no||'')+'"></td>'+
     '<td><input data-v300-cargo="kg" aria-label="Trọng lượng booking chuyến '+title+'" '+
       'inputmode="decimal" type="number" min="0" step="any" placeholder="0" value="'+H(amount)+'"></td>'+
     '<td><select data-v300-cargo="unit" aria-label="Đơn vị trọng lượng booking">'+
       '<option value="KG" '+(unit==='KG'?'selected':'')+'>KG</option>'+
       '<option value="TAN" '+(unit==='TAN'?'selected':'')+'>TẤN</option></select></td>'+
     '<td><input data-v300-cargo="pcs" type="number" min="0" step="1" '+
       'aria-label="Số kiện (tùy chọn)" placeholder="—" value="'+H(x.cargo_pcs??'')+'"></td>'+
     '<td><input data-v300-cargo="ready" aria-label="Hàng sẵn sàng (tùy chọn)" '+
       'type="time" value="'+H(ready)+'"></td></tr>';
 }
 function cargoUnitTables(){
   const model=root.SagsCargoBookingV320;
   const pairs=getFlights(),detail=state?.snap2?.payload?.source_detail||
     state?.snap1?.payload?.source_detail||{};
   const split=model?.split((state?.cargo||[]).filter(x=>x.flight_no),pairs,detail)||
     {departure:[],arrival:[],unmatched:[]};
   const flightList=(side)=>[...new Set([
     ...pairs.map(x=>side==='departure'?x.departure:x.arrival),
     ...(detail[side==='departure'?'departures':'arrivals']||[]).map(x=>x.no||x.flight_no)
   ].filter(Boolean))].map(x=>'<option value="'+H(model.normalize(x))+'"></option>').join('');
   const table=(side,label)=>'<section class="v320-cargo-panel" data-v320-booking-panel="'+side+'">'+
     '<h3>'+label+'</h3><datalist id="v320CargoFlights'+side+'">'+flightList(side)+'</datalist>'+
     '<div class="v300-table-wrap v320-cargo-scroll"><table class="v300-table v320-cargo-table">'+
     '<thead><tr><th>Chuyến bay</th><th>Booking</th><th>Đơn vị</th><th>PCS</th><th>Sẵn sàng</th></tr></thead>'+
     '<tbody id="v320CargoBody'+side+'">'+
        split[side].map(x=>cargoEntryRow(x,side)).join('')+cargoEntryRow({},side)+
     '</tbody><tfoot><tr><th>TỔNG</th><td colspan="4"><strong data-v320-cargo-total="'+side+'">'+
       H(model.formattedTotal(model.total(split[side])))+'</strong></td></tr></tfoot></table></div>'+
     '<button type="button" class="v311-add" data-v300-command="add-cargo" data-side="'+side+
       '">+ THÊM CHUYẾN '+(side==='departure'?'ĐI':'ĐẾN')+'</button></section>';
   const others=split.unmatched.length?
     '<details class="v300-details v320-cargo-unmatched"><summary>'+
       split.unmatched.length+' booking cũ không xác định được chiều chuyến từ lịch hiện tại</summary>'+
       '<p class="v300-hint">Không tự coi các dòng này là chuyến đi hoặc đến; cần kiểm tra số hiệu trong lịch trước khi nhập lại.</p>'+
       split.unmatched.map(x=>'<p>'+H(x.flight_no)+': '+
         H(model.formattedTotal(Number(x.cargo_kg||0)))+'</p>').join('')+'</details>':'';
   return wrapPanel('02 · BOOKING HÀNG HÓA – CHUYẾN ĐI VÀ CHUYẾN ĐẾN',
     'Nhập số hiệu, trọng lượng và chọn KG/TẤN ngay tại từng dòng. Hai bảng cộng riêng, không gộp hàng đi với hàng đến.',
     '<p class="v300-hint">Ví dụ: 2.5 TẤN = 2.500 KG; 500 KG = 0,5 TẤN. Tổng tự động quy đổi. Không nhập số 2.5 dưới đơn vị KG nếu thực tế là 2,5 tấn.</p>'+
     '<div class="v320-cargo-layout">'+table('departure','CHUYẾN BAY ĐI')+
       table('arrival','CHUYẾN BAY ĐẾN')+'</div>'+others+
     '<p class="v300-hint">PCS và giờ hàng sẵn sàng là dữ liệu bổ sung; ô trống không mặc định bằng 0. Chỉ lưu booking đã được Kho Hàng xác nhận.</p>');
 }
 function updateCargoTotals(){
   const model=root.SagsCargoBookingV320,page=$('v300Page');
   if(!model||!page)return;
   for(const side of ['departure','arrival']){
     let kg=0,valid=true;
     for(const row of page.querySelectorAll('[data-v320-cargo-side="'+side+'"]')){
       const value=row.querySelector('[data-v300-cargo="kg"]')?.value||'';
       if(!value.trim())continue;
       const unit=row.querySelector('[data-v300-cargo="unit"]')?.value||'KG';
       const n=model.toKg(value,unit);
       if(n==null){valid=false;continue}
       kg+=n;
     }
     const target=page.querySelector('[data-v320-cargo-total="'+side+'"]');
     if(target)target.textContent=(valid?'':'KIỂM TRA GIÁ TRỊ · ')+model.formattedTotal(kg);
   }
 }

 function issueFields(u){
   if(u==='KTS'){
     const groups=(state?.gse||[]).filter(x=>['STAIRS','BELT','TRACTOR','COBUS_LARGE','PUSHBACK','GPU','ASU'].includes(x.code));
     const devices=groups.length?'<details class="v300-details v311-advanced"><summary>Điều chỉnh số thiết bị khả dụng (chỉ khi thay đổi)</summary>'+
       '<div class="v300-device-grid">'+groups.map(x=>'<label>'+H(x.code)+' · tối đa '+H(x.catalog_total)+
       '<input data-v300-gse="'+H(x.code)+'" type="number" min="0" max="'+H(x.catalog_total)+'" placeholder="Chờ xác nhận" value="'+H(x.ready_count??'')+'"></label>').join('')+'</div></details>':'';
     return wrapPanel('02 · Thiết bị hạn chế / thay đổi','Chỉ nhập xe mới hỏng, hạn chế, phục hồi hoặc điều chỉnh số khả dụng. Không nhập lại danh mục.',
       '<div class="v300-fields-grid"><label>Mã xe (nếu có thay đổi)<input data-v300-issue="id" maxlength="55" placeholder="Mã xe"></label>'+
       '<label>Trạng thái<select data-v300-issue="status"><option value="OUT_OF_SERVICE">Hỏng / ngưng sử dụng</option><option value="REPAIR">Đang sửa</option><option value="LIMITED">Hạn chế</option><option value="RETURNED">Đã phục hồi</option></select></label>'+
       '<label class="v300-wide">Ảnh hưởng phục vụ<input data-v300-issue="fault" maxlength="260" placeholder="Hỏng gì? Ảnh hưởng chuyến/bãi nào?"></label></div>'+devices);
   }
   if(u==='KHO')return cargoUnitTables();
   return '';
 }

 function renderDepartment(u){
   const plan=getUnitPlan(u),details=plan?.details||{};
   const focus={
     DH:'Nhập tổng nhân sự toàn Phòng ĐH theo ca; Điều phối là bộ phận riêng. Bổ sung các thay đổi AOC, yêu cầu hãng/charter và đề xuất điều hành.',
     KTS:'Nhập Cán bộ Phòng, Đội PVSĐ, HLSĐ, HLNG, PVTT và Xưởng SC theo ca; tách rõ SKO/TC đúng nhóm. Đồng thời ghi phương án phối hợp khi cần.',
     PVHK:'Nhập riêng Cán bộ Phòng, Đội PVHK đi và Đội PVHK đến cho từng ca. Đội đi/đến chỉ là các nhóm trong phòng, không tự gộp thành tổng biên chế.',
     KHO:'Nhập booking CHUYẾN ĐI và CHUYẾN ĐẾN ở hai bảng riêng; chọn rõ KG/TẤN để tránh sai khối lượng. Các trường PCS và giờ sẵn sàng chỉ nhập khi có nguồn.',
     QA_IT:'Chỉ ghi vấn đề đã xác nhận về an toàn, FOD, thời tiết hoặc tồn tại ảnh hưởng ca.'
   };
   const names=noteFields[u]||[],hasNotes=names.some(([k])=>details[k]);
   const fields=names.map(([k,label])=>'<label>'+H(label)+
     '<textarea data-v300-note="'+H(k)+'" rows="2" maxlength="350" placeholder="Chỉ ghi chuyến/khung giờ, nguy cơ cụ thể và phương án">'+H(details[k]||'')+'</textarea></label>').join('');
   const comments=wrapPanel(u==='QA_IT'?'01 · Thông tin cần báo':'03 · Ngoại lệ / phương án bổ sung',
     'Không cần viết lại số chuyến, giờ cao điểm và bãi đỗ: báo cáo đã tự tổng hợp từ nguồn.',
     '<details class="v300-details v311-advanced" '+(hasNotes||u==='QA_IT'?'open':'')+'><summary>Ghi chú để đưa vào báo cáo ('+(hasNotes?'đang có nội dung':'tùy chọn')+')</summary><div class="v300-fields-grid">'+fields+'</div></details>');
   const flights=getFlights(),dep=dataRows(),bays=flights.filter(x=>x.bay!=null).length;
   const auto=wrapPanel('Dữ liệu tự lấy từ lịch bay · không phải nhập',
     'Lịch Lần 1/Lần 2 cung cấp STA, STD, số chuyến, đăng bạ, vị trí đỗ và phân tích cao điểm.',
     '<div class="v311-source-grid"><div><small>CẶP CHUYẾN</small><strong>'+H(flights.length||'Chưa có lịch')+'</strong></div>'+
     '<div><small>BÃI CÓ NGUỒN</small><strong>'+H(bays)+'/'+H(flights.length)+'</strong></div>'+
     '<div><small>CHARTER (##)</small><strong>'+H(dep.filter(x=>x.charter).length)+'</strong></div></div>');
   $('v300Page').innerHTML='<div class="v300-dept-head"><div><strong>'+H(tagUnit[u])+'</strong><small>Ngày '+H(date())+' · theo đúng phân quyền</small></div>'+smallState(plan?.status)+'</div>'+
     '<div class="v311-entry-guide"><b>Phòng cần nhập:</b> '+H(focus[u])+'</div>'+auto+
     roleInputs(u)+issueFields(u)+comments+
     '<div class="v300-savebar v311-savebar"><div><strong>Xác nhận dữ liệu cho ngày '+H(date())+'</strong>'+
     '<small>Thông tin bỏ trống vẫn là CHỜ XÁC NHẬN, không được mặc định đủ.</small>'+
     '<label class="v300-check"><input type="checkbox" data-v300-no-exception '+(details.no_new_exceptions==='YES'?'checked':'')+'> Đã kiểm tra: không có ngoại lệ nào khác cần bổ sung</label></div>'+
     '<button type="button" class="v300-primary" data-v300-command="save" data-unit="'+u+'">LƯU & XÁC NHẬN PHÒNG</button></div>';
 }

 async function getNewData(){
   if(!db())return;
   const day=date();
   const queries=[
    db().from('ops_forecast_snapshots').select('revision,payload,source_filename').eq('service_date',day).in('revision',[1,2]),
    db().from('ops_unit_forecasts').select('*').eq('service_date',day),
    db().from('ops_staff_capacity').select('*').eq('service_date',day),
    db().from('ops_gse_capacity').select('*').eq('service_date',day),
    db().from('ops_gse_issues').select('*').eq('service_date',day),
    db().from('ops_warehouse_cargo_plan').select('*').eq('service_date',day),
    db().from('ops_flights').select('*').eq('service_date',day),
    db().from('ops_minimum_service_norms').select('*')
   ];
   const results=await Promise.all(queries);
   for(const r of results)if(r.error)throw Error(r.error.message);
   const [snaps,plans,staff,gse,issues,cargo,flights,minimumNorms]=results.map(r=>r.data||[]);
   return {snap1:snaps.find(x=>x.revision===1),snap2:snaps.find(x=>x.revision===2),
    plans,staff,gse,issues,cargo,flights,minimumNorms};
 }
 async function refresh(){
   if(!mounted||loading||!user())return;
   const ticket=++serial;
   loading=true;showLoading(true);
   try{
     state=await getNewData();
     if(ticket!==serial)return;
     render();
     status('Đã đồng bộ dữ liệu ngày '+date()+'. Các nguồn chưa xác nhận không được coi là đủ.');
   }catch(e){status('Không đọc được dữ liệu: '+e.message,true);if(state)render();}
   finally{loading=false;showLoading(false)}
 }
 function parkNative(){
   const page=$('v300Page'),dock=$('v300LegacyDock');if(!page||!dock)return;
   for(const node of [...page.querySelectorAll(':scope > [id^="tab-"]')]){node.classList.add('hidden');dock.appendChild(node)}
 }
 function render(){
   if(!mounted)return;
   parkNative();
   const nav=$('v300Nav');
   nav.querySelectorAll('[data-v300-route]').forEach(x=>x.classList.toggle('on',x.dataset.v300Route===view));
   const obj=NAV.find(x=>x[0]===view)||NAV[0];
   $('v300Heading').textContent=obj[1];
   $('v300Subheading').textContent=obj[3];
   if(view==='overview')return renderOverview();
   if(Object.keys(tagUnit).includes(view))return renderDepartment(view);
   if(view==='analysis')return renderAnalysis();
   if(view==='report')return renderReport();
   if(view==='sources'||view==='norms'||view==='shuttle'||view==='admin')return attachLegacy(view);
 }
 function prepareSource(node){
   if(node.dataset.v300Prepared)return;
   const panels=[...node.children].filter(el=>el.classList.contains('panel'));
   if(panels.length>1){
     const extra=document.createElement('details');extra.className='v300-source-extra v300-details';
     const head=document.createElement('summary');
     head.textContent='Mở nhập thủ công / đối chiếu dữ liệu và lịch đã lưu (khi cần)';
     extra.appendChild(head);
     panels.slice(1).forEach(panel=>extra.appendChild(panel));
     node.appendChild(extra);
   }
   const banner=document.createElement('div');banner.className='v300-source-banner';
   banner.innerHTML='<strong>01 · LỊCH BAY LÀ NGUỒN DUY NHẤT CHO DỰ BÁO</strong>'+
    '<p>Dùng file Excel để lập Lần 1. Khi có lịch cập nhật bãi đỗ, lưu Lần 2; không nhập lại sản lượng/giờ bay vào biểu mẫu các phòng.</p>';
   node.prepend(banner);
   node.dataset.v300Prepared='1';
 }
 function attachLegacy(k){
   const target={sources:'tab-sources',norms:'tab-norms',shuttle:'tab-shuttle-report',admin:'tab-admin'}[k];
   const node=$(target);
   if(!node){$('v300Page').innerHTML=wrapPanel('Chưa sẵn sàng','','Không tìm thấy công cụ đã lưu.');return}
   if(k==='sources')prepareSource(node);
   $('v300Page').replaceChildren(node);
   node.classList.remove('hidden');
   node.classList.add('v300-embedded');
   if(k==='sources')root.SagsSecondUI?.refresh?.();
   if(k==='norms')root.SagsMinimumV231?.refresh('norms');
   if(k==='shuttle'){
     // The old shuttle screen displayed exports only. V3.04 mounts the live
     // editable V24 matrix in the same tab and refreshes its confirmed data.
     root.SagsShuttleGridV24?.refresh?.();
     root.SagsShuttleExport?.bind?.();
     root.SagsShuttleExport?.renderPreview?.();
   }
   if(k==='admin')root.RnsRadarAdmin?.loadShared?.();
 }
 function renderAnalysis(){
  const list=highlights();
  const html=list.filter(x=>x.type!=='pending').map((x,i)=>
   '<article class="v300-risk"><div class="v300-risk-number">'+String(i+1).padStart(2,'0')+'</div><div>'+
   '<div class="v300-risk-title"><h3>'+H(x.title)+'</h3><span>'+H(x.unit)+'</span></div>'+
   '<p>'+H(x.desc)+'</p><div class="v300-action-note"><b>Phương án dự báo</b> · '+H(x.action)+'</div></div></article>').join('');
  $('v300Page').innerHTML=wrapPanel('Nguy cơ cần chuẩn bị trước ca',
   'Chỉ hiển thị các điểm có thể ảnh hưởng khai thác theo lịch D+1; ưu tiên cao điểm và điều chuyển nguồn lực.',
   html||'<p class="v300-empty">Chưa xác định nguy cơ đủ căn cứ từ lịch đã có.</p>')+
   wrapPanel('Kiểm soát thông tin chưa đủ', 'Thông tin thiếu cần được xác nhận, không được xem là sẵn sàng.',
    list.filter(x=>x.type==='pending').map(x=>'<p>'+H(x.desc)+'</p>').join('')||
     '<p>Không ghi nhận thiếu xác nhận ở cấp phòng theo dữ liệu đã lưu.</p>')+
   '<div class="v300-cta"><div><strong>Từ dự báo sang phương án</strong><span>Chọn các nguy cơ trọng tâm trước khi xuất báo cáo.</span></div>'+
   '<button class="v300-cta-btn" data-v300-route="report">XEM BẢN DỰ BÁO →</button></div>';
 }
 async function renderReport(){
   $('v300Page').innerHTML=wrapPanel('Báo cáo điều hành D+1',
    'Giữ mẫu Lần 1; Lần 2 chỉ cập nhật dữ liệu và nhận định có căn cứ.',
    '<div class="v300-report-controls"><button data-v300-command="preview" class="v300-primary">TẠO / CẬP NHẬT BẢN XEM TRƯỚC</button>'+
    (['DH','ADMIN'].includes(role())?'<button data-v300-command="word">XUẤT WORD</button><button data-v300-command="pdf">XUẤT PDF</button>'+
    '<label class="v315-pdf-toggle"><input id="v315WorkspaceHidePending" type="checkbox" checked> Ẩn thông tin chưa xác nhận khi xuất PDF</label>':'')+
    '</div><div class="v300-report-preview" id="v300ReportPreview"><p class="v300-hint">Chọn tạo bản xem trước để tổng hợp số liệu hiện có.</p></div>');
   await previewReport();
 }
 async function previewReport(){
   const dest=$('v300ReportPreview');if(!dest)return;
   dest.innerHTML='<p class="v300-hint">Đang tổng hợp báo cáo theo ngày '+H(date())+'…</p>';
   try{
     if(!root.SagsReportV19)throw Error('Chưa nạp công cụ báo cáo.');
     await root.SagsReportV19.preview();
     const src=$('v19ReportPreview')?.querySelector('.v19-report-sheet');
     if(!src)throw Error(($('v19ReportPreview')?.textContent||'').trim()||'Chưa có lịch hợp lệ để lập báo cáo');
     dest.replaceChildren(src.cloneNode(true));
     status('Đã tạo bản xem trước từ nguồn dữ liệu ngày '+date()+'.');
   }catch(e){dest.innerHTML='<div class="v300-error">CHƯA TẠO ĐƯỢC: '+H(e.message)+'</div>';status('Báo cáo chưa sẵn sàng: '+e.message,true)}
 }
 async function exportReport(ext){
   if(!['DH','ADMIN'].includes(role()))return;
   await previewReport();
   const src=$('v300ReportPreview')?.querySelector('.v19-report-sheet');
   if(!src)return;
   try{
     if(!root.SagsOfficeExportV29)throw Error('Công cụ xuất Word/PDF chưa sẵn sàng.');
     const target='SAGS_CXR_DU_BAO_'+(state?.snap2?'LAN_2':'LAN_1')+'_'+date().replaceAll('-','')+'.'+ext;
     const hidePendingWarnings=ext==='pdf'&&$('v315WorkspaceHidePending')?.checked===true;
     await root.SagsOfficeExportV29.exportElement(src,ext,target,{hidePendingWarnings});
     status('Đã xuất '+target+'.');
   }catch(e){status('Chưa xuất được '+ext.toUpperCase()+': '+e.message,true)}
 }
 async function saveDepartment(u){
   if(saving||!allowed(u)||!state)return;
   if(date()!==$('day')?.value)return;
   const page=$('v300Page'),now=new Date().toISOString(),day=date();
   const items=[],details={...(getUnitPlan(u)?.details||{})};
   const sum={SÁNG:0,ĐÊM:0};
   for(const el of page.querySelectorAll('[data-v300-staff]')){
     const v=el.value.trim();if(!v)continue;
     const n=num(v);if(!Number.isInteger(n)||n<0||n>9999)return status('Quân số phải là số nguyên 0–9999.',true);
     const [role_code,shift]=el.dataset.v300Staff.split('|');
     const morning=shift==='SÁNG';sum[shift]+=n;
     items.push({service_date:day,unit:u,role_code,shift,
       start_min:morning?495:1095,end_min:morning?1095:1935,quantity:n,
       confirmed_by:user().id,confirmed_at:now});
   }
   if(u==='DH'){
     for(const el of page.querySelectorAll('[data-v319-dh-total]')){
       const k=el.dataset.v319DhTotal,v=el.value.trim();
       if(v==='')continue; // Preserve saved value when not edited; never infer from COORD.
       const n=num(v);
       if(!Number.isInteger(n)||n<0||n>9999)return status('Tổng nhân sự Phòng ĐH phải là số nguyên 0–9999.',true);
       details['pvb_'+k]=String(n);
       details['pvb_'+k+'_status']='PENDING';details['pvb_'+k+'_required']='';
     }
   }
   for(const el of page.querySelectorAll('[data-v300-note]'))details[el.dataset.v300Note]=el.value.trim();
   if(items.length&&['KTS','PVHK'].includes(u))details.personnel_structure='V3.20';
   if(items.length&&!['DH','KTS','PVHK'].includes(u)){
     const activeShifts=new Set(items.map(x=>x.shift));
     for(const sh of activeShifts){
       const k=sh==='SÁNG'?'morning':'night';
       // Total staffing is a rollup, not independently typed by each unit.
       // The confirmation is NOT a positive sufficiency judgement.
       details['pvb_'+k]=String(sum[sh]);
       details['pvb_'+k+'_status']='PENDING';
       details['pvb_'+k+'_required']='';
     }
   }
   let issue=null,cargo=[],gseChanges=[];
   if(u==='KTS'){
     const id=page.querySelector('[data-v300-issue="id"]')?.value.trim()||'';
     const fault=page.querySelector('[data-v300-issue="fault"]')?.value.trim()||'';
     const statusValue=page.querySelector('[data-v300-issue="status"]')?.value||'OUT_OF_SERVICE';
     if(id){
       if(id.length<2||(!fault&&statusValue!=='RETURNED'))return status('Thiết bị cần mã và lý do hạn chế; phục hồi cần mã thiết bị.',true);
       const previous=state.issues.find(x=>x.equipment_id===id);
       issue={service_date:day,equipment_id:id,equipment_group:previous?.equipment_group||'OTHERS',
         issue_status:statusValue,fault:fault||previous?.fault||'Thiết bị đã phục hồi',
         impact:previous?.impact||'',workaround:previous?.workaround||'',
         expected_return:previous?.expected_return||null,updated_by:user().id,updated_at:now};
     }
     for(const el of page.querySelectorAll('[data-v300-gse]')){
       const original=state.gse.find(x=>x.code===el.dataset.v300Gse),newValue=el.value.trim();
       if(!original||!newValue||String(original.ready_count??'')===newValue)continue;
       const n=num(newValue);
       if(!Number.isInteger(n)||n<0||n>original.catalog_total||
          (original.ready_a330_count!=null&&n<original.ready_a330_count))
          return status('Giá trị khả dụng không hợp lệ cho '+el.dataset.v300Gse+'; cần kiểm tra số A330 khả dụng.',true);
       gseChanges.push({...original,ready_count:n,service_date:day,confirmed_by:user().id,confirmed_at:now,updated_at:now});
     }
   }
   if(u==='KHO'){
     const seen=new Set(),available=new Set(dataRows().filter(x=>x.no&&!x.ferry).map(x=>String(x.no).toUpperCase().replace(/^##/,'')));
     for(const row of page.querySelectorAll('[data-v300-cargo-row]')){
       const flight_no=(row.querySelector('[data-v300-cargo="flight"]')?.value||'').trim().toUpperCase().replace(/^##/,''),
         kg=(row.querySelector('[data-v300-cargo="kg"]')?.value||'').trim(),
         pcs=(row.querySelector('[data-v300-cargo="pcs"]')?.value||'').trim(),
         ready=(row.querySelector('[data-v300-cargo="ready"]')?.value||'').trim();
       if(!flight_no&&!kg&&!pcs&&!ready)continue;
       if(!/^[A-Z0-9]{2,20}$/.test(flight_no)||!kg)return status('Kho: mỗi dòng cần số hiệu chuyến và KG được xác nhận.',true);
       if(available.size&&!available.has(flight_no))return status('Kho: chuyến '+flight_no+' không có trong lịch đi; vui lòng kiểm tra.',true);
       if(seen.has(flight_no))return status('Kho: chuyến '+flight_no+' bị nhập trùng.',true);
       seen.add(flight_no);
       const weight=Number(kg),qty=pcs===''?null:Number(pcs);
       if(!Number.isFinite(weight)||weight<0||(qty!=null&&(!Number.isInteger(qty)||qty<0)))
         return status('Kho: KG phải là số không âm; PCS nếu nhập phải là số nguyên không âm.',true);
       const ready_by_min=ready?Number(ready.split(':')[0])*60+Number(ready.split(':')[1]):null;
       const original=(state.cargo||[]).find(x=>x.flight_no===flight_no);
       if(original&&Number(original.cargo_kg)===weight&&Number(original.cargo_pcs??-1)===Number(qty??-1)&&
          Number(original.ready_by_min??-1)===Number(ready_by_min??-1))continue;
       cargo.push({service_date:day,flight_no,cargo_kg:weight,cargo_pcs:qty,ready_by_min,
         plan_note:original?.plan_note||'',updated_by:user().id,updated_at:now});
     }
   }
   const noException=!!page.querySelector('[data-v300-no-exception]')?.checked;
   if(noException)details.no_new_exceptions='YES';
   else details.no_new_exceptions='';
   if(!noException&&!items.length&&!(u==='DH'&&[...page.querySelectorAll('[data-v319-dh-total]')].some(el=>el.value.trim()))&&!issue&&!cargo.length&&!gseChanges.length&&
      !(noteFields[u]||[]).some(([key])=>details[key]))return status('Chưa có dữ liệu để xác nhận. Có thể quay lại khi có nguồn.',true);
   saving=true; const saveBtn=page.querySelector('[data-v300-command="save"]');
   if(saveBtn)saveBtn.disabled=true;status('Đang lưu và kiểm tra các nguồn đã cập nhật…');
   try{
     const write=async(promise,label)=>{const r=await promise;if(r.error)throw Error(label+': '+r.error.message);}
     if(items.length)await write(db().from('ops_staff_capacity').upsert(items,{onConflict:'service_date,unit,role_code,shift'}),'Quân số');
     if(gseChanges.length)await write(db().from('ops_gse_capacity').upsert(gseChanges,{onConflict:'service_date,code'}),'GSE');
     if(issue)await write(db().from('ops_gse_issues').upsert(issue,{onConflict:'service_date,equipment_id'}),'Thiết bị hạn chế');
     if(cargo.length)await write(db().from('ops_warehouse_cargo_plan').upsert(cargo,{onConflict:'service_date,flight_no'}),'Kho hàng');
     const old=getUnitPlan(u);
     await write(db().from('ops_unit_forecasts').upsert({
       service_date:day,unit:u,details,status:'CONFIRMED',revision:(old?.revision||0)+1,
       confirmed_by:user().id,confirmed_at:now,updated_by:user().id,updated_at:now
     },{onConflict:'service_date,unit'}),'Xác nhận đơn vị');
     status('ĐÃ XÁC NHẬN '+tagUnit[u]+' cho ngày '+day+'.');
     await refresh();
   }catch(e){status('Lưu chưa hoàn chỉnh: '+e.message+'. Kiểm tra dữ liệu trước khi lưu lại.',true)}
   finally{saving=false;if(saveBtn)saveBtn.disabled=false;}
 }
 async function copyPrevious(u){
   if(!allowed(u)||!db())return;
   const today=date(),d=new Date(today+'T00:00:00Z');
   if(!Number.isFinite(d.getTime()))return status('Ngày khai thác chưa hợp lệ.',true);
   d.setUTCDate(d.getUTCDate()-1);
   const before=d.toISOString().slice(0,10);
   const answer=await db().from('ops_staff_capacity').select('role_code,shift,quantity,confirmed_at')
     .eq('service_date',before).eq('unit',u);
   if(answer.error)return status('Không tải được quân số tham khảo: '+answer.error.message,true);
   let count=0;
   for(const row of answer.data||[]){
     if(!row.confirmed_at)continue;
     const selector='[data-v300-staff="'+row.role_code+'|'+row.shift+'"]';
     const input=$('v300Page')?.querySelector(selector);
     if(input&&input.value===''){input.value=String(row.quantity);count++;}
   }
   status(count?'Đã điền tham khảo '+count+' ô quân số từ ngày '+before+
     '. Cần kiểm tra và bấm XÁC NHẬN cho ngày '+today+'; chưa tự lưu.':
     'Không có quân số đã xác nhận ở ngày '+before+' để tham khảo.');
 }
 function handleClick(e){
   const route=e.target.closest('[data-v300-route]');if(route){go(route.dataset.v300Route);return}
   const command=e.target.closest('[data-v300-command]');if(!command)return;
   const cmd=command.dataset.v300Command;
   if(cmd==='add-cargo'){
     const side=command.dataset.side==='arrival'?'arrival':'departure';
     $('v320CargoBody'+side)?.insertAdjacentHTML('beforeend',cargoEntryRow({},side));
     updateCargoTotals();return;
   }
   if(cmd==='refresh')refresh();
   if(cmd==='save')saveDepartment(command.dataset.unit);
   if(cmd==='copy-previous')copyPrevious(command.dataset.unit);
   if(cmd==='preview')previewReport();
   if(cmd==='word')exportReport('docx');
   if(cmd==='pdf')exportReport('pdf');
 }
 function go(k){
   if(!canOpen(k))return;
   view=k;render();
   $('v300Root')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:{zone,clock,canOpen}};
})(window);