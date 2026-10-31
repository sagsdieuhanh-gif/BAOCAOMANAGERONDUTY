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
   const rm=parseCount(details.pvb_morning_required),rn=parseCount(details.pvb_night_required);
   const ms=confirmed&&m!=null?state(details.pvb_morning_status):'PENDING';
   const ns=confirmed&&n!=null?state(details.pvb_night_status):'PENDING';
   // Reporting only: do not rate staffing sufficiency here. Such assessments
   // require an applicable, verified service norm, not just a headcount.
   const headcountConfirmed=confirmed&&m!=null&&n!=null;
   const status=headcountConfirmed?'CONFIRMED':confirmed?'PARTIAL':'PENDING';
   const show=(label,value)=>label+' ('+(value==null?'CHỜ XÁC NHẬN':value+' NS')+')';
   const line='- '+def.label+': '+(headcountConfirmed?'Quân số đã xác nhận':'Quân số theo ca')+
     '. '+show('Sáng',confirmed?m:null)+'; '+show('Đêm',confirmed?n:null)+'.';
   return {unit,line,status,headcountConfirmed,complete:ms!=='PENDING'&&ns!=='PENDING'&&m!=null&&n!=null,detail:{morning:m,night:n,required_morning:rm,required_night:rn,morning_status:ms,night_status:ns}};
 }
 function summarize(rows=[]){
   const lines=departments.map(d=>{
     const row=rows.find(x=>x.unit===d.unit);
     return formatUnit(d.unit,row?.details||{},row?.status==='CONFIRMED');
   });
   const incomplete=lines.filter(x=>!x.complete).map(x=>x.unit);
   return {lines:lines.map(x=>x.line),byUnit:lines,headcountsConfirmed:lines.every(x=>x.headcountConfirmed),complete:incomplete.length===0,incomplete};
 }
 function validate(details={}){
   for(const shift of needs){
     const value=details['pvb_'+shift],raw=String(value??'').trim(),status=state(details['pvb_'+shift+'_status']);
     if(raw&&parseCount(raw)===null)throw Error('Tổng quân số ca '+(shift==='morning'?'sáng':'đêm')+' phải là số nguyên 0–9999.');
     if(status!=='PENDING'&&!raw)throw Error('Đã chọn tình trạng ca '+(shift==='morning'?'sáng':'đêm')+' nhưng chưa nhập tổng quân số.');
   }
   for(const shift of needs){
     const required=String(details['pvb_'+shift+'_required']??'').trim();
     if(required&&parseCount(required)===null)throw Error('Nhu cầu nhân sự ca '+(shift==='morning'?'sáng':'đêm')+' phải là số nguyên 0–9999.');
     const actual=parseCount(details['pvb_'+shift]),needed=parseCount(required);
     if(actual!=null&&needed!=null&&needed>actual&&state(details['pvb_'+shift+'_status'])==='READY')
       throw Error('Ca '+(shift==='morning'?'sáng':'đêm')+' đang thiếu '+(needed-actual)+' người so với nhu cầu nhưng được đánh dấu đủ. Vui lòng kiểm tra lại.');
   }
   return true;
 }
 root.SagsPersonnelV212={departments,parseCount,formatUnit,summarize,validate};
})(window);