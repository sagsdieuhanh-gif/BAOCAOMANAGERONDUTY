'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},document:{getElementById(){return null;}}};
for(const f of ['v212-personnel.js','v211-unit-input.js'])
 vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const u=ctx.window.SagsUnitInputV211,p=ctx.window.SagsPersonnelV212;
assert.ok(u&&p,'Personnel and unit-input modules must load without UI side effects');
for(const unit of ['DH','PVHK','KTS']){
 const form=u._test.html(unit,u.groups[unit]);
 assert.equal((form.match(/class="v224-shift-card"/g)||[]).length,2,'Exactly two shift cards for '+unit);
 assert.equal((form.match(/data-unit-field="pvb_(morning|night)"/g)||[]).length,2);
 assert.equal((form.match(/data-unit-field="pvb_(morning|night)_required"/g)||[]).length,2);
 assert.equal((form.match(/data-unit-field="pvb_(morning|night)_status"/g)||[]).length,2);
 assert.equal((form.match(/data-v211-confirm="/g)||[]).length,1,'Single main save for '+unit);
 assert.ok(form.includes('data-v211-save="'+unit+'"'),'Draft save must remain available');
 assert.ok(form.includes('data-v215-quick="'+unit+'"'),'Quick paste preserved');
 assert.ok(form.includes('data-v212-preview="'+unit+'"'),'Signed-off report sentence preview preserved');
 assert.ok(form.includes('02 · THÔNG TIN NGHIỆP VỤ BỔ SUNG'),'Special notes can be expanded');
 assert.ok(!form.includes('v215-fast-report'),'Remove formerly crowded always-open paste box');
 assert.ok(form.indexOf('v224-personnel')<form.indexOf('v224-specialty'),'Staff totals must precede special notes');
}
for(const unit of ['KHO','QA_IT']){
 const form=u._test.html(unit,u.groups[unit]);
 assert.ok(form.includes('v224-specialty" open'),'Non-staff departments must not see an empty screen');
 assert.ok(!form.includes('v224-personnel'),'Do not invent headcounts for '+unit);
 assert.ok(form.includes('XÁC NHẬN & LƯU'),'Confirm remains accessible');
}
assert.ok(u._test.shiftFeedback({pvb_morning:'20',pvb_morning_required:'25',pvb_morning_status:'LIMITED'},'morning').includes('THIẾU 5 NGƯỜI'));
assert.ok(u._test.shiftFeedback({pvb_night:'22',pvb_night_required:'18',pvb_night_status:'READY'},'night').includes('dư 4'));
assert.ok(u._test.shiftFeedback({pvb_night:'12',pvb_night_required:'15',pvb_night_status:'READY'},'night').includes('CẦN KIỂM TRA'));
assert.ok(u._test.shiftFeedback({pvb_morning:'',pvb_morning_status:'PENDING'},'morning').includes('CHƯA NHẬP'));
assert.equal(p.parseCount('0'),0,'Zero is a real count, not a missing value');
assert.equal(p.parseCount(''),null,'Blank stays unconfirmed');
const source=fs.readFileSync('v211-unit-input.js','utf8');
assert.ok(source.includes("data['pvb_'+code+'_status']==='READY'&&required!=null&&current<required"),'Contradictory staffing signoff blocked');
assert.ok(source.includes("head.insertAdjacentElement('afterend',node)"),'Main staff form must be near department heading');
assert.ok(source.includes('ops_unit_forecasts'),'Save approved summary to unchanged table');
assert.ok(source.includes('ops_unit_quick_reports'),'Keep quick-paste data as separate source');
const dept=fs.readFileSync('v20-departments.js','utf8');
assert.ok(dept.includes('v224-team-details'),'Detailed team allocations are collapsed by default');
assert.ok(dept.includes("fieldGroups('PVHK')")&&dept.includes("fieldGroups('KTS')"),'Both role-based inputs retained');
assert.ok(dept.includes('ops_staff_capacity'),'Detailed staffing stays in original table');
assert.ok(dept.includes('v20SaveKTS')&&dept.includes('v20SavePVHK'),'Retain original team save handlers');
assert.ok(dept.includes('v20SaveSky')&&dept.includes('v20SavePvExtra'),'Retain staffing extras');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('v224-staff-ui.css','utf8');
assert.ok(html.includes('Báo cáo điều hành V2.25'));
assert.ok(html.includes('v211-unit-input.js?v=2.25'));
assert.ok(html.includes('v20-departments.js?v=2.25'));
assert.ok(html.includes('v224-staff-ui.css?v=2.24'));
assert.ok(html.indexOf('v224-staff-ui.css')>html.indexOf('v222-shuttle-layout.css'),'Latest staff CSS must load last');
assert.ok(css.includes('grid-template-columns:1fr!important'),'Stack two shifts on phone');
assert.ok(css.includes('.v224-primary-actions button'),'Clear single primary save');
assert.ok(css.includes('.v224-team-details'),'Detailed per-role inputs available on demand');
const report=fs.readFileSync('v19-report.js','utf8');
assert.ok(report.includes('SagsPersonnelV212.summarize'),'Staff report must still use confirmed source');
console.log('PASS V2.24: 2 shift cards, signed-off vs detailed sources, honest missing values, compact unit UI and report/export preservation');
