'use strict';
/* Check-in counter staffing commitments: input by authorized PVHK/DH/ADMIN only.
   No invented airline commitments, no default staff-per-counter values. */
(function(root){
 const $=id=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let active='',mounted=false,records=[],busy=false;
 const editable=()=>['PVHK','DH','ADMIN'].includes(typeof unit==='undefined'?'':unit);
 function mount(){
   if(mounted)return;mounted=true;
   const tab=$('tab-pvhk');if(!tab)return;
   const pane=document.createElement('div');pane.id='v219ContractPane';pane.className='panel v219-contract-panel';
   pane.innerHTML='<h2>ĐỊNH MỨC QUẦY CHECK-IN THEO HÃNG · PVHK XÁC NHẬN</h2>'+
     '<p class="note">Chỉ nhập mức thực tế theo hợp đồng/SLA hoặc phương án hãng đã thống nhất. Không tự đặt số quầy cho hãng. Mức này phục vụ dự báo đủ/thiếu nhân sự theo thời gian quầy mở chồng lấn. </p>'+
     '<div id="v219ContractRows"></div><div class="btnbar"><button type="button" id="v219ContractSave" class="primary">LƯU ĐỊNH MỨC HÃNG · MỘT LẦN</button><span id="v219ContractStatus" role="status"></span></div>';
   tab.prepend(pane);
   $('v219ContractSave').onclick=save;
 }
 async function refresh(){
   if(typeof me==='undefined'||!me||typeof sb==='undefined'||!sb)return;
   mount();const date=$('day')?.value;if(!date||!$('v219ContractRows'))return;
   if(active===date&&$('v219ContractRows').querySelector(':focus'))return;
   const [rules,snap2,snap1]=await Promise.all([
     sb.from('ops_service_contracts').select('*').eq('service_date',date),
     sb.from('ops_forecast_snapshots').select('payload').eq('service_date',date).eq('revision',2).maybeSingle(),
     sb.from('ops_forecast_snapshots').select('payload').eq('service_date',date).eq('revision',1).maybeSingle()
   ]);
   const state=$('v219ContractStatus');
   if(rules.error||snap2.error||snap1.error){if(state)state.textContent='Chưa tải được định mức: '+(rules.error||snap2.error||snap1.error).message;return;}
   active=date;records=rules.data||[];
   const p=snap2.data?.payload||snap1.data?.payload||{};
   const ai=root.SagsOpsForecastV219;
   const fromDep=p.source_detail?.departures||p.flights||[];
   const carriers=[...new Set([...fromDep.map(x=>ai?.carrier(x)).filter(Boolean),...records.map(x=>x.airline)])].sort();
   if(!carriers.length){$('v219ContractRows').innerHTML='<p class="note">Chưa có lịch bay để lập danh sách hãng; hãy nhập Lần 1 hoặc Lần 2 trước.</p>';return;}
   const opts=k=>records.find(x=>x.airline===k)||{};
   const input=(k,value,placeholder,type='number')=>'<input type="'+type+'" data-key="'+k+'" min="0" max="500" value="'+esc(value??'')+'" placeholder="'+placeholder+'" '+(editable()?'':'disabled')+'>';
   $('v219ContractRows').innerHTML='<div class="v219-rules-table"><table><tr><th>HÃNG</th><th>QUẦY/CHUYẾN</th><th>NV/QUẦY</th><th>MỞ TRƯỚC STD (phút)</th><th>ĐÓNG TRƯỚC STD (phút)</th><th>NV GATE/CHUYẾN</th><th>NGUỒN CAM KẾT</th></tr>'+
     carriers.map(k=>{const f=opts(k);return '<tr data-carrier="'+esc(k)+'"><td><b>'+esc(k)+'</b></td>'+
       '<td>'+input('checkin_counters',f.checkin_counters,'Chưa có')+'</td>'+
       '<td>'+input('staff_per_counter',f.staff_per_counter,'Chưa có')+'</td>'+
       '<td>'+input('checkin_open_lead',f.checkin_open_lead,'Chưa có')+'</td>'+
       '<td>'+input('checkin_close_lead',f.checkin_close_lead,'Chưa có')+'</td>'+
       '<td>'+input('gate_staff',f.gate_staff,'Chưa có')+'</td>'+
       '<td>'+input('requirement_source',f.requirement_source,'Tên hợp đồng/nguồn xác nhận','text')+'</td></tr>';}).join('')+'</table></div>';
   $('v219ContractSave').disabled=!editable();
   if(state)state.textContent='Định mức chưa nhập được giữ ở trạng thái CHỜ XÁC NHẬN. Không lấy số liệu mẫu để kết luận.';
 }
 async function save(){
   if(!editable()||busy)return;
   const date=$('day')?.value;if(date!==active)return alert('Ngày khai thác đã đổi; vui lòng tải lại.');
   const trs=[...$('v219ContractRows').querySelectorAll('tr[data-carrier]')],upserts=[];
   try{
     busy=true;$('v219ContractSave').disabled=true;
     for(const tr of trs){
       const fields={},filled=[];
       for(const el of tr.querySelectorAll('[data-key]')){
         const key=el.dataset.key,raw=el.value.trim();
         if(key==='requirement_source')fields[key]=raw;
         else if(raw){if(!/^\d+$/.test(raw))throw Error(tr.dataset.carrier+': '+key+' phải là số nguyên.');fields[key]=Number(raw);filled.push(key);}
         else fields[key]=null;
       }
       if(!filled.length)continue;
       if(!fields.requirement_source)throw Error('Hãng '+tr.dataset.carrier+': nhập nguồn xác nhận định mức (hợp đồng/SLA).');
       if(fields.checkin_counters!=null&&(!fields.staff_per_counter||!fields.checkin_open_lead||!fields.checkin_close_lead))
         throw Error('Hãng '+tr.dataset.carrier+': cần đủ quầy, NV/quầy và giờ mở/đóng quầy.');
       if(fields.checkin_open_lead!=null&&fields.checkin_close_lead!=null&&fields.checkin_open_lead<=fields.checkin_close_lead)
         throw Error('Hãng '+tr.dataset.carrier+': mốc mở quầy phải xa STD hơn mốc đóng.');
       if(fields.staff_per_counter!=null&&fields.staff_per_counter>10)throw Error('NV/quầy không hợp lệ.');
       if(fields.checkin_counters!=null&&fields.checkin_counters>80)throw Error('Số quầy không hợp lệ.');
       if(fields.requirement_source.length>500)throw Error('Nguồn xác nhận tối đa 500 ký tự.');
       upserts.push({service_date:date,airline:tr.dataset.carrier,...fields,confirmed_by:me.id,confirmed_at:new Date().toISOString()});
     }
     if(!upserts.length){$('v219ContractStatus').textContent='Chưa nhập định mức mới.';return;}
     const {error}=await sb.from('ops_service_contracts').upsert(upserts,{onConflict:'service_date,airline'});
     if(error)throw Error(error.message);
     $('v219ContractStatus').textContent='Đã lưu '+upserts.length+' hãng. ĐH có thể tải lại dự báo để so sánh quầy và quân số.';
     await refresh();
   }catch(e){$('v219ContractStatus').textContent='CHƯA LƯU: '+e.message;}
   finally{busy=false;$('v219ContractSave').disabled=false;}
 }
 root.SagsContractInputV219={refresh};
})(window);