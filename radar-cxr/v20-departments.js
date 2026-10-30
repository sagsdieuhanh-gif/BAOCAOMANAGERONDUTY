'use strict';
(function(){
 const $=id=>document.getElementById(id);
 const escape=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const val=id=>$(id)?.value?.trim()||'';
 const day=()=>$('day').value;
 const knownFlights=()=>flights.flatMap(f=>[f.arrival,f.departure]).filter(Boolean);
 const time=n=>n==null?'—':String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0')+(n>=1440?' (+1)':'');
 const clock=s=>{const m=String(s||'').match(/^(\d\d):(\d\d)$/);return m?Number(m[1])*60+Number(m[2]):null};
 const allowed=r=>unit==='ADMIN'||unit===r;
 const shifts=[['SÁNG',495,1095,'08:15–18:15'],['ĐÊM',1095,1935,'18:15–08:15 (+1)']];
 const roleNames={KTS:[['BAGGAGE','Bốc xếp công ty'],['GSE_DRIVER','Lái xe GSE']],PVHK:[['PVHK_ARRIVAL_TEAM','Đội PVHK ĐẾN'],['PVHK_DEPARTURE_TEAM','Đội PVHK ĐI']]};
 let cargo=[],issues=[],transport=[],generation=0,initialized=false;
 const buses=window.SagsShuttleModel.defaults;
 const staffFor=(u,role,shift)=>staff.find(x=>x.unit===u&&x.role_code===role&&x.shift===shift)?.quantity;
 function fieldGroups(u){
   const names=roleNames[u];
   return '<div class="v20-shifts">'+shifts.map(sh=>'<article class="v20-shift"><div class="v20-shift-title"><b>CA '+sh[0]+'</b><span>'+sh[3]+'</span></div><div class="v20-field-row">'+names.map(x=>'<label>'+x[1]+'<input data-v20-quantity="'+u+'|'+sh[0]+'|'+x[0]+'" type="number" inputmode="numeric" min="0" placeholder="Chưa xác nhận" value="'+escape(staffFor(u,x[0],sh[0])??'')+'"></label>').join('')+'</div></article>').join('')+'</div>';
 }
 function tableRows(){return '<div class="v20-head"><div><h2>PVSĐ · NHÂN SỰ & TRANG THIẾT BỊ</h2><p>Nhập tại đây một lần. SKYONE được cộng vào bốc xếp theo đúng giờ thuê.</p></div></div>'+
   '<div class="v20-column-grid"><section class="v20-panel"><h3>01 · Quân số PVSĐ</h3>'+fieldGroups('KTS')+
   '<button class="primary" id="v20SaveKTS">LƯU QUÂN SỐ PVSĐ</button><div class="v20-help" id="v20KTSHelp"></div><div class="v20-help" data-v20-staff-confirm="KTS"></div></section>'+
   '<section class="v20-panel"><h3>02 · SKYONE – BỐC XẾP THUÊ NGOÀI</h3>'+
   '<p>Chỉ thêm khung giờ thực tế có thuê; người SKYONE tính chung tổng bốc xếp.</p>'+
   '<div class="v20-field-row"><label>Từ giờ<input type="time" id="v20SkyFrom" value="09:00"></label><label>Đến giờ<input type="time" id="v20SkyTo" value="13:00"></label><label>Số SKYONE<input type="number" id="v20SkyPeople" min="0" placeholder="Số người"></label></div>'+
   '<button class="primary" id="v20SaveSky">+ LƯU KHUNG GIỜ SKYONE</button><div id="v20SkyList" class="v20-list"></div></section></div>'+
   '<section class="v20-panel"><h3>03 · Xe hỏng / đang sửa / hạn chế khai thác</h3>'+
   '<p>Ghi từng xe có vấn đề, tình trạng, ảnh hưởng và phương án thay thế. Xe phục hồi chỉ cần đổi trạng thái; không nhập lại cả danh mục mỗi ngày.</p>'+
   '<div class="v20-incident-grid"><label>Mã xe / thiết bị<input id="v20Vehicle" maxlength="55" placeholder="Ví dụ 31806"></label>'+
   '<label>Nhóm<select id="v20Group"><option value="PUSHBACK">Xe kéo đẩy máy bay</option><option value="COBUS">Cobus</option><option value="STAIRS">Thang hành khách</option><option value="BELT">Băng chuyền</option><option value="LOADER_TOTAL">Xe nâng hàng</option><option value="GPU">GPU</option><option value="ACU">ACU</option><option value="ASU">ASU</option><option value="TRACTOR">Xe kéo hành lý</option><option value="OTHER">Khác</option></select></label>'+
   '<label>Trạng thái<select id="v20IssueStatus"><option value="OUT_OF_SERVICE">TẠM DỪNG</option><option value="REPAIR">ĐANG SỬA</option><option value="LIMITED">HẠN CHẾ</option><option value="RETURNED">ĐÃ HOẠT ĐỘNG LẠI</option></select></label>'+
   '<label>Hư hỏng / lý do<input id="v20Fault" maxlength="700" placeholder="Sự cố xác nhận"></label>'+
   '<label>Ảnh hưởng phục vụ<input id="v20Impact" maxlength="600" placeholder="Thiếu 01 xe, hạn chế tàu..."></label>'+
   '<label>Phương án thay thế<input id="v20Workaround" maxlength="600" placeholder="Xe dự phòng/điều chuyển..."></label>'+
   '<label>Dự kiến khắc phục<input id="v20RepairEta" maxlength="100" placeholder="Chưa xác nhận hoặc giờ dự kiến"></label></div>'+
   '<button class="primary" id="v20SaveIssue">LƯU TÌNH TRẠNG XE</button><div id="v20Issues" class="v20-list"></div></section>'+
   '<details class="v20-panel v20-details"><summary>04 · XÁC NHẬN TỔNG XE GSE KHẢ DỤNG (CHỈ KHI SỐ LƯỢNG THAY ĐỔI)</summary>'+
   '<p>Thông số danh mục giữ sẵn, chỉ cập nhật số xe sử dụng được và tương thích A330 khi có thay đổi. Không nhập trùng với tình trạng hư hỏng ở trên.</p>'+
   '<div id="v20GseMount"></div></details>';
 }
 function pvhk(){return '<div class="v20-head"><div><h2>PVHK · ĐỘI CHUYẾN ĐẾN / ĐI</h2><p>Hai ca chuẩn; thêm khung giờ riêng khi có người tăng cường. Chỉ một nơi nhập quân số PVHK.</p></div></div>'+
  '<section class="v20-panel"><h3>01 · Nhân sự theo ca</h3>'+fieldGroups('PVHK')+
  '<button class="primary" id="v20SavePVHK">LƯU QUÂN SỐ PVHK</button><div class="v20-help" id="v20PVHKHelp"></div><div class="v20-help" data-v20-staff-confirm="PVHK"></div></section>'+
  '<section class="v20-panel"><h3>02 · Khung giờ ngoài hai ca chuẩn</h3><div class="v20-incident-grid">'+
  '<label>Đội<select id="v20PvTeam"><option value="PVHK_ARRIVAL_TEAM">PVHK ĐẾN</option><option value="PVHK_DEPARTURE_TEAM">PVHK ĐI</option></select></label>'+
  '<label>Từ giờ<input type="time" id="v20PvFrom" value="10:00"></label>'+
  '<label>Đến giờ<input type="time" id="v20PvTo" value="14:00"></label>'+
  '<label>Số người<input type="number" min="0" id="v20PvPeople"></label></div>'+
  '<button class="primary" id="v20SavePvExtra">+ LƯU KHUNG GIỜ PVHK</button><div id="v20PvList" class="v20-list"></div></section>';
 }
 function warehouse(){const options=[...new Set(knownFlights())].map(x=>'<option value="'+escape(x)+'"></option>').join('');
  return '<div class="v20-head"><div><h2>KHO HÀNG · KẾ HOẠCH CARGO</h2>'+
   '<p>Nhập kế hoạch hàng hóa theo chuyến. TBĐH sẽ tự đối chiếu các chuyến tập trung theo STD/STA để chủ động điều phối.</p></div></div>'+
   '<section class="v20-panel"><h3>01 · Kế hoạch theo chuyến</h3>'+
   '<datalist id="v20Flights">'+options+'</datalist><div class="v20-incident-grid">'+
   '<label>Số hiệu chuyến<input list="v20Flights" id="v20CargoFlight" placeholder="VJ782" maxlength="20"></label>'+
   '<label>Hàng dự kiến (KG)<input type="number" step="0.01" min="0" id="v20CargoKg" placeholder="Chưa xác nhận"></label>'+
   '<label>Kiện hàng (PCS)<input type="number" min="0" id="v20CargoPcs" placeholder="Chưa xác nhận"></label>'+
   '<label>Giờ kho dự kiến sẵn sàng<input type="time" id="v20ReadyTime"></label>'+
   '<label class="v20-span-2">Ghi chú kế hoạch<input id="v20CargoNote" maxlength="800" placeholder="Loại hàng, hạn chế, yêu cầu ưu tiên..."></label></div>'+
   '<button class="primary" id="v20SaveCargo">LƯU KẾ HOẠCH CHUYẾN</button></section>'+
   '<section class="v20-panel"><h3>02 · Dán nhanh nhiều chuyến (nếu đã có kế hoạch)</h3>'+
   '<p>Mỗi dòng: <b>Số hiệu | KG | PCS | Giờ sẵn sàng</b>. Ví dụ: <code>VJ782 | 5000 | 200 | 09:00</code>. Chỉ nhập những trường đã có dữ liệu.</p>'+
   '<textarea id="v20CargoPaste" rows="4" placeholder="VJ782 | 5000 | 200 | 09:00&#10;VU1270 | 4000 | 165 | 09:15"></textarea>'+
   '<button class="primary" id="v20SaveCargoBulk">NHẬP KẾ HOẠCH HÀNG LOẠT</button></section>'+
   '<section class="v20-panel"><h3>03 · Danh sách và nhận định sơ bộ</h3><div id="v20CargoInsight" class="v20-insight"></div><div id="v20CargoRows" class="v20-list"></div></section>';
 }
 function showTotals(rows,u,extra){
   const relevant=rows.filter(x=>x.unit===u&&extra.includes(x.role_code)&&x.shift.startsWith('KHUNG_'));
   return relevant.length?relevant.map(x=>'<div class="v20-line"><b>'+escape(x.role_code==='SKYONE_BAGGAGE'?'SKYONE':x.role_code==='PVHK_ARRIVAL_TEAM'?'Đội đến':'Đội đi')+'</b> '+
   time(x.start_min)+'–'+time(x.end_min)+' · '+x.quantity+' người</div>').join(''):'<div class="v20-muted">Chưa có khung giờ bổ sung.</div>';
 }
 function renderLists(){
   if($('v20SkyList'))$('v20SkyList').innerHTML=showTotals(staff,'KTS',['SKYONE_BAGGAGE']);
   if($('v20PvList'))$('v20PvList').innerHTML=showTotals(staff,'PVHK',['PVHK_ARRIVAL_TEAM','PVHK_DEPARTURE_TEAM']);
   if($('v20Issues')){
     const active=issues.filter(x=>x.issue_status!=='RETURNED');
     $('v20Issues').innerHTML=issues.length?'<div class="v20-muted">'+active.length+' thiết bị đang có hạn chế / đang sửa chữa</div>'+
       issues.map(x=>'<div class="v20-line"><div><b>'+escape(x.equipment_id)+'</b> · '+escape(x.equipment_group)+' · <strong>'+escape(x.issue_status)+'</strong><div>'+escape(x.fault)+
       (x.impact?' · Ảnh hưởng: '+escape(x.impact):'')+
       (x.workaround?' · Thay thế: '+escape(x.workaround):'')+
       (x.expected_return?' · Dự kiến: '+escape(x.expected_return):'')+'</div></div>'+
       (x.issue_status!=='RETURNED'?'<button data-v20-fix="'+escape(x.equipment_id)+'">ĐÃ PHỤC HỒI</button>':'')+'</div>').join(''):
       '<div class="v20-muted">Chưa có thiết bị hư hỏng được khai báo cho ngày này.</div>';
   }
   if($('v20CargoRows')){
     $('v20CargoRows').innerHTML=cargo.length?cargo.map(x=>
       '<div class="v20-line"><div><b>'+escape(x.flight_no)+'</b> · '+(x.cargo_kg==null?'KG chưa có':Number(x.cargo_kg).toLocaleString('vi-VN')+' KG')+
       (x.cargo_pcs==null?'':' · '+x.cargo_pcs+' PCS')+
       (x.ready_by_min==null?'':' · Kho sẵn sàng '+time(x.ready_by_min))+
       (x.plan_note?' · '+escape(x.plan_note):'')+'</div><button data-v20-remove="'+escape(x.flight_no)+'">XÓA</button></div>'
      ).join(''):'<div class="v20-muted">Chưa nhận kế hoạch cargo.</div>';
     const windows=new Map();
     for(const x of cargo){
       const f=flights.find(z=>z.departure===x.flight_no||z.arrival===x.flight_no);
       const dep=f?.departure===x.flight_no,instant=dep?f?.std_min:f?.sta_min;
       if(instant==null)continue;
       const slot=Math.floor(instant/30)*30;
       if(!windows.has(slot))windows.set(slot,[]);
       windows.get(slot).push(x);
     }
     const busy=[...windows].filter(x=>x[1].length>=2).sort((a,b)=>b[1].length-a[1].length);
     $('v20CargoInsight').innerHTML=busy.length?'Các khung tập trung nhiều chuyến có cargo: '+
       busy.slice(0,4).map(x=>'<b>'+time(x[0])+'–'+time(x[0]+30)+'</b> ('+
         x[1].map(z=>escape(z.flight_no)).join(', ')+')').join('; ')+
       '. <b>TBĐH:</b> chủ động báo Kho, PVSĐ chuẩn bị hàng/xe và theo dõi giờ sẵn sàng từng chuyến.':
       'Chưa phát hiện từ hai chuyến cargo trở lên cùng khung 30 phút theo STA/STD đã lưu; cần tiếp tục theo dõi dữ liệu kế hoạch.';
   }
 }
 function mountGse(){
   const wrap=$('v20GseMount'),panel=$('tab-gse')?.querySelector('.panel');
   if(wrap&&panel&&!wrap.contains(panel))wrap.appendChild(panel);
 }


 function vehiclePanel(who){
   const model=window.SagsShuttleModel;
   const name=who==='KTS'?'PVSĐ':who==='PVHK'?'PVHK':who==='DH'?'ĐIỀU HÀNH':'KHO HÀNG';
   const dirGroup=direction=>{
      const selection=model.defaults.filter(x=>x.direction===direction);
      return '<div class="v21-route-group"><div class="v21-route-heading"><b>'+model.directionLabel[direction]+'</b><span>'+selection.length+' mốc từ mẫu</span></div>'+
       '<div class="v21-route-slots">'+selection.map(x=>
        '<label class="v21-slot"><b>'+x.label+'</b><span>Số người</span>'+
        '<input type="number" min="0" max="500" inputmode="numeric" placeholder="Chưa nhập" data-v21-bus="'+who+'|'+direction+'|'+x.departure_min+'">'+
        '<small data-v21-confirm="'+who+'|'+direction+'|'+x.departure_min+'">Chưa xác nhận</small>'+
        (x.note?'<em>'+escape(x.note)+'</em>':'')+
        '</label>').join('')+'</div></div>';
   };
   return '<section class="v20-panel v21-transport" data-v21-panel="'+who+'"><h3>XE GIAO CA · '+name+'</h3>'+
    '<p><b>CHIỀU NHA → CXR</b> là xe đi làm; <b>CXR → NHA</b> là xe về. Các mốc dưới đây đúng theo ảnh mẫu. Ô trống là chưa xác nhận, 0 là xác nhận không có người. Thời điểm lưu do hệ thống ghi nhận.</p>'+
    dirGroup('NHA_CXR')+dirGroup('CXR_NHA')+
    '<div class="v21-transport-actions"><button class="primary" data-v20-bus-save="'+who+'">LƯU & XÁC NHẬN SỐ NGƯỜI</button>'+
    '<span class="v20-help" data-v20-bus-message="'+who+'"></span></div>'+
    '<details class="v21-add"><summary>+ THÊM KHUNG GIỜ / CHIỀU XE TÙY CHỌN</summary>'+
    '<div class="v21-add-fields">'+
    '<label>Chiều xe chạy<select data-v21-add-direction="'+who+'"><option value="NHA_CXR">NHA → CXR · Xe đi làm</option><option value="CXR_NHA">CXR → NHA · Xe về</option></select></label>'+
    '<label>Giờ xe chạy<input type="time" data-v21-add-time="'+who+'" value="12:00"></label>'+
    '<label>Ngày chạy<select data-v21-add-next="'+who+'"><option value="0">Cùng ngày khai thác</option><option value="1">Ngày hôm sau (+1)</option></select></label>'+
    '<label>Số người<input type="number" min="0" max="500" data-v21-add-count="'+who+'" placeholder="Nhập số người"></label>'+
    '<label class="v21-wide">Ghi chú (không bắt buộc)<input maxlength="300" data-v21-add-note="'+who+'" placeholder="Xe tăng cường, xe bổ sung..."></label></div>'+
    '<button class="primary" data-v21-add-save="'+who+'">+ LƯU CHUYẾN XE BỔ SUNG</button>'+
    '</details>'+
    '<div class="v21-extra-list"><h4>KHUNG GIỜ TÙY CHỌN ĐÃ LƯU</h4><div data-v21-custom-list="'+who+'"></div></div>'+
    '</section>';
 }
 async function saveTransport(target){
   if(!allowed(target))return;
   const data=[];
   document.querySelectorAll('[data-v21-bus]').forEach(input=>{
     const [u,d,m]=input.dataset.v21Bus.split('|');
     if(u!==target)return;
     const val=String(input.value||'').trim();
     if(!val)return;
     if(!/^\d+$/.test(val)||Number(val)>500)throw new Error('Số người phải từ 0 đến 500.');
     const minute=Number(m);
     const prior=transport.find(x=>x.unit===u&&x.direction===d&&x.departure_min===minute);
     if(prior&&prior.quantity===Number(val))return;
     data.push({service_date:day(),unit:u,direction:d,departure_min:minute,
      quantity:Number(val),is_custom:!window.SagsShuttleModel.isDefault(d,minute),
      note:prior?.note||'',confirmed_by:me.id});
   });
   if(!data.length)return toast('Không có số người thay đổi; giữ nguyên thời điểm xác nhận trước đó.');
   const {error}=await sb.from('ops_shift_transport_v2').upsert(data,{onConflict:'service_date,unit,direction,departure_min'});
   if(error)return alert('Không lưu được xe giao ca: '+error.message);
   await refresh();
   const msg=document.querySelector('[data-v20-bus-message="'+target+'"]');
   if(msg)msg.textContent='Đã xác nhận '+data.length+' chuyến xe. Giờ xác nhận được lấy từ máy chủ.';
   toast('Đã lưu xe giao ca '+target);
 }
 async function saveNewTransport(target){
   if(!allowed(target))return;
   const dir=document.querySelector('[data-v21-add-direction="'+target+'"]')?.value;
   const time=document.querySelector('[data-v21-add-time="'+target+'"]')?.value;
   const next=document.querySelector('[data-v21-add-next="'+target+'"]')?.value==='1';
   const num=document.querySelector('[data-v21-add-count="'+target+'"]')?.value.trim();
   const note=document.querySelector('[data-v21-add-note="'+target+'"]')?.value.trim()||'';
   const minute=window.SagsShuttleModel.parseClock(time,next);
   if(!['NHA_CXR','CXR_NHA'].includes(dir)||minute==null)
     return alert('Chọn chiều xe chạy và giờ hợp lệ.');
   if(!/^\d+$/.test(num)||+num>500)return alert('Số người phải từ 0 đến 500.');
   if(window.SagsShuttleModel.isDefault(dir,minute))
     return alert('Khung giờ này có sẵn trong bảng mẫu phía trên. Nhập số người tại đúng chiều và giờ đó.');
   const exists=transport.some(x=>x.unit===target&&x.direction===dir&&x.departure_min===minute);
   if(exists&&!confirm('Chuyến xe tự chọn này đã có. Cập nhật lại số người và xác nhận?'))return;
   const {error}=await sb.from('ops_shift_transport_v2').upsert({
    service_date:day(),unit:target,direction:dir,departure_min:minute,
    quantity:Number(num),is_custom:true,note,confirmed_by:me.id
   },{onConflict:'service_date,unit,direction,departure_min'});
   if(error)return alert('Không lưu được khung xe mới: '+error.message);
   await refresh();
   const el=document.querySelector('[data-v21-add-count="'+target+'"]');if(el)el.value='';
   toast('Đã thêm xe '+window.SagsShuttleModel.directionLabel[dir]+' '+window.SagsShuttleModel.clock(minute));
 }
 async function removeTransport(unitName,direction,minute){
   if(!allowed(unitName))return;
   const record=transport.find(x=>x.unit===unitName&&x.direction===direction&&x.departure_min===minute);
   if(!record||!record.is_custom)return;
   if(!confirm('Xóa xe tự chọn '+window.SagsShuttleModel.directionLabel[direction]+' lúc '+window.SagsShuttleModel.clock(minute)+'?'))return;
   const {error}=await sb.from('ops_shift_transport_v2').delete().eq('service_date',day()).eq('unit',unitName).eq('direction',direction).eq('departure_min',minute);
   if(error)return alert('Không xóa được: '+error.message);
   await refresh();
 }
 function vnTime(iso){
   if(!iso)return 'Chưa xác nhận';
   return new Date(iso).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
 }
 function renderTransport(){
   const model=window.SagsShuttleModel;
   for(const u of ['DH','KTS','PVHK','KHO']){
     for(const slot of model.defaults){
       const key=u+'|'+slot.direction+'|'+slot.departure_min;
       const inp=document.querySelector('[data-v21-bus="'+key+'"]');
       const note=document.querySelector('[data-v21-confirm="'+key+'"]');
       const found=transport.find(x=>x.unit===u&&x.direction===slot.direction&&x.departure_min===slot.departure_min);
       if(inp&&document.activeElement!==inp)inp.value=found?.quantity??'';
       if(note)note.textContent=found?.confirmed_at?'Đã xác nhận '+vnTime(found.confirmed_at):'Chưa xác nhận';
     }
     const box=document.querySelector('[data-v21-custom-list="'+u+'"]');
     if(box){
       const extra=model.order(transport.filter(x=>x.unit===u&&x.is_custom));
       box.innerHTML=extra.length?extra.map(x=>{
         const key=u+'|'+x.direction+'|'+x.departure_min;
         return '<div class="v21-custom-row"><div><b>'+escape(model.directionLabel[x.direction])+'</b> · '+model.clock(x.departure_min)+
           (x.note?' · '+escape(x.note):'')+'<small>Đã xác nhận: '+vnTime(x.confirmed_at)+'</small></div>'+
           '<label>Số người<input type="number" min="0" max="500" inputmode="numeric" data-v21-bus="'+key+'" value="'+x.quantity+'"></label>'+
           '<button type="button" data-v21-delete="'+key+'">XÓA</button></div>';
       }).join(''):'<div class="v20-muted">Chưa có chuyến xe bổ sung.</div>';
     }
     const values=staff.filter(x=>x.unit===u&&['SÁNG','ĐÊM'].includes(x.shift)&&x.confirmed_at);
     const last=values.map(x=>x.confirmed_at).sort().at(-1);
     const label=document.querySelector('[data-v20-staff-confirm="'+u+'"]');
     if(label)label.textContent=last?'Quân số đã xác nhận: '+vnTime(last):'Quân số chưa được xác nhận';
   }
 }
 function init(){
   if(initialized)return;initialized=true;
   $('v20Pvsd').innerHTML=tableRows()+vehiclePanel('KTS');$('v20Pvhk').innerHTML=pvhk()+vehiclePanel('PVHK');$('v20Warehouse').innerHTML=warehouse()+vehiclePanel('KHO');
   $('tab-home').insertAdjacentHTML('beforeend', '<div id="v22DhShuttle">'+vehiclePanel('DH')+'</div>');
   mountGse();
   document.querySelectorAll('[data-v20-bus-save]').forEach(b=>b.onclick=()=>saveTransport(b.dataset.v20BusSave).catch(e=>alert(e.message)));
   document.querySelectorAll('[data-v21-add-save]').forEach(b=>b.onclick=()=>saveNewTransport(b.dataset.v21AddSave));
   for(const u of ['DH','KTS','PVHK','KHO']){
     const box=document.querySelector('[data-v21-custom-list="'+u+'"]');
     box.onclick=e=>{const btn=e.target.closest('[data-v21-delete]');if(btn){const [target,dir,min]=btn.dataset.v21Delete.split('|');removeTransport(target,dir,Number(min));}};
   }
   $('v20SaveKTS').onclick=()=>saveStaff('KTS');
   $('v20SavePVHK').onclick=()=>saveStaff('PVHK');
   $('v20SaveSky').onclick=()=>saveExtra('KTS');
   $('v20SavePvExtra').onclick=()=>saveExtra('PVHK');
   $('v20SaveIssue').onclick=saveIssue;
   $('v20SaveCargo').onclick=saveCargo;
   $('v20SaveCargoBulk').onclick=saveBulkCargo;
   window.SagsShuttleExport?.bind();
   $('v20Issues').onclick=e=>{const b=e.target.closest('[data-v20-fix]');if(b)fixIssue(b.dataset.v20Fix)};
   $('v20CargoRows').onclick=e=>{const b=e.target.closest('[data-v20-remove]');if(b)removeCargo(b.dataset.v20Remove)};
   window.SagsUnitInputV211?.init();
 }
 function status(id,msg,error=false){const el=$(id);if(el){el.textContent=msg;el.style.color=error?'#b92835':'#257b67'}}
 async function saveStaff(target){
   if(!allowed(target))return;
   const data=[];
   for(const sh of shifts)for(const role of roleNames[target]){
     const el=document.querySelector('[data-v20-quantity="'+target+'|'+sh[0]+'|'+role[0]+'"]');
     const n=el?.value?.trim();
     if(!n)continue;
     if(!/^\d+$/.test(n))return alert('Quân số phải là số nguyên không âm.');
     data.push({service_date:day(),unit:target,role_code:role[0],shift:sh[0],
       start_min:sh[1],end_min:sh[2],quantity:Number(n),confirmed_by:me.id,confirmed_at:new Date().toISOString()});
   }
   if(!data.length)return alert('Chưa nhập quân số nào; ô trống là chưa xác nhận.');
   const {error}=await sb.from('ops_staff_capacity').upsert(data,{onConflict:'service_date,unit,role_code,shift'});
   if(error)return alert('Chưa lưu được: '+error.message);
   await load();status('v20'+target+'Help','Đã cập nhật quân số '+target+'.');
 }
 async function saveExtra(target){
   if(!allowed(target))return;
   const isSky=target==='KTS';
   const from=clock(val(isSky?'v20SkyFrom':'v20PvFrom'));
   let end=clock(val(isSky?'v20SkyTo':'v20PvTo'));
   const number=val(isSky?'v20SkyPeople':'v20PvPeople');
   if(from==null||end==null||!/^\d+$/.test(number))return alert('Kiểm tra giờ bắt đầu, giờ kết thúc và số người.');
   if(end<=from)end+=1440;
   const role=isSky?'SKYONE_BAGGAGE':val('v20PvTeam');
   const shift='KHUNG_'+role+'_'+from+'_'+end;
   const entry={service_date:day(),unit:target,role_code:role,shift,start_min:from,end_min:end,
     quantity:Number(number),confirmed_by:me.id,confirmed_at:new Date().toISOString()};
   const {error}=await sb.from('ops_staff_capacity').upsert(entry,{onConflict:'service_date,unit,role_code,shift'});
   if(error)return alert('Không lưu được: '+error.message);
   await load();toast('Đã thêm khung giờ '+time(from)+'–'+time(end)+'.');
 }
 async function saveIssue(){
   if(!allowed('KTS'))return;
   const equipment_id=val('v20Vehicle'),equipment_group=val('v20Group'),issue_status=val('v20IssueStatus'),fault=val('v20Fault');
   if(equipment_id.length<2||fault.length<2)return alert('Cần mã thiết bị và nội dung hư hỏng/trạng thái thực tế.');
   const item={service_date:day(),equipment_id,equipment_group,issue_status,fault,
     impact:val('v20Impact'),workaround:val('v20Workaround'),expected_return:val('v20RepairEta'),
     updated_by:me.id,updated_at:new Date().toISOString()};
   const {error}=await sb.from('ops_gse_issues').upsert(item,{onConflict:'service_date,equipment_id'});
   if(error)return alert('Chưa lưu được: '+error.message);
   await refresh();toast('Đã cập nhật tình trạng '+equipment_id+'.');
 }
 async function fixIssue(id){
   if(!allowed('KTS'))return;
   const row=issues.find(x=>x.equipment_id===id);
   if(!row||!confirm('Xác nhận '+id+' đã phục hồi hoạt động?'))return;
   const {error}=await sb.from('ops_gse_issues').update({issue_status:'RETURNED',updated_by:me.id,updated_at:new Date().toISOString()})
     .eq('service_date',day()).eq('equipment_id',id);
   if(error)return alert(error.message);await refresh();
 }
 function cargoFrom(x){
   const flight_no=String(x.flight_no||'').trim().toUpperCase().replace(/\s/g,'');
   if(!/^[A-Z0-9]{2,20}$/.test(flight_no))throw Error('Số hiệu chuyến không hợp lệ: '+flight_no);
   const q=(s,name,integer=false)=>{
     if(s==null||String(s).trim()==='')return null;
     const n=Number(s);
     if(!Number.isFinite(n)||n<0||(integer&&!Number.isInteger(n)))throw Error(name+' không hợp lệ của '+flight_no);
     return n;
   };
   let ready=null;
   if(x.ready&&String(x.ready).trim()){
     ready=clock(x.ready);if(ready==null)throw Error('Giờ sẵn sàng không hợp lệ: '+flight_no);
   }
   return {service_date:day(),flight_no,cargo_kg:q(x.kg,'KG'),cargo_pcs:q(x.pcs,'PCS',true),
     ready_by_min:ready,plan_note:String(x.note||'').trim(),updated_by:me.id,updated_at:new Date().toISOString()};
 }
 async function saveCargo(){
   if(!allowed('KHO'))return;
   let data;
   try{data=cargoFrom({flight_no:val('v20CargoFlight'),kg:val('v20CargoKg'),pcs:val('v20CargoPcs'),
     ready:val('v20ReadyTime'),note:val('v20CargoNote')})}catch(e){return alert(e.message)}
   if(data.cargo_kg==null&&data.cargo_pcs==null&&!data.plan_note)return alert('Nhập ít nhất KG, PCS hoặc ghi chú cargo.');
   const {error}=await sb.from('ops_warehouse_cargo_plan').upsert(data,{onConflict:'service_date,flight_no'});
   if(error)return alert('Chưa lưu được: '+error.message);
   await refresh();toast('Đã lưu kế hoạch cargo '+data.flight_no+'.');
 }
 async function saveBulkCargo(){
   if(!allowed('KHO'))return;
   const lines=val('v20CargoPaste').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   if(!lines.length)return alert('Chưa có dòng kế hoạch.');
   if(lines.length>100)return alert('Mỗi lần nhập tối đa 100 chuyến.');
   let items=[];
   try{
     items=lines.map((line,i)=>{const a=line.split('|').map(x=>x.trim());
       if(a.length<2||a.length>5)throw Error('Dòng '+(i+1)+' chưa đúng mẫu Số hiệu | KG | PCS | Giờ.');
       return cargoFrom({flight_no:a[0],kg:a[1],pcs:a[2],ready:a[3],note:a[4]});
     });
     if(new Set(items.map(x=>x.flight_no)).size!==items.length)throw Error('Có chuyến trùng trong bảng dán.');
   }catch(e){return alert(e.message)}
   const {error}=await sb.from('ops_warehouse_cargo_plan').upsert(items,{onConflict:'service_date,flight_no'});
   if(error)return alert('Chưa lưu được: '+error.message);
   $('v20CargoPaste').value='';await refresh();toast('Đã nhập '+items.length+' kế hoạch cargo.');
 }
 async function removeCargo(flightNo){
   if(!allowed('KHO')||!confirm('Xóa kế hoạch cargo của '+flightNo+'?'))return;
   const {error}=await sb.from('ops_warehouse_cargo_plan').delete().eq('service_date',day()).eq('flight_no',flightNo);
   if(error)return alert(error.message);await refresh();
 }
 function render(){
   if(!initialized||!me)return;
   for(const target of ['KTS','PVHK']){
     for(const sh of shifts)for(const role of roleNames[target]){
       const el=document.querySelector('[data-v20-quantity="'+target+'|'+sh[0]+'|'+role[0]+'"]');
       if(el&&document.activeElement!==el)el.value=staffFor(target,role[0],sh[0])??'';
     }
   }
   renderLists();renderTransport();
   const radar=$('v20RadarContext');
   if(radar){
     const active=issues.filter(x=>x.issue_status!=='RETURNED');
     const planned=cargo.filter(x=>x.cargo_kg!=null);
     const total=planned.reduce((n,x)=>n+Number(x.cargo_kg),0);
     const busDetails=['NHA_CXR','CXR_NHA'].map(dir=>window.SagsShuttleModel.directionLabel[dir]+': '+['DH','KTS','PVHK','KHO'].map(u=>{const parts=transport.filter(z=>z.unit===u&&z.direction===dir);const label=u==='KTS'?'PVSĐ':u==='PVHK'?'PVHK':u==='DH'?'ĐH':'KHO';return label+' '+(parts.length?parts.length+' mốc đã xác nhận ('+parts.reduce((n,r)=>n+r.quantity,0)+' lượt xe theo các mốc)':'chưa xác nhận');}).join(' · ')).join('; ');
     radar.innerHTML='<div class="v20-context-grid"><div><b>KHO HÀNG</b><p>'+cargo.length+' chuyến có kế hoạch · '+
       (planned.length?total.toLocaleString('vi-VN')+' KG đã khai báo':'KG chưa có dữ liệu')+
       '</p></div><div><b>GSE HẠN CHẾ</b><p>'+active.length+' thiết bị đang tạm dừng/sửa chữa/hạn chế</p></div>'+
       '<div><b>XE GIAO CA THEO PHÒNG</b><p>'+escape(busDetails)+'</p></div></div>';
   }
 }
 async function refresh(){
   if(!initialized||!me)return;
   const n=++generation,date=day();
   const [p,q,b]=await Promise.all([
     sb.from('ops_warehouse_cargo_plan').select('*').eq('service_date',date).order('flight_no'),
     sb.from('ops_gse_issues').select('*').eq('service_date',date).order('equipment_id'),
     sb.from('ops_shift_transport_v2').select('*').eq('service_date',date)
   ]);
   if(n!==generation)return;
   if(p.error||q.error||b.error){console.warn('Cannot retrieve departmental source',p.error||q.error||b.error);return}
   cargo=p.data||[];issues=q.data||[];transport=b.data||[];
   window.SagsCargoPlanCache=cargo;
   render();if(typeof renderRadar==='function')renderRadar();
   await window.SagsUnitInputV211?.refresh();
 }
 function setUnit(role){
   init();
   // Restore the full Điều hành overview, which was never initialized by V2.4.
   // Keep the shuttle entry independent if the overview encounters a display error.
   try{window.SagsUIV19?.setUnit(role)}
   catch(error){console.error('Không hiển thị được tổng quan ĐH:',error);
     const home=$('v19Home');
     if(home)home.innerHTML='<div class="panel"><h2>PHÒNG ĐIỀU HÀNH</h2><p>Không tải được phần tổng quan. Bảng xe giao ca vẫn sử dụng được ở bên dưới.</p></div>';
   }
   const allowedTabs={
     DH:['home','sources','radar','report','doorclose'],
     KTS:['pvsd','radar','report'],
     PVHK:['pvhk','radar','report'],
     KHO:['warehouse','radar','report'],
     QA:['qa_it','radar','report'],
     IT:['qa_it','radar','report'],
     VIEWER:['radar','report'],
     ADMIN:['home','sources','pvsd','pvhk','warehouse','qa_it','radar','report','doorclose','admin']
   }[role]||['radar','report'];
   const labels={home:'ĐIỀU HÀNH',sources:'LỊCH BAY',pvsd:'PVSĐ',pvhk:'PVHK',warehouse:'KHO HÀNG',qa_it:'QA / IT',
     radar:'RADAR',report:'BÁO CÁO',doorclose:'DOOR CLOSE',admin:'PHÂN QUYỀN'};
   document.querySelectorAll('#tabs [data-tab]').forEach(b=>{
     b.classList.toggle('v19-tab-off',!allowedTabs.includes(b.dataset.tab));
     if(labels[b.dataset.tab])b.textContent=labels[b.dataset.tab];
   });
   $('v20Pvsd').closest('section').classList.toggle('v20-locked',!allowed('KTS'));
   $('v20Pvhk').closest('section').classList.toggle('v20-locked',!allowed('PVHK'));
   $('v20Warehouse').closest('section').classList.toggle('v20-locked',!allowed('KHO'));
   window.SagsUnitInputV211?.updateRights();
   const dhPanel=$('v22DhShuttle');if(dhPanel)dhPanel.style.display=allowed('DH')?'':'none';
   const note=$('v19NoteEditor');if(note)note.style.display=['DH','ADMIN'].includes(role)?'':'none';
   document.querySelectorAll('[data-v19-export],[data-v21-export]').forEach(button=>{button.hidden=!['DH','ADMIN'].includes(role);button.style.display=['DH','ADMIN'].includes(role)?'':'none';});
   switchTab(allowedTabs[0]);
   // The new five-column entry grid must mount on first login, not only after a refresh.
   window.SagsShuttleGridV24?.setUnit(role);
   refresh();
 }
 window.SagsUIV20={setUnit,refresh,render};
})();
