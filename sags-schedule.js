'use strict';
(function(global){
  const norm=v=>String(v==null?'':v).trim().toUpperCase().replace(/\u00a0/g,' ').replace(/\s+/g,'');
  const reg=v=>norm(v).replace(/[^A-Z0-9]/g,'');
  const route=v=>norm(v).replace(/[\u2013\u2014]/g,'-');
  const flight=v=>norm(v).replace(/[^A-Z0-9]/g,'');
  function time(v){
    if(v===null||v===undefined||v==='')return null;
    if(typeof v==='number'){
      if(v>=0&&v<1)return Math.round(v*1440);
      if(v>=10000&&v<100000)return Math.round((v%1)*1440);
    }
    const t=norm(v);
    const plus=t.endsWith('+')?1440:0;
    const a=t.replace(/\+$/,'').replace(':','');
    if(!/^\d{3,4}$/.test(a))return null;
    const x=a.padStart(4,'0'),hh=+x.slice(0,2),mm=+x.slice(2);
    if(hh>23||mm>59)return null;
    return hh*60+mm+plus;
  }
  function dateFromText(v){
    const m=String(v||'').match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/);
    if(!m)return null;const [,d,mo,y]=m;
    const dt=new Date(Date.UTC(+y,+mo-1,+d));
    if(dt.getUTCFullYear()!==+y||dt.getUTCMonth()!==+mo-1||dt.getUTCDate()!==+d)return null;
    return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0');
  }
  const airportVN=new Set(['CXR','SGN','HAN','PQC','HPH','DAD','HUI','DLI','VII','VDH','VCA','UIH','VCS','VCL','BMV','VDO','THD','DIN','TBB','VKG','CAH','PXU','SQH','VKG','TQO']);
  function isDomestic(rt){
    const parts=route(rt).split('-');
    if(parts.length!==2||parts.some(p=>p.length!==3)||!parts.includes('CXR'))return null;
    return parts.every(p=>airportVN.has(p));
  }
  function pax(v){
    if(v===null||v===undefined||v==='')return null;
    const s=String(v).trim().replace(/,/g,'');
    return /^\d+$/.test(s)?Number(s):null; // TBA is unknown, never a numeric passenger count
  }
  const airline=n=>{const m=flight(n).match(/^([A-Z0-9]{2})(?=\d)/);return m?m[1]:null};
  function detect(rows){
    const title=String(rows?.[0]?.[0]||'').toUpperCase(),date=dateFromText(rows?.[1]?.[0]);
    const blocks=rows?.[2]||[];
    const start=blocks.findIndex(x=>/DEPARTURE\s*FLIGHT/i.test(String(x||'')));
    const isSags=title.includes('GROUND OPERATION')&&!!date&&String(blocks[0]||'').toUpperCase().includes('ARRIVAL FLIGHT')&&start>=7&&start<=11;
    return {isSags,service_date:date,depOffset:start,sheet:'LB'};
  }
  function parse(rows){
    const meta=detect(rows);
    if(!meta.isSags)throw Error('Không đúng mẫu LICH BAY SAGS · sheet LB. Vui lòng chọn mẫu được hỗ trợ.');
    const dep=meta.depOffset;
    const arrs=[],deps=[],issues=[];
    const seenArr=new Set(),seenDep=new Set();
    let otherData=0;
    for(let i=3;i<rows.length;i++){
      const row=rows[i]||[];
      for(const [which,start,out,seen] of [['ARR',0,arrs,seenArr],['DEP',dep,deps,seenDep]]){
        const no=flight(row[start+1]);if(!no)continue;
        if(!/^[A-Z0-9]{2,20}$/.test(no)){issues.push('Dòng '+(i+1)+' số hiệu '+which+' không hợp lệ.');continue}
        if(seen.has(no))throw Error('Trùng chuyến '+no+' trong danh sách '+which+' dòng '+(i+1));
        seen.add(no);
        const t=time(row[start+5]);if(t===null)throw Error('Thiếu hoặc sai giờ '+which+' của '+no+' ở dòng '+(i+1));
        const rt=route(row[start+4]);if(!rt.includes('CXR'))issues.push(no+': chặng bay không có CXR ('+rt+').');
        out.push({no,reg:reg(row[start+2]),rawReg:norm(row[start+2]),type:norm(row[start+3]),route:rt,
          t,pax:pax(row[start+6]),paxRaw:row[start+6]==null?'':String(row[start+6]).trim(),
          airline:airline(no),sheetRow:i+1,stand:null});
      }
    }
    if(arrs.length<1||deps.length<1)throw Error('Sheet LB chưa đủ chuyến đến hoặc chuyến đi.');
    const usedA=new Set(),usedD=new Set(),pairs=[];
    function link(i,j,method){
      const a=arrs[i],d=deps[j];usedA.add(i);usedD.add(j);
      const intA=isDomestic(a.route),intD=isDomestic(d.route);
      const intr=(intA===null||intD===null)?null:!(intA&&intD);
      pairs.push({arrival:a.no,departure:d.no,sta_min:a.t,std_min:d.t,bay:null,
        airline:a.airline||d.airline,aircraft_type:a.type||d.type||null,
        aircraft_reg:a.rawReg||d.rawReg||null,
        arrival_route:a.route,departure_route:d.route,arrival_pax:a.pax,departure_pax:d.pax,
        international:intr,match_method:method});
    }
    // Phase 1: exact registration, find the nearest subsequent available departure.
    const orderedA=arrs.map((a,i)=>i).sort((x,y)=>arrs[x].t-arrs[y].t);
    for(const i of orderedA){
      const a=arrs[i];if(!a.reg)continue;
      const c=deps.map((d,j)=>({d,j})).filter(x=>!usedD.has(x.j)&&x.d.reg&&a.reg===x.d.reg&&x.d.t>=a.t&&x.d.t-a.t<=900).sort((x,y)=>(x.d.t-a.t)-(y.d.t-a.t));
      if(c.length)link(i,c[0].j,'REG');
    }
    // Phase 2: for missing registration only, require unique airline + reversed route + realistic chronological order.
    let candidates=[];
    for(let i=0;i<arrs.length;i++){
      if(usedA.has(i)||arrs[i].reg)continue;
      const a=arrs[i],fromTo=a.route.split('-');
      if(fromTo.length!==2||fromTo[1]!=='CXR')continue;
      for(let j=0;j<deps.length;j++){
        if(usedD.has(j)||deps[j].reg)continue;
        const d=deps[j],back=d.route.split('-');
        if(a.airline!==d.airline||!a.airline||back.length!==2||back[0]!=='CXR'||back[1]!==fromTo[0])continue;
        if(d.t<a.t||d.t-a.t>600)continue;
        if(a.type&&d.type&&a.type!==d.type)continue;
        candidates.push([i,j]);
      }
    }
    for(const [i,j] of candidates){
      if(usedA.has(i)||usedD.has(j))continue;
      if(candidates.filter(x=>x[0]===i).length===1&&candidates.filter(x=>x[1]===j).length===1){
        link(i,j,'ROUTE_UNIQUE');
      }
    }
    for(let i=0;i<arrs.length;i++)if(!usedA.has(i)){
      const a=arrs[i],int=isDomestic(a.route);
      pairs.push({arrival:a.no,departure:null,sta_min:a.t,std_min:null,bay:null,
        airline:a.airline,aircraft_type:a.type||null,aircraft_reg:a.rawReg||null,
        arrival_route:a.route,departure_route:null,arrival_pax:a.pax,departure_pax:null,
        international:int===null?null:!int,match_method:'ARRIVAL_ONLY'});
      issues.push(a.no+': chưa tìm được chuyến đi tương ứng từ nguồn.');
    }
    for(let j=0;j<deps.length;j++)if(!usedD.has(j)){
      const d=deps[j],int=isDomestic(d.route);
      pairs.push({arrival:null,departure:d.no,sta_min:null,std_min:d.t,bay:null,
        airline:d.airline,aircraft_type:d.type||null,aircraft_reg:d.rawReg||null,
        arrival_route:null,departure_route:d.route,arrival_pax:null,departure_pax:d.pax,
        international:int===null?null:!int,match_method:'DEPARTURE_ONLY'});
      issues.push(d.no+': chuyến đi không có chuyến đến tương ứng trong lịch ngày này.');
    }
    // Calculate source-derived daily totals only when every source route can be classified.
    const domesticArr=arrs.filter(x=>isDomestic(x.route)===true).length;
    const domesticDep=deps.filter(x=>isDomestic(x.route)===true).length;
    const known=arrs.every(x=>isDomestic(x.route)!==null)&&deps.every(x=>isDomestic(x.route)!==null);
    const payload={service_date:meta.service_date,revision:1,
      source_sheet:'LB',arrival_count:arrs.length,departure_count:deps.length,
      domestic_count:known?domesticArr+domesticDep:null,
      international_count:known?arrs.length+deps.length-domesticArr-domesticDep:null,
      domestic_arrivals:known?domesticArr:null,domestic_departures:known?domesticDep:null,
      international_arrivals:known?arrs.length-domesticArr:null,
      international_departures:known?deps.length-domesticDep:null,
      flights:pairs,issues,
      source_detail:{arrivals:arrs.map(x=>({flight:x.no,row:x.sheetRow,pax_raw:x.paxRaw})),
        departures:deps.map(x=>({flight:x.no,row:x.sheetRow,pax_raw:x.paxRaw}))}};
    return {meta,arrivals:arrs,departures:deps,payload,stats:{
      arrival_count:arrs.length,departure_count:deps.length,
      matched_reg:pairs.filter(x=>x.match_method==='REG').length,
      matched_route:pairs.filter(x=>x.match_method==='ROUTE_UNIQUE').length,
      unmatched:pairs.filter(x=>x.match_method.endsWith('_ONLY')).length,
      total_records:pairs.length},issues};
  }
  const api={detect,parse,time,dateFromText,isDomestic};
  global.SagsSchedule=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);