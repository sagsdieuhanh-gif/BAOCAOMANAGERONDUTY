'use strict';
/* V3.20: Cargo is booked by FLIGHT and DIRECTION. Input KG or TẤN, persist kg. */
(function(root){
 const normalize=x=>String(x||'').trim().toUpperCase().replace(/^##/,'');
 const validKg=n=>Number.isFinite(Number(n))&&Number(n)>=0;
 function direction(flight,pairs=[],detail={}){
   const name=normalize(flight);
   if(!name)return null;
   const match=(values)=>values.some(x=>normalize(x)===name);
   const arrival=match((pairs||[]).map(x=>x.arrival))||
     match((detail.arrivals||[]).map(x=>x.no||x.flight_no));
   const departure=match((pairs||[]).map(x=>x.departure))||
     match((detail.departures||[]).map(x=>x.no||x.flight_no));
   return arrival&&!departure?'arrival':departure&&!arrival?'departure':null;
 }
 const split=(plans,pairs,detail={})=>{
   const out={arrival:[],departure:[],unmatched:[]};
   for(const plan of plans||[]){
     const group=direction(plan.flight_no,pairs,detail)||'unmatched';
     out[group].push(plan);
   }
   return out;
 };
 function toKg(value,unit){
   const text=String(value??'').trim().replace(',','.');
   if(!text||!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(text))return null;
   const qty=Number(text),kg=qty*(unit==='TAN'?1000:unit==='KG'?1:NaN);
   return Number.isFinite(kg)&&kg>=0&&kg<=1e9&&Math.abs(kg-Math.round(kg))<1e-8?Math.round(kg):null;
 }
 const total=rows=>(rows||[]).reduce((sum,r)=>sum+(validKg(r.cargo_kg)?Number(r.cargo_kg):0),0);
 const vn=n=>Number(n).toLocaleString('vi-VN');
 const formattedTotal=kg=>vn(kg)+' kg ('+vn(kg/1000)+' tấn)';
 root.SagsCargoBookingV320={normalize,direction,split,toKg,total,formattedTotal};
})(typeof window!=='undefined'?window:globalThis);
