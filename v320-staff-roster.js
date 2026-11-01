'use strict';
/* V3.20 – Explicit personnel roster by operational team.
   Số 0 được xác nhận khác với ô chưa nhập. Không phân bổ lại SKYONE
   cũ sang HLSĐ, HLNG hoặc PVTT khi chưa có xác nhận theo từng nhóm. */
(function(root){
 const TEAMS={
  PVHK:[
   {label:'Cán bộ Phòng',parts:[['PVHK_OFFICE','Chính']]},
   {label:'Đội PVHK đi',parts:[['PVHK_DEPARTURE_TEAM','Chính']]},
   {label:'Đội PVHK đến',parts:[['PVHK_ARRIVAL_TEAM','Chính']]}
  ],
  KTS:[
   {label:'Cán bộ Phòng',parts:[['KTS_OFFICE','Chính']]},
   {label:'Đội PVSĐ',parts:[['KTS_RAMP_TEAM','Chính']]},
   {label:'HLSĐ',parts:[['BAGGAGE','Chính'],['KTS_HLSD_SKO','SKO']]},
   {label:'HLNG',parts:[['TERMINAL_BAGGAGE','Chính'],['KTS_HLNG_SKO','SKO']]},
   {label:'Đội PVTT',parts:[['KTS_PVTT','Chính'],['KTS_PVTT_TC','TC'],['KTS_PVTT_SKO','SKO']]},
   {label:'Xưởng SC',parts:[['KTS_WORKSHOP_SC','Chính']]}
  ]
 };
 const valid=v=>v!==''&&v!=null&&Number.isInteger(Number(v))&&Number(v)>=0;
 function get(rows,unit,code,shift){
  const entry=(rows||[]).find(r=>r.unit===unit&&r.role_code===code&&r.shift===shift&&r.confirmed_at&&valid(r.quantity));
  return entry?Number(entry.quantity):null;
 }
 function groups(rows,unit,shift){
  return (TEAMS[unit]||[]).map(def=>{
   const members=def.parts.map(([code,type])=>({code,type,count:get(rows,unit,code,shift)}));
   return {label:def.label,members};
  });
 }
 function pretty(group){
  const known=group.members.some(x=>x.count!=null);
  if(!known)return null;
  return group.members.map((m,i)=>m.count==null?
   (m.type==='Chính'?'Chính: chưa xác nhận':m.type+': chưa xác nhận'):
   String(m.count)+(m.type==='Chính'?'':' '+m.type))
   .join(' + ');
 }
 function legacy(rows,unit,shift){
  if(unit!=='KTS')return null;
  // Never presume legacy generic contractor is assigned to a specific task.
  return get(rows,'KTS','SKYONE_BAGGAGE',shift);
 }
 root.SagsStaffRosterV320={TEAMS,get,groups,pretty,legacy};
})(typeof window!=='undefined'?window:globalThis);
