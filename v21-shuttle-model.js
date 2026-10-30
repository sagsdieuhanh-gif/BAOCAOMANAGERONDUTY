/* v2.1 Shuttle direction, schedule defaults, and cross-midnight normalization */
(function(root){
 const defaults=[
  {direction:'NHA_CXR',departure_min:420,label:'07:00'},
  {direction:'NHA_CXR',departure_min:1050,label:'17:30'},
  {direction:'CXR_NHA',departure_min:990,label:'16:30'},
  {direction:'CXR_NHA',departure_min:1110,label:'18:30'},
  {direction:'CXR_NHA',departure_min:1935,label:'08:15 (+1)'}
 ];
 const directionLabel={NHA_CXR:'NHA → CXR · XE ĐI LÀM',CXR_NHA:'CXR → NHA · XE VỀ'};
 function clock(min){
  if(!Number.isInteger(min)||min<0||min>=2880)return '—';
  return String(Math.floor(min/60)%24).padStart(2,'0')+':'+String(min%60).padStart(2,'0')+(min>=1440?' (+1)':'');
 }
 function parseClock(value,dayAfter=false){
  const m=String(value??'').match(/^(\d{2}):(\d{2})$/);
  if(!m)return null;
  const hour=Number(m[1]),minute=Number(m[2]);
  if(hour>23||minute>59)return null;
  return hour*60+minute+(dayAfter?1440:0);
 }
 function isDefault(direction,minute){return defaults.some(x=>x.direction===direction&&x.departure_min===minute)}
 function order(records){return [...records].sort((a,b)=>
  (a.direction===b.direction?0:a.direction==='NHA_CXR'?-1:1)
  ||a.departure_min-b.departure_min);}
 root.SagsShuttleModel={defaults,directionLabel,clock,parseClock,isDefault,order};
})(typeof window!=='undefined'?window:globalThis);
