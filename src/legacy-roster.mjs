// Read-only projection of the existing E-Report roster. No new flight IDs, assignments or writes.
const S=v=>String(v??'').trim();
const U=v=>S(v).toUpperCase();
export const safeLegacyKey=v=>S(v).replace(/[.#$\[\]\/]/g,'_');
export const legacyFormCode=v=>{
 const g=U(v).replace(/[^A-Z0-9]/g,'');
 return ({FSAGS421:'42.1',FSAGS423:'42.3',FSAGS551:'55.1',FSAGS54:'54',FSAGS94:'94',CLC_CHECKLIST:'94',CLCCHECKLIST:'94',FSAGS94CLC:'94',FSAGS208:'208'})[g]||null;
};
export function legacyRosterItems(raw,date,username='',isAdmin=false){
 const user=U(username);const entries=Object.entries(raw||{});
 return entries.flatMap(([key,item])=>{
  if(!item||typeof item!=='object'||Array.isArray(item))return [];
  const group=legacyFormCode(item.formGroup);
  if(!group||item.active===false||item.duplicateInactive===true||S(item.opDate||item.date)!==S(date))return [];
  const owner=U(item.targetUser||item.user||item.ownerUser);
  if(!isAdmin&&(!user||owner!==user))return [];
  const aid=S(item.assignmentId||key),fid=S(item.flightId);
  if(!aid||!fid)return [];
  return [{...item,assignmentId:aid,flightId:fid,formCode:group,owner}];
 });
}
export function groupLegacyRoster(items,date){
 const groups=new Map();
 for(const task of items){
  // Original E-Report flightId remains the authoritative identifier.
  const fid=S(task.flightId),id=S(date)+'::'+fid;
  if(!groups.has(id))groups.set(id,{id,legacyFlightId:fid,date:S(date),arrival:S(task.arrFlight),departure:S(task.depFlight),reg:S(task.acReg),route:S(task.route),sta:S(task.sta),std:S(task.std),etd:S(task.etd),tasks:[],legacy:true});
  const g=groups.get(id);g.tasks.push(task);
  for(const [k,v] of [['arrival',task.arrFlight],['departure',task.depFlight],['reg',task.acReg],['route',task.route],['sta',task.sta],['std',task.std],['etd',task.etd]])if(!g[k]&&S(v))g[k]=S(v);
 }
 return [...groups.values()].map(g=>({...g,tasks:g.tasks.sort((a,b)=>a.formCode.localeCompare(b.formCode))})).sort((a,b)=>(a.sta||a.std||'').localeCompare(b.sta||b.std||''));
}