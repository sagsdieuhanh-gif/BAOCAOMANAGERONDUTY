'use strict';
/* Manager On Duty L2: ARRIVAL/DEPARTURE schedule with stand, gate, booking,
   check-in and ferry. No invented PAX. L1 baseline is immutable. */
(function(root){
 const VN=new Set(['CXR','SGN','HAN','PQC','HPH','DAD','HUI','DLI','VII','VDH','VCA','UIH','VCS','VCL','BMV','VDO','THD','DIN','TBB','VKG','CAH','PXU','SQH','TQO']);
 const KOREAN=new Set(['KE','OZ','BX','TW','RF','LJ','ZE','RS','7C','YP','WE']);
 const FAST=new Set(['VJ','9G','VU','AK','FD']);
 const trim=v=>String(v??'').replace(/\u00a0/g,' ').trim();
 const clean=v=>/^(?:|---|--|—|-|TBA|N\/A)$/i.test(trim(v))?'':trim(v);
 const no=v=>clean(v).toUpperCase().replace(/\s+/g,'');
 const reg=v=>no(v).replace(/[^A-Z0-9]/g,'');
 const aircraft=v=>no(v);
 const fields=['FlightNo','Registration','Aircraft','Route','ParkingBay','Gate','Booking','NatureOfFlight','SSR','FlightType','CkiRow','CKIN OPEN','CKIN CLS','BDG Start','BDG Finish','TotalPax','STA','STD','ETA','ETD','Belt','Remarks','Status'];
 const canon=x=>String(x??'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 function detectHeader(rows,kind){
   const needed=kind==='ARRIVAL'?'STA':'STD';
   for(let i=0;i<Math.min(32,rows.length);i++){
     const h=(rows[i]||[]).map(canon);
     if(h.includes('FLIGHTNO')&&h.includes(canon(needed))&&h.includes('PARKINGBAY')){
       const map={};(rows[i]||[]).forEach((x,j)=>{const k=canon(x);if(k&&!Object.prototype.hasOwnProperty.call(map,k))map[k]=j});
       return {index:i,map};
     }
   }
   return null;
 }
 function excelDate(rows){
   for(let i=0;i<Math.min(rows.length,12);i++){
     const row=rows[i]||[];
     for(let j=0;j<row.length;j++){
       const k=trim(row[j]);
       if(/^date:\s*$/i.test(k)){
         const text=trim(row[j+1]);
         const d=date(text);if(d)return d;
       }
     }
   }
   return null;
 }
 function date(raw){
   const s=trim(raw);let m=s.match(/^(\d{1,2})[-\/]([A-Za-z]{3})[-\/](20\d{2})$/);
   if(m){const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],mo=months.indexOf(m[2].toUpperCase())+1;
     if(!mo)return null;return m[3]+'-'+String(mo).padStart(2,'0')+'-'+m[1].padStart(2,'0');}
   m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](20\d{2})$/);
   if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
   return null;
 }
 function time(v){
   if(v==null||v==='')return null;
   if(typeof v==='number'&&v>=0&&v<1)return Math.round(v*1440);
   const s=clean(v).replace(/\s/g,'');
   if(!s)return null;
   const plus=/\+$/.test(s)?1440:0;
   const t=s.replace(/\+$/,'').replace(':','');
   if(!/^\d{3,4}$/.test(t))return null;
   const padded=t.padStart(4,'0'),h=Number(padded.slice(0,2)),m=Number(padded.slice(2));
   return h<=23&&m<=59?h*60+m+plus:null;
 }
 function clock(x){if(x==null)return '—';const t=x%1440;return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')+(x>=1440?' (+1)':'');}
 function marker43(rows,head){
   const keys=['Remarks','TotalPax','SSR','Booking','Gate'];
   return keys.filter(k=>{
     const col=head.map[canon(k)];return col!=null&&(rows.slice(head.index+1).filter(x=>trim((x||[])[col])==='43').length>=6);
   }).length>=3;
 }
 function readSheet(rows,kind,issues){
   const h=detectHeader(rows,kind);if(!h)throw Error('Không nhận diện được hàng tiêu đề '+kind+' (FlightNo, '+(kind==='ARRIVAL'?'STA':'STD')+', ParkingBay).');
   const filler=marker43(rows,h);if(filler)issues.push('Nguồn '+kind+' có ký hiệu "43" lặp lại nhiều cột; các trường nghi là giá trị mẫu được để CHỜ XÁC NHẬN.');
   const cell=(row,k)=>{
     const j=h.map[canon(k)],v=j==null?'':row[j],s=clean(v);
     return filler&&s==='43'?'':s;
   };
   const flights=[],seen=new Set(),fatal=[];
   for(let i=h.index+1;i<rows.length;i++){
     const r=rows[i]||[],rawNo=no(cell(r,'FlightNo'));
     if(!rawNo)continue;
     const provisional=rawNo.replace(/^##/,'');
     if(!/^[A-Z0-9]{2,20}$/.test(provisional)){fatal.push(kind+' dòng '+(i+1)+': số hiệu '+rawNo+' không hợp lệ.');continue;}
     // ## is the schedule convention for a CHARTER (non-scheduled) flight, not a parse error.
     // ## is identification only: preserve charter=true, no issue or abnormal-service flag.
     if(seen.has(provisional)){fatal.push(kind+' dòng '+(i+1)+': trùng số hiệu '+provisional+'.');continue}
     seen.add(provisional);
     const scheduled=time(cell(r,kind==='ARRIVAL'?'STA':'STD'));
     if(scheduled==null){fatal.push(kind+' dòng '+(i+1)+': '+provisional+' thiếu/sai giờ '+(kind==='ARRIVAL'?'STA':'STD')+'.');continue}
     const bayText=cell(r,'ParkingBay'),bay=/^\d{1,2}$/.test(bayText)?Number(bayText):null;
     const booking=cell(r,'Booking'),parts=/^\d+\/\d+\/\d+$/.test(booking)?booking.split('/').map(Number):null;
     const ptxt=cell(r,'TotalPax'),pax=/^\d{1,4}$/.test(ptxt)?Number(ptxt):null;
     const route=no(cell(r,'Route')).replace(/[–—]/g,'-');
     const ssr=cell(r,'SSR').toUpperCase(),nature=cell(r,'NatureOfFlight').toUpperCase(),flightType=cell(r,'FlightType').toUpperCase();
     const carrier=(provisional.match(/^([A-Z0-9]{2})(?=\d)/)||[])[1]||null;
     flights.push({no:provisional,raw_no:rawNo,charter:rawNo!==provisional,reg:reg(cell(r,'Registration')),raw_reg:cell(r,'Registration'),type:aircraft(cell(r,'Aircraft')),
       route,t:scheduled,bay,gate:cell(r,'Gate'),booking,booking_parts:parts,booking_sum:parts?parts.reduce((a,b)=>a+b,0):null,
       ssr,nature,flight_type:flightType,ferry:/\bFERRY\b/i.test(ssr+' '+nature+' '+flightType),
       checkin_row:cell(r,'CkiRow'),checkin_open:time(cell(r,'CKIN OPEN')),checkin_close:time(cell(r,'CKIN CLS')),
       eta:time(cell(r,'ETA')),etd:time(cell(r,'ETD')),
       boarding_start:time(cell(r,'BDG Start')),boarding_finish:time(cell(r,'BDG Finish')),
       pax,belt:cell(r,'Belt'),source_row:i+1,carrier});
   }
   return {flights,fatal,filler,headerRow:h.index+1};
 }
 function zone(n){return [31,32,33,34,35,36,37,51,52,53,54,55].includes(Number(n))?'KHU 1':
   [38,39,40,41,42].includes(Number(n))?'KHU 2':Number(n)>=56&&Number(n)<=71?'KHU 3':'CHƯA PHÂN KHU';}
 function domestic(route){const parts=route.split('-');return parts.length===2&&parts.includes('CXR')&&parts.every(p=>VN.has(p))?true:
  parts.length===2&&parts.includes('CXR')&&parts.every(p=>/^[A-Z]{3}$/.test(p))?false:null;}
 function buildPayload(arrs,deps,serviceDate,issues,fatal){
   const usedA=new Set(),usedD=new Set(),pairs=[];
   function link(i,j,method){
     const a=i==null?null:arrs[i],d=j==null?null:deps[j];
     if(a)usedA.add(i);if(d)usedD.add(j);
     const dd=domestic(d?.route||a?.route||'');
     const bay=a?.bay||d?.bay||null;
     const m=a&&d&&a.bay!=null&&d.bay!=null&&a.bay!==d.bay;
     if(m)issues.push('Bãi đỗ khác giữa chuyến đến '+a.no+' ('+a.bay+') và đi '+d.no+' ('+d.bay+'); cần AOC xác nhận.');
     const std=d?.t??null,sta=a?.t??null;
     pairs.push({arrival:a?.no||null,departure:d?.no||null,sta_min:sta,std_min:std,bay,
       arrival_bay:a?.bay??null,departure_bay:d?.bay??null,airline:a?.carrier||d?.carrier||null,
       aircraft_type:a?.type||d?.type||null,aircraft_reg:a?.raw_reg||d?.raw_reg||null,
       arrival_route:a?.route||null,departure_route:d?.route||null,arrival_pax:a?.pax??null,departure_pax:d?.pax??null,
       departure_gate:d?.gate||null,departure_checkin_row:d?.checkin_row||null,
       departure_checkin_open:d?.checkin_open??null,departure_checkin_close:d?.checkin_close??null,
       departure_boarding_start:d?.boarding_start??null,departure_boarding_finish:d?.boarding_finish??null,
       booking_raw:d?.booking||null,booking_parts:d?.booking_parts||null,booking_sum:d?.booking_sum??null,
       eta_min:a?.eta??null,etd_min:d?.etd??null,
       ferry:!!(a?.ferry||d?.ferry),charter:!!(a?.charter||d?.charter),arrival_raw_no:a?.raw_no||null,departure_raw_no:d?.raw_no||null,
       arrival_nature:a?.nature||null,departure_nature:d?.nature||null,
       arrival_ssr:a?.ssr||null,departure_ssr:d?.ssr||null,arrival_flight_type:a?.flight_type||null,
       departure_flight_type:d?.flight_type||null,stand_mismatch:!!m,
       international:dd==null?null:!dd,match_method:method});
   }
   const ia=arrs.map((_,i)=>i).sort((x,y)=>arrs[x].t-arrs[y].t);
   for(const i of ia){
     const a=arrs[i];if(!a.reg)continue;
     const next=deps.map((d,j)=>({d,j})).filter(x=>!usedD.has(x.j)&&x.d.reg&&x.d.reg===a.reg&&x.d.t>a.t&&x.d.t-a.t<=900)
       .sort((x,y)=>x.d.t-y.d.t);
     if(next.length)link(i,next[0].j,'REG');
   }
   const candidates=[];
   for(let i=0;i<arrs.length;i++){
     if(usedA.has(i)||arrs[i].reg)continue;
     const a=arrs[i],from=a.route.split('-');
     if(from.length!==2||from[1]!=='CXR')continue;
     for(let j=0;j<deps.length;j++){
       const d=deps[j],to=d.route.split('-');
       if(usedD.has(j)||d.reg||!a.carrier||a.carrier!==d.carrier||to[0]!=='CXR'||to[1]!==from[0])continue;
       if(d.t<=a.t||d.t-a.t>600||a.type&&d.type&&a.type!==d.type)continue;
       candidates.push([i,j]);
     }
   }
   for(const [i,j] of candidates)if(!usedA.has(i)&&!usedD.has(j)&&candidates.filter(x=>x[0]===i).length===1&&candidates.filter(x=>x[1]===j).length===1)link(i,j,'ROUTE_UNIQUE');
   arrs.forEach((_,i)=>{if(!usedA.has(i))link(i,null,'ARRIVAL_ONLY');});
   deps.forEach((_,i)=>{if(!usedD.has(i))link(null,i,'DEPARTURE_ONLY');});
   const domA=arrs.filter(x=>domestic(x.route)===true).length,domD=deps.filter(x=>domestic(x.route)===true).length;
   const known=arrs.every(x=>domestic(x.route)!=null)&&deps.every(x=>domestic(x.route)!=null);
   const payload={service_date:serviceDate,revision:2,source_sheet:'ARRIVAL+DEPARTURE',
     arrival_count:arrs.length,departure_count:deps.length,
     domestic_count:known?domA+domD:null,international_count:known?arrs.length+deps.length-domA-domD:null,
     domestic_arrivals:known?domA:null,domestic_departures:known?domD:null,
     international_arrivals:known?arrs.length-domA:null,international_departures:known?deps.length-domD:null,
     flights:pairs,issues,source_detail:{arrivals:arrs,departures:deps}};
   return {payload,stats:{arrival_count:arrs.length,departure_count:deps.length,matched_reg:pairs.filter(x=>x.match_method==='REG').length,
     matched_route:pairs.filter(x=>x.match_method==='ROUTE_UNIQUE').length,unmatched:pairs.filter(x=>/_ONLY$/.test(x.match_method)).length,
     widebody:deps.filter(x=>/A330|B777/i.test(x.type)).length,ferry:deps.filter(x=>x.ferry&&!x.charter).length,
     booked:deps.filter(x=>x.booking_parts).length},fatal};
 }
 function parseTables(aRows,dRows){
   const issues=[],fatals=[],da=excelDate(aRows),dd=excelDate(dRows);
   if(!da||!dd||da!==dd)throw Error('Ngày khai thác ARRIVAL/DEPARTURE không có hoặc không khớp nhau.');
   const a=readSheet(aRows,'ARRIVAL',issues),d=readSheet(dRows,'DEPARTURE',issues);
   fatals.push(...a.fatal,...d.fatal);
   if(!a.flights.length||!d.flights.length)throw Error('Cần có chuyến đến và chuyến đi hợp lệ.');
   const x=buildPayload(a.flights,d.flights,da,issues,fatals);
   for(const f of d.flights)if(f.ferry&&!f.charter&&f.flight_type==='PAX')issues.push(f.no+': SSR/Nature cho thấy FERRY nhưng FlightType là PAX; cần xác nhận tính chất chuyến.');
   return {meta:{service_date:da,source_sheet:'ARRIVAL+DEPARTURE'},arrivals:a.flights,departures:d.flights,
     payload:x.payload,stats:x.stats,issues,fatal:fatals};
 }
 function validateForSave(parsed,baseline){
   const blocks=[...(parsed?.fatal||[])],p=parsed?.payload||{},pairs=p.flights||[];
   if(!baseline?.payload?.flights?.length)
     blocks.push('Chưa có lịch bay Lần 1 đã lưu cho ngày '+(parsed?.meta?.service_date||'này')+'. Nhập và lưu Lần 1 trước khi duyệt Lần 2.');
   if(!pairs.length||pairs.length>350)blocks.push('Số cặp chuyến không hợp lệ (chỉ hỗ trợ 1–350 cặp).');
   if(!pairs.some(x=>x.bay!=null))
     blocks.push('Lần 2 chưa có vị trí đỗ hợp lệ. Cần kiểm tra cột ParkingBay trong file.');
   const arr=new Set(),dep=new Set();
   for(const f of pairs){
     const id=f.departure||f.arrival||'Chuyến chưa rõ số hiệu';
     if(f.arrival){if(arr.has(f.arrival))blocks.push('Trùng số hiệu chuyến đến '+f.arrival+'.');arr.add(f.arrival);}
     if(f.departure){if(dep.has(f.departure))blocks.push('Trùng số hiệu chuyến đi '+f.departure+'.');dep.add(f.departure);}
     if(f.arrival&&f.departure&&f.sta_min!=null&&f.std_min!=null&&f.std_min<=f.sta_min)
       blocks.push(id+': STD '+clock(f.std_min)+' không sau STA '+clock(f.sta_min)+
         '. Nếu chuyến đi qua ngày cần ghi dấu + ở nguồn Excel.');
     if((f.sta_min!=null&&(f.sta_min<0||f.sta_min>1800))||
        (f.std_min!=null&&(f.std_min<0||f.std_min>1800)))
       blocks.push(id+': giờ bay ngoài phạm vi cho phép; kiểm tra dấu + và định dạng giờ.');
     if(f.bay!=null&&(f.bay<1||f.bay>99))blocks.push(id+': số vị trí đỗ ngoài phạm vi cho phép.');
   }
   if(p.arrival_count!==arr.size||p.departure_count!==dep.size)
     blocks.push('Số lượt chuyến đến/đi không khớp dữ liệu đã ghép; kiểm tra số hiệu bị trùng hoặc bỏ sót.');
   return [...new Set(blocks)];
 }
 function detectWorkbook(book,xlsx){
   if(!book||!xlsx?.utils)return null;
   const found={};
   for(const name of book.SheetNames||[]){
     const rows=xlsx.utils.sheet_to_json(book.Sheets[name],{header:1,raw:true,defval:'',blankrows:true});
     // Workbook editions may omit the ARRIVAL/DEPARTURE title in row 4.
     // The actual FlightNo + STA/STD + ParkingBay headers are authoritative.
     const hasArr=!!detectHeader(rows,'ARRIVAL'),hasDep=!!detectHeader(rows,'DEPARTURE');
     const title=(name+' '+rows.slice(0,10).map(row=>(row||[]).slice(0,8).map(x=>trim(x)).join(' ')).join(' ')).toUpperCase();
     if(hasArr&&!hasDep&&!found.ARRIVAL)found.ARRIVAL=rows;
     if(hasDep&&!hasArr&&!found.DEPARTURE)found.DEPARTURE=rows;
     if(hasArr&&hasDep){
       if(/\bARRIVAL\b/.test(title)&&!found.ARRIVAL)found.ARRIVAL=rows;
       if(/\bDEPARTURE\b/.test(title)&&!found.DEPARTURE)found.DEPARTURE=rows;
     }
   }
   return found.ARRIVAL&&found.DEPARTURE?found:null;
 }
 function booking(f){return f.booking_raw?'Booking '+f.booking_raw+(f.booking_sum!=null?' (tổng 3 thành phần '+f.booking_sum+', chưa phải số khách thực đi)':''):'';}
 function analyze(payload){
   const pairs=payload.flights||[],deps=payload.source_detail?.departures||[];
   const wide=deps.filter(x=>/A330|B777/i.test(x.type));
   const ferry=deps.filter(x=>x.ferry&&!x.charter);
   const high=deps.filter(x=>x.booking_sum!=null&&x.booking_sum>=300);
   const night=deps.filter(x=>x.t>=1080);
   const gateCheck=[];
   for(let i=0;i<deps.length;i++)for(let j=i+1;j<deps.length;j++){
     const a=deps[i],b=deps[j];
     if(!a.gate||a.gate!==b.gate)continue;
     const full=[a.boarding_start,a.boarding_finish,b.boarding_start,b.boarding_finish].every(Number.isFinite);
     const overlap=full&&a.boarding_start<b.boarding_finish&&b.boarding_start<a.boarding_finish;
     const gap=Math.abs(a.t-b.t);
     if(overlap||gap<=45)gateCheck.push({gate:a.gate,a:a.no,b:b.no,minutes:gap,
       kind:overlap?'CÙNG GATE, DỰ KIẾN TRÙNG THỜI GIAN BOARDING':'CÙNG GATE, STD GẦN NHAU – CẦN ĐỐI CHIẾU'});
   }
   const zones={};for(const f of pairs)for(const [key,bay] of [['ARR',f.arrival_bay],['DEP',f.departure_bay]]){
     if(bay==null)continue;const z=zone(bay);zones[z]=(zones[z]||0)+1;
   }
   return {wide,ferry,high,night,gateCheck,zones,pairs:pairs.length,booked:deps.filter(x=>x.booking_parts).length};
 }
 function compare(payload,base){
   const before=base?.flights||[],bA=new Map(),bD=new Map(),changes=[];
   for(const f of before){if(f.arrival)bA.set(f.arrival,f);if(f.departure)bD.set(f.departure,f);}
   const arrivals=payload.source_detail?.arrivals||[],deps=payload.source_detail?.departures||[];
   for(const f of arrivals){
     const old=bA.get(f.no);if(!old){changes.push({flight:f.no,type:'CHUYẾN ĐẾN CHƯA CÓ TRONG LẦN 1'});continue;}
     if(f.bay!=null&&old.bay!=null&&Number(old.bay)!==f.bay)changes.push({flight:f.no,type:'THAY ĐỔI BÃI ĐỖ',from:old.bay,to:f.bay});
     if(f.t!=null&&old.sta_min!=null&&Number(old.sta_min)!==f.t)changes.push({flight:f.no,type:'THAY ĐỔI STA',from:clock(old.sta_min),to:clock(f.t)});
   }
   for(const f of deps){
     const old=bD.get(f.no);if(!old){changes.push({flight:f.no,type:'CHUYẾN ĐI CHƯA CÓ TRONG LẦN 1'});continue;}
     if(f.bay!=null&&old.bay!=null&&Number(old.bay)!==f.bay)changes.push({flight:f.no,type:'THAY ĐỔI BÃI ĐỖ',from:old.bay,to:f.bay});
     if(f.t!=null&&old.std_min!=null&&Number(old.std_min)!==f.t)changes.push({flight:f.no,type:'THAY ĐỔI STD',from:clock(old.std_min),to:clock(f.t)});
   }
   return changes;
 }
 const api={detectWorkbook,parseTables,validateForSave,analyze,compare,clock,time,date,zone,booking,_test:{readSheet,detectHeader,marker43}};
 root.SagsSecondForecast=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);