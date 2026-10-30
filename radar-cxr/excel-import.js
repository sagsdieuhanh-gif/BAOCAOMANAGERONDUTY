/* SAGS-CXR Radar V1.7 – standalone Excel import / change comparison */
(function(root){
  const RadarExcelImport=(function makeCore(){
  const fields=["arrival","departure","sta","std","bay","airline","aircraft_type","aircraft_reg","cargo_status"];
  const labels={arrival:"Chuyến đến",departure:"Chuyến đi",sta:"STA",std:"STD",bay:"Bãi đỗ",airline:"Hãng",aircraft_type:"Loại tàu",aircraft_reg:"Đăng bạ",cargo_status:"Cargo"};
  const synonyms={
    arrival:["arrival","arr flight","arr flight no","arrflt","flt arr","flight arr","chuyen den","so hieu den","ma chuyen den","inbound","arriving flight","arr no"],
    departure:["departure","dep flight","dep flight no","depflt","flt dep","flight dep","chuyen di","so hieu di","ma chuyen di","outbound","departing flight","dep no"],
    sta:["sta","scheduled arrival","gio den","gio ha canh","arr time","arrival time","sta lt"],
    std:["std","scheduled departure","gio di","gio cat canh","dep time","departure time","std lt"],
    bay:["bay","stand","parking stand","gate stand","vi tri do","vi tri","vtd","vi tri do tau","bai do"],
    airline:["airline","carrier","hang","hang bay","ma hang","hang hk"],
    aircraft_type:["aircraft type","aircrafttype","ac type","a c type","loai tau","loai may bay","type","ac"],
    aircraft_reg:["aircraft reg","ac reg","registration","reg","dang ba","so dang ba","ac registration"],
    cargo_status:["cargo","cargo status","co hang","hang hoa","tinh trang hang"]
  };
  const norm=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[đĐ]/g,"d").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
  const keyForHeader=x=>{const s=norm(x);if(!s)return null;for(const k of fields)if(synonyms[k].some(t=>norm(t)===s))return k;return null};
  function guess(rows){
    let best={index:0,score:-1,columns:{}};
    (rows||[]).slice(0,30).forEach((row,i)=>{
      let columns={},score=0;
      (row||[]).forEach((cell,j)=>{let k=keyForHeader(cell);if(k&&columns[k]===undefined){columns[k]=j;score+=(["arrival","departure","sta","std","bay"].includes(k)?2:1)}});
      if(score>best.score)best={index:i,score,columns};
    });
    return best;
  }
  const numberToTime=x=>{const m=Math.round(x*1440);return String(Math.floor(m/60)%24).padStart(2,"0")+":"+String(m%60).padStart(2,"0")};
  function time(x){
    if(x===null||x===undefined||x==="")return "";
    if(typeof x==="number"){
      if(x>=0&&x<1)return numberToTime(x);
      if(x>30000&&x<100000)return numberToTime(x-Math.floor(x));
      x=String(x);
    }
    let s=String(x).trim().replace(/\s+/g," ");
    if(!s)return "";
    if(/^\d{3,4}$/.test(s)){const t=s.padStart(4,"0");s=t.slice(0,2)+":"+t.slice(2);}
    const m=s.match(/(?:^|[\sT])(\d{1,2}):(\d{2})(?::\d{2})?\s*(\+|next day|\+1)?\s*$/i);
    if(!m)return s;
    const hh=Number(m[1]),mm=Number(m[2]);
    if(hh>23||mm>59)return s;
    return String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0")+(m[3]?"+":"");
  }
  function flight(x){return String(x??"").trim().toUpperCase().replace(/\s+/g,"").replace(/[–—]/g,"-")}
  function bay(x){let s=String(x??"").trim();if(!s||/^(-|tba|n\/a|chua co)$/i.test(s))return "";if(/^\d+(\.0+)?$/.test(s))return String(Number(s));return s;}
  function parse(rows,mapping,headerIndex){
    const records=[],issues=[],keys=new Set();let ignored=0;
    if(mapping.arrival===undefined&&mapping.departure===undefined)return {records,issues:["Chưa chọn cột số hiệu chuyến đến hoặc chuyến đi."],ignored:0};
    for(let i=headerIndex+1;i<rows.length;i++){
      const row=rows[i]||[];
      if(!row.some(c=>String(c??"").trim()))continue;
      const read=k=>mapping[k]===undefined?"":row[mapping[k]];
      const arr=flight(read("arrival")),dep=flight(read("departure"));
      if(!arr&&!dep){ignored++;continue}
      let r={
        arrival:arr,departure:dep,sta:time(read("sta")),std:time(read("std")),bay:bay(read("bay")),
        airline:String(read("airline")??"").trim().toUpperCase(),aircraft_type:String(read("aircraft_type")??"").trim().toUpperCase(),
        aircraft_reg:String(read("aircraft_reg")??"").trim().toUpperCase(),cargo_status:"UNKNOWN"
      };
      let rawCargo=norm(read("cargo_status"));
      if(["cargo","yes","co","co cargo","co hang"].includes(rawCargo))r.cargo_status="CARGO";
      if(["no cargo","none","khong","khong hang"].includes(rawCargo))r.cargo_status="NO_CARGO";
      const id=arr+"|"+dep;
      if(keys.has(id)){issues.push("Excel dòng "+(i+1)+": trùng cặp "+(arr||"—")+"/"+(dep||"—")+"; không tự gộp.");continue}
      keys.add(id);
      if(arr&&!r.sta)issues.push("Excel dòng "+(i+1)+" thiếu STA của "+arr);
      if(dep&&!r.std)issues.push("Excel dòng "+(i+1)+" thiếu STD của "+dep);
      records.push(r);
    }
    if(ignored)issues.push("Bỏ qua "+ignored+" dòng không có cột số hiệu chuyến; kiểm tra nếu file là danh sách chuyến đến/đi tách dòng.");
    if(!records.length)issues.push("Không nhận được cặp/chuyến nào. Hãy kiểm tra sheet, hàng tiêu đề và ánh xạ cột.");
    return {records,issues,ignored};
  }
  function comparable(x){return {
    arrival:flight(x.arrival),departure:flight(x.departure),
    sta:time(x.sta!==undefined?x.sta:(x.sta_min==null?"":numberToTime(x.sta_min/1440))),std:time(x.std!==undefined?x.std:(x.std_min==null?"":numberToTime(x.std_min/1440))),
    bay:bay(x.bay),airline:String(x.airline??"").trim().toUpperCase(),
    aircraft_type:String(x.aircraft_type??"").trim().toUpperCase(),aircraft_reg:String(x.aircraft_reg??"").trim().toUpperCase()
  }}
  function compare(current,baseline){
    let before=new Map((baseline||[]).map(x=>{let o=comparable(x);return [o.arrival+"|"+o.departure,o]}));
    let after=new Map((current||[]).map(x=>{let o=comparable(x);return [o.arrival+"|"+o.departure,o]}));
    let added=[],changed=[],missing=[],unchanged=0;
    for(const [id,now] of after){
      const old=before.get(id);
      if(!old){added.push({flight:id,now});continue}
      const diffs=[];
      for(const field of ["sta","std","bay","airline","aircraft_type","aircraft_reg"]){
        if(!now[field])continue; // blank optional Excel cell never erases known source value
        if(now[field]!==old[field])diffs.push({field,old:old[field]||"—",now:now[field]});
      }
      if(diffs.length)changed.push({flight:id,diffs});else unchanged++;
    }
    for(const [id,old] of before)if(!after.has(id))missing.push({flight:id,old});
    return {added,changed,missing,unchanged,sourceCount:baseline?.length||0,targetCount:current?.length||0};
  }
  return {fields,labels,norm,guess,parse,compare,time};
})();
  if(typeof module!=='undefined'&&module.exports)module.exports=RadarExcelImport;
  root.RadarExcelImport=RadarExcelImport;
})(typeof window!=='undefined'?window:globalThis);
