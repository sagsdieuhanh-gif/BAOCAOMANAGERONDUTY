'use strict';
/* Persistent, source-confirmed per-flight staff norms and 30-minute demand.
   Never infer a normative headcount or call an unconfirmed role "available". */
(function(root){
 const CATALOG={
  DH:[['CO','Điều phối viên CO'],['LOADING','Loading / Load Control']],
  PVHK:[['PVHK_ARRIVAL_TEAM','Nhân viên phục vụ khách đến'],['PVHK_DEPARTURE_TEAM','Nhân viên phục vụ khách đi']],
  KTS:[['RAMP','Nhân viên phục vụ sân đỗ'],['BAGGAGE','Bốc xếp hành lý tàu bay'],['GSE_DRIVER','Lái xe GSE'],['COBUS_DRIVER','Lái xe COBUS'],['TERMINAL_BAGGAGE','Bốc xếp hành lý nhà ga']],
  KHO:[['WAREHOUSE_CARGO','Nhân viên kho / phục vụ hàng']]
 };
 const LABEL={DH:'Phòng Điều hành',PVHK:'Phục vụ hành khách',KTS:'Phục vụ sân đỗ / bốc xếp',KHO:'Kho hàng'};
 const GROUPS=['NARROW','WIDE'];
 const E=id=>document.getElementById(id);
 const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const num=v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:/^\d+$/.test(String(v??'').trim())?Number(v):null;
 const clock=t=>String(Math.floor(t/60)%24).padStart(2,'0')+':'+String(t%60).padStart(2,'0')+(t>=1440?' (+1)':'');
 const unitRole=()=>typeof unit==='undefined'?'':unit;
 const meNow=()=>typeof me==='undefined'?null:me;
 const db=()=>typeof sb==='undefined'?null:sb;
 const canEdit=u=>['ADMIN','DH'].includes(unitRole())||unitRole()===u;
 const aircraftGroup=f=>{
  const s=String(f.aircraft_type||f.type||'').toUpperCase().replace(/\s+/g,'');
  if(/A3(30|40|50|80)|B?(747|767|777|787)|B7(47|67|77|87)|IL96|MD11/.test(s))return 'WIDE';
  if(/A(318|319|320|321|220)|B?7(17|27|37|57)|737|ATR|AT7|AT4|DHC|DH8|E(170|175|190|195)|CRJ|A320NEO|COMAC|C919|SSJ/.test(s))return 'NARROW';
  return null;
 };
 const shiftOf=t=>t>=495&&t<1095?'SÁNG':t>=1095&&t<1935?'ĐÊM':null;
 const roles=u=>CATALOG[u]||[];
 const action=u=>({
  DH:'Cán bộ trực rà soát phân công CO/Loading, ưu tiên các chuyến chồng lấn; đề xuất huy động người đủ năng định từ ca khác hoặc nghỉ tuần theo phê duyệt, và trực tiếp hỗ trợ tại hiện trường khi đủ điều kiện. Không mặc định đã điều động.',
  PVHK:'PVHK bố trí lại đội đến/đi theo khung phục vụ, kiểm tra riêng quầy check-in và boarding theo giờ đã xác nhận; đề xuất tăng cường người đủ năng định, tránh rút nhân lực khỏi chuyến đang phục vụ.',
  KTS:'PVSĐ chủ động chia tổ, tập kết xe thang/COBUS, GSE và lực lượng theo cụm bãi trước giờ tàu lăn; cân đối nhân lực bốc xếp nhà ga và tổ sân đỗ, đề xuất bổ sung khi thiếu.',
  KHO:'Kho hàng kiểm tra booking/giờ bàn giao đã xác nhận; bố trí tổ phục vụ hàng theo các chuyến quay đầu ngắn, đề xuất tăng cường và phối hợp PVSĐ trước khi hàng sẵn sàng.'
 }[u]||'Đơn vị rà soát phân bổ nhân lực theo tiến độ.');
 function assess({date,rows=[],norms=[],staff=[],unitPlans=[],operational,cargoPlans=[]}={}){
  const normMap=new Map(norms.filter(x=>x&&x.confirmed_by&&num(x.staff_per_flight)!=null)
   .map(x=>[x.unit+'|'+x.role_code+'|'+x.aircraft_group,num(x.staff_per_flight)]));
  const roleRows=staff.filter(x=>x.confirmed_at&&num(x.quantity)!=null);
  const planMap=new Map((unitPlans||[]).filter(x=>x.status==='CONFIRMED').map(x=>[x.unit,x.details||{}]));
  const cargoMap=new Map((cargoPlans||[]).map(x=>[String(x.flight_no||'').toUpperCase(),x]));
  const ticks=Array.from({length:96},(_,i)=>i*30);
  const events=[],unresolved=new Set(),windows=[];
  const serviceM=root.SagsOpsForecastV219?.serviceM;
  for(const f of rows){
   const duration=typeof serviceM==='function'?serviceM(f):null;
   const sta=num(f.sta_min),std=num(f.std_min);
   let start=sta,end=duration!=null&&sta!=null?sta+duration:null;
   if(start==null&&std!=null&&duration!=null){start=Math.max(0,std-duration);end=std;}
   if(start==null||end==null||end<=start){unresolved.add('chưa đủ STA/STD hoặc thời lượng phục vụ cho '+(f.departure||f.arrival||'chuyến chưa rõ số hiệu'));continue;}
   if(std!=null&&std>start)end=Math.min(end,std);
   const g=aircraftGroup(f);
   const no=String(f.departure||f.arrival||'—').toUpperCase();
   const plan=cargoMap.get(no);
   // Hàng đi chỉ có căn cứ khi Kho hàng đã nhập khối lượng; không suy từ cờ lịch bay.
   const cargoStatus=plan&&Number.isFinite(Number(plan.cargo_kg))&&Number(plan.cargo_kg)>0?'CARGO':'UNKNOWN';
   events.push({no,start,end,group:g,cargoStatus,flight:f});
  }
  const roleQty=(u,code,t)=>{
   const rows=roleRows.filter(r=>r.unit===u&&
     (r.role_code===code||(u==='KTS'&&code==='BAGGAGE'&&r.role_code==='SKYONE_BAGGAGE'))&&
     num(r.start_min)!=null&&num(r.end_min)!=null&&r.start_min<=t&&r.end_min>=t+30);
   if(!rows.length)return null;
   return rows.reduce((n,r)=>n+num(r.quantity),0);
  };
  const totalOf=(u,sh)=>{
   const d=planMap.get(u);return d?num(d['pvb_'+(sh==='SÁNG'?'morning':'night')]):null;
  };
  const groupKeys={NARROW:'thân hẹp',WIDE:'thân rộng'};
  for(const t of ticks){
   const shift=shiftOf(t),active=events.filter(e=>e.start<t+30&&e.end>t);
   if(!active.length)continue;
   for(const u of Object.keys(CATALOG)){
    const requiredEvents=u==='KHO'?active.filter(x=>x.cargoStatus==='CARGO'):active;
    if(!requiredEvents.length&&u!=='KHO')continue;
    if(u==='KHO'&&!requiredEvents.length&&!active.some(x=>x.cargoStatus==='UNKNOWN'))continue;
    const lacking=[],perRole=[],missingType=requiredEvents.filter(x=>!x.group);
    const pendingCargo=u==='KHO'?active.filter(x=>x.cargoStatus==='UNKNOWN').map(x=>x.no):[];
    if(missingType.length)lacking.push('chưa rõ loại tàu: '+missingType.map(x=>x.no).join(', '));
    if(pendingCargo.length)lacking.push('chưa xác nhận hàng: '+pendingCargo.join(', '));
    for(const [code,label] of roles(u)){
     let required=0,complete=!missingType.length&&!pendingCargo.length;
     const missing=[];
     for(const e of requiredEvents){
      if(!e.group)continue;
      const key=u+'|'+code+'|'+e.group;
      if(!normMap.has(key)){complete=false;missing.push(e.no+' ('+groupKeys[e.group]+')');}
      else required+=normMap.get(key);
     }
     if(missing.length)lacking.push('thiếu định mức '+label+': '+missing.slice(0,3).join(', '));
     const available=shift?roleQty(u,code,t):null;
     perRole.push({code,label,required:complete?required:null,available,shortage:complete&&available!=null?Math.max(0,required-available):null});
    }
    const complete=perRole.every(x=>x.required!=null);
    const required=complete?perRole.reduce((n,r)=>n+r.required,0):null;
    const actualTotal=shift?totalOf(u,shift):null;
    const confirmedRoles=perRole.filter(x=>x.required>0&&x.available!=null);
    const allRolesConfirmed=perRole.filter(x=>x.required>0).every(x=>x.available!=null);
    const shortage=complete&&allRolesConfirmed?perRole.reduce((n,x)=>n+(x.shortage||0),0):null;
    const minShortage=required!=null&&actualTotal!=null?Math.max(0,required-actualTotal):null;
    const detail=perRole.filter(x=>x.required>0||x.shortage>0).map(x=>x.label+': cần '+(x.required??'CHỜ ĐỊNH MỨC')+', có '+(x.available??'CHỜ QUÂN SỐ')+
     (x.shortage>0?', thiếu '+x.shortage:'')).join('; ');
    windows.push({unit:u,shift,slot:clock(t)+'–'+clock(t+30),time:t,flights:requiredEvents.map(x=>x.no),
      activeFlights:active.map(x=>x.no),required,actualTotal,shortage,minShortage,
      detail,lacking:[...new Set(lacking)],verified:complete&&allRolesConfirmed,
      action:action(u),unitLabel:LABEL[u],confirmedRoles:confirmedRoles.length});
   }
  }
  const shiftRows=[];
  for(const u of Object.keys(CATALOG))for(const sh of ['SÁNG','ĐÊM']){
   const sample=windows.filter(w=>w.unit===u&&w.shift===sh).sort((a,b)=>
     (b.required??-1)-(a.required??-1)||b.activeFlights.length-a.activeFlights.length||a.time-b.time)[0];
   const all=windows.filter(w=>w.unit===u&&w.shift===sh);
   const complete=all.length&&all.every(w=>w.required!=null);
   const need=complete?Math.max(...all.map(w=>w.required)):null;
   const actual=totalOf(u,sh);
   const shortage=need!=null&&actual!=null?Math.max(0,need-actual):null;
   shiftRows.push({unit:u,unitLabel:LABEL[u],shift:sh,actual,required:need,shortage,
     slot:sample?.slot||'—',state:!all.length?'Không có khung được tính':need==null?'Thiếu định mức/loại tàu':
     actual==null?'Chưa xác nhận quân số':shortage>0?'Thiếu ít nhất '+shortage+' người theo tổng':
     'Đủ theo tổng; cần kiểm tra phân bổ đúng vai trò'});
  }
  const picks=[];
  for(const u of Object.keys(CATALOG))for(const sh of ['SÁNG','ĐÊM']){
   const candidates=windows.filter(w=>w.unit===u&&w.shift===sh&&w.activeFlights.length)
    .sort((a,b)=>(b.shortage??b.minShortage??-1)-(a.shortage??a.minShortage??-1)||
      b.activeFlights.length-a.activeFlights.length||a.time-b.time);
   if(candidates.length)picks.push(candidates[0]);
   const second=candidates.find(x=>x.time!==candidates[0]?.time&&(x.shortage>0||x.minShortage>0));
   if(second)picks.push(second);
  }
  const entries=picks.map((w,i)=>{
    const numbers=w.required==null?'CHƯA ĐỦ ĐỊNH MỨC ĐỂ TÍNH':
      'Nhu cầu '+w.required+' người; quân số ca đã xác nhận '+(w.actualTotal??'CHỜ XÁC NHẬN')+
      (w.minShortage>0?'; thiếu tối thiểu '+w.minShortage+' người so với tổng ca':
        w.actualTotal!=null?'; chưa thể kết luận đủ từng vai trò nếu chưa phân bổ cụ thể':'');
    const roleShort=w.shortage>0?' Thiếu theo từng vị trí '+w.shortage+' người.':'';
    return {key:'norm-'+w.unit+'-'+w.shift,title:'Nhân sự '+w.unitLabel+' – '+(w.shift==='SÁNG'?'ca sáng':'ca đêm')+' · '+w.slot,
      observation:'Chuyến/cặp chồng lấn: '+w.activeFlights.slice(0,9).join(', ')+'. '+numbers+'.'+roleShort+
        (w.detail?' Phân tích: '+w.detail+'.':'')+
        (w.lacking.length?' CHỜ XÁC NHẬN: '+w.lacking.slice(0,4).join('; ')+'.':''),
      action:w.required==null||w.actualTotal==null?'Chưa chốt đủ/thiếu; '+w.action:
        (w.minShortage>0||w.shortage>0?'Nguy cơ thiếu nhân lực đã được tính từ số liệu; ':'Đối chiếu phân công thực tế trước khi khẳng định đủ. ')+w.action,
      owner:w.unitLabel,weight:5};
  });
  if(!norms.length)unresolved.add('Chưa có định mức nhân sự theo loại tàu và vai trò; không được kết luận đủ/thiếu theo khung 30 phút.');
  if(windows.some(w=>w.lacking.length))unresolved.add('Một số khung còn thiếu loại tàu, xác nhận cargo hoặc định mức vị trí.');
  if(windows.some(w=>w.shift==null))unresolved.add('Chuyến 00:00–08:15 thuộc ca đêm ngày trước hoặc ngoài ca đã nhập; phải đối chiếu ca đúng ngày trước khi so sánh.');
  return {shiftRows,entries,windows,unresolved:[...unresolved],normCount:norms.length};
 }
 let mounted=false,lastDate='',lastRole='',loading=false;
 function mount(){
  if(mounted)return;
  const target=unitRole();
  if(!meNow()||!db()||!['ADMIN','DH','KTS','PVHK','KHO'].includes(target))return;
  const tab=target==='ADMIN'||target==='DH'?'tab-staff':target==='KTS'?'tab-pvsd':target==='PVHK'?'tab-pvhk':'tab-warehouse';
  const parent=E(tab);if(!parent)return;
  const pane=document.createElement('div');pane.className='panel';pane.id='v229StaffNormsPanel';
  pane.innerHTML='<h2>ĐỊNH MỨC NHÂN SỰ THEO CHUYẾN – LƯU DÙNG CHUNG CÁC NGÀY</h2>'+
   '<p class="note">Nhập một lần cho từng đơn vị/vị trí và tàu thân hẹp, thân rộng. Số <b>0</b> = xác nhận không cần nhân sự cho vị trí đó; để trống = CHỜ ĐỊNH MỨC. Ghi rõ nguồn quy định/thoả thuận. Định mức không tự thay đổi theo ngày. Dự báo tính trong cửa sổ 30 phút từ lịch Lần 2, không tính trùng cặp đến–đi.</p>'+
   '<p class="note">Quân số sáng/đêm là số thực sự sẵn sàng theo đúng vị trí (08:15–18:15 và 18:15–08:15 hôm sau). Không dùng tổng quân số phòng để tự suy ra số CO, Loading, đội đến/đi hay tổ bốc xếp.</p>'+
   '<div id="v229NormTable" class="tablewrap"></div>'+
   '<div class="btnbar"><button class="primary" type="button" id="v229SaveNorms">LƯU ĐỊNH MỨC VÀ QUÂN SỐ THEO VỊ TRÍ</button><span id="v229NormStatus" role="status"></span></div>';
  parent.prepend(pane);
  E('v229SaveNorms').onclick=save;
  mounted=true;
 }
 async function refresh(tab){
  mount();if(!mounted||loading)return;
  const role=unitRole(),date=E('day')?.value;
  if(!meNow()||!date)return;
  const shown=['ADMIN','DH'].includes(role)?'staff':role==='KTS'?'pvsd':role==='PVHK'?'pvhk':'warehouse';
  if(tab&&tab!==shown)return;
  if(E('v229NormTable').querySelector(':focus'))return;
  loading=true;
  try{
   const [a,b]=await Promise.all([db().from('ops_staff_norms').select('*'),
     db().from('ops_staff_capacity').select('*').eq('service_date',date)]);
   if(a.error||b.error)throw Error((a.error||b.error).message);
   const units=role==='DH'||role==='ADMIN'?Object.keys(CATALOG):[role];
   const norms=a.data||[],staff=b.data||[];
   E('v229NormTable').innerHTML='<table><thead><tr><th>ĐƠN VỊ / VỊ TRÍ</th><th>TÀU THÂN HẸP (người/chuyến)</th><th>TÀU THÂN RỘNG (người/chuyến)</th><th>NGUỒN ĐỊNH MỨC</th><th>QUÂN SỐ SÁNG (người)</th><th>QUÂN SỐ ĐÊM (người)</th></tr></thead><tbody>'+
    units.flatMap(u=>roles(u).map(([code,label])=>{
      const findNorm=g=>norms.find(x=>x.unit===u&&x.role_code===code&&x.aircraft_group===g);
      const findStaff=sh=>staff.find(x=>x.unit===u&&x.role_code===code&&x.shift===sh);
      const n=findNorm('NARROW'),w=findNorm('WIDE');
      return '<tr data-norm-unit="'+h(u)+'" data-norm-role="'+h(code)+'"><td><b>'+h(LABEL[u])+'</b><div>'+h(label)+'</div></td>'+
       '<td><input type="number" inputmode="numeric" min="0" max="100" data-norm-group="NARROW" placeholder="Chưa xác nhận" value="'+h(n?.staff_per_flight??'')+'"></td>'+
       '<td><input type="number" inputmode="numeric" min="0" max="100" data-norm-group="WIDE" placeholder="Chưa xác nhận" value="'+h(w?.staff_per_flight??'')+'"></td>'+
       '<td><input data-norm-source="1" maxlength="500" placeholder="Hợp đồng / WI / định mức đã duyệt" value="'+h(w?.source_reference||n?.source_reference||'')+'"></td>'+
       '<td><input type="number" inputmode="numeric" min="0" max="9999" data-norm-shift="SÁNG" placeholder="Chưa có" value="'+h(findStaff('SÁNG')?.quantity??'')+'"></td>'+
       '<td><input type="number" inputmode="numeric" min="0" max="9999" data-norm-shift="ĐÊM" placeholder="Chưa có" value="'+h(findStaff('ĐÊM')?.quantity??'')+'"></td></tr>';
    })).join('')+'</tbody></table>';
   E('v229NormTable').dataset.date=date;
   lastDate=date;lastRole=role;
   E('v229NormStatus').textContent='Định mức đã xác nhận được dùng lại mọi ngày; quân số lưu theo ngày đang chọn.';
  }catch(e){E('v229NormStatus').textContent='CHƯA TẢI ĐƯỢC ĐỊNH MỨC: '+e.message;}
  finally{loading=false;}
 }
 async function save(){
  if(loading||!meNow()||!db())return;
  const date=E('day')?.value;
  if(date!==lastDate||unitRole()!==lastRole)return alert('Ngày hoặc quyền tài khoản đã thay đổi, tải lại định mức.');
  const norms=[],capacity=[];
  try{
   loading=true;E('v229SaveNorms').disabled=true;
   for(const tr of E('v229NormTable').querySelectorAll('tr[data-norm-unit]')){
    const u=tr.dataset.normUnit,role_code=tr.dataset.normRole,source=tr.querySelector('[data-norm-source]').value.trim();
    if(!canEdit(u))throw Error('Không được cập nhật đơn vị '+u);
    for(const input of tr.querySelectorAll('[data-norm-group]')){
     const raw=input.value.trim();if(!raw)continue;
     const n=num(raw);
     if(n==null||n>100)throw Error('Định mức '+u+'/'+role_code+' phải là số 0–100.');
     if(source.length<3)throw Error('Nhập nguồn xác nhận định mức cho '+u+'/'+role_code+'.');
     norms.push({unit:u,role_code,aircraft_group:input.dataset.normGroup,staff_per_flight:n,source_reference:source,
      confirmed_by:meNow().id,confirmed_at:new Date().toISOString(),updated_at:new Date().toISOString()});
    }
    for(const input of tr.querySelectorAll('[data-norm-shift]')){
     const raw=input.value.trim();if(!raw)continue;
     const n=num(raw);if(n==null||n>9999)throw Error('Quân số '+u+'/'+role_code+' phải là số nguyên từ 0–9999.');
     const morning=input.dataset.normShift==='SÁNG';
     capacity.push({service_date:date,unit:u,role_code,shift:input.dataset.normShift,
      start_min:morning?495:1095,end_min:morning?1095:1935,quantity:n,
      confirmed_by:meNow().id,confirmed_at:new Date().toISOString()});
    }
   }
   if(!norms.length&&!capacity.length)throw Error('Chưa nhập định mức hoặc quân số để lưu.');
   if(norms.length){const r=await db().from('ops_staff_norms').upsert(norms,{onConflict:'unit,role_code,aircraft_group'});if(r.error)throw Error('Định mức: '+r.error.message);}
   if(capacity.length){const r=await db().from('ops_staff_capacity').upsert(capacity,{onConflict:'service_date,unit,role_code,shift'});if(r.error)throw Error('Quân số: '+r.error.message);}
   E('v229NormStatus').textContent='ĐÃ LƯU: '+norms.length+' định mức dùng chung và '+capacity.length+' ô quân số ngày '+date+'.';
   if(typeof load==='function')await load();
  }catch(e){E('v229NormStatus').textContent='CHƯA LƯU ĐỦ: '+e.message;}
  finally{loading=false;E('v229SaveNorms').disabled=false;}
 }
 root.SagsStaffNormsV229={CATALOG,assess,mount,refresh};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.SagsStaffNormsV229;
})(typeof window!=='undefined'?window:globalThis);
