'use strict';
/* V2.25 single role map: user interface only. The matching DB RLS is authoritative. */
(function(root){
 const OWN={KTS:'pvsd',PVHK:'pvhk',KHO:'warehouse',QA:'qa_it',IT:'qa_it'};
 const ALL=['home','sources','pvsd','pvhk','warehouse','qa_it','staff','gse','doorclose','radar','report','radar-report','shuttle-report','quick','admin'];
 const SHARED=['radar','report','radar-report','shuttle-report'];
 function privileged(role){return role==='DH'||role==='ADMIN'}
 function canManage(role){return role==='ADMIN'}
 function canExport(role){return privileged(role)}
 function canEditUnit(role,target){
   return privileged(role)||role===target||(target==='QA_IT'&&(role==='QA'||role==='IT'));
 }
 function canOpen(role,tab){
   if(!role)return false;
   if(tab==='admin')return canManage(role);
   if(privileged(role))return true;
   if(SHARED.includes(tab))return true;
   return OWN[role]===tab;
 }
 function canEdit(role,tab){
   if(privileged(role))return tab!=='admin'||canManage(role);
   return OWN[role]===tab;
 }
 function allowedTabs(role){return ALL.filter(x=>canOpen(role,x))}
 const getRole=()=>typeof unit==='undefined'?null:unit;
 function reveal(node,allowed){
   if(!node)return;
   node.hidden=!allowed;
   node.classList.toggle('v225-denied',!allowed);
   node.setAttribute('aria-hidden',String(!allowed));
 }
 function apply(){
   const role=getRole();if(!role)return;
   document.body.dataset.accessRole=role;
   for(const tab of ALL){
     const allow=canOpen(role,tab);
     for(const button of document.querySelectorAll('#tabs [data-tab="'+tab+'"]')){
       button.hidden=!allow;button.disabled=!allow;button.classList.toggle('hidden',!allow);
       button.classList.toggle('v19-tab-off',!allow);
     }
   }
   // Reports are visible for every active member, but only DH/ADMIN can write or export.
   const write=canExport(role);
   const report=document.getElementById('tab-report');
   if(report){
     for(const el of report.querySelectorAll('button')){
       const keep=el.id==='v19ReportRefresh';
       reveal(el,write||keep);
       if(!keep)el.disabled=!write;
     }
     for(const el of report.querySelectorAll('#controlsTable textarea, #controlsTable input, #controlsTable select, #comparisonTable input, #comparisonTable textarea')){
       el.disabled=!write;
       el.readOnly=!write;
     }
     for(const id of ['v19NoteEditor'])reveal(document.getElementById(id),write);
     for(const item of report.querySelectorAll('[data-v19-export],[data-main-pdf]'))reveal(item,write);
   }
   for(const selector of [
     '[data-v21-export]','#r28ExportWord','#r28ExportPdf','#r28ExportPdf','#downloadReport',
     '#v19ReportExport','#v29MainPdf','#v19SaveNotes','#saveDailyTotals','#saveControls','#release',
     '#quickIssue','#quickPrint','#quickPreview'
   ])for(const item of document.querySelectorAll(selector)){
     reveal(item,write);if('disabled' in item)item.disabled=!write;
   }
   // Only ADMIN sees account management. DH is operational manager, not account administrator.
   reveal(document.getElementById('adminTab'),canManage(role));
   reveal(document.getElementById('tab-admin'),canManage(role));
   // Legacy editor tabs must never be shown to the wrong unit. The allowed department tab
   // remains available and server policies block cross-unit writes.
   for(const tab of ['sources','pvsd','pvhk','warehouse','qa_it','gse','staff','doorclose','quick']){
     const element=document.getElementById('tab-'+tab);
     if(element&&!canOpen(role,tab))element.classList.add('v225-denied');
     else element?.classList.remove('v225-denied');
   }
   if(typeof root.SagsFriendlyUIV220?.refresh==='function')root.SagsFriendlyUIV220.refresh();
 }
 root.SagsRoleAccessV225={privileged,canManage,canExport,canEditUnit,canOpen,canEdit,allowedTabs,apply,all:ALL};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.SagsRoleAccessV225;
})(typeof window!=='undefined'?window:globalThis);