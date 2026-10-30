'use strict';
(function(root){
 const model=()=>root.SagsShuttleModel;
 const $=id=>document.getElementById(id);
 const V=['DH','KTS','PVHK','KHO','QA_IT'];
 const headings=['ĐH','PVSĐ','PVHK','KHO HÀNG','QA / IT'];
 const missingUnits=x=>V.filter((_,i)=>!x.cells[i]).map((v)=>({'DH':'ĐH','KTS':'PVSĐ','PVHK':'PVHK','KHO':'Kho Hàng','QA_IT':'QA/IT'}[v]));
 const short=(s)=>String(s??'');
 const escape=s=>short(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fixed=[...model().defaults];
 const allowedRoles=new Set(['ADMIN','DH','KTS','PVHK','KHO','QA','IT']);
 const fieldOf=r=>r==='QA'||r==='IT'?'QA_IT':r;
 const editable=(who,field)=>who==='ADMIN'||fieldOf(who)===field;
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
   const sorted=[...slots.values()].sort((a,b)=>
     (a.direction===b.direction?0:a.direction==='NHA_CXR'?-1:1)||
     a.departure_min-b.departure_min||a.line_no-b.line_no);
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
   if(row.total===0)return {label:'KHÔNG CẦN XE',kind:'zero'};
   if(row.total<=29)return {label:'29 CHỖ',kind:'small'};
   if(row.total<=45)return {label:'45 CHỖ',kind:'big'};
   return {label:'CẦN BỔ SUNG XE',kind:'excess'};
 }
 function makeGrid(direction,all,who){
   const active=allowedRoles.has(who);
   const route=direction==='NHA_CXR'?'NHA TRANG → CAM RANH':'CAM RANH → NHA TRANG';
   const what=direction==='NHA_CXR'?'CHIỀU ĐI LÀM':'CHIỀU XE VỀ';
   const directionRows=all.filter(x=>x.direction===direction);
   const body=directionRows.map(x=>{
     const key=partKey(x),cls=classify(x),child=x.line_no>0,custom=!x.defaultTime||child;
     const canReason=custom&&(who==='ADMIN'||who==='DH'||(typeof me!=='undefined'&&me?.id&&x.created_by===me.id));
     const group=directionRows.filter(z=>z.departure_min===x.departure_min);
     const groupTotal=group.reduce((sum,z)=>sum+z.total,0);
     const groupVerified=group.every(z=>z.confirmed===V.length);
     const groupNote=!child&&group.length>1?'<small>Tổng '+group.length+' xe: '+(groupVerified?'':'~')+groupTotal+'</small>':'';
     const cells=x.cells.map((v,j)=>{
       const u=V[j],edit=editable(who,u);
       if(edit){
         return '<td class="v24-cell v24-edit"><label><input aria-label="'+escape(headings[j])+' '+clock(x.departure_min)+(child?' bổ sung '+x.line_no:'')+
           '" type="number" min="0" max="500" inputmode="numeric" placeholder="—" data-v24-value="'+u+'" value="'+(v?.quantity??'')+'"></label>'+
           '<small>'+(v?'Đã lưu '+timeVN(v.confirmed_at):'Chưa xác nhận')+'</small></td>';
       }
       return '<td class="v24-cell v24-read"><strong>'+(v?.quantity??'—')+'</strong><small>'+(v?timeVN(v.confirmed_at):'Chưa xác nhận')+'</small></td>';
     }).join('');
     return '<tr class="v24-time-row'+(child?' v24-child':'')+(custom?' v28-extra-slot':'')+'" data-v24-key="'+key+'">'+
       '<td class="v24-time"><b>'+clock(x.departure_min)+'</b><small>'+(child?'↳ Xe bổ sung '+x.line_no:'Chuyến chính')+'</small></td>'+
       '<td class="v24-plus">'+(!child&&active?'<button type="button" data-v24-add="'+key+'" aria-label="Thêm xe vào khung '+clock(x.departure_min)+'" title="Thêm dòng ngay dưới giờ này">+</button>':'')+
       ((child||!x.defaultTime)&&active?'<button type="button" class="v27-delete" data-v27-delete="'+key+'" title="Xóa giờ / dòng bổ sung thừa nếu chưa có số liệu xác nhận" aria-label="Xóa '+(child?'dòng bổ sung':'giờ xe tự thêm')+' '+clock(x.departure_min)+'">×</button>':'')+'</td>'+
       cells+
       '<td class="v24-total"><b>'+(x.confirmed===V.length?'':'~')+x.total+'</b><small>'+x.confirmed+'/'+V.length+' đơn vị</small>'+groupNote+'</td>'+
       '<td class="v24-coach v24-'+cls.kind+'">'+
         (cls.kind==='small'?icon(29):cls.kind==='big'||cls.kind==='excess'?icon(45):'')+
         '<span>'+cls.label+'</span></td>'+
       '<td class="v24-save">'+(active?'<button data-v24-save="'+key+'" type="button">LƯU</button>':'')+'</td></tr>'+ (x.missing.length?'<tr class="v28-missing-row"><td colspan="10"><b>CHƯA XÁC NHẬN:</b> '+escape(missingUnits(x).join(', '))+'</td></tr>':'')+ (custom?'<tr class="v28-reason-row"><td colspan="10"><div class="v28-reason-wrap"><b>XE BỔ SUNG · LÝ DO:</b> '+(canReason? '<input maxlength="220" placeholder="Ví dụ: Xe hỗ trợ họp chuyên môn" data-v28-reason="'+key+'" value="'+escape(x.reason||'')+'">'+ '<button type="button" data-v28-save-reason="'+key+'">LƯU LÝ DO</button>': '<span>'+escape(x.reason||'Chưa ghi lý do thêm xe')+'</span>')+'</div></td></tr>':'');
   }).join('');
   return '<section class="v24-direction" data-v24-direction="'+direction+'"><div class="v24-route-title"><div><b>'+route+'</b><small>'+what+'</small></div>'+
     '<div class="v24-route-number">'+directionRows.filter(x=>x.line_no===0).length+' mốc giờ</div></div>'+
     '<div class="v24-table-scroll"><table class="v24-table"><thead><tr><th>GIỜ XE</th><th>+</th>'+
       headings.map(t=>'<th>'+t+'</th>').join('')+'<th>TỔNG</th><th>GỢI Ý XE</th><th></th></tr></thead><tbody>'+body+'</tbody></table></div>'+
     (active?'<details class="v24-custom"><summary>+ THÊM GIỜ XE KHÁC CHO CHIỀU NÀY</summary>'+
       '<div><label>Giờ chạy <input type="time" data-v24-time="'+direction+'" value="12:00"></label>'+
       '<label><input type="checkbox" data-v24-next="'+direction+'"> Ngày hôm sau (+1)</label>'+ '<label class="v28-custom-reason">Lý do thêm xe <input maxlength="220" data-v28-custom-reason="'+direction+'" placeholder="Ví dụ: Xe hỗ trợ họp chuyên môn" required></label>'+
       '<button type="button" data-v24-custom="'+direction+'">THÊM MỐC GIỜ</button></div></details>':'')+
     '</section>';
 }
 function template(who){
   const editablePart=allowedRoles.has(who);
   const activeField=who==='ADMIN'?'TẤT CẢ CỘT':headings[V.indexOf(fieldOf(who))]||'CHỈ XEM';
   return '<div class="v24-wrap" data-v24-active="'+who+'"><div class="v24-heading">'+
     '<div><div class="v24-eyebrow">SAGS  ·  XE GIAO CA</div><h2>Bảng nhập trực tiếp theo giờ xe</h2>'+
     '<p>Hai chiều xe · 05 cột đơn vị (QA và IT chung một cột) · lưu số người ngay trong ô tương ứng.</p></div>'+
     '<div class="v24-access">'+(editablePart?'ĐƯỢC NHẬP: '+activeField:'CHỈ ĐƯỢC XEM')+'</div></div>'+
     '<div class="v24-explain">Ô nền trắng viền xanh là cột được nhập. Các phòng khác hiển thị khóa. <strong>Ô trống = chưa xác nhận</strong>; <strong>0 = xác nhận không có người</strong>. Dấu <b>+</b> cạnh giờ tạo dòng bổ sung ngay bên dưới.</div>'+
     makeGrid('NHA_CXR',assemble(rows,lines),who)+makeGrid('CXR_NHA',assemble(rows,lines),who)+
     '<p class="v24-footer">Chỉ có xe 29 chỗ và 45 chỗ. Loại xe chỉ được gợi ý khi đủ 5 cột xác nhận; quyết định phát hành và điều xe thuộc ĐH. Xem ảnh/PDF tại tab <b>BÁO CÁO</b>.</p>'+
     '<div class="v24-status" role="status"></div></div>';
 }
 function mount(){
   if(ready)return;ready=true;
   const placements=[
     ['DH','tab-home'],['KTS','tab-pvsd'],['PVHK','tab-pvhk'],['KHO','tab-warehouse'],
     ['QA','tab-qa-it'],['IT','tab-qa-it']
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
   const mapping=[['tab-home','DH'],['tab-pvsd','KTS'],['tab-pvhk','PVHK'],['tab-warehouse','KHO'],['tab-qa-it',role==='IT'?'IT':'QA']];
   for(const [tab,who] of mapping){
     const div=$('v24-'+tab);if(!div)continue;
     const adjusted=role==='ADMIN'?'ADMIN':who;
     // Preserve input being edited if a refresh occurs in another tab.
     if(div.contains(document.activeElement)&&document.activeElement?.matches('input[data-v24-value]'))continue;
     div.innerHTML=template(adjusted);
   }
 }
 async function refresh(){
   if(typeof me==='undefined'||!me||typeof sb==='undefined'||!sb)return;
   mount();const date=$('day')?.value;if(!date)return;
   const req=++sequence;
   const [a,b]=await Promise.all([
     sb.from('ops_shift_transport_v2').select('unit,direction,departure_min,line_no,quantity,confirmed_at,is_custom,note').eq('service_date',date),
     sb.from('ops_shift_transport_rows').select('direction,departure_min,line_no,reason,created_by').eq('service_date',date)
   ]);
   if(req!==sequence)return;
   if(a.error||b.error){const status=document.querySelector('.v24-status');if(status)status.textContent='Không đọc được xe giao ca: '+(a.error||b.error).message;return}
   activeDate=date;rows=a.data||[];lines=b.data||[];
   show();
   window.SagsShuttleExport?.renderPreview?.();
 }
 const message=(box,s,isError=false)=>{
   const el=box?.closest('.v24-mount')?.querySelector('.v24-status')||box?.querySelector('.v24-status');if(!el)return;
   el.textContent=s;el.style.color=isError?'#A64036':'#17735D';
 };
 let busy=false;
 async function onClick(e){
   const b=e.target.closest('button');if(!b||busy)return;
   const wrap=e.currentTarget.querySelector('.v24-wrap');if(!wrap)return;
   const own=typeof unit==='undefined'?viewRole:unit;
   if(!allowedRoles.has(own))return;
   try{
     busy=true;b.disabled=true;
     if(b.dataset.v28SaveReason){
       const [direction,minute,line]=b.dataset.v28SaveReason.split('|');
       const field=e.currentTarget.querySelector('[data-v28-reason="'+b.dataset.v28SaveReason+'"]');
       const reason=(field?.value||'').trim();
       if(reason.length>220)throw Error('Lý do tối đa 220 ký tự.');
       const {error}=await sb.rpc('ops_set_shuttle_reason',{p_date:$('day').value,p_direction:direction,p_minute:Number(minute),p_line:Number(line),p_reason:reason});
       if(error)throw Error(error.message);
       await refresh();message(wrap,'Đã lưu lý do xe bổ sung '+clock(Number(minute))+'.');
     }else if(b.dataset.v27Delete){
       const [dir,min,line]=b.dataset.v27Delete.split('|');
       const isMain=Number(line)===0;
       const label=(isMain?'mốc giờ tự thêm ':'dòng bổ sung ')+clock(Number(min))+(isMain?'':' số '+line);
       if(!confirm('XÓA '+label+'? Nếu chỉ phòng bạn đã nhập thì số liệu của phòng bạn cũng sẽ được xóa. Nếu phòng khác đã xác nhận thì không xóa được. Giờ gốc không thể xóa.'))return;
       const {error}=await sb.rpc('ops_remove_shuttle_addition',{
         p_date:$('day').value,p_direction:dir,p_minute:Number(min),p_line:Number(line)
       });
       if(error){
         if(/OTHER_DEPARTMENTS_HAVE_CONFIRMED_PEOPLE/.test(error.message||''))
           throw Error('Không xóa được: đã có phòng khác xác nhận số người. Chỉ phòng đó được sửa/xóa số liệu của họ; bạn không được xóa dữ liệu phòng khác.');
         throw Error(error.message);
       }
       await refresh();
       message(e.currentTarget.querySelector('.v24-wrap')||wrap,'Đã xóa '+label+'.');
     }else if(b.dataset.v24Save){
       const row=b.closest('.v24-time-row'),key=b.dataset.v24Save;
       if(!row||row.dataset.v24Key!==key)return;
       const [direction,minute,ln]=key.split('|');
       const inputs=[...row.querySelectorAll('input[data-v24-value]')];
       const data=[];
       for(const x of inputs){
         const value=x.value.trim(),which=x.dataset.v24Value;
         if(value==='')continue;
         if(!/^\d+$/.test(value)||Number(value)>500)throw Error('Số người phải là số nguyên từ 0 đến 500.');
         if(!editable(own,which))continue;
         const saved=rows.find(r=>r.unit===which&&partKey(r)===key);
         if(saved&&saved.quantity===Number(value))continue;
         data.push({service_date:$('day').value,unit:which,direction,
           departure_min:Number(minute),line_no:Number(ln),quantity:Number(value),
           is_custom:!model().isDefault(direction,Number(minute)),confirmed_by:me.id});
       }
       if(!data.length){message(e.currentTarget.querySelector('.v24-wrap')||wrap,'Không có dữ liệu thay đổi. Giờ xác nhận cũ được giữ nguyên.');return}
       const {error}=await sb.from('ops_shift_transport_v2').upsert(data,{onConflict:'service_date,unit,direction,departure_min,line_no'});
       if(error)throw Error(error.message);
       message(e.currentTarget.querySelector('.v24-wrap')||wrap,'Đã lưu '+data.length+' ô và ghi thời gian xác nhận trên máy chủ.');
       await refresh();
     }else if(b.dataset.v24Add){
       const [dir,min,ln]=b.dataset.v24Add.split('|');
       if(+ln!==0)throw Error('Chỉ thêm dòng từ mốc giờ chính.');
       const {error}=await sb.rpc('ops_add_shuttle_row',{p_date:$('day').value,p_direction:dir,p_minute:+min});
       if(error)throw Error(error.message);
       await refresh();
       message(e.currentTarget.querySelector('.v24-wrap')||wrap,'Đã thêm một dòng xe bổ sung ngay dưới '+clock(+min)+'.');
     }else if(b.dataset.v24Custom){
       const direction=b.dataset.v24Custom;
       const time=e.currentTarget.querySelector('[data-v24-time="'+direction+'"]')?.value;
       const next=!!e.currentTarget.querySelector('[data-v24-next="'+direction+'"]')?.checked;
       const minute=readMinute(time,next);
       if(minute===null)throw Error('Vui lòng chọn giờ hợp lệ.');
       const reason=(e.currentTarget.querySelector('[data-v28-custom-reason="'+direction+'"]')?.value||'').trim();
       if(!reason)throw Error('Vui lòng nhập lý do thêm giờ xe (ví dụ: xe hỗ trợ họp chuyên môn).');
       if(reason.length>220)throw Error('Lý do tối đa 220 ký tự.');
       const already=assemble(rows,lines).some(x=>x.direction===direction&&x.departure_min===minute&&x.line_no===0);
       if(already)throw Error('Khung giờ này đã có; bấm dấu + ngay cạnh khung giờ để thêm xe.');
       const {error}=await sb.rpc('ops_add_shuttle_slot',{p_date:$('day').value,p_direction:direction,p_minute:minute});
       if(error)throw Error(error.message);
       const reasonResult=await sb.rpc('ops_set_shuttle_reason',{p_date:$('day').value,p_direction:direction,p_minute:minute,p_line:0,p_reason:reason});
       if(reasonResult.error)throw Error('Đã tạo mốc xe nhưng chưa lưu được lý do: '+reasonResult.error.message);
       await refresh();
       message(e.currentTarget.querySelector('.v24-wrap')||wrap,'Đã thêm mốc '+clock(minute)+' cho chiều '+model().directionLabel[direction]+' – '+reason+'.');
     }
   }catch(error){message(e.currentTarget.querySelector('.v24-wrap')||wrap,'Không lưu được: '+error.message,true)}
   finally{busy=false;b.disabled=false}
 }
 function onKeydown(e){
   if(e.key==='Enter'&&e.target.matches('input[data-v24-value]')){
     e.preventDefault();e.target.closest('.v24-time-row')?.querySelector('[data-v24-save]')?.click();
   }
 }
 function setUnit(role){
   viewRole=role;mount();show();refresh();
 }
 root.SagsShuttleGridV24={setUnit,refresh,show,_test:{assemble,fieldOf,editable,classify}};
})(typeof window!=='undefined'?window:globalThis);