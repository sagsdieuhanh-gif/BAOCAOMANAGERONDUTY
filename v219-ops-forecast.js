'use strict';
/* Separate Peak Hours movement counts (hourly) from 30-minute turn resource forecasts.
   CXR airside rules, approved staffing/GSE data and contract-confirmed check-in counters.
   Unconfirmed inputs MUST NOT become "sufficient" verdicts. */
(function(root){
 const VN=new Set(['CXR','SGN','HAN','PQC','HPH','DAD','HUI','DLI','VII','VDH','VCA','UIH','VCS','VCL','BMV','VDO','THD','DIN','TBB','VKG','CAH','PXU','SQH','TQO']);
 const KOR=new Set(['KE','OZ','BX','TW','RF','LJ','ZE','RS','7C','YP','WE']);
 const FAST=new Set(['VJ','VU','9G','AK','FD']);
 const bridge=new Set([52,53,32,33,34,35,36]);
 const time=x=>x==null?'—':String(Math.floor((x%1440)/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0')+(x>=1440?' (+1)':'');
 const carrier=x=>{
   let no=String(x?.departure||x?.arrival||x?.no||'').toUpperCase().replace(/^##/,'');
   return String(x?.carrier||x?.airline||(no.match(/^([A-Z0-9]{2})(?=\d)/)||[])[1]||'').toUpperCase();
 };
 function domestic(route){
   const a=String(route||'').toUpperCase().split(/[-–—]/).map(x=>x.trim());
   return a.length===2&&a.includes('CXR')&&a.every(x=>VN.has(x))?true:
      a.length===2&&a.includes('CXR')&&a.every(x=>/^[A-Z]{3}$/.test(x))?false:null;
 }
 const zone=bay=>([31,32,33,34,35,36,37,51,52,53,54,55].includes(Number(bay))?'K1':
   [38,39,40,41,42].includes(Number(bay))?'K2':bay!=null&&bay>=56&&bay<=71?'K3':'?');
 function movements(payload,live=[]){
   const detailed=payload?.source_detail,events=[],unverified=[];
   if([...(detailed?.arrivals||[]),...(detailed?.departures||[])].some(x=>Number.isFinite(x.t)&&x.no&&x.route)){
     for(const [direction,items] of [['arrival',detailed.arrivals||[]],['departure',detailed.departures||[]]]){
       for(const f of items){
         const international=domestic(f.route);
         events.push({direction,no:f.no||f.arrival||f.departure,minute:f.t,domestic:international,route:f.route||'',bay:f.bay});
       }
     }
   }else{
     const pairs=payload?.flights?.length?payload.flights:live;
     for(const f of pairs){
       for(const dir of ['arrival','departure']){
         const name=f[dir],minute=f[dir==='arrival'?'sta_min':'std_min'];
         if(!name)continue;
         const route=f[dir+'_route'],d=typeof f.international==='boolean'?!f.international:domestic(route);
         events.push({direction:dir,no:name,minute,domestic:d,route:route||'',bay:f.bay});
       }
     }
   }
   const slots=Array.from({length:24},(_,hour)=>({hour,label:String(hour).padStart(2,'0')+':00–'+String(hour+1).padStart(2,'0')+':00',
     ia:0,id:0,da:0,dd:0,total:0,flights:[]}));
   const seen=new Set();
   for(const f of events){
     const key=f.direction+'|'+f.no+'|'+f.minute;
     if(seen.has(key))continue;seen.add(key);
     if(!Number.isFinite(f.minute)||f.minute<0){unverified.push(f.no+' thiếu giờ '+f.direction);continue;}
     if(f.minute>=1440)continue; // 24-hour "Peak Hours" day; next-day +1 shown separately in radar.
     if(f.domestic===null){unverified.push(f.no+' chưa rõ quốc nội/quốc tế');continue;}
     const slot=slots[Math.floor(f.minute/60)];
     if(f.direction==='arrival'){if(f.domestic)slot.da++;else slot.ia++;}
     else {if(f.domestic)slot.dd++;else slot.id++;}
     slot.total++;slot.flights.push(f.no);
   }
   return {slots,peak:[...slots].sort((a,b)=>b.total-a.total||a.hour-b.hour).slice(0,4),
     verified:slots.reduce((n,x)=>n+x.total,0),unverified,plusOne:events.filter(x=>x.minute>=1440).length};
 }
 function svg(chart){
   const rows=chart.slots||[],W=1120,H=340,ml=61,mr=16,top=68,bottom=62,areaW=W-ml-mr,areaH=H-top-bottom;
   const mx=Math.max(1,...rows.map(x=>Math.max(x.ia,x.id,x.da,x.dd)));
   const upper=Math.max(2,Math.ceil(mx)),bar=7,pitch=areaW/24;
   const cols=[['ia','#3E68A0','Quốc tế đến'],['id','#F7AF62','Quốc tế đi'],['da','#1B987A','Quốc nội đến'],['dd','#C85638','Quốc nội đi']];
   let out='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Peak Hours – bốn nhóm chuyến theo từng giờ">';
   out+='<rect width="'+W+'" height="'+H+'" fill="#fff"/><text x="'+W/2+'" y="28" font-family="Arial" font-size="21" font-weight="700" text-anchor="middle" fill="#183f59">PEAK HOURS · 24 GIỜ</text>';
   out+='<text x="'+W/2+'" y="47" text-anchor="middle" font-family="Arial" font-size="12" fill="#678">Lượt chuyến theo STA / STD · không phải cặp tàu bay</text>';
   for(let i=0;i<=upper;i++){const y=top+areaH-i*areaH/upper;out+='<line x1="'+ml+'" y1="'+y+'" x2="'+(W-mr)+'" y2="'+y+'" stroke="#E0E7ED"/><text x="'+(ml-11)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" font-family="Arial" fill="#547086">'+i+'</text>';}
   rows.forEach((r,i)=>{
     const center=ml+(i+.5)*pitch;
     cols.forEach(([key,color],j)=>{
       const value=r[key];if(!value)return;
       const h=value/upper*areaH,x=center-16+j*8,y=top+areaH-h;
       out+='<rect x="'+x+'" y="'+y+'" width="'+bar+'" height="'+h+'" fill="'+color+'"/>'+
         '<text x="'+(x+bar/2)+'" y="'+(y-4)+'" text-anchor="middle" font-family="Arial" font-size="10" fill="#193950">'+value+'</text>';
     });
     out+='<text transform="translate('+(center-2)+','+(top+areaH+16)+') rotate(-45)" text-anchor="end" font-size="10" font-family="Arial" fill="#34556a">'+String(r.hour).padStart(2,'0')+'–'+String(r.hour+1).padStart(2,'0')+'</text>';
   });
   cols.forEach(([_,color,label],i)=>{const x=ml+i*250;out+='<rect x="'+x+'" y="'+(H-15)+'" width="12" height="12" fill="'+color+'"/><text x="'+(x+17)+'" y="'+(H-5)+'" font-family="Arial" font-size="12" fill="#23475f">'+label+'</text>';});
   return out+'</svg>';
 }
 function boardingWindow(f){
   if(f?.boarding_start!=null&&f?.boarding_finish!=null&&f.boarding_finish>f.boarding_start)
     return {start:f.boarding_start,end:f.boarding_finish,certainty:'XÁC NHẬN TỪ LỊCH'};
   if(f?.t==null||f?.ferry)return null;
   const c=carrier(f),lead=c==='VJ'?50:c==='KE'?35:['AK','FD'].includes(c)?30:null;
   if(lead===null)return null;
   // Approximation / passenger arrival guidance only: NOT an airline handling timetable.
   const ref=f.etd!=null&&f.etd>=f.t?f.etd:f.t;
   return {start:Math.max(0,ref-lead),end:Math.max(0,ref-(c==='KE'?10:15)),
     certainty:'THAM CHIẾU; CHƯA XÁC NHẬN BOARDING',lead,carrier:c};
 }
 function serviceM(p){
   const c=carrier(p);
   if(FAST.has(c))return 30;
   if(KOR.has(c))return 60;
   if(p.sta_min!=null&&p.std_min!=null&&p.std_min>p.sta_min)return p.std_min-p.sta_min;
   return null;
 }
 function boardings(deps,pairs){
   const warnings=[],list=deps.filter(x=>x.gate&&!x.ferry).map(x=>({...x,w:boardingWindow(x)}));
   for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
     const a=list[i],b=list[j];
     if(a.gate!==b.gate||!a.w||!b.w)continue;
     if(a.w.start<b.w.end&&b.w.start<a.w.end)warnings.push({gate:a.gate,a:a.no,b:b.no,
       start:Math.max(a.w.start,b.w.start),end:Math.min(a.w.end,b.w.end),
       verified:a.w.certainty==='XÁC NHẬN TỪ LỊCH'&&b.w.certainty==='XÁC NHẬN TỪ LỊCH'});
   }
   const arrivals=new Map((pairs||[]).filter(x=>x.departure).map(x=>[x.departure,x]));
   const risky=[];
   for(const f of list){
     const pair=arrivals.get(f.no),lead=pair&&serviceM(pair);
     if(pair?.sta_min!=null&&pair?.std_min!=null&&lead!=null){
       const ground=pair.std_min-pair.sta_min,eta=pair.eta_min;
       if(ground<lead||eta!=null&&eta>pair.sta_min&&eta+lead>pair.std_min)
         risky.push({flight:f.no,sta:pair.sta_min,std:pair.std_min,ground,
           eta:eta??null,reference:lead,gate:f.gate,
           kind:eta!=null&&eta>pair.sta_min?'ETA MUỘN HƠN STA; CÓ THỂ ẢNH HƯỞNG BOARDING':
             'QUAY ĐẦU SÁT; ĐẾN TRỄ CÓ THỂ ẢNH HƯỞNG BOARDING'});
     }
   }
   return {warnings,risky,unknown:list.filter(x=>!x.w).map(x=>x.no)};
 }
 function staffAt(rows,t,role){
   const matching=(rows||[]).filter(x=>x.role_code===role&&x.confirmed_at!=null&&
     Number(x.start_min)<=t&&Number(x.end_min)>=t+30&&Number.isFinite(Number(x.quantity)));
   return matching.length?matching.reduce((n,x)=>n+Number(x.quantity),0):null;
 }
 function capacity(pairs,staff,gse,contracts,details){
   const windows=[],src=details?.departures||[];
   const contract=new Map((contracts||[]).map(x=>[x.airline,x]));
   const byGse=new Map((gse||[]).map(x=>[x.code,x]));
   for(let start=0;start<1440;start+=30){
     const active=(pairs||[]).filter(p=>{
       const n=serviceM(p);
       if(n==null||p.sta_min==null)return false;
       const end=Math.min(p.sta_min+n,p.std_min??Infinity);
       return start<end&&start+30>p.sta_min;
     });
     if(!active.length)continue;
     const outer=active.filter(p=>p.bay!=null&&!bridge.has(Number(p.bay)));
     const incompleteBay=active.filter(p=>p.bay==null);
     const needs={STAIRS:outer.length*2,COBUS_LARGE:outer.length*2,
       BELT:active.length*2,TRACTOR:active.length*2};
     const comparisons=Object.entries(needs).map(([key,required])=>{
       const available=byGse.get(key)?.ready_count;
       return {key,required,available:available==null?null:Number(available),
         shortage:available==null?null:Math.max(0,required-Number(available))};
     });
     const cargoUnknown=active.filter(x=>!['CARGO','NO_CARGO'].includes(x.cargo_status));
     const withCargo=active.filter(x=>x.cargo_status==='CARGO').length;
     const withoutCargo=active.filter(x=>x.cargo_status==='NO_CARGO').length;
     const neededBag=withoutCargo*3+withCargo*6;
     const neededDrv=withoutCargo+withCargo*2;
     const bag=staffAt(staff,start,'BAGGAGE'),sky=staffAt(staff,start,'SKYONE_BAGGAGE'),drv=staffAt(staff,start,'GSE_DRIVER');
     const observedBag=bag==null&&sky==null?null:(bag||0)+(sky||0);
     const baggage={need:cargoUnknown.length?null:neededBag,available:observedBag,
       shortage:cargoUnknown.length||observedBag==null?null:Math.max(0,neededBag-observedBag)};
     const driver={need:cargoUnknown.length?null:neededDrv,available:drv,
       shortage:cargoUnknown.length||drv==null?null:Math.max(0,neededDrv-drv)};
     const cbDriver=staffAt(staff,start,'COBUS_DRIVER');
     const cobusDrivers={need:outer.length*2,available:cbDriver,
       shortage:cbDriver==null?null:Math.max(0,outer.length*2-cbDriver)};
     const chosen=src.filter(d=>!d.ferry&&d.t>=start&&d.t<start+30);
     const desks=chosen.filter(x=>contract.has(carrier(x))).map(x=>({...x,rule:contract.get(carrier(x))}));
     const missingRules=chosen.filter(x=>!contract.has(carrier(x))).map(x=>x.no);
     const desksNeed=desks.reduce((n,x)=>n+(x.rule.checkin_counters||0)*(x.rule.staff_per_counter||0),0);
     const desksReady=staffAt(staff,start,'PVHK_DEPARTURE_TEAM');
     // Counter demand peak belongs to the entire overlapping check-in period, not departure slot.
     const openDesks=src.filter(d=>{
       const rule=contract.get(carrier(d));if(!rule||d.ferry||d.t==null)return false;
       const open=d.checkin_open??(d.t-rule.checkin_open_lead);
       const close=d.checkin_close??(d.t-rule.checkin_close_lead);
       return Number.isFinite(open)&&Number.isFinite(close)&&start<close&&start+30>open;
     });
     const neededCounterStaff=openDesks.reduce((n,d)=>{
       const rule=contract.get(carrier(d));return n+(rule.checkin_counters||0)*(rule.staff_per_counter||0);
     },0);
     const counterUnknown=src.filter(d=>{
       const rule=contract.get(carrier(d));return !rule&&d.t!=null&&start>=d.t-180&&start<d.t;
     });
     const currentGates=src.filter(d=>d.gate&&!d.ferry&&(()=>{
       const w=boardingWindow(d);return !!w&&start<w.end&&start+30>w.start;
     })());
     const unconfirmedGate=currentGates.filter(d=>!contract.get(carrier(d))?.gate_staff);
     const gateRequired=currentGates.reduce((n,d)=>n+(contract.get(carrier(d))?.gate_staff||0),0);
     const gateAvailable=staffAt(staff,start,'GATE');
     const gateStaff={need:unconfirmedGate.length?null:gateRequired,available:gateAvailable,
       shortage:unconfirmedGate.length||gateAvailable==null?null:Math.max(0,gateRequired-gateAvailable),
       flights:currentGates.map(d=>d.no)};
     windows.push({start,active:active.map(x=>x.departure||x.arrival),
       total:active.length,outer:outer.length,unknownBay:incompleteBay.length,
       zone2:active.filter(x=>zone(x.bay)==='K2').map(x=>x.departure||x.arrival),
       zone3:active.filter(x=>zone(x.bay)==='K3').map(x=>x.departure||x.arrival),
       gse:comparisons,baggage,driver,cobusDrivers,gateStaff,unknownCargo:cargoUnknown.length,
       checkin:{required:!counterUnknown.length&&openDesks.length?neededCounterStaff:null,
         available:desksReady,shortage:counterUnknown.length||!openDesks.length||desksReady==null?null:Math.max(0,neededCounterStaff-desksReady),
         openFlights:openDesks.map(x=>x.no),missing:counterUnknown.map(x=>x.no)}});
   }
   return windows;
 }
 function groupStand(pairs){
   const groups=new Map();
   for(const p of pairs||[]){
     if(!['K2','K3'].includes(zone(p.bay)))continue;
     for(const [type,minute] of [['đến',p.sta_min],['đi',p.std_min]]){
       if(minute==null)continue;
       const h=Math.floor(minute/60),key=zone(p.bay)+'|'+h;
       if(!groups.has(key))groups.set(key,{zone:zone(p.bay),hour:h,flights:[]});
       groups.get(key).flights.push((type==='đến'?p.arrival:p.departure)+' ('+type+', bãi '+p.bay+')');
     }
   }
   return [...groups.values()].filter(x=>x.flights.length).sort((a,b)=>a.hour-b.hour||a.zone.localeCompare(b.zone));
 }
 function handoffs(pairs){
   const turns=(pairs||[]).filter(p=>p.sta_min!=null&&serviceM(p)!=null)
     .map(p=>({name:p.departure||p.arrival,begin:p.sta_min,
       expectedEnd:Math.min(p.sta_min+serviceM(p),p.std_min??Infinity)}))
     .sort((a,b)=>a.begin-b.begin);
   const result=[];
   for(let i=0;i<turns.length-1;i++){
     const from=turns[i],next=turns[i+1],gap=next.begin-from.expectedEnd;
     result.push({from:from.name,to:next.name,fromEnd:from.expectedEnd,nextStart:next.begin,gap,
       status:gap<0?'PHẢI PHỤC VỤ CHỒNG LẤN – KHÔNG THỂ DÙNG CHUNG MỘT TỔ/THIẾT BỊ':
         'CÓ THỂ ĐIỀU CHUYỂN SAU KHI XÁC NHẬN HOÀN TẤT; CHƯA CÓ THỜI GIAN DI CHUYỂN'});
   }
   return result;
 }
 function summarize(payload,rows,staff,gse,contracts){
   const detail=payload?.source_detail||{},pairs=payload?.flights?.length?payload.flights:rows||[];
   const hours=movements(payload,rows),deps=detail.departures||[];
   const gate=boardings(deps,pairs),stand=groupStand(pairs);
   const windows=capacity(pairs,staff,gse,contracts,detail);
   const attention=windows.filter(w=>w.unknownBay||w.unknownCargo||
     w.gse.some(x=>x.shortage>0)||w.baggage.shortage>0||w.driver.shortage>0||w.cobusDrivers.shortage>0||w.gateStaff.shortage>0||w.checkin.shortage>0);
   const top=windows.slice().sort((a,b)=>b.total-a.total||a.start-b.start).slice(0,6);
   return {hours,gate,stand,windows,attention,top,handoffs:handoffs(pairs),contracts:(contracts||[]).length,
     unknown:hours.unverified};
 }
 root.SagsOpsForecastV219={movements,svg,boardingWindow,boardings,capacity,groupStand,summarize,handoffs,serviceM,zone,domestic,carrier,time};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.SagsOpsForecastV219;
})(typeof window!=='undefined'?window:globalThis);