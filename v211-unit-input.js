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
 let rows=[],quickRows=[],bound=false,token=0,loading=false,loadedDate='',lastError='';
 const labelFor=(row)=>row?.status==='CONFIRMED'?'ĐÃ XÁC NHẬN':row?.status==='DRAFT'?'ĐÃ LƯU NHÁP':'CHƯA CÓ DỮ LIỆU';
 const mayEdit=(key)=>typeof unit!=='undefined'&&(['ADMIN','DH'].includes(unit)||unit===key||(key==='QA_IT'&&['QA','IT'].includes(unit)));
 const statusOpts=[['PENDING','CHƯA XÁC NHẬN'],['READY','ĐÃ SẴN SÀNG'],['LIMITED','CÓ HẠN CHẾ']]; 
 function createField(info){
   if(info.type==='status')return '<label>'+esc(info.label)+'<select data-unit-field="'+esc(info.key)+'">'+statusOpts.map(([v,k])=>'<option value="'+v+'">'+k+'</option>').join('')+'</select></label>';
   return '<label>'+esc(info.label)+'<textarea data-unit-field="'+esc(info.key)+' rows="2" maxlength="350" placeholder="'+esc(info.hint||'Nhập thông tin có căn cứ')+'"></textarea></label>';
 }
 function personnelFields(k){
   if(!['DH','PVHK','KTS'].includes(k))return '';
   const opts='<option value="PENDING">Chưa đánh giá</option><option value="READY">ĐỦ nhân sự</option><option value="LIMITED">THIẾU nhân sự</option>';
   const shift=(name,code)=>'<article class="v224-shift-card" data-v224-shift="'+code+'">'+
     '<h4>'+name+'</h4><div class="v224-shift-fields">'+
     '<label>Quân số hiện có<input data-unit-field="pvb_'+code+'" type="number" min="0" max="9999" step="1" inputmode="numeric" placeholder="Nhập số người"></label>'+
     '<label>Quân số cần (nếu có định mức)<input data-unit-field="pvb_'+code+'_required" type="number" min="0" max="9999" step="1" inputmode="numeric" placeholder="Chưa có định mức"></label>'+
     '<label>Đánh giá của phòng<select data-unit-field="pvb_'+code+'_status">'+opts+'</select></label>'+
     '</div><p class="v224-shift-feedback" data-v224-shift-feedback="'+code+'">Chưa nhập hoặc chưa đánh giá.</p></article>';
   return '<div class="v212-personnel v224-personnel">'+
     '<div class="v224-section-title"><span class="v224-step">01</span><div><h4>TỔNG QUÂN SỐ PHỤC VỤ BAY</h4>'+
     '<p>Nhập số người thực có và xác nhận tình trạng từng ca. Không cộng lại số người ở phần phân bổ theo đội.</p></div></div>'+
     '<div class="v224-shift-grid">'+shift('CA SÁNG','morning')+shift('CA ĐÊM','night')+'</div>'+
     '<div class="v212-staff-preview v224-staff-preview"><b>NỘI DUNG SẼ ĐƯA VÀO BÁO CÁO</b>'+
     '<p data-v212-preview="'+k+'">Chưa có quân số được xác nhận.</p>'+
     '<small>Đây là bản xem trước; chỉ số liệu đã bấm XÁC NHẬN & LƯU mới được dùng trong báo cáo chính thức.</small></div>'+
     '</div>';
 }
 function shiftFeedback(details,code){
   const p=root.SagsPersonnelV212;
   if(!p)return 'Chưa có đánh giá.';
   const count=p.parseCount(details['pvb_'+code]),required=p.parseCount(details['pvb_'+code+'_required']);
   const state=details['pvb_'+code+'_status'];
   if(count==null)return 'CHƯA NHẬP quân số.';
   if(state==='PENDING'||!state)return 'Đã nhập '+count+' người · chưa đánh giá đủ/thiếu.';
   if(required==null)return (state==='READY'?'Phòng xác nhận đủ':'Phòng xác nhận thiếu')+
      ' · chưa có định mức số người để tính chênh lệch.';
   const diff=count-required;
   const contradiction=state==='READY'&&diff<0||state==='LIMITED'&&diff>=0;
   if(contradiction)return 'CẦN KIỂM TRA: '+count+' người / nhu cầu '+required+
      ' người, khác với đánh giá đã chọn.';
   return diff<0?'THIẾU '+(-diff)+' NGƯỜI ('+count+'/'+required+').':
     'ĐỦ THEO SỐ LIỆU ('+count+'/'+required+', dư '+diff+').';
 }
 function readFields(node){
   const values={};
   for(const el of node.querySelectorAll('[data-unit-field]'))values[el.dataset.unitField]=String(el.value||'').trim();
   return values;
 }
 function refreshStaffPreview(k){
   const node=document.querySelector('[data-unit-forecast="'+k+'"]'),
         out=node?.querySelector('[data-v212-preview]');
   if(!node||!root.SagsPersonnelV212)return;
   const data=readFields(node);
   if(out)out.textContent=root.SagsPersonnelV212.formatUnit(k,data,true).line;
   for(const code of ['morning','night']){
     const indicator=node.querySelector('[data-v224-shift-feedback="'+code+'"]');
     if(indicator){
       const copy=shiftFeedback(data,code);
       indicator.textContent=copy;
       indicator.dataset.level=/CẦN KIỂM TRA|THIẾU/.test(copy)?'warn':
         /CHƯA|chưa đánh giá/.test(copy)?'pending':'ok';
     }
   }
 }
 function html(k,g){
   return '<section class="v20-panel v211-input v224-unit-panel" data-unit-forecast="'+k+'">'+
    '<div class="v224-head"><div><span class="v224-kicker">CẬP NHẬT THEO NGÀY</span><h3>'+g.label+'</h3>'+
    '<p>Chỉ cần xác nhận quân số của hai ca và bổ sung nội dung cần lưu ý nếu có.</p></div>'+
    '<span class="status gray" data-v211-state="'+k+'">CHƯA CÓ DỮ LIỆU</span></div>'+
    personnelFields(k)+
    '<details class="v224-details v224-specialty"'+(personnelFields(k)?'':' open')+'><summary><b>'+(personnelFields(k)?'02 · THÔNG TIN NGHIỆP VỤ BỔ SUNG':'NỘI DUNG CẦN BÁO CÁO')+'</b><small>Chỉ mở khi có hạn chế hoặc nội dung cần báo ĐH</small></summary>'+
    '<div class="v20-incident-grid">'+g.fields.map(createField).join('')+'</div></details>'+
    '<details class="v224-details v224-paste"><summary><b>DÁN NHANH BẢN TIN CỦA PHÒNG</b><small>Dán nhiều dòng khi có tình trạng xe, nhân sự hoặc nhiệm vụ khác cần báo</small></summary>'+
    '<textarea data-v215-quick="'+k+'" rows="4" maxlength="5000" placeholder="Dán những nội dung cần báo ĐH. Giữ nguyên ý từ phòng..."></textarea>'+
    '<div class="v215-quick-actions"><button type="button" data-v215-send="'+k+'">LƯU NỘI DUNG DÁN NHANH</button>'+
    '<span data-v215-state="'+k+'">Chưa gửi nội dung bổ sung.</span></div></details>'+
    '<div class="v224-primary-actions"><button type="button" class="primary" data-v211-confirm="'+k+'">XÁC NHẬN & LƯU THÔNG TIN PHÒNG</button>'+
    '<span class="v224-save-note">Số liệu đã xác nhận được đưa vào báo cáo điều hành.</span></div>'+
    '<details class="v224-draft"><summary>Chưa đủ dữ liệu? Lưu nháp</summary>'+
    '<button type="button" data-v211-save="'+k+'">LƯU NHÁP · CHƯA PHÁT HÀNH</button>'+
    '<p>Thông tin lưu nháp không được coi là số liệu xác nhận của phòng.</p></details>'+
    '<p class="note" data-v211-message="'+k+'" role="status" aria-live="polite"></p></section>';
 }
 function init(){
   if(bound)return;bound=true;
   for(const [key,g] of Object.entries(groups)){
     const target=$(g.mount);if(!target)continue;
     const section=document.createElement('div');section.innerHTML=html(key,g);
     const node=section.firstElementChild;
     if(key==='DH')target.insertBefore(node,$('v22DhShuttle')||null);
     else if(key==='PVHK'||key==='KTS'){
       const head=target.querySelector('.v20-head');
       if(head)head.insertAdjacentElement('afterend',node);
       else target.prepend(node);
     }else target.appendChild(node);
     node.querySelector('[data-v211-save]').onclick=()=>save(key,false);
     node.querySelector('[data-v211-confirm]').onclick=()=>save(key,true);
     node.querySelector('[data-v215-send]').onclick=()=>saveQuick(key);
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
     const row=rows.find(r=>r.unit===key),data=row?.details||{},quick=quickRows.find(r=>r.unit===key);
     if(node.contains(document.activeElement))continue;
     for(const el of node.querySelectorAll('[data-unit-field]'))el.value=String(data[el.dataset.unitField]??(el.tagName==='SELECT'?'PENDING':''));
     const box=node.querySelector('[data-v215-quick]');if(box)box.value=quick?.report_text||'';
     const note=node.querySelector('[data-v215-state]');
     if(note)note.textContent=quick?.updated_at?'ĐH đã nhận · '+new Date(quick.updated_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Chưa gửi nội dung bổ sung.';
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
   const [normal,quick]=await Promise.all([
     sb.from('ops_unit_forecasts').select('*').eq('service_date',date),
     sb.from('ops_unit_quick_reports').select('service_date,unit,report_text,updated_at,updated_by').eq('service_date',date)
   ]);
   const {data,error}=normal;
   if(n!==token)return;
   loading=false;loadedDate=date;lastError=error?.message||'';
   if(error||quick.error){for(const key of Object.keys(groups)){const el=document.querySelector('[data-v211-message="'+key+'"]');if(el)el.textContent='Không tải được nội dung các phòng: '+(error||quick.error).message;}return;}
   rows=data||[];quickRows=quick.data||[];applyRows();
 }
 async function saveQuick(key){
   if(!mayEdit(key)||loading||!me)return;
   const date=$('day')?.value;if(!date||date!==loadedDate)return alert('Vui lòng tải lại dữ liệu của ngày cần báo cáo.');
   const node=document.querySelector('[data-unit-forecast="'+key+'"]'),box=node?.querySelector('[data-v215-quick]');
   if(!node||!box)return;
   const note=String(box.value||'').trim();
   if(!note)return alert('Vui lòng dán hoặc nhập nội dung cần báo cáo trước khi gửi.');
   if(note.length>5000)return alert('Nội dung dài quá 5.000 ký tự.');
   const button=node.querySelector('[data-v215-send]'),label=node.querySelector('[data-v215-state]');
   button.disabled=true;button.textContent='ĐANG LƯU…';
   try{
     const {error}=await sb.from('ops_unit_quick_reports').upsert({
       service_date:date,unit:key,report_text:note,updated_by:me.id,updated_at:new Date().toISOString()
     },{onConflict:'service_date,unit'});
     if(error)throw Error(error.message);
     const saved=await sb.from('ops_unit_quick_reports').select('service_date,unit,report_text,updated_at,updated_by')
       .eq('service_date',date).eq('unit',key).maybeSingle();
     if(saved.error||saved.data?.report_text!==note)throw Error('Chưa thể xác nhận nội dung đã lưu. Vui lòng tải lại trước khi gửi lần nữa.');
     quickRows=quickRows.filter(r=>r.unit!==key).concat(saved.data);
     if(label)label.textContent='ĐÃ GỬI ĐH · '+new Date(saved.data.updated_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'});
   }catch(e){if(label)label.textContent='CHƯA GỬI ĐƯỢC: '+e.message;}
   finally{button.disabled=false;button.textContent='LƯU & GỬI ĐH';}
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
   if(confirm&&['DH','PVHK','KTS'].includes(key)){
     for(const code of ['morning','night']){
       const current=root.SagsPersonnelV212.parseCount(data['pvb_'+code]),
             required=root.SagsPersonnelV212.parseCount(data['pvb_'+code+'_required']);
       if(data['pvb_'+code+'_status']==='READY'&&required!=null&&current<required){
         alert('Ca '+(code==='morning'?'sáng':'đêm')+': có '+current+
           ' người, cần '+required+' người (thiếu '+(required-current)+
           '). Vui lòng chọn CHƯA ĐỦ NHÂN SỰ hoặc kiểm tra lại định mức trước khi xác nhận.');
         return;
       }
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
 root.SagsUnitInputV211={init,refresh,updateRights,groups,_test:{selected,labelFor,shiftFeedback,html,personnelFields}};
})(window);