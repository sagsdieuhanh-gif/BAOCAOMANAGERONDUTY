'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},document:{readyState:'loading',addEventListener(){}},globalThis:{}};
vm.runInNewContext(fs.readFileSync('v225-role-access.js','utf8'),ctx,{filename:'v225-role-access.js'});
const P=ctx.window.SagsRoleAccessV225;
assert.ok(P);
const shared=['radar','report','radar-report','shuttle-report'];
const scope={KTS:'pvsd',PVHK:'pvhk',KHO:'warehouse',QA:'qa_it',IT:'qa_it'};
for(const [role,tab] of Object.entries(scope)){
 assert.equal(P.canOpen(role,tab),true,role+' gets own editor');
 assert.equal(P.canEdit(role,tab),true);
 for(const x of ['home','sources','pvsd','pvhk','warehouse','qa_it','staff','gse','doorclose','quick','admin']){
   if(x===tab)continue;
   assert.equal(P.canOpen(role,x),false,role+' may not access '+x);
 }
 for(const x of shared){assert.equal(P.canOpen(role,x),true);assert.equal(P.canEdit(role,x),false);}
 assert.equal(P.canExport(role),false,role+' cannot export');
 assert.equal(P.canManage(role),false,role+' cannot change permissions');
 assert.equal(P.canEditUnit(role,role==='QA'||role==='IT'?'QA_IT':role),true);
 for(const other of ['DH','PVHK','KTS','KHO','QA_IT']){
   if(other===role||other==='QA_IT'&&['QA','IT'].includes(role))continue;
   assert.equal(P.canEditUnit(role,other),false,role+' forbidden to edit '+other);
 }
}
for(const role of ['DH','ADMIN']){
 for(const tab of P.all){assert.equal(P.canOpen(role,tab),tab!=='admin'||role==='ADMIN');}
 for(const target of ['DH','PVHK','KTS','KHO','QA_IT'])assert.equal(P.canEditUnit(role,target),true);
 assert.equal(P.canExport(role),true);
 assert.equal(P.canManage(role),role==='ADMIN');
}
for(const tab of P.all){
 assert.equal(P.canOpen('VIEWER',tab),shared.includes(tab));
 assert.equal(P.canEdit('VIEWER',tab),false);
}
assert.equal(P.canManage('VIEWER'),false);
assert.equal(P.canOpen(null,'report'),false);
const ui=fs.readFileSync('index.html','utf8'),nav=fs.readFileSync('v220-friendly-ui.js','utf8'),
 sh=fs.readFileSync('v24-shuttle-grid.js','utf8'),dept=fs.readFileSync('v20-departments.js','utf8'),
 notes=fs.readFileSync('v211-unit-input.js','utf8'),sql=fs.readFileSync('server/v225-room-permissions.sql','utf8');
assert.ok(ui.includes('Báo cáo điều hành V2.27'));
assert.ok(ui.includes('v225-role-access.js?v=2.25')&&ui.includes('v225-role-access.css?v=2.25'));
assert.ok(ui.includes('SagsRoleAccessV225?.canOpen(unit,tab)'),'Direct tab switching must check permissions');
assert.ok(ui.includes('SagsRoleAccessV225?.apply()'));
assert.ok(ui.includes("if(!window.SagsRoleAccessV225?.canExport(unit))return;"),'Fallback HTML/print exports must be protected');
assert.ok(nav.includes("access()?.canOpen(role(),tab)"),'Friendly menus must filter by current role');
assert.ok(sh.includes("['ADMIN','DH'].includes(who)"),'DH must be able to edit other units in shuttle table');
assert.ok(dept.includes("['ADMIN','DH'].includes(unit)||unit===r"),'DH operations can update other units');
assert.ok(notes.includes("['ADMIN','DH'].includes(unit)||unit===key"),'DH operations can confirm unit forecasts');
assert.ok(ui.includes("if(unit!=='ADMIN')return"),'Account changes remain admin-only');
assert.ok(sql.includes("CREATE POLICY v225_ops_gse_capacity_insert")&&sql.includes("CREATE POLICY v225_ops_staff_capacity_insert"));
assert.ok(sql.includes("ops_internal.my_unit()=unit"),'Rows must remain scoped by owner');
assert.ok(!sql.includes('DROP POLICY IF EXISTS ops_members_'),'Never loosen account manager RLS');
const css=fs.readFileSync('v225-role-access.css','utf8');
assert.ok(css.includes('.v225-denied')&&css.includes('#tab-admin'));
for(const file of ['v21-shuttle-export.js','report-export-v29.js','radar-report-v28.js']){
 assert.ok(/\['(?:ADMIN','DH|DH','ADMIN)'\]/.test(fs.readFileSync(file,'utf8')),file+' should guard export');
}
console.log('PASS V2.25: department ownership; read-only reports; DH operational superuser; ADMIN-only rights; RLS + UI gates');
