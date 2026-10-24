// Read-only adaptation of ORIGINAL E-Report RTDB assignment records.
// No new flightId, assignmentId, role or business record is generated here.
const S=v=>String(v??'').trim();
const U=v=>S(v).toUpperCase();
export const safeLegacyKey=v=>S(v).replace(/[.#$\[\]\/]/g,'_');
export const legacyUsername=v=>U(v).replace(/\s+/g,'').replace(/[^A-Z0-9._-]/g,'_').slice(0,40);

// Mirror the actual canonicalForm aliases used by E-Report's daily-roster module.
export function legacyFormCode(value){
 const g=U(value).replace(/[^A-Z0-9]/g,'');
 return ({
   FSAGS:'42.3',FSAGS423:'42.3',FSAGSCXR423:'42.3',
   FSAGS421:'42.1',FSAGSCXR421:'42.1',
   FSAGS551:'55.1',FSAGSCXR551:'55.1',
   FSAGS54:'54',FSAGSCXR54:'54',
   FSAGS94:'94',FSAGSCXR94:'94',CLCCHECKLIST:'94',FSAGS94CLC:'94',
   FSAGS208:'208',FSAGSCXR208:'208'
 })[g]||null;
}
// Read exactly the source scope authorized by RTDB: one personal mailbox/day or one
// AD manifest/day. Include OTHER assignments as flight evidence, but never pretend
// they are one of Lite's six editable forms.
export function legacyRosterItems(raw,date,username='',isAdmin=false){
 const target=legacyUsername(username),d=S(date),items=raw?.items&&typeof raw.items==='object'?raw.items:raw;
 return Object.entries(items||{}).flatMap(([key,item])=>{
  if(!item||typeof item!=='object'||Array.isArray(item)||item.active===false||item.duplicateInactive===true)return [];
  if(S(item.opDate||item.date)!==d)return [];
  const owner=legacyUsername(item.targetUser||item.user||item.ownerUser);
  if(!isAdmin&&(!target||owner!==target))return [];
  const assignmentId=S(item.assignmentId||key),flightId=S(item.flightId);
  if(!assignmentId||!flightId)return [];
  return [{...item,assignmentId,flightId,formCode:legacyFormCode(item.formGroup),owner}];
 });
}
export function rosterDiagnostics(raw,date,username='',isAdmin=false){
 const items=raw?.items&&typeof raw.items==='object'?raw.items:raw;
 const entries=Object.entries(items||{}).filter(([,v])=>v&&typeof v==='object'&&!Array.isArray(v));
 const day=entries.filter(([,v])=>S(v.opDate||v.date)===S(date));
 const active=day.filter(([,v])=>v.active!==false&&v.duplicateInactive!==true);
 const assigned=active.filter(([,v])=>isAdmin||legacyUsername(v.targetUser||v.user||v.ownerUser)===legacyUsername(username));
 const valid=assigned.filter(([key,v])=>S(v.assignmentId||key)&&S(v.flightId));
 return {raw:entries.length,day:day.length,active:active.length,assigned:assigned.length,valid:valid.length,
   sixForms:valid.filter(([,v])=>!!legacyFormCode(v.formGroup)).length,
   otherForms:valid.filter(([,v])=>!legacyFormCode(v.formGroup)).length,
   missingFlightId:assigned.length-valid.length};
}
export function groupLegacyRoster(items,date){
 const groups=new Map();
 for(const task of items){
  const fid=S(task.flightId),id=S(date)+'::'+fid;
  if(!fid)continue;
  if(!groups.has(id))groups.set(id,{id,legacyFlightId:fid,date:S(date),arrival:S(task.arrFlight),departure:S(task.depFlight),reg:S(task.acReg),route:S(task.route),sta:S(task.sta),std:S(task.std),etd:S(task.etd),tasks:[],legacy:true});
  const g=groups.get(id);g.tasks.push(task);
  for(const [k,v] of [['arrival',task.arrFlight],['departure',task.depFlight],['reg',task.acReg],['route',task.route],['sta',task.sta],['std',task.std],['etd',task.etd]])if(!g[k]&&S(v))g[k]=S(v);
 }
 return [...groups.values()].map(g=>({...g,tasks:g.tasks.sort((a,b)=>(a.formCode||'ZZ').localeCompare(b.formCode||'ZZ'))})).sort((a,b)=>(a.sta||a.std||'').localeCompare(b.sta||b.std||''));
}

// Admin-only, on-demand READ projection of the existing flight_records/{date}.
// The browser must be authorized by the ORIGINAL Realtime Database Rules.
// Never include passenger/form payloads in the summary or cache them locally.
export function projectLegacyFlightRecords(raw,date){
 return Object.entries(raw||{}).filter(([,r])=>r&&typeof r==='object'&&!Array.isArray(r)).map(([key,rec])=>{
  const fid=S(rec.flightId||key),a=S(rec.arrFlight),d=S(rec.depFlight);
  const docs=Object.keys(rec.documents||{}),modules=Object.keys(rec.modules||{});
  return {flightId:fid,date:S(date),arrival:a,departure:d,
   label:S(rec.flightName||rec.flightRaw||[a,d].filter(Boolean).join(' / ')||fid),
   acReg:S(rec.acReg||rec.acRegn),status:S(rec.rosterStatus),
   rosterActive:rec.rosterActive!==false,documents:docs,modules,
   has208:docs.includes('FSAGS208')||modules.includes('FSAGS208')};
 }).sort((a,b)=>a.label.localeCompare(b.label,'vi'));
}