export const FORM_IDS=['fsags421','fsags423','fsags551','fsags54','fsags94','fsags208'];
export const FORM_LABELS={fsags421:'42.1',fsags423:'42.3',fsags551:'55.1',fsags54:'54',fsags94:'94',fsags208:'208'};
export const ROLE_NAMES={AD:'Quản trị viên',DH:'Điều hành',CBTT:'CBTT',VIEWER:'Chỉ xem'};
export const CATEGORY_OPTIONS=['APU INOP','HOLD INOP/ISSUES','SEAT INOP','OTHERS'];
export const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const norm=(s)=>String(s??'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export const flightToken=s=>norm(s).replace(/[^A-Z0-9]/g,'');
export function localToday(t=new Date()){return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`}
export function normalizeClock(s){let v=String(s||'').trim().replace(':','');if(!/^\d{4}$/.test(v))return '';const h=+v.slice(0,2),m=+v.slice(2);return h<24&&m<60?`${v.slice(0,2)}:${v.slice(2)}`:''}
export function atClock(date,clock){const c=normalizeClock(clock);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!c)return null;const [yy,mo,dd]=date.split('-').map(Number),[h,m]=c.split(':').map(Number);const d=new Date(yy,mo-1,dd,h,m,0,0);return d.getFullYear()===yy&&d.getMonth()===mo-1&&d.getDate()===dd?d.getTime():null}
export function cleanFlight(input){const date=String(input.date||'').trim(),arrival=flightToken(input.arrival),departure=flightToken(input.departure),reg=flightToken(input.reg),route=norm(input.route).replace(/[^A-Z0-9\-]/g,'');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!atClock(date,'12:00'))throw Error('Ngày khai thác không hợp lệ');if(!arrival&&!departure)throw Error('Cần có số hiệu chuyến đến hoặc chuyến đi');return{date,arrival,departure,reg,route,sta:normalizeClock(input.sta),std:normalizeClock(input.std),etd:normalizeClock(input.etd),pushback:!!input.pushback}}
export function flightId(f){const v=cleanFlight(f);return `${v.date}_${v.arrival||'NA'}_${v.departure||'NA'}`}
export const canEdit=(role)=>role==='AD'||role==='DH';
export const canManage=(role)=>role==='AD';
export function normalLimit(x={}){return{id:String(x.id||`ACL_${Date.now()}_${Math.random().toString(36).slice(2,9)}`),source:'MANUAL',active:x.active!==false,airline:flightToken(x.airline),flightNo:flightToken(x.flightNo),acReg:flightToken(x.acReg),displayReg:norm(x.displayReg||x.acReg),matchMode:['BOTH','FLIGHT','REG'].includes(x.matchMode)?x.matchMode:(x.flightNo&&x.acReg?'BOTH':x.flightNo?'FLIGHT':'REG'),category:CATEGORY_OPTIONS.includes(norm(x.category))?norm(x.category):'OTHERS',restriction:String(x.restriction||'').trim(),effectiveFrom:String(x.effectiveFrom||''),effectiveTo:String(x.effectiveTo||''),batchDate:String(x.batchDate||''),batchVersion:String(x.batchVersion||''),recipientRoles:[...new Set((x.recipientRoles||['DH','CBTT']).map(norm))],createdAtMs:Number(x.createdAtMs||Date.now()),updatedAtMs:Number(x.updatedAtMs||Date.now()),createdBy:x.createdBy||null,updatedBy:x.updatedBy||null}}
export function limitMatches(item,flight,date=flight.date){let x=normalLimit(item);if(!x.active||!x.restriction||date<x.effectiveFrom&&x.effectiveFrom||x.effectiveTo&&date>x.effectiveTo)return false;const fs=[flight.arrival,flight.departure].map(flightToken);const fm=Boolean(x.flightNo&&fs.includes(x.flightNo));const rm=Boolean(x.acReg&&x.acReg===flightToken(flight.reg));return x.matchMode==='BOTH'?fm&&rm:x.matchMode==='FLIGHT'?fm:rm}
export function isAsu(item){return /(^|[^A-Z])ASU([^A-Z]|$)/i.test(String(item.restriction||''))}
export function limitDue(item,flight){const asu=isAsu(item);const clock=asu?(flight.etd||flight.std):flight.sta;let ms=atClock(flight.date,clock);if(ms===null)return null;const sta=atClock(flight.date,flight.sta);if(asu&&sta!==null&&ms+12*3600000<sta)ms+=86400000;return{kind:asu?'ASU':'GENERAL',event:asu?(flight.etd?'ETD':'STD'):'STA',clock,due:ms-600000}}
export function eligibleAlerts(catalog,flights,role,now=Date.now()){let out=[];for(const flight of flights){if(flight.pushback)continue;let matches=(catalog.items||[]).filter(x=>limitMatches(x,flight)&&(x.recipientRoles||[]).map(norm).includes(norm(role)));for(const kind of ['GENERAL','ASU']){const items=matches.filter(x=>(isAsu(x)?'ASU':'GENERAL')===kind);if(!items.length)continue;const tm=limitDue(items[0],flight);if(!tm||now<tm.due)continue;const signature=items.map(x=>`${x.id}:${Number(x.updatedAtMs)||0}:${x.restriction}`).sort().join('|');const key=`${flightId(flight)}|${kind}|${tm.event}|${signature}`;out.push({flight,items,tm,key})}}return out}
export function quickLimit(s){const arr=String(s||'').trim().split(/\s+/);if(arr.length<3)throw Error('Nhập đủ Flight No, A/C Reg và nội dung hạn chế');const flightNo=flightToken(arr.shift()),acReg=flightToken(arr.shift());if(!flightNo||!acReg)throw Error('Số hiệu hoặc đăng bạ không hợp lệ');return{flightNo,acReg,matchMode:'BOTH',restriction:arr.join(' '),category:'OTHERS',recipientRoles:['DH','CBTT'],active:true}}
export function draftKey(uid,flightId,formId){return ['sags-lite-draft-v1',uid,flightId,formId].join('::')}
export function classifyField(f){let t=String(f.type||'text').toLowerCase();return t==='checkbox'||t==='check'?'checkbox':t==='signature'?'signature':['computed','display','displaycheck'].includes(t)?'read-only':t==='textarea'?'textarea':t==='number'?'number':t==='date'?'date':t==='time'?'time':'text'}
export function sanitizeValues(form,values){const allowed=new Set((form.fields||[]).map(x=>x.key)),out={};for(const [k,v] of Object.entries(values||{})){if(!allowed.has(k))continue;if(typeof v==='string')out[k]=v.slice(0,3500);else if(typeof v==='boolean'||typeof v==='number')out[k]=v}return out}

// Shared E-Report account identifiers: mirror firebaseLoginEmail from the legacy app.
// The reserved AD alias must use its actual Firebase email, not a hardcoded bootstrap password.
export function legacyLoginEmail(raw){
  const value=String(raw||'').trim();
  if(!value) return '';
  if(value.includes('@')) return value.toLowerCase();
  if(norm(value)==='AD') return '';
  const slug=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[Đđ]/g,'D')
    .toLowerCase().replace(/[^a-z0-9._-]+/g,'.').replace(/^\.+|\.+$/g,'').replace(/\.{2,}/g,'.');
  return slug ? `${slug}@ereport-sags.local` : '';
}
export function operationalRole(raw){
  const role=String(raw||'').trim().toUpperCase();
  if(role==='ADMIN'||role==='AD')return 'AD';
  if(role==='ĐH'||role==='DH')return 'DH';
  return role;
}
export function validOldRole(raw){return ['AD','DH','CBTT','KH','VIEWER'].includes(operationalRole(raw))}