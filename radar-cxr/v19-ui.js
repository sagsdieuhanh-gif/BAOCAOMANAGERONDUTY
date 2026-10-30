'use strict';
(function(){
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dVN=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'—';
 const em=x=>x==null?'Chưa nhập':x;
 const unitLabel={DH:'PHÒNG ĐIỀU HÀNH',KTS:'PHÒNG KTSĐ / PVSĐ',PVHK:'PHÒNG PVHK',VIEWER:'THEO DÕI BÁO CÁO',ADMIN:'QUẢN TRỊ & ĐIỀU HÀNH'};
 let currentRole=null;
 function go(tab){
  switchTab(tab);
  const el=document.getElementById('tab-'+tab);
  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function timeRange(type){
   const x=type==='SÁNG';
   return {start:x?495:1095,end:x?1095:1935};
 }
 function getQty(u,r,s){
   const x=staff.find(x=>x.unit===u&&x.role_code===r&&x.shift===s);
   return x?x.quantity:'';
 }
 function shiftInputs(u){
   const names=u==='KTS'?[['BAGGAGE','Bốc xếp công ty'],['GSE_DRIVER','Lái xe GSE']]:
    [['PVHK_ARRIVAL_TEAM','Đội PVHK đến'],['PVHK_DEPARTURE_TEAM','Đội PVHK đi']];
   return '<div class="v19-grid-date">'+['SÁNG','ĐÊM'].map(sh=>
      '<div class="v19-shift"><h4>CA '+sh+' · '+(sh==='SÁNG'?'08:15–18:15':'18:15–08:15 hôm sau')+'</h4>'+
      '<div class="v19-inline-form">'+names.map(x=>
       '<label>'+esc(x[1])+'<input type="number" min="0" inputmode="numeric" placeholder="Chưa xác nhận" data-v19-staff="'+u+'|'+sh+'|'+x[0]+'" value="'+esc(getQty(u,x[0],sh))+'"></label>').join('')+
      '</div></div>').join('')+'</div>';
 }
 function unitDashboard(u){
   const isKTS=u==='KTS',label=isKTS?'NHÂN SỰ KTSĐ / BỐC XẾP':'PHỤC VỤ HÀNH KHÁCH';
   const extra=isKTS?'<h3>SKYONE – BỐC XẾP THUÊ NGOÀI</h3>'+
    '<p>Chỉ bổ sung khi có SKYONE. Tự cộng vào tổng bốc xếp trong đúng khung giờ.</p><div class="v19-inline-form">'+
    '<label>Từ giờ<input type="time" id="v19ExtraFrom" value="12:00"></label>'+
    '<label>Đến giờ<input type="time" id="v19ExtraTo" value="16:00"></label>'+
    '<label>Số SKYONE<input id="v19ExtraCount" type="number" min="0" placeholder="Số người"></label></div>':
    '<h3>ĐỘI PVHK NGOÀI KHUNG CA CHUẨN</h3>'+
    '<p>Chọn đội đến hoặc đi, nhập số người trong khung giờ thực tế.</p><div class="v19-inline-form">'+
    '<label>Đội<select id="v19ExtraTeam"><option value="PVHK_ARRIVAL_TEAM">PVHK ĐẾN</option><option value="PVHK_DEPARTURE_TEAM">PVHK ĐI</option></select></label>'+
    '<label>Số người<input id="v19ExtraCount" type="number" min="0" placeholder="Số người"></label>'+
    '<label>Từ giờ<input type="time" id="v19ExtraFrom" value="10:00"></label>'+
    '<label>Đến giờ<input type="time" id="v19ExtraTo" value="12:00"></label></div>';
   const details=isKTS?'Xem & cập nhật tình trạng GSE':'Xem biểu đồ phục vụ các chuyến đến/đi';
   return '<div class="v19-main-grid"><section class="v19-section"><h3>'+label+'</h3>'+
    '<p>Chỉ cần nhập số người có thể bố trí theo hai ca của công ty. Bỏ trống nếu chưa có thông tin; không nhập 0 thay cho chưa xác nhận.</p>'+
    shiftInputs(u)+'<div class="v19-buttons"><button class="v19-primary" id="v19SaveStaff">LƯU QUÂN SỐ HAI CA</button>'+
    '<button class="v19-inline-btn" id="v19ViewStaff">XEM CHI TIẾT THEO GIỜ</button></div><p class="v19-small" id="v19StaffHint"></p></section>'+
    '<section class="v19-section"><div>'+extra+'</div>'+
    '<div class="v19-buttons"><button class="v19-primary" id="v19SaveExtra">+ LƯU KHUNG GIỜ BỔ SUNG</button></div>'+
    '<div class="v19-optional"><div class="v19-callout">Sau khi lưu, Radar tự cộng SKYONE vào bốc xếp hoặc cập nhật đội PVHK theo đúng khung giờ, không cần gửi biểu mẫu giấy.</div>'+
    '<button class="v19-inline-btn" id="v19GoDetail" style="margin-top:12px">'+details+'</button></div></section></div>';
 }
 function countStatus(){
   const kts=staff.some(x=>x.unit==='KTS'&&x.role_code==='BAGGAGE')&&staff.some(x=>x.unit==='KTS'&&x.role_code==='GSE_DRIVER');
   const pv=staff.some(x=>x.unit==='PVHK'&&x.role_code==='PVHK_ARRIVAL_TEAM')&&staff.some(x=>x.unit==='PVHK'&&x.role_code==='PVHK_DEPARTURE_TEAM');
   const gseComplete=gse.length>0&&gse.every(x=>x.ready_count!=null);
   return [
    {name:'KTSĐ',ok:kts,label:kts?'Đã cập nhật ít nhất một ca':'Đang chờ quân số xác nhận'},
    {name:'PVHK',ok:pv,label:pv?'Đã cập nhật ít nhất một ca':'Đang chờ quân số xác nhận'},
    {name:'GSE',ok:gseComplete,label:gseComplete?'Đã xác nhận các nhóm thiết bị':'Còn nhóm thiết bị chưa xác nhận'}
   ];
 }
 function dhDashboard(){
   const one=snapshots.some(x=>x.revision===1),two=snapshots.some(x=>x.revision===2);
   const item=(num,heading,sub,action,tab)=>'<div class="v19-step"><div class="v19-step-num">'+num+'</div>'+
    '<div class="v19-step-content"><b>'+heading+'</b><span>'+sub+'</span></div>'+
    '<button class="v19-inline-btn" data-v19-go="'+tab+'">'+action+'</button></div>';
   return '<div class="v19-main-grid"><section class="v19-section"><h3>QUY TRÌNH DỰ BÁO NGÀY MAI</h3>'+
    '<p>Chỉ cần upload lịch Excel. Báo cáo Word được tổng hợp tự động từ các nguồn đã lưu, không phải gõ lại 9 nội dung mỗi ngày.</p>'+
    '<div class="v19-steps">'+
     item('1','Lịch bay đầu ngày – DỰ BÁO LẦN 1',one?'Đã lưu bản nguồn Lần 1':'Chưa có bản Lần 1; upload Excel để tự nhận chuyến','TẢI EXCEL','sources')+
     item('2','Radar tự động theo khung 30 phút','Trực quan chuyến chồng lấn, tàu thân rộng, nguồn lực','MỞ RADAR','radar')+
     item('3','Bản tin Lần 1 theo mẫu Word','Đủ 5 phần: tóm tắt, kiểm soát, cao điểm, phối hợp, kiến nghị','XEM MẪU','report')+
     item('4','Lịch có bãi sau AOC – DỰ BÁO LẦN 2',two?'Đã có bản Lần 2':'Cập nhật sau 21h; giữ bản Lần 1 để đối chiếu','LỊCH CẬP NHẬT','sources')+
    '</div><div class="v19-buttons"><button class="v19-primary" data-v19-export>XUẤT DỰ BÁO LẦN 1 (.DOCX)</button>'+
    '<button class="v19-inline-btn" data-v19-go="report">XEM TRƯỚC BẢN TIN</button></div>'+
    '<div class="v19-small" id="v19ExportMessage">Thông tin chưa xác nhận sẽ ghi rõ là chờ xác nhận trong Word.</div></section>'+
    '<section class="v19-section"><h3>THÔNG TIN TỪ CÁC ĐƠN VỊ</h3>'+
    countStatus().map(x=>'<div class="v19-status '+(x.ok?'ok':'warn')+'"><span class="dot"></span><b>'+x.name+':</b> '+x.label+'</div>').join('')+
    '<div class="v19-optional"><h3 style="margin-top:0">GHI CHÚ NGOẠI LỆ</h3>'+
    '<p>Ngày bình thường không cần nhập. Chỉ bổ sung khi có bất thường, tồn tại ca trước hoặc kiến nghị.</p>'+
    '<button class="v19-inline-btn" data-v19-go="report">NHẬP GHI CHÚ / XEM BẢN TIN</button></div>'+
    '<div class="v19-callout" style="margin-top:13px">Không cần nhập thủ công biểu đồ, số chuyến, chênh lệch, các cặp quay đầu hoặc bảng cao điểm; hệ thống tự tính từ lịch đã lưu.</div></section></div>';
 }
 function renderHome(){
   const home=$('v19Home');if(!home||!unit)return;
   const counts=[flights.filter(x=>x.arrival).length,flights.filter(x=>x.departure).length];
   const peaks=Array.from({length:60},(_,i)=>({time:i*30,n:iNeed(i*30).pairs.length})).sort((a,b)=>b.n-a.n||a.time-b.time);
   const title=unitLabel[unit]||unit;
   const info=unit==='KTS'?'Cập nhật nhân sự bốc xếp, lái xe, SKYONE và GSE':
     unit==='PVHK'?'Cập nhật đội PVHK đến và đội PVHK đi theo giờ thực tế':
     'Một lịch bay – một Radar – một bản tin khai thác tự động';
   const top='<div class="v19-hero"><div><div class="v19-kicker">SAGS-CXR • DỰ BÁO & ĐIỀU HÀNH</div>'+
    '<h2>'+title+'</h2><p>'+info+' · Ngày '+dVN($('day').value)+'</p></div>'+
    '<div class="v19-round">BẢN TIN SƠ BỘ<br><b>'+esc(dayStatus?.report_status||'DỰ THẢO')+'</b></div></div>';
   const tiles='<div class="v19-tiles">'+[
    ['CHUYẾN ĐẾN',counts[0],'Theo lịch đã lưu'],
    ['CHUYẾN ĐI',counts[1],'Theo lịch đã lưu'],
    ['ĐỈNH RADAR',peaks[0]?.n||0,'Cặp/chuyến đang phục vụ'],
    ['KHUNG GIỜ CAO ĐIỂM',timeFmt(peaks[0]?.time||0),'Theo 30 phút']
   ].map(x=>'<div class="v19-tile"><small>'+x[0]+'</small><div class="v19-big">'+x[1]+'</div><div class="v19-sub">'+x[2]+'</div></div>').join('')+'</div>';
   home.innerHTML='<div class="v19-home">'+top+tiles+
    (unit==='KTS'||unit==='PVHK'?unitDashboard(unit):dhDashboard())+'</div>';
   home.querySelectorAll('[data-v19-go]').forEach(b=>b.onclick=()=>go(b.dataset.v19Go));
   home.querySelectorAll('[data-v19-export]').forEach(b=>b.onclick=()=>window.SagsReportV19?.exportOne());
   if(unit==='KTS'||unit==='PVHK'){
     $('v19SaveStaff').onclick=savePeople;
     $('v19SaveExtra').onclick=saveExtra;
     $('v19ViewStaff').onclick=()=>go('staff');
     $('v19GoDetail').onclick=()=>go(unit==='KTS'?'gse':'radar');
   }
 }
 async function savePeople(){
   if(!['KTS','PVHK','ADMIN'].includes(unit))return;
   const inputs=[...document.querySelectorAll('[data-v19-staff]')],values=[];
   for(const el of inputs){
     if(!el.value.trim())continue;
     const parts=el.dataset.v19Staff.split('|');
     const n=Number(el.value),range=timeRange(parts[1]);
     if(!Number.isInteger(n)||n<0)return $('v19StaffHint').textContent='Số người phải là số nguyên không âm.';
     values.push({service_date:$('day').value,unit:parts[0],shift:parts[1],
       role_code:parts[2],start_min:range.start,end_min:range.end,quantity:n,
       confirmed_by:me.id,confirmed_at:new Date().toISOString()});
   }
   if(!values.length)return $('v19StaffHint').textContent='Chưa nhập số quân số nào. Ô bỏ trống là chưa xác nhận.';
   const {error}=await sb.from('ops_staff_capacity').upsert(values,{onConflict:'service_date,unit,role_code,shift'});
   if(error)return $('v19StaffHint').textContent='Không lưu được: '+error.message;
   await load();toast('Đã cập nhật '+values.length+' số quân số của đơn vị.');
 }
 async function saveExtra(){
   const num=$('v19ExtraCount')?.value,from=$('v19ExtraFrom')?.value,to=$('v19ExtraTo')?.value;
   if(num===''||Number(num)<0||!Number.isInteger(+num))return alert('Nhập số người hợp lệ cho khung giờ.');
   if(unit==='KTS'){
     $('skyStart').value=from;$('skyEnd').value=to;$('skyCount').value=num;
     await saveSpecialStaff('SKYONE');
   }else if(unit==='PVHK'){
     $('pvhkTeam').value=$('v19ExtraTeam').value;
     $('pvhkTeamCount').value=num;$('pvhkTeamStart').value=from;$('pvhkTeamEnd').value=to;
     await saveSpecialStaff('PVHK');
   }
 }
 function setUnit(role){
   currentRole=role;
   document.body.className=document.body.className.replace(/\bv19-unit-[A-Z]+\b/g,'').trim()+' v19-unit-'+role;
   const visible={
    DH:['home','sources','radar','doorclose','report','quick'],
    KTS:['home','staff','gse','radar'],
    PVHK:['home','staff','radar'],
    VIEWER:['home','radar','report'],
    ADMIN:['home','sources','radar','staff','gse','doorclose','report','quick','admin']
   }[role]||['home','radar'];
   document.querySelectorAll('#tabs [data-tab]').forEach(b=>{
     b.classList.toggle('v19-tab-off',!visible.includes(b.dataset.tab));
   });
   const labels={home:'TỔNG QUAN',sources:'LỊCH BAY / EXCEL',radar:'RADAR 30 PHÚT',
    staff:'NHÂN SỰ',gse:'THIẾT BỊ GSE',doorclose:'DOOR CLOSE',report:'BÁO CÁO TGĐ',
    quick:'CÔNG CỤ CHI TIẾT',admin:'PHÂN QUYỀN'};
   document.querySelectorAll('#tabs [data-tab]').forEach(b=>{if(labels[b.dataset.tab])b.textContent=labels[b.dataset.tab]});
   const notes=document.getElementById('v19NoteEditor');
   if(notes)notes.classList.toggle('hidden',!['DH','ADMIN'].includes(role));
   renderHome();
 }
 async function afterTab(tab){
   if(tab==='report'&&me){
     try{await window.SagsReportV19?.loadNotes();}catch(e){const hint=$('v19NotesHint');if(hint)hint.textContent=e.message;}
     await window.SagsReportV19?.preview();
   }
 }
 function attach(){
   const btn=$('v19ReportExport');if(btn)btn.onclick=()=>window.SagsReportV19?.exportOne();
   const prev=$('v19ReportRefresh');if(prev)prev.onclick=()=>window.SagsReportV19?.preview();
   const save=$('v19SaveNotes');if(save)save.onclick=async()=>{
     try{await window.SagsReportV19?.saveNotes();}catch(e){alert(e.message)}
   };
 }
 attach();
 window.SagsUIV19={renderHome,setUnit,afterTab};
})();