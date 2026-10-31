'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const ws=fs.readFileSync('v300-workspace.js','utf8');
const grid=fs.readFileSync('v24-shuttle-grid.js','utf8');
const model=fs.readFileSync('v21-shuttle-model.js','utf8');
assert.match(html,/Báo cáo điều hành V3\.05/);
assert.ok(html.includes('v24-shuttle-grid.js?v=3.05'), 'New grid code must bypass cached old grid');
assert.ok(html.includes('v300-workspace.js?v=3.05'), 'New workspace code must bypass cached old UI');
assert.ok(ws.includes("['shuttle','Xe giao ca','bus-front','Nhập số người và xuất bảng xe'"),'Shuttle navigation must be obvious');
assert.ok(ws.includes("['analysis','report','shuttle'].filter(canOpen)"),'XE GIAO CA belongs to the main left rail');
assert.ok(ws.includes("const other=['norms','admin'].filter(canOpen)"),'XE GIAO CA must not hide in tools folder');
assert.ok(ws.includes("shuttle:'tab-shuttle-report'"),'Shuttle page must reuse confirmed export data');
assert.ok(ws.includes("root.SagsShuttleGridV24?.refresh?.()"),'Entering shuttle must load confirmed entry grid');
assert.ok(ws.includes("root.SagsShuttleExport?.renderPreview?.()"),'Entering shuttle must update PNG/PDF preview');
assert.ok(grid.includes("['SHUTTLE','tab-shuttle-report']"),'Live input grid must mount inside the shuttle screen');
assert.ok(grid.includes("['tab-shuttle-report',role]"),'Live input grid must honor the current user role');
assert.ok(grid.includes("div.addEventListener('click',onClick)"),'Restored input must keep save handlers');
assert.ok(grid.includes('data-v24-save-all'),'Shuttle screen must expose LƯU TẤT CẢ THAY ĐỔI');
assert.ok(grid.includes("data-v24-value"),'Shuttle screen must contain numeric personnel entry fields');
assert.ok(grid.includes("await refresh()"),'Saving personnel must refresh confirmed source data');
assert.ok(grid.includes("sb.from('ops_shift_transport_v2')"),'Use existing Supabase shuttle rows, do not create duplicate storage');
assert.ok(grid.includes("V=['DH','PVHK','KTS','QA_IT']"),'Keep confirmed four-column matrix');
assert.ok(grid.includes("fieldOf(who)===field"),'Ordinary roles may only edit their own department');
assert.ok(model.includes("departure_min:1935") && model.includes("departure_min:990"),
 'Keep existing overnight 08:15 and 16:30 vehicle slots and stored time keys');
assert.ok(html.includes('data-v21-export="png"')&&html.includes('data-v21-export="pdf"'),
 'Original shuttle PNG/PDF export buttons must remain');
console.log('PASS V3.05: live per-hour shuttle personnel editing, department permissions, save and exports restored');
