'use strict';
/* Source-grounded, per-unit staffing summary for the D-1 management report.
   Counts here mean department-wide PVB headcounts, not partial team-role totals. */
(function(root){
 const departments=[
   {unit:'DH',label:'Phòng ĐH',service:'nhân sự PVB'},
   {unit:'PVHK',label:'Phòng PVHK',service:'nhân sự phục vụ bay'},
   {unit:'KTS',label:'Phòng KTSĐ',service:'nhân sự PVB'}
 ];
 const parseCount=value=>{
   if(typeof value==='number')return Number.isSafeInteger(value)&&value>=0&&value<=9999?value:null;
   const s=String(value??'').trim();
   return /^\d{1,4}$/.test(s)?Number(s):null;
 };
 const state=(v)=>v==='READY'?'READY':v==='LIMITED'?'LIMITED':'PENDING';
 const needs=['morning','night'];
 function formatUnit(unit,details={},confirmed=false){
   const def=departments.find(x=>x.unit===unit)||{unit,label:unit,service:'nhân sự PVB'};
   const m=parseCount(details.pvb_morning),n=parseCount(details.pvb_night);
   const ms=confirmed&&m!=null?state(details.pvb_morning_status):'PENDING';
   const ns=confirmed&&n!=null?state(details.pvb_night_status):'PENDING';
   const human={READY:'Đảm bảo',LIMITED:'Chưa đảm bảo',PENDING:'CHỜ XÁC NHẬN'}; 
   const status=ms==='READY'&&ns==='READY'?'Đảm bảo':
     (ms==='LIMITED'||ns==='LIMITED')?'Chưa đảm bảo':
     ms==='PENDING'&&ns==='PENDING'?'CHỜ XÁC NHẬN':
     'Chưa xác nhận đầy đủ';
   const suffix=(label,value,s)=>label+' ('+(value==null?'CHỜ XÁC NHẬN':value+' NS')+
      (s==='PENDING'&&value!=null?', chưa xác nhận đáp ứng':'')+')';
   const shiftVariation=ms!==ns&&ms!=='PENDING'&&ns!=='PENDING';
   const headline=shiftVariation?'Sáng '+human[ms].toLowerCase()+', đêm '+human[ns].toLowerCase()+' '+def.service:
     status==='CHỜ XÁC NHẬN'?'CHỜ XÁC NHẬN '+def.service:
     status==='Chưa xác nhận đầy đủ'?'Chưa xác nhận đầy đủ khả năng đáp ứng '+def.service:
     status+' '+def.service;
   const countMorning=confirmed?m:null,countNight=confirmed?n:null;
   const line='- '+def.label+': '+headline+'. '+suffix('Sáng',countMorning,ms)+'; '+suffix('Đêm',countNight,ns)+'.';
   return {unit,line,status,complete:ms!=='PENDING'&&ns!=='PENDING'&&m!=null&&n!=null,detail:{morning:m,night:n,morning_status:ms,night_status:ns}};
 }
 function summarize(rows=[]){
   const lines=departments.map(d=>{
     const row=rows.find(x=>x.unit===d.unit);
     return formatUnit(d.unit,row?.details||{},row?.status==='CONFIRMED');
   });
   const incomplete=lines.filter(x=>!x.complete).map(x=>x.unit);
   return {lines:lines.map(x=>x.line),byUnit:lines,complete:incomplete.length===0,incomplete};
 }
 function validate(details={}){
   for(const shift of needs){
     const value=details['pvb_'+shift],raw=String(value??'').trim(),status=state(details['pvb_'+shift+'_status']);
     if(raw&&parseCount(raw)===null)throw Error('Tổng quân số ca '+(shift==='morning'?'sáng':'đêm')+' phải là số nguyên 0–9999.');
     if(status!=='PENDING'&&!raw)throw Error('Đã chọn tình trạng ca '+(shift==='morning'?'sáng':'đêm')+' nhưng chưa nhập tổng quân số.');
   }
   return true;
 }
 root.SagsPersonnelV212={departments,parseCount,formatUnit,summarize,validate};
})(window);