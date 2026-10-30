'use strict';
/* Structured, role-scoped D-1 inputs for the management forecast report.
   Existing flight, staff, cargo and shuttle forms remain the single source of truth for numbers. */
(function(root){
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const groups={
  DH:{label:'PHÒNG ĐIỀU HÀNH',mount:'tab-home',fields:[
   {key:'stand_status',label:'Bãi đỗ/hạ tầng theo AOC',type:'status'},
   {key:'stand_notes',label:'Chuyến/vị trí cần ưu tiên kiểm soát',hint:'Chỉ ghi thay đổi/hạn chế đã có nguồn xác nhận'},
   {key:'peak_priority',label:'Thứ tự ưu tiên điều hành cao điểm',hint:'Ví dụ: giải quyết dứt điểm nhóm chuyến sát STD, điều chuyển cuốn chiếu'},
   {key:'extra_restrictions',label:'Hạn chế khai thác hoặc yêu cầu hãng',hint:'Nếu có: chuyến, giờ, ảnh hưởng; nếu chưa có thông tin để trống'},
   {key:'escalation',label:'Vấn đề cần xin ý kiến cấp trên',hint:'Chỉ ghi nội dung có cơ sở'}
  ]},
  KTS:{label:'PVSĐ / KTSĐ',mount:'v20Pvsd',fields:[
   {key:'a330_ready',label:'Đáp ứng GSE/năng định tàu A330',type:'status'},
   {key:'b777_ready',label:'Đáp ứng GSE/năng định tàu B777',type:'status'},
   {key:'widebody_note',label:'Tàu rộng: thiết bị, người và phương án dự phòng',hint:'Nêu loại tàu/chuyến và phần đã xác nhận, không cần số xe nếu đã nhập ở mục GSE'},
   {key:'rolling_support',label:'Điều chuyển quân số/GSE cuốn chiếu',hint:'Nhóm/khung ưu tiên, điều kiện chuyển sau khi hoàn tất công đoạn'},
   {key:'staff_shortage',label:'Vị trí thiếu hoặc cần bổ sung nguồn lực',hint:'Chỉ ghi trường hợp có căn cứ, giờ và phương án xử lý'},
   {key:'gse_risk',label:'Hạn chế GSE còn ảnh hưởng theo chuyến',hint:'Mã xe, chuyến bị ảnh hưởng, phương án dự phòng'}
  ]},
  PVHK:{label:'PHỤC VỤ HÀNH KHÁCH',mount:'v20Pvhk',fields:[
   {key:'widebody_ready',label:'Nhân lực PVHK phục vụ tàu rộng',type:'status'},
   {key:'widebody_note',label:'Phục vụ hành khách A330/B777',hint:'Chuyến, tải PAX dự kiến, quầy/gate/đón khách cần điều chỉnh'},
   {key:'peak_staff',label:'Phân bổ đội đến/đi trong cao điểm',hint:'Khung giờ cần tăng cường, phối hợp cuốn chiếu theo tiến độ'},
   {key:'bag_risk',label:'Hành lý ký gửi / đảo trả / băng chuyền',hint:'Nêu chuyến cụ thể, không nhập lại số liệu PAX từ Excel'},
   {key:'special_pax',label:'Khách đặc biệt hoặc yêu cầu phục vụ riêng',hint:'Chỉ ghi khi có thông tin nguồn xác nhận'}
  ]},
  KHO:{label:'KHO HÀNG',mount:'v20Warehouse',fields:[
   {key:'cargo_ready',label:'Kế hoạch hàng trọng điểm đã kiểm tra',type:'status'},
   {key:'handover_priority',label:'Ưu tiên bàn giao hàng theo chuyến',hint:'Nêu chuyến và mốc cần bàn giao; KG/PCS nhập ở bảng hàng hóa phía trên'},
   {key:'special_cargo',label:'Hàng đặc thù (lạnh/transit/thủy sản...)',hint:'Chỉ nêu hàng có trong nguồn xác nhận'},
   {key:'cargo_bottleneck',label:'Nguy cơ ùn hàng / chậm bàn giao',hint:'Khung giờ, chuyến bị ảnh hưởng và phương án'},
   {key:'coordination',label:'Yêu cầu xe/nhân lực hỗ trợ từ PVSĐ',hint:'Thiết bị/giờ/vị trí cần phối hợp'}
  ]},
  QA_IT:{label:'QA / IT · AN TOÀN & TỒN TẠI',mount:'tab-qa_it',fields:[
   {key:'safety_status',label:'Thông tin an toàn/chất lượng đã kiểm tra',type:'status'},
   {key:'weather_fod',label:'Thời tiết, FOD hoặc hạn chế an toàn theo giờ',hint:'Chỉ đưa dữ liệu có nguồn chính thức'},
   {key:'open_capa',label:'Tồn tại/CAPA còn hiệu lực chuyển từ ca trước',hint:'Số vấn đề, mức ảnh hưởng, đơn vị phụ trách'},
   {key:'operational_impact',label:'Chuyến/vị trí bị ảnh hưởng',hint:'Nếu chưa có tác động cụ thể, ghi đang rà soát'},
   {key:'followup',label:'Biện pháp kiểm soát và mốc xác nhận',hint:'Phối hợp với ĐH, PVSĐ hoặc PVHK'}
  ]}
 };
 const selected=(unit)=>unit==='QA'||unit==='IT'?'QA_IT':unit;
 let rows=[],bound=false,token=0,loading=false,loadedDate='',lastError='';
 const labelFor=(row)=>row?.status==='CONFIRMED'?'ĐÃ XÁC NHẬN':row?.status==='DRAFT'?'ĐÃ LƯU NHÁP':'CHƯA CÓ DỮ LIỆU';
 const mayEdit=(key)=>typeof unit!=='undefined'&&(unit==='ADMIN'||unit===key||(key==='QA_IT'&&['QA','IT'].includes(unit)));
 const statusOpts=[['PENDING','CHƯA XÁC NHẬN'],['READY','ĐÃ SẴN SÀNG'],['LIMITED','CÓ HẠN CHẾ']]; 
 function createField(info){
   if(info.type==='status')return '<label>'+esc(info.label)+'<select data-unit-field="'+esc(info.key)+'">'+statusOpts.map(([v,k])=>'<option value="'+v+'">'+k+'</option>').join('')+'</select></label>';
   return '<label>'+esc(info.label)+'<textarea data-unit-field="'+esc(info.key)+' rows="2" maxlength="350" placeholder="'+esc(info.hint||'Nhập thông tin có căn cứ')+'"></textarea></label>';
 }
 function personnelFields(k){
   if(!['DH','PVHK','KTS'].includes(k))return '';
   const options='<option value="PENDING">CHỜ XÁC NHẬN</option><option value="READY">ĐẢM BẢO PHỤC VỤ BAY</option><option value="LIMITED">CHƯA ĐẢM BẢO PHỤC VỤ BAY</option>';
   return '<div class="v212-personnel">'+
     '<h4>TỔNG QUÂN SỐ PHỤC VỤ BAY · THEO CA</h4>'+
     '<p class="note">Nhập tổng nhân sự phục vụ bay của phòng, không nhập riêng đội đến/đi hoặc từng vị trí. Tình trạng đảm bảo do phòng tự xác nhận; không tự kết luận từ số lượng.</p>'+
     '<div class="v212-staff-grid">'+
       '<label>Ca sáng – tổng quân số<input data-unit-field="pvb_morning" type="number" min="0" max="9999" step="1" inputmode="numeric" placeholder="Chưa có số liệu"></label>'+
       '<label>Ca sáng – tình trạng<select data-unit-field="pvb_morning_status">'+options+'</select></label>'+
       '<label>Ca đêm – tổng quân số<input data-unit-field="pvb_night" type="number" min="0" max="9999" step="1" inputmode="numeric" placeholder="Chưa có số liệu"></label>'+
       '<label>Ca đêm – tình trạng<select data-unit-field="pvb_night_status">'+options+'</select></label>'+
     '</div>'+
     '<div class="v212-staff-preview"><b>CÂU TỔNG HỢP TẠI MỤC NHÂN SỰ</b><p data-v212-preview="'+k+'">CHỜ XÁC NHẬN quân số.</p><small>Bản xem trước khi nhập; báo cáo chính chỉ nhận số liệu sau khi phòng bấm XÁC NHẬN.</small></div>'+
     '</div>';
 }
 function readFields(node){
   const values={};
   for(const el of node.querySelectorAll('[data-unit-field]'))values[el.dataset.unitField]=String(el.value||'').trim();
   return values;
 }
 function refreshStaffPreview(k){
   const node=document.querySelector('[data-unit-forecast="'+k+'"]'),out=node?.querySelector('[data-v212-preview]');
   if(out&&root.SagsPersonnelV212)out.textContent=root.SagsPersonnelV212.formatUnit(k,readFields(node),true).line;
 }
 function html(k,g){
   return '<section class="v20-panel v211-input" data-unit-forecast="'+k+'"><div class="row space"><h3>BỔ SUNG XÁC NHẬN PHỤC VỤ BÁO CÁO · '+g.label+'</h3><span class="status gray" data-v211-state="'+k+'">CHƯA CÓ DỮ LIỆU</span></div>'+
    '<p class="note">Chỉ nhập điểm cần bổ sung cho dự báo; quân số, PAX, KG/PCS, GSE và xe giao ca giữ nguyên ở các biểu mẫu hiện có. Ô chưa biết để trống hoặc CHƯA XÁC NHẬN. LƯU NHÁP không được coi là xác nhận chuyên môn.</p>'+
    personnelFields(k)+'<div class="v20-incident-grid">'+g.fields.map(createField).join('')+'</div>'+
    '<div class="btnbar"><button type="button" data-v211-save="'+k+'">LƯU NHÁP</button><button type="button" class="primary" data-v211-confirm="'+k+'">XÁC NHẬN DỮ LIỆU CỦA PHÒNG</button></div>'+
    '<p class="note" data-v211-message="'+k+'"></p></section>';
 }
 function init(){
   if(bound)return;bound=true;
   for(const [key,g] of Object.entries(groups)){
     const target=$(g.mount);if(!target)continue;
     const section=document.createElement('div');section.innerHTML=html(key,g);
     const node=section.firstElementChild;
     if(key==='DH')target.insertBefore(node,$('v22DhShuttle')||null);
     else target.appendChild(node);
     node.querySelector('[data-v211-save]').onclick=()=>save(key,false);
     node.querySelector('[data-v211-confirm]').onclick=()=>save(key,true);
     node.querySelectorAll('[data-unit-field]').forEach(el=>el.addEventListener('input',()=>refreshStaffPreview(key)));
     node.querySelectorAll('select[data-unit-field]').forEach(el=>el.addEventListener('change',()=>refreshStaffPreview(key)));
     refreshStaffPreview(key);
   }
   updateRights();
 }
 function updateRights(){
   for(const [key] of Object.entries(groups)){
     const node=document.querySelector('[data-unit-forecast="'+key+'"]');if(!node)continue;
     node.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=!mayEdit(key));
   }
 }
 function applyRows(){
   for(const [key,g] of Object.entries(groups)){
     const node=document.querySelector('[data-unit-forecast="'+key+'"]');if(!node)continue;
     const row=rows.find(r=>r.unit===key),data=row?.details||{};
     if(node.contains(document.activeElement))continue;
     for(const el of node.querySelectorAll('[data-unit-field]'))el.value=String(data[el.dataset.unitField]??(el.tagName==='SELECT'?'PENDING':''));
     refreshStaffPreview(key);
     const el=node.querySelector('[data-v211-state]');
     if(el){el.textContent=labelFor(row)+(row?.confirmed_at?' · '+new Date(row.confirmed_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}):'');el.className='status '+(row?.status==='CONFIRMED'?'ok':'warn');}
   }
   updateRights();
 }
 async function refresh(){
   if(!bound||typeof me==='undefined'||!me)return;
   const date=$('day')?.value;if(!date)return;
   const n=++token;loading=true;
   const {data,error}=await sb.from('ops_unit_forecasts').select('*').eq('service_date',date);
   if(n!==token)return;
   loading=false;loadedDate=date;lastError=error?.message||'';
   if(error){for(const key of Object.keys(groups)){const el=document.querySelector('[data-v211-message="'+key+'"]');if(el)el.textContent='Chưa đọc được phản hồi chuyên môn: '+error.message;}return;}
   rows=data||[];applyRows();
 }
 async function save(key,confirm){
   if(!mayEdit(key)||loading)return;
   if(loadedDate!==$('day').value)return alert('Ngày dữ liệu đã đổi; hãy tải lại trước khi lưu.');
   const node=document.querySelector('[data-unit-forecast="'+key+'"]'),data={},g=groups[key];
   if(!node||!g)return;
   Object.assign(data,readFields(node));
   if(['DH','PVHK','KTS'].includes(key)&&root.SagsPersonnelV212){
     try{root.SagsPersonnelV212.validate(data);}catch(e){alert(e.message);return;}
   }
   if(confirm&&['DH','PVHK','KTS'].includes(key)){
     const p=root.SagsPersonnelV212;
     if(!p||['pvb_morning','pvb_night'].some(n=>p.parseCount(data[n])==null)||
       ['pvb_morning_status','pvb_night_status'].some(n=>!['READY','LIMITED'].includes(data[n]))){
       alert('Vui lòng nhập đầy đủ tổng quân số và chọn tình trạng phục vụ của cả ca sáng và ca đêm trước khi XÁC NHẬN. Có thể LƯU NHÁP nếu chưa đủ thông tin.');return;
     }
   }
   const values=Object.entries(data).filter(([k,v])=>v&&v!=='PENDING');
   if(!values.length)return alert('Cần nhập ít nhất một thông tin có căn cứ trước khi lưu.');
   const existing=rows.find(x=>x.unit===key);
   const timestamp=new Date().toISOString();
   const payload={service_date:$('day').value,unit:key,details:data,
     status:confirm?'CONFIRMED':'DRAFT',revision:(existing?.revision||0)+1,
     confirmed_by:confirm?me.id:null,confirmed_at:confirm?timestamp:null,
     updated_by:me.id,updated_at:timestamp};
   const message=node.querySelector('[data-v211-message="'+key+'"]'),buttons=[...node.querySelectorAll('button')];
   buttons.forEach(b=>b.disabled=true);
   try{
     const {error}=await sb.from('ops_unit_forecasts').upsert(payload,{onConflict:'service_date,unit'});
     if(error)throw Error(error.message);
     if(message)message.textContent=confirm?'Đã xác nhận dữ liệu phòng; ĐH có thể sử dụng trong bản tin.':'Đã lưu nháp; chưa sử dụng như nguồn đã xác nhận.';
     await refresh();
   }catch(e){if(message)message.textContent='KHÔNG LƯU ĐƯỢC: '+e.message;}
   finally{updateRights();}
 }
 root.SagsUnitInputV211={init,refresh,updateRights,groups,_test:{selected,labelFor}};
})(window);