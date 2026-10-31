'use strict';
(function(root){
 const model=()=>root.SagsShuttleModel;
 const $=id=>document.getElementById(id);
 const V=['DH','PVHK','KTS','QA_IT'];
 const headings=['ĐH','PVHK','PVSĐ','QA & IT'];
 const missingUnits=x=>V.filter((_,i)=>!x.cells[i]).map((v)=>({'DH':'ĐH','PVHK':'PVHK','KTS':'PVSĐ','QA_IT':'QA & IT'}[v]));
 const short=(s)=>String(s??'');
 const escape=s=>short(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fixed=[...model().defaults];
 const allowedRoles=new Set(['ADMIN','DH','KTS','PVHK','QA','IT']);
 const fieldOf=r=>r==='QA'||r==='IT'?'QA_IT':r;
 const editable=(who,field)=>['ADMIN','DH'].includes(who)||fieldOf(who)===field;
 const partKey=(x)=>x.direction+'|'+x.departure_min+'|'+Number(x.line_no||0);
 const clock=x=>model().clock(x);
 const readMinute=(s,next)=>model().parseClock(s,next);
 const timeVN=t=>t?new Date(t).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Chưa xác nhận';
 let rows=[],lines=[],activeDate='',sequence=0,ready=false,viewRole=null;
 function assemble(values,additional){
   const slots=new Map();
   for(const r of fixed)slots.set(partKey({...r,line_no:0}),{direction:r.direction,departure_min:r.departure_min,line_no:0});
   for(const r of values)slots.set(partKey(r),{direction:r.direction,departure_min:r.departure_min,line_no:Number(r.line_no||0)});
   for(const r of additional)slots.set(partKey(r),{direction:r.direction,departure_min:r.departure_min,line_no:Number(r.line_no||0),reason:r.reason||'',created_by:r.created_by||null});
   // If a custom time has extra rows but no base row, include a main slot.
   for(const x of [...slots.values()])if(x.line_no>0){
     const k=partKey({...x,line_no:0});
     if(!slots.has(k))slots.set(k,{...x,line_no:0});
   }
   // Interleave fixed and custom times in the SAME chronological sequence.
   // E.g. custom 11:00 must sit between 10:00 and 16:30, not at the end.
   const sorted=model().order([...slots.values()]);
   return sorted.map(x=>{
     const cells=V.map(u=>values.find(v=>v.unit===u&&partKey(v)===partKey(x))||null);
     const confirmed=cells.filter(Boolean).length;
     return {...x,cells,confirmed,total:cells.reduce((sum,v)=>sum+(v?.quantity||0),0),
       missing:V.filter((_,i)=>!cells[i]),
       defaultTime:fixed.some(z=>z.direction===x.direction&&z.departure_min===x.departure_min)};
   });
 }
 const icon=(n)=>{
   const w=n===45?73:56,win=n===45?6:4;
   return '<svg aria-hidden="true" width="'+w+'" height="27" viewBox="0 0 '+w+' 27" xmlns="http://www.w3.org/2000/svg">'+
     '<rect x="2" y="2" rx="5" width="'+(w-4)+'" height="19" fill="#e2eff4" stroke="#287a9d" stroke-width="2"/>'+
     Array.from({length:win},(_,i)=>'<rect x="'+(7+i*(w-14)/win)+'" y="6" width="'+((w-20)/win)+'" height="6" rx="1" fill="#8bbccc"/>').join('')+
     '<circle cx="16" cy="22" r="4" fill="#25475c"/><circle cx="'+(w-16)+'" cy="22" r="4" fill="#25475c"/></svg>';
 };
 function classify(row){
   if(row.confirmed<V.length)return {label:'CHỜ XÁC NHẬN',kind:'pending'};
   const plan=model().suggestVehicles(row.total);
   if(!plan)return {label:'CHƯA THỂ TÍNH',kind:'pending'};
   return {...plan,kind:plan.count===0?'zero':plan.count===1?(plan.n29?'small':'big'):'multi'};
 }
 // A visual route-level recommendation remains visible even on a narrow phone.
 // The legacy recommendation is the far-right column of a horizontally scrolling table;
 // this strip restores vehicle imagery without claiming a plan for unconfirmed staff.
 function vehicleSuggestions(directionRows){
   const pending=directionRows.filter(x=>x.confirmed<V.length).length;
   // Every scheduled hour receives a visual entry, whether or not four units
   // have submitted. Only fully confirmed rows receive a vehicle choice.
   const previews=directionRows.map(x=>{
     const complete=x.confirmed===V.length;
     const p=complete?model().suggestVehicles(x.total):null;
     const units=(p?.units||[]).map(item=>'<span class="v306-vehicle-thumb">'+
       '<img loading="lazy" src="./assets/shuttle-'+item.seats+'.webp" alt="Xe '+item.seats+' chỗ">'+
       '<b>×'+item.quantity+'</b></span>').join('');
     return '<div class="v306-suggestion" data-v306-slot="'+escape(partKey(x))+'">'+
       '<span class="v306-suggest-time">'+escape(clock(x.departure_min))+
       (x.line_no>0?' <small>Xe bổ sung '+x.line_no+'</small>':'')+'</span>'+
       '<span class="v306-suggest-vehicles">'+(complete?units||'<span class="v306-none">Không cần xe</span>':
         '<span class="v306-none">⏳</span>')+'</span>'+
       '<span class="v306-suggest-text"><strong>'+(p?escape(p.label):'CHỜ XÁC NHẬN')+'</strong>'+
       '<small>'+(p?escape(p.details||'')+' · '+x.total+' người':
         'Đã nhập '+x.confirmed+'/4 phòng')+'</small></span>'+
       '</div>';
   }).filter(Boolean);
   const legend='<div class="v306-vehicle-legend">'+
     '<div><img loading="lazy" src="./assets/shuttle-29.webp" alt="Xe 29 chỗ"><span>Xe 29 chỗ</span></div>'+
     '<div><img loading="lazy" src="./assets/shuttle-45.webp" alt="Xe 45 chỗ"><span>Xe 45 chỗ</span></div>'+
     '</div>';
   return '<aside class="v306-vehicle-showcase" aria-label="Gợi ý loại xe theo giờ">'+
     '<div class="v306-vehicle-header"><div><strong>🚌 GỢI Ý XE THEO GIỜ</strong>'+
     '<p>Hệ thống tự tính phương án xe 29/45 chỗ từ tổng người của bốn đơn vị.</p></div>'+legend+'</div>'+
     (previews.length?'<div class="v306-vehicle-list">'+previews.join('')+'</div>':
       '<p class="v306-await">Chưa có giờ xe để gợi ý.</p>')+
     (pending?'<p class="v306-pending">'+pending+' mốc giờ còn chờ dữ liệu đủ 4 phòng; không tự chốt loại xe khi chưa đủ số người.</p>':'')+
     '</aside>';
 }
 function makeGrid(direction,all,who){
   const active=allowedRoles.has(who);
   const route=direction==='NHA_CXR'?'NHA TRANG → CXR':'CXR → NHA TRANG';
   const what=direction==='NHA_CXR'?'CHIỀU ĐI LÀM':'CHIỀU XE VỀ';
   const directionRows=all.filter(x=>x.direction===direction);
   const body=directionRows.map(x=>{
     const key=partKey(x),cls=classify(x),child=x.line_no>0,custom=!x.defaultTime||child;
     const canReason=custom&&(who==='ADMIN'||who==='DH'||(typeof me!=='undefined'&&me?.id&&x.created_by===me.id));
     const cells=x.cells.map((v,j)=>{
       const u=V[j],edit=editable(who,u);
       if(edit){
         return '<td class="v24-cell v24-edit"><label><input aria-label="'+escape(headings[j])+' '+clock(x.departure_min)+(child?' bổ sung '+x.line_no:'')+
           '" type="number" min="0" max="500" inputmode="numeric" placeholder="—" data-v24-value="'+u+'" value="'+(v?.quantity??'')+'"></label>'+
           '</td>';
       }
       return '<td class="v24-cell v24-read"><strong>'+(v?.quantity??'—')+'</strong></td>';
     }).join('');
     return '<tr class="v24-time-row'+(child?' v24-child':'')+(custom?' v28-extra-slot':'')+'" data-v24-key="'+key+'">'+
       '<td class="v24-time"><b>'+clock(x.departure_min)+'</b>'+
       (custom?'<span class="v307-added-badge">'+(child?'XE '+(x.line_no+1):'GIỜ THÊM')+'</span>':'')+'</td>'+
       cells+
       '<td class="v24-total"><b>'+(x.confirmed===V.length?'':'~')+x.total+'</b>'+
         (x.confirmed<V.length?'<small>Đủ '+x.confirmed+'/4</small>':'')+'</td>'+
       '<td class="v24-coach v24-'+cls.kind+'">'+
         (cls.units?.length?'<span class="v221-bus-types">'+cls.units.map(x=>
           '<span class="v221-bus-type"><img src="./assets/shuttle-'+x.seats+'.webp" alt="Xe SAGS '+x.seats+' chỗ" class="v220-coach-img"><b>×'+x.quantity+'</b></span>'
         ).join('')+'</span>':'')+
         '<span><b>'+escape(cls.label)+'</b></span>'+
         (cls.seats?'<small>'+escape(cls.details)+'</small>':'')+'</td>'+
       '</tr>';
   }).join('');
   // Keep delete and reason editing available in an optional compact drawer;
   // do not generate extra rows between times in the main table.
   const editExtras=directionRows.filter(x=>!x.defaultTime||x.line_no>0).map(x=>{
     const key=partKey(x),canReason=who==='ADMIN'||who==='DH'||
       (typeof me!=='undefined'&&me?.id&&x.created_by===me.id);
     return '<div class="v307-extra-edit"><strong>'+escape(clock(x.departure_min))+
       (x.line_no>0?' · Xe '+(x.line_no+1):'')+'</strong>'+
       (canReason?'<input aria-label="Lý do giờ xe '+escape(clock(x.departure_min))+
         '" maxlength="220" data-v28-reason="'+key+'" value="'+escape(x.reason||'')+'" placeholder="Lý do tăng chuyến">':
         '<span>'+escape(x.reason||'Chưa có lý do')+'</span>')+
       (['ADMIN','DH'].includes(who)?'<button type="button" data-v27-delete="'+key+'">Xóa</button>':'')+
       '</div>';
   }).join('');
   return '<section class="v24-direction" data-v24-direction="'+direction+'"><div class="v24-route-title"><div><b>'+route+'</b><small>'+what+'</small></div>'+
     '<div class="v24-route-number">'+directionRows.filter(x=>x.line_no===0).length+' giờ xe</div></div>'+
     vehicleSuggestions(directionRows)+
     '<p class="v222-scroll-hint">Cuộn ngang để xem đủ 4 phòng, tổng số người và gợi ý xe <span aria-hidden="true">↔</span></p>'+
     '<div class="v24-table-scroll" role="region" aria-label="Bảng xe '+route+'; vuốt ngang để xem đầy đủ 7 cột" tabindex="0"><table class="v24-table"><colgroup>'+
       '<col class="v222-col-time"><col class="v222-col-unit"><col class="v222-col-unit"><col class="v222-col-unit"><col class="v222-col-unit"><col class="v222-col-total"><col class="v222-col-bus">'+
       '</colgroup><thead><tr><th scope="col">GIỜ CHẠY</th>'+
       headings.map(t=>'<th scope="col">'+t+'</th>').join('')+'<th scope="col">TỔNG</th><th scope="col">GỢI Ý XE</th></tr></thead><tbody>'+body+'</tbody></table></div>'+
     (editExtras?'<details class="v307-extras"><summary>Quản lý giờ bổ sung ('+
       directionRows.filter(x=>!x.defaultTime||x.line_no>0).length+')</summary>'+editExtras+'</details>':'')+
     (active?'<details class="v24-custom"><summary>+ THÊM GIỜ XE</summary>'+
       '<div><label>Giờ chạy <input type="time" data-v24-time="'+direction+'" value="12:00"></label>'+
       '<label><input type="checkbox" data-v24-next="'+direction+'"> Ngày hôm sau (+1)</label>'+ '<label class="v28-custom-reason">Lý do thêm xe <input maxlength="220" data-v28-custom-reason="'+direction+'" placeholder="Ví dụ: Xe hỗ trợ họp chuyên môn" required></label>'+
       '<button type="button" data-v24-custom="'+direction+'">THÊM MỐC GIỜ</button></div></details>':'')+
     '</section>';
 }
 function template(who){
   const editablePart=allowedRoles.has(who);
   const activeField=who==='ADMIN'?'TẤT CẢ CỘT':headings[V.indexOf(fieldOf(who))]||'CHỈ XEM';
   return '<div class="v24-wrap v307-compact" data-v24-active="'+who+'" data-v307-render="clock-sorted"><div class="v24-heading">'+
     '<div><h2>XE GIAO CA</h2><p>GIỜ CHẠY · SỐ NGƯỜI · GỢI Ý XE</p></div>'+
     '<div class="v24-access">'+(editablePart?'NHẬP: '+activeField:'CHỈ XEM')+'</div></div>'+
     makeGrid('NHA_CXR',assemble(rows,lines),who)+makeGrid('CXR_NHA',assemble(rows,lines),who)+
     (editablePart?'<div class="v214-actions"><span>Lưu số người của phòng ở cả hai chiều xe và lý do xe bổ sung đã chỉnh sửa.</span><button type="button" class="primary" data-v24-save-all>LƯU TẤT CẢ THAY ĐỔI</button></div>':'')+
     '<p class="v24-footer">Ô trống = chưa có dữ liệu. Gợi ý chỉ có hiệu lực khi đủ 4 phòng xác nhận; ĐH quyết định điều xe.</p>'+
     '<div class="v24-status" role="status"></div></div>';
 }
 function mount(){
   if(ready)return;ready=true;
   const placements=[
     ['DH','tab-home'],['KTS','tab-pvsd'],['PVHK','tab-pvhk'],
     ['QA','tab-qa-it'],['IT','tab-qa-it'],
     // V3.04: The consolidated shuttle screen must also have a LIVE entry grid.
     ['SHUTTLE','tab-shuttle-report']
   ];
   const done=new Set();
   placements.forEach(([role,id])=>{
     if(done.has(id))return;done.add(id);
     const el=$(id);if(!el)return;
     const div=document.createElement('div');div.className='v24-mount';div.id='v24-'+id;
     if(id==='tab-home')el.appendChild(div);else el.prepend(div);
     div.addEventListener('click',onClick);
     div.addEventListener('keydown',onKeydown);
   });
 }
 function show(){
   if(!ready)return;
   const role=typeof unit==='undefined'?viewRole:unit;
   const mapping=[['tab-home','DH'],['tab-pvsd','KTS'],['tab-pvhk','PVHK'],
      ['tab-qa-it',role==='IT'?'IT':'QA'],['tab-shuttle-report',role]];
   for(const [tab,who] of mapping){
     const div=$('v24-'+tab);if(!div)continue;
     const adjusted=['ADMIN','DH'].includes(role)?role:who;
     div.hidden=!(root.SagsRoleAccessV225?.canOpen(role,tab.replace('tab-','').replace('qa-it','qa_it'))??true);
     // Preserve input being edited if a refresh occurs in another tab.
     if(div.contains(document.activeElement)&&document.activeElement?.matches('input[data-v24-value]'))continue;
     div.innerHTML=template(adjusted);
   }
 }
 async function refresh(){
   if(typeof me==='undefined'||!me||typeof sb==='undefined'||!sb)return;
   mount();const date=$('day')?.value;if(!date)return;
   // Render the core table immediately. Missing network access/permissions
   // must never make the entire timetable and illustrated bus panel vanish.
   if(activeDate!==date){rows=[];lines=[];activeDate=date;}
   show();
   const req=++sequence;
   const [a,b]=await Promise.all([
     sb.from('ops_shift_transport_v2').select('unit,direction,departure_min,line_no,quantity,confirmed_at,is_custom,note').eq('service_date',date),
     sb.from('ops_shift_transport_rows').select('direction,departure_min,line_no,reason,created_by').eq('service_date',date)
   ]);
   if(req!==sequence)return;
   if(a.error||b.error){
     for(const status of document.querySelectorAll('.v24-mount .v24-status'))
       status.textContent='CHƯA TẢI ĐƯỢC SỐ NGƯỜI: '+(a.error||b.error).message+
         '. Bảng giờ vẫn hiển thị, nhưng không xác nhận nguồn khi chưa đồng bộ.';
     return;
   }
   activeDate=date;rows=a.data||[];lines=b.data||[];
   show();
   window.SagsShuttleExport?.renderPreview?.();
 }
 const message=(box,s,isError=false)=>{
   const el=box?.closest('.v24-mount')?.querySelector('.v24-status')||box?.querySelector('.v24-status');if(!el)return;
   el.textContent=s;el.style.color=isError?'#A64036':'#17735D';
 };

 function collectChanges(valueEdits,reasonEdits,who,date,userId){
   const upserts=[],deletes=[],reasons=[];
   for(const e of valueEdits){
     const [direction,minuteText,lineText]=String(e.key||'').split('|');
     const minute=Number(minuteText),line=Number(lineText),which=e.unit;
     if(!editable(who,which))continue;
     if(!['NHA_CXR','CXR_NHA'].includes(direction)||!Number.isInteger(minute)||minute<0||minute>2879||!Number.isInteger(line)||line<0||line>12)
       throw Error('Mốc xe không hợp lệ; vui lòng tải lại bảng.');
     const value=String(e.value??'').trim();
     const saved=rows.find(x=>x.unit===which&&partKey(x)===e.key);
     if(value===''){
       if(saved)deletes.push({unit:which,direction,departure_min:minute,line_no:line});
       continue;
     }
     if(!/^\d+$/.test(value)||Number(value)>500)throw Error('Số người tại '+clock(minute)+' ('+which+') phải là số nguyên từ 0 đến 500.');
     if(saved&&saved.quantity===Number(value))continue;
     upserts.push({service_date:date,unit:which,direction,departure_min:minute,line_no:line,
       quantity:Number(value),is_custom:line>0||!model().isDefault(direction,minute),confirmed_by:userId});
   }
   for(const e of reasonEdits){
     const stored=lines.find(x=>partKey(x)===e.key);
     if(!stored)throw Error('Dòng xe bổ sung không còn tồn tại; vui lòng tải lại.');
     if(!(who==='DH'||who==='ADMIN'||stored.created_by===userId))continue;
     const next=String(e.value??'').trim();
     if(next===String(stored.reason||'').trim())continue;
     if(!next)throw Error('Vui lòng ghi lý do của xe bổ sung '+clock(stored.departure_min)+'.');
     if(next.length>220)throw Error('Lý do thêm xe tối đa 220 ký tự.');
     reasons.push({direction:stored.direction,minute:stored.departure_min,line:stored.line_no,reason:next});
   }
   return {upserts,deletes,reasons};
 }
 function pendingDraft(wrap,who){
   const fields=[...wrap.querySelectorAll('input[data-v24-value]')].filter(x=>editable(who,x.dataset.v24Value));
   for(const el of fields){
     const key=el.closest('[data-v24-key]')?.dataset.v24Key;
     const saved=rows.find(x=>x.unit===el.dataset.v24Value&&partKey(x)===key);
     if(String(el.value||'').trim()!==String(saved?.quantity??''))return true;
   }
   return [...wrap.querySelectorAll('input[data-v28-reason]')].some(el=>{
     const old=lines.find(x=>partKey(x)===el.dataset.v28Reason)?.reason||'';
     return el.value.trim()!==old.trim();
   });
 }
 async function saveAll(wrap,who){
   const date=$('day')?.value;
   if(date!==activeDate)throw Error('Ngày xe đã thay đổi. Vui lòng tải lại trước khi lưu.');
   const values=[...wrap.querySelectorAll('input[data-v24-value]')].map(el=>({
     key:el.closest('[data-v24-key]')?.dataset.v24Key,unit:el.dataset.v24Value,value:el.value
   }));
   const edits=[...wrap.querySelectorAll('input[data-v28-reason]')].map(el=>({
     key:el.dataset.v28Reason,value:el.value
   }));
   const work=collectChanges(values,edits,who,date,me.id);
   const count=work.upserts.length+work.deletes.length+work.reasons.length;
   if(!count){message(wrap,'Không có thay đổi. Số liệu đã xác nhận trước đó được giữ nguyên.');return;}
   // Validate all inputs before performing any write.
   for(const rec of work.deletes){
     const {error}=await sb.from('ops_shift_transport_v2').delete()
       .eq('service_date',date).eq('unit',rec.unit).eq('direction',rec.direction)
       .eq('departure_min',rec.departure_min).eq('line_no',rec.line_no);
     if(error)throw Error('Không thể bỏ xác nhận lúc '+clock(rec.departure_min)+': '+error.message);
   }
   if(work.upserts.length){
     const {error}=await sb.from('ops_shift_transport_v2').upsert(work.upserts,{
       onConflict:'service_date,unit,direction,departure_min,line_no'
     });
     if(error)throw Error('Không lưu được số người: '+error.message);
   }
   for(const item of work.reasons){
     const {error}=await sb.rpc('ops_set_shuttle_reason',{
       p_date:date,p_direction:item.direction,p_minute:item.minute,p_line:item.line,p_reason:item.reason
     });
     if(error)throw Error('Đã lưu một phần số liệu, nhưng chưa lưu hết lý do xe bổ sung: '+error.message);
   }
   await refresh();
   message(wrap,'ĐÃ LƯU: '+work.upserts.length+' ô số người, '+work.deletes.length+' ô bỏ xác nhận, '+work.reasons.length+' lý do xe bổ sung (cả hai chiều xe).');
 }
 let busy=false;
 async function onClick(e){
   const b=e.target.closest('button');if(!b||busy)return;
   const wrap=e.currentTarget.querySelector('.v24-wrap');if(!wrap)return;
   const own=typeof unit==='undefined'?viewRole:unit;
   if(!allowedRoles.has(own))return;
   try{
     busy=true;b.disabled=true;
     if(b.hasAttribute('data-v24-save-all')){
       await saveAll(wrap,own);
     }else if(b.dataset.v27Delete){
       if(pendingDraft(wrap,own))throw Error('Bạn còn số liệu chưa lưu. Hãy bấm LƯU TẤT CẢ THAY ĐỔI trước khi xóa giờ xe.');
       const [dir,min,line]=b.dataset.v27Delete.split('|');
       const isMain=Number(line)===0;
       const label=(isMain?'mốc giờ tự thêm ':'dòng bổ sung ')+clock(Number(min))+(isMain?'':' số '+line);
       if(!['ADMIN','DH'].includes(own))throw Error('Chỉ ĐH hoặc ADMIN được xóa xe đã thêm.');
       const affected=rows.filter(x=>x.direction===dir&&x.departure_min===Number(min)&&(isMain||x.line_no===Number(line)));
       const impacted=[...new Set(affected.map(x=>x.unit))];
       if(!confirm('XÁC NHẬN XÓA '+label+'?\\nSẽ xóa số người đã nhập của '+impacted.length+' đơn vị ('+impacted.join(', ')+') và các dòng xe bổ sung liên quan. Hệ thống lưu nhật ký để truy xuất.\\nKhông thể hoàn tác trên màn hình.'))return;
       const {error}=await sb.rpc('ops_remove_shuttle_addition',{
         p_date:$('day').value,p_direction:dir,p_minute:Number(min),p_line:Number(line)
       });
       if(error){
         if(/ONLY_DH_ADMIN/.test(error.message||''))throw Error('Chỉ ĐH hoặc ADMIN được xóa các giờ xe bổ sung.');
         throw Error(error.message);
       }
       await refresh();
       message(e.currentTarget.querySelector('.v24-wrap')||wrap,'Đã xóa '+label+'.');
     }else if(b.dataset.v24Custom){
       if(pendingDraft(wrap,own))throw Error('Bạn còn số liệu chưa lưu. Hãy bấm LƯU TẤT CẢ THAY ĐỔI trước khi thêm giờ xe.');
       const direction=b.dataset.v24Custom;
       const time=e.currentTarget.querySelector('[data-v24-time="'+direction+'"]')?.value;
       const next=!!e.currentTarget.querySelector('[data-v24-next="'+direction+'"]')?.checked;
       const minute=readMinute(time,next);
       if(minute===null)throw Error('Vui lòng chọn giờ hợp lệ.');
       const reason=(e.currentTarget.querySelector('[data-v28-custom-reason="'+direction+'"]')?.value||'').trim();
       if(!reason)throw Error('Vui lòng nhập lý do thêm giờ xe (ví dụ: xe hỗ trợ họp chuyên môn).');
       if(reason.length>220)throw Error('Lý do tối đa 220 ký tự.');
       const already=assemble(rows,lines).some(x=>x.direction===direction&&x.departure_min===minute&&x.line_no===0);
       if(already)throw Error('Giờ xe này đã có trong bảng; vui lòng nhập tại dòng tương ứng.');
       const {error}=await sb.rpc('ops_add_shuttle_slot',{p_date:$('day').value,p_direction:direction,p_minute:minute});
       if(error)throw Error(error.message);
       const reasonResult=await sb.rpc('ops_set_shuttle_reason',{p_date:$('day').value,p_direction:direction,p_minute:minute,p_line:0,p_reason:reason});
       if(reasonResult.error)throw Error('Đã tạo mốc xe nhưng chưa lưu được lý do: '+reasonResult.error.message);
       await refresh();
       // Lead staff straight to the inserted row; do not leave the impression
       // that new times were appended at the end or require a manual reload.
       const inserted=e.currentTarget.querySelector('[data-v24-key="'+direction+'|'+minute+'|0"]');
       inserted?.scrollIntoView?.({behavior:'smooth',block:'center',inline:'nearest'});
       message(e.currentTarget.querySelector('.v24-wrap')||wrap,'Đã chèn '+clock(minute)+' đúng thứ tự giờ trong chiều '+model().directionLabel[direction]+'. Nhập số người tại dòng mới và lưu tất cả thay đổi.');
     }
   }catch(error){message(e.currentTarget.querySelector('.v24-wrap')||wrap,'Không lưu được: '+error.message,true)}
   finally{busy=false;b.disabled=false}
 }
 function onKeydown(e){
   if(e.key==='Enter'&&e.target.matches('input[data-v24-value], input[data-v28-reason]')){
     e.preventDefault();
     const inputs=[...e.currentTarget.querySelectorAll('input[data-v24-value], input[data-v28-reason]')];
     const next=inputs[inputs.indexOf(e.target)+1];
     if(next)next.focus();else e.currentTarget.querySelector('[data-v24-save-all]')?.focus();
   }
 }
 function setUnit(role){
   viewRole=role;mount();show();refresh();
 }
 root.SagsShuttleGridV24={setUnit,refresh,show,_test:{assemble,fieldOf,editable,classify,collectChanges,pendingDraft,makeGrid}};
})(typeof window!=='undefined'?window:globalThis);