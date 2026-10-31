'use strict';
/* V2.31 – A short, minimum per-flight service profile. This is an operational
 * reference for planning, not a replacement for WI/SLA staffing requirements.
 * Examples are NEVER saved without an explicit confirmation click. */
(function(root){
  const UNITS={DH:'Điều hành',PVHK:'Phục vụ hành khách',KTS:'Phục vụ sân đỗ / bốc xếp',KHO:'Kho hàng'};
  const ITEMS={
    DH:[{section:'Điều phối chuyến bay',key:'co_loading',label:'CO kiêm Loading (người/chuyến)',hint:'Chỉ 1 người thực hiện hai nhiệm vụ nếu được phân công đủ năng định'}],
    PVHK:[
      {section:'Làm thủ tục',key:'checkin_counters',label:'Quầy check-in cho mỗi nhóm chuyến',hint:'Ví dụ VJ thân hẹp: 3 quầy'},
      {section:'Làm thủ tục',key:'shared_checkin_flights',label:'Số chuyến dùng chung nhóm quầy',hint:'2 = chuyến 1–2 dùng chung 3 quầy; chuyến 3 cần thêm 3 quầy (chỉ khi đủ điều kiện chia sẻ)'},
      {section:'Làm thủ tục',key:'skyboard_desks',label:'Quầy Skyboard dùng chung',hint:'Tính một lần khi nhóm chuyến đang làm thủ tục'},
      {section:'Boarding',key:'gate_reader',label:'Nhân viên kiểm soát tại gate',hint:'Kiểm tra thẻ, kiểm soát hành khách'},
      {section:'Boarding',key:'busgate_staff',label:'Nhân viên tại bus gate',hint:'Phục vụ gọi và điều phối khách lên xe'},
      {section:'Boarding – tàu đỗ bãi',key:'busgate_ground',label:'Nhân viên phía dưới bus gate',hint:'Chỉ tính khi chuyến đỗ bãi dùng xe'},
      {section:'Boarding – tàu đỗ bãi',key:'stairs_front',label:'Kiểm soát khách tại thang trước',hint:'Chỉ tính khi tàu đỗ bãi có thang trước'},
      {section:'Boarding – tàu đỗ bãi',key:'stairs_rear',label:'Kiểm soát khách tại thang sau',hint:'Chỉ tính khi tàu đỗ bãi có thang sau'}
    ],
    KTS:[
      {section:'Lái xe phục vụ',key:'tractor_driver',label:'Lái xe đầu kéo',hint:'1 người/chuyến theo gợi ý'},
      {section:'Lái xe phục vụ',key:'belt_driver',label:'Lái xe băng chuyền',hint:'1 người/chuyến theo gợi ý'},
      {section:'Bốc xếp hành lý',key:'hold_workers',label:'Bốc xếp trong hầm hàng',hint:'3 người/chuyến theo gợi ý'},
      {section:'Bốc xếp hành lý',key:'ground_workers',label:'Bốc xếp dưới sân',hint:'1 người cùng lái xe hỗ trợ, không tính trùng lái xe'}
    ],
    KHO:[{section:'Kho hàng',key:'cargo_team',label:'Nhân viên phục vụ hàng tối thiểu/chuyến có hàng',hint:'Chỉ nhập sau khi Kho hàng xác nhận định mức'}]
  };
  const SAMPLE={
    DH:{co_loading:1},
    PVHK:{checkin_counters:3,shared_checkin_flights:2,skyboard_desks:1,
      gate_reader:2,busgate_staff:2,busgate_ground:1,stairs_front:1,stairs_rear:1},
    KTS:{tractor_driver:1,belt_driver:1,hold_workers:3,ground_workers:1}
  };
  const $=id=>document.getElementById(id);
  const esc=x=>String(x??'').replace(/[&<>"']/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[a]));
  const quantity=v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:/^\d+$/.test(String(v??'').trim())?Number(v):null;
  const htime=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
  const role=()=>typeof unit==='undefined'?null:unit;
  const db=()=>typeof sb==='undefined'?null:sb;
  const actor=()=>typeof me==='undefined'?null:me;
  const permitted=u=>['DH','ADMIN'].includes(role())||role()===u;
  const carrier=f=>String(f?.airline||f?.carrier||String(f?.departure||f?.arrival||f?.no||'').match(/^(?:##)?([A-Z0-9]{2,3})\d/)?.[1]||'').trim().toUpperCase();
  let mounted=false,lastSignature='',active=false,profiles=[],airlines=[],draft={},saving=false;
  const narrow=f=>{const s=String(f?.aircraft_type||f?.type||'').toUpperCase();
    if(/A3(30|40|50|80)|B?7(47|67|77|87)|B?777|B?787|B?767/.test(s))return 'WIDE';
    if(/A(318|319|320|321|220)|B?7(17|27|37|57)|ATR|AT[47]|E(170|175|190|195)|DH[8C]|DHC|C919/.test(s))return 'NARROW';
    return null;
  };
  function mount(){
    if(mounted||!actor()||!['DH','ADMIN','PVHK','KTS','KHO'].includes(role()))return;
    const target=$('tab-norms');if(!target)return;
    target.innerHTML='<div class="panel" id="minServicePanel">'+
      '<h2>ĐỊNH MỨC PHỤC VỤ TỐI THIỂU / 1 CHUYẾN BAY</h2>'+
      '<p class="note">Chọn hãng, loại tàu và nhập số tối thiểu cho từng công đoạn. Định mức nhập một lần, không cần nhập quân số sáng/đêm ở đây. Đây là mức phục vụ tối thiểu để dự báo, <b>không thay thế hướng dẫn công việc hoặc thỏa thuận hãng</b>.</p>'+
      '<div class="formrow"><label>Hãng hàng không<select id="minServiceAirline"></select></label>'+
      '<label>Loại tàu<select id="minServiceGroup"><option value="NARROW">Thân hẹp</option><option value="WIDE">Thân rộng</option></select></label>'+
      '<label>Đơn vị<select id="minServiceUnit"></select></label></div>'+
      '<div id="minServiceFields"></div>'+
      '<div class="btnbar"><button type="button" id="minServiceExample">ĐIỀN MẪU GỢI Ý VJ THÂN HẸP (CHƯA LƯU)</button>'+
      '<button type="button" id="minServiceSave" class="primary">LƯU ĐỊNH MỨC TỐI THIỂU</button></div>'+
      '<p class="note" id="minServiceStatus" role="status">Các ô trống chưa được xác nhận; giá trị gợi ý chưa phải định mức đã duyệt.</p></div>';
    $('minServiceAirline').onchange=render;
    $('minServiceGroup').onchange=render;
    $('minServiceUnit').onchange=render;
    $('minServiceExample').onclick=example;
    $('minServiceSave').onclick=save;
    mounted=true;
  }
  const key=()=>[$('minServiceAirline')?.value,$('minServiceGroup')?.value,$('minServiceUnit')?.value].join('|');
  function readDraft(){
    const fields={};
    $('minServiceFields')?.querySelectorAll('[data-min-key]').forEach(el=>{fields[el.dataset.minKey]=el.value});
    if(key().replace(/\|/g,''))draft[key()]=fields;
  }
  function render(){
    if(!mounted)return;
    const [airline,group,unitName]=key().split('|'),record=profiles.find(x=>x.airline===airline&&x.aircraft_group===group&&x.unit===unitName);
    const d=draft[key()]||record?.norm||{};
    const items=ITEMS[unitName]||[];
    const parts=[];
    let sec='';
    for(const item of items){
      if(item.section!==sec){sec=item.section;parts.push('<h3>'+esc(sec)+'</h3>')}
      const candidate=airline==='VJ'&&group==='NARROW'?SAMPLE[unitName]?.[item.key]:undefined;
      const val=d[item.key]??'';
      parts.push('<label style="display:block;margin:8px 0">'+esc(item.label)+
        '<input data-min-key="'+esc(item.key)+'" type="number" inputmode="numeric" min="0" max="100" style="width:115px;max-width:100%;margin-left:10px" value="'+esc(val)+'" placeholder="'+esc(candidate??'—')+'">'+
        '<span class="note" style="display:block">'+esc(item.hint)+'</span></label>');
    }
    $('minServiceFields').innerHTML=parts.join('')||'<p class="note">Chưa có danh sách công đoạn.</p>';
    $('minServiceExample').hidden=airline!=='VJ'||group!=='NARROW'||!SAMPLE[unitName];
    $('minServiceStatus').textContent=record?'Đã có định mức đã lưu. Có thể chỉnh rồi LƯU lại.':'Chưa lưu định mức cho hãng/loại tàu/đơn vị này.';
  }
  function updateSelectors(){
    const list=airlines.length?airlines:['VJ'];
    const current=$('minServiceAirline').value;
    $('minServiceAirline').innerHTML=list.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
    $('minServiceAirline').value=list.includes(current)?current:(list.includes('VJ')?'VJ':list[0]);
    const units=permitted('DH')?Object.keys(UNITS):[role()];
    const prev=$('minServiceUnit').value;
    $('minServiceUnit').innerHTML=units.map(x=>'<option value="'+esc(x)+'">'+esc(UNITS[x])+'</option>').join('');
    $('minServiceUnit').value=units.includes(prev)?prev:units[0];
  }
  async function refresh(tab){
    mount();if(!mounted||!actor()||!db()||tab&&tab!=='norms'||saving)return;
    if($('minServiceFields')?.querySelector(':focus'))return;
    active=true;
    try{
      const day=$('day')?.value;
      const [rules,s2,s1]=await Promise.all([
        db().from('ops_minimum_service_norms').select('*'),
        db().from('ops_forecast_snapshots').select('payload').eq('service_date',day).eq('revision',2).maybeSingle(),
        db().from('ops_forecast_snapshots').select('payload').eq('service_date',day).eq('revision',1).maybeSingle()
      ]);
      const err=rules.error||s2.error||s1.error;if(err)throw Error(err.message);
      profiles=rules.data||[];
      const fl=[...((s2.data?.payload||s1.data?.payload)?.source_detail?.departures||[]),
        ...((s2.data?.payload||s1.data?.payload)?.flights||[])];
      airlines=[...new Set(['VJ',...fl.map(carrier),...profiles.map(x=>x.airline)].filter(Boolean))].sort();
      updateSelectors();render();
    }catch(e){$('minServiceStatus').textContent='KHÔNG TẢI ĐƯỢC: '+e.message}
    finally{active=false;}
  }
  function example(){
    readDraft();
    const unitName=$('minServiceUnit').value;
    const example=SAMPLE[unitName];if(!example)return;
    draft[key()]={...example};render();
    $('minServiceStatus').textContent='Đã điền mẫu gợi ý để đối chiếu. Chưa lưu vào hệ thống và chưa dùng làm kết luận.';
  }
  async function save(){
    if(saving||active||!actor()||!db())return;
    const [airline,group,unitName]=key().split('|');
    if(!permitted(unitName)||!/^[A-Z0-9]{2,3}$/.test(airline))return;
    const data={},missing=[];
    for(const item of ITEMS[unitName]||[]){
      const node=$('minServiceFields').querySelector('[data-min-key="'+item.key+'"]');
      const val=node?.value.trim()||'';
      if(!val){missing.push(item.label);continue;}
      const n=quantity(val);
      if(n==null||n>100||item.key==='shared_checkin_flights'&&n<1){
        $('minServiceStatus').textContent='Sai số lượng tại mục '+item.label+'.';return;
      }
      data[item.key]=n;
    }
    if(missing.length){
      $('minServiceStatus').textContent='Chưa lưu: cần xác nhận đủ '+missing.length+' công đoạn. Trường hợp không dùng phải nhập 0, không tự bỏ qua.';
      return;
    }
    saving=true;$('minServiceSave').disabled=true;
    try{
      const payload={airline,aircraft_group:group,unit:unitName,norm:data,
        confirmed_by:actor().id,confirmed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
      const result=await db().from('ops_minimum_service_norms').upsert(payload,{onConflict:'airline,aircraft_group,unit'});
      if(result.error)throw Error(result.error.message);
      delete draft[key()];
      const index=profiles.findIndex(x=>x.airline===airline&&x.aircraft_group===group&&x.unit===unitName);
      if(index>=0)profiles[index]=payload;else profiles.push(payload);
      render();
      $('minServiceStatus').textContent='ĐÃ LƯU định mức '+airline+' / '+(group==='NARROW'?'thân hẹp':'thân rộng')+
        ' / '+UNITS[unitName]+'. Các ngày tiếp theo sử dụng lại.';
    }catch(e){$('minServiceStatus').textContent='CHƯA LƯU: '+e.message}
    finally{saving=false;$('minServiceSave').disabled=false}
  }
  /* Strictly source-grounded resource demand; only project confirmed timings.
     Check-in share rule: 1–2 simultaneous flights use 1 bank of counters, 3–4 use 2.
     It is a configurable minimum arrangement, not a guarantee that counters can
     actually be shared. Boarding staff are not counted without real boarding times. */
  function assess({pairs=[],sourcePayload=null,profiles:all=[],staff=[]}={}){
    const departures=sourcePayload?.source_detail?.departures||[];
    const rules=new Map(all.filter(r=>r.confirmed_by).map(r=>[r.airline+'|'+r.aircraft_group+'|'+r.unit,r.norm||{}]));
    const events=[];
    for(const d of departures){
      if(d.ferry||!Number.isFinite(d.t))continue;
      const group=narrow(d),code=carrier(d),ky=code+'|'+group;
      if(!group)continue;
      events.push({code,group,d,ky});
    }
    const spans=Array.from({length:96},(_,i)=>i*30);
    const notes=[],gaps=[];
    for(const t of spans){
      const checking=new Map();
      for(const e of events){
        const x=e.d, open=x.checkin_open,close=x.checkin_close;
        if(!Number.isFinite(open)||!Number.isFinite(close)||!(t<close&&t+30>open))continue;
        if(!checking.has(e.ky))checking.set(e.ky,[]);checking.get(e.ky).push(e);
      }
      for(const [ky,flights] of checking){
        const first=flights[0],n=rules.get(ky+'|PVHK');
        if(!n||quantity(n.checkin_counters)==null||quantity(n.shared_checkin_flights)==null){
          gaps.push('Chưa có định mức quầy '+ky);continue;
        }
        const share=Math.max(1,quantity(n.shared_checkin_flights));
        const counterBanks=Math.ceil(flights.length/share);
        const counters=counterBanks*quantity(n.checkin_counters),sky=quantity(n.skyboard_desks);
        if(flights.length>=2)notes.push({
          topic:3,slot:htime(t)+'–'+htime(t+30),count:flights.length,
          flight:flights.map(x=>x.d.no).join(', '),
          text:'Quầy '+ky.replace('|',' / ')+': '+flights.length+' chuyến chồng giờ làm thủ tục, cần tối thiểu '+
            counters+' quầy check-in theo phương án chia sẻ đã nhập'+
            (sky!=null?', '+sky+' quầy Skyboard dùng chung':'')+
            '; xác nhận việc chia sẻ quầy thực tế trước khi bố trí.'
        });
      }
    }
    const best=notes.sort((a,b)=>b.count-a.count||a.slot.localeCompare(b.slot));
    return {notes:best.slice(0,2),pending:[...new Set(gaps)].slice(0,3)};
  }
  root.SagsMinimumV231={mount,refresh,assess,ITEMS,SAMPLE};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.SagsMinimumV231;
})(typeof window!=='undefined'?window:globalThis);