'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../v21-shuttle-model.js');
require('../v24-shuttle-grid.js');
const grid=globalThis.SagsShuttleGridV24._test;
const values=['DH','PVHK','KTS','QA_IT'].map((unit,i)=>({
 unit,direction:'NHA_CXR',departure_min:420,line_no:0,
 quantity:[18,23,21,12][i],confirmed_at:'2026-10-30T18:00:00Z'
}));
const confirmed=grid.assemble(values,[]);
assert.equal(confirmed.find(x=>x.direction==='NHA_CXR'&&x.departure_min===420).total,74);
const html=grid.makeGrid('NHA_CXR',confirmed,'DH');
assert.equal((html.match(/<col class="v222-col-/g)||[]).length,7,'exactly 7 column dimensions');
assert.equal((html.match(/<th scope="col"/g)||[]).length,7,'exactly seven headers');
const rows=[...html.matchAll(/<tr class="v24-time-row[^>]*>[\s\S]*?<\/tr>/g)];
assert.equal(rows.length,2,'two fixed departures on NHA_CXR');
for(const row of rows)assert.equal((row[0].match(/<td\b/g)||[]).length,7,'each run must have seven cells');
assert.ok(html.includes('<td class="v24-cell v24-edit">'),'editable cell remains in correct column');
assert.ok(html.includes('2 XE: 45C + 29C'),'vehicle recommendation shown in a fixed column');
assert.ok(html.includes('74 ghế · dư 0 ghế'),'seat count stays inside recommendation column');
assert.ok(html.includes('v222-scroll-hint'),'mobile horizontal-scroll instruction');
assert.ok(html.includes('tabindex="0"'),'keyboard navigable scroll container');
const extra=grid.assemble([...values.slice(0,3),{
 unit:'DH',direction:'NHA_CXR',departure_min:480,line_no:0,quantity:2
}], [{direction:'NHA_CXR',departure_min:480,line_no:0,reason:'Xe họp chuyên môn',created_by:'user-1'}]);
const customHtml=grid.makeGrid('NHA_CXR',extra,'DH');
assert.ok(customHtml.includes('colspan="7"'),'unconfirmed/extra row must span exactly seven columns');
assert.ok(customHtml.includes('XE BỔ SUNG · LÝ DO:'));
const css=fs.readFileSync('v222-shuttle-layout.css','utf8');
const expectedWidths={time:126,unit:116,total:116,bus:260};
assert.equal(expectedWidths.time+4*expectedWidths.unit+expectedWidths.total+expectedWidths.bus,966,'fixed grid widths must total 966px');
for(const [col,w] of Object.entries(expectedWidths)){
 assert.ok(css.includes('.v222-col-'+col+'{width:'+w+'px!important}'),'CSS column width for '+col);
}
assert.ok(css.includes('width:966px!important')&&css.includes('min-width:966px!important'));
assert.ok(css.includes('position:sticky!important;left:0!important')||css.includes('position:sticky!important;left:0!important;'),'time must remain visible while scrolling');
assert.ok(css.includes('overflow-x:auto!important'),'horizontal scroll required on mobiles');
assert.ok(css.includes('input[data-v24-value]')&&css.includes('max-width:100%!important'),'input cannot cross cell boundaries');
assert.ok(css.includes('.v214-actions{position:relative!important'),'save toolbar should not cover rows on phone');
const index=fs.readFileSync('index.html','utf8');
assert.ok(index.includes('Báo cáo điều hành V2.22'));
assert.ok(index.includes('v24-shuttle-grid.js?v=2.22'));
assert.ok(index.includes('v222-shuttle-layout.css?v=2.22'));
assert.ok(index.indexOf('v222-shuttle-layout.css')>index.indexOf('rns-admin.css'),'alignment overrides must load last');
console.log('PASS V2.22: seven aligned cells, explicit column widths, sticky time, safe mobile inputs and existing shuttle recommendation');
