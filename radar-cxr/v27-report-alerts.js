'use strict';
(function(root){
 const $=id=>document.getElementById(id);
 const rosters=[{unit:'DH',name:'ĐH'},{unit:'KTS',name:'PVSĐ'},{unit:'PVHK',name:'PVHK'},{unit:'KHO',name:'KHO HÀNG'},{unit:'QA_IT',name:'QA / IT'}];
 const directions=[{key:'NHA_CXR',name:'Nha Trang → Cam Ranh'},{key:'CXR_NHA',name:'Cam Ranh → Nha Trang'}];
 const requiredShifts=[
  {unit:'KTS',name:'PVSĐ',roles:[['BAGGAGE','Bốc xếp'],['GSE_DRIVER','Lái xe GSE']]},
  {unit:'PVHK',name:'PVHK',roles:[['PVHK_ARRIVAL_TEAM','Đội đến'],['PVHK_DEPARTURE_TEAM','Đội đi']]}
 ];
 const baseSlots=()=>{
   const mod=root.SagsShuttleModel;
   return mod?.defaults||[];
 };
 const clock=n=>{
   const h=String(Math.floor(n/60)%24).padStart(2,'0');
   const m=String(n%60).padStart(2,'0');
   return h+':'+m+(n>=1440?' (+1)':'');
 };
 const key=r=>r.direction+'|'+r.departure_min+'|'+Number(r.line_no||0);
 const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function analyze({transport=[],additionalRows=[],staff=[],cargoPlans=[],gse=[],expectCargo=true}={}){
   const alerts=[];
   const all=new Map();
   for(const x of baseSlots())all.set(key(x),{direction:x.direction,departure_min:x.departure_min,line_no:0});
   for(const x of [...transport,...additionalRows]){
     all.set(key(x),{direction:x.direction,departure_min:x.departure_min,line_no:Number(x.line_no||0)});
     if(Number(x.line_no||0)>0){
       const baseKey=key({...x,line_no:0});
       if(!all.has(baseKey))all.set(baseKey,{direction:x.direction,departure_min:x.departure_min,line_no:0});
     }
   }
   const slots=[...all.values()].sort((a,b)=>a.departure_min-b.departure_min||a.line_no-b.line_no);
   const has=new Set(transport.map(x=>x.unit+'|'+key(x)));
   for(const u of rosters){
     for(const d of directions){
       const target=slots.filter(x=>x.direction===d.key);
       const pending=target.filter(x=>!has.has(u.unit+'|'+key(x)));
       if(!pending.length)continue;
       const times=pending.slice(0,5).map(x=>clock(x.departure_min)+(x.line_no>0?' / bổ sung '+x.line_no:'')).join(', ');
       alerts.push({unit:u.name,type:'XE GIAO CA',detail:'Chưa nhập '+pending.length+'/'+target.length+' dòng chiều '+d.name+': '+times+(pending.length>5?', …':'')});
     }
   }
   for(const group of requiredShifts){
     const missing=[];
     for(const sh of ['SÁNG','ĐÊM'])for(const [role,label] of group.roles){
       if(!staff.some(x=>x.unit===group.unit&&x.shift===sh&&x.role_code===role&&x.quantity!=null&&x.confirmed_at))
         missing.push(label+' ca '+(sh==='SÁNG'?'sáng':'đêm'));
     }
     if(missing.length)alerts.push({unit:group.name,type:'NHÂN SỰ PHỤC VỤ',detail:'Chưa xác nhận: '+missing.join('; ')});
   }
   const gseMissing=gse.filter(x=>x.ready_count==null||!x.confirmed_at);
   if(!gse.length)alerts.push({unit:'PVSĐ',type:'TRANG THIẾT BỊ',detail:'Chưa có xác nhận số GSE khả dụng theo nhóm thiết bị.'});
   else if(gseMissing.length)alerts.push({unit:'PVSĐ',type:'TRANG THIẾT BỊ',detail:'Chưa xác nhận số xe khả dụng: '+gseMissing.slice(0,5).map(x=>x.code).join(', ')+(gseMissing.length>5?' và '+(gseMissing.length-5)+' nhóm khác':'')});
   if(expectCargo){
     if(!cargoPlans.length)alerts.push({unit:'KHO HÀNG',type:'CARGO',detail:'Chưa nhập kế hoạch cargo theo chuyến hoặc chưa xác nhận ngày không phát sinh hàng.'});
     else{
       const miss=cargoPlans.filter(x=>x.cargo_kg==null||x.cargo_pcs==null||x.ready_by_min==null);
       if(miss.length)alerts.push({unit:'KHO HÀNG',type:'CARGO',detail:'Thiếu KG / PCS / giờ kho sẵn sàng: '+miss.slice(0,5).map(x=>x.flight_no).join(', ')+(miss.length>5?', …':'')});
     }
   }
   return alerts;
 }
 function markup(alerts){
   if(!alerts.length)return '<div class="v27-ok"><b>Đã có xác nhận cho các mục theo dõi.</b> ĐH tiếp tục kiểm tra thay đổi thực tế trước khi phát hành.</div>';
   return '<div class="v27-alert-title"><b>CHƯA ĐỦ THÔNG TIN TỪ CÁC ĐƠN VỊ</b><span>'+alerts.length+' nhóm thông tin cần kiểm tra</span></div>'+
     '<p class="v27-alert-caption">Dữ liệu chưa nhập không được coi là 0. ĐH rà soát với các đơn vị trước khi phát hành báo cáo.</p>'+
     '<ul class="v27-alert-list">'+alerts.map(x=>'<li><strong>'+escape(x.unit)+' · '+escape(x.type)+':</strong> '+escape(x.detail)+'</li>').join('')+'</ul>';
 }
 let request=0;
 async function fetch(date){
   if(typeof sb==='undefined'||!sb)throw Error('Chưa có kết nối Supabase.');
   const [a,b,c,d,e]=await Promise.all([
     sb.from('ops_shift_transport_v2').select('unit,direction,departure_min,line_no,quantity').eq('service_date',date),
     sb.from('ops_shift_transport_rows').select('direction,departure_min,line_no').eq('service_date',date),
     sb.from('ops_staff_capacity').select('unit,role_code,shift,quantity,confirmed_at').eq('service_date',date),
     sb.from('ops_warehouse_cargo_plan').select('flight_no,cargo_kg,cargo_pcs,ready_by_min').eq('service_date',date),
     sb.from('ops_gse_capacity').select('code,ready_count,confirmed_at').eq('service_date',date)
   ]);
   const error=[a,b,c,d,e].find(x=>x.error)?.error;
   if(error)throw Error(error.message);
   return analyze({transport:a.data,additionalRows:b.data,staff:c.data,cargoPlans:d.data,gse:e.data});
 }
 async function refresh(){
   const el=$('v27MissingData');if(!el)return;
   const date=$('day')?.value;if(!date)return;
   const current=++request;
   el.innerHTML='<p class="v27-pending">Đang kiểm tra số liệu các đơn vị…</p>';
   try{
     const warnings=await fetch(date);if(current!==request)return;
     el.innerHTML=markup(warnings);
   }catch(e){
     if(current===request)el.innerHTML='<p class="v27-error"><strong>CHƯA KIỂM TRA ĐƯỢC DỮ LIỆU CÁC ĐƠN VỊ:</strong> '+escape(e.message)+'</p>';
   }
 }
 root.SagsMissingV27={analyze,fetch,refresh,_test:{markup}};
})(typeof window!=='undefined'?window:globalThis);
