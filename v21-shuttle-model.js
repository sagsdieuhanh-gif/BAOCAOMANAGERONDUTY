/* v2.1 Shuttle direction, schedule defaults, and cross-midnight normalization */
(function(root){
 const defaults=[
  {direction:'NHA_CXR',departure_min:420,label:'07:00'},
  {direction:'NHA_CXR',departure_min:1050,label:'17:30'},
  {direction:'NHA_CXR',departure_min:1170,label:'19:30'},
  {direction:'CXR_NHA',departure_min:990,label:'16:30'},
  {direction:'CXR_NHA',departure_min:1110,label:'18:30'},
  {direction:'CXR_NHA',departure_min:1560,label:'02:00'},
  {direction:'CXR_NHA',departure_min:1935,label:'08:15'}
 ];
 const directionLabel={NHA_CXR:'NHA → CXR · XE ĐI LÀM',CXR_NHA:'CXR → NHA · XE VỀ'};
 function clock(min){
  if(!Number.isInteger(min)||min<0||min>=2880)return '—';
  const wall=String(Math.floor(min/60)%24).padStart(2,'0')+':'+String(min%60).padStart(2,'0');
  // Official route times are presented as HH:MM only. Preserve their stored
  // 24h offset for the service day and backend; do not leak (+1) into UI.
  if(defaults.some(x=>x.departure_min===min))return wall;
  return wall+(min>=1440?' (+1)':'');
 }
 function parseClock(value,dayAfter=false){
  const m=String(value??'').match(/^(\d{2}):(\d{2})$/);
  if(!m)return null;
  const hour=Number(m[1]),minute=Number(m[2]);
  if(hour>23||minute>59)return null;
  return hour*60+minute+(dayAfter?1440:0);
 }
 function suggestVehicles(rawCount){
  const people=Number(rawCount);
  if(!Number.isSafeInteger(people)||people<0||people>5000) return null;
  if(people===0)return {people,seats:0,spare:0,count:0,n29:0,n45:0,
    units:[],short:'KHÔNG CẦN XE',label:'KHÔNG CẦN XE',details:'0 người'};
  let best=null;
  for(let n45=0;n45<=Math.ceil(people/45);n45++){
   for(let n29=0;n29<=Math.ceil(people/29);n29++){
    const count=n45+n29,seats=45*n45+29*n29,spare=seats-people;
    if(!count||spare<0)continue;
    if(!best||count<best.count||count===best.count&&spare<best.spare||
       count===best.count&&spare===best.spare&&n45>best.n45){
      best={people,count,seats,spare,n29,n45};
    }
   }
  }
  const units=[...(best.n45?[{seats:45,quantity:best.n45}]:[]),
    ...(best.n29?[{seats:29,quantity:best.n29}]:[])];
  const combo=units.map(x=>(x.quantity>1?x.quantity+'×':'')+x.seats+'C').join(' + ');
  return {...best,units,short:combo,
    label:best.count===1?(best.n29?'29 CHỖ':'45 CHỖ'):best.count+' XE: '+combo,
    details:best.seats+' ghế · dư '+best.spare+' ghế'};
 }
 function isDefault(direction,minute){return defaults.some(x=>x.direction===direction&&x.departure_min===minute)}
 // Sort by clock time shown to staff; database keeps original cross-day
 // minute keys. 10:00 → 11:00 → 16:30. 02:00 → 08:15 → 16:30 → 18:30.
 function compareSlots(a,b){
  const directions={NHA_CXR:0,CXR_NHA:1};
  const dir=(directions[a.direction]??2)-(directions[b.direction]??2);
  if(dir)return dir;
  const time=(Number(a.departure_min)%1440)-(Number(b.departure_min)%1440);
  if(time)return time;
  // At the same clock time show the main/base row before a next-day repeat,
  // followed by the extra vehicle rows in their persisted line order.
  const day=Math.floor(Number(a.departure_min)/1440)-Math.floor(Number(b.departure_min)/1440);
  if(day)return day;
  return Number(a.line_no||0)-Number(b.line_no||0);
 }
 function order(records){return [...records].sort(compareSlots);}
 root.SagsShuttleModel={defaults,directionLabel,clock,parseClock,isDefault,compareSlots,order,suggestVehicles};
})(typeof window!=='undefined'?window:globalThis);
