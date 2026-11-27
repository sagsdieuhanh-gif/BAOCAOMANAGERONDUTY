'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const css=read('v336-festive.css');
const js=read('v336-festive.js');
const exportJs=read('v21-shuttle-export.js');
const work=read('v300-workspace.js');
const preview=read('festive-preview-v336.html');
const previewLegacy=read('festive-preview-v335.html');
const readme=read('README.md');
assert.match(index,/const APP_VERSION='V3\.36'/);
assert.match(work,/id="v300Version">V3\.36/);
assert.ok(readme.startsWith('## V3.36'));
assert.ok(index.includes('v336-festive.css?v=3.36'));
assert.ok(index.includes('v336-festive.js?v=3.36'));
assert.ok(index.includes('v21-shuttle-export.js?v=3.36'));
assert.ok(index.includes('v300-workspace.js?v=3.36'));
assert.ok(!index.includes('v334-festive.js')&&!index.includes('v335-ereport-premium.css'));
assert.ok(!index.includes('v334-festive.css'));
assert.ok(!preview.includes('sags-festive-banner'));
assert.ok(!preview.includes('class="sags-festive-login-greet"'),'Login preview must not inject a second greeting');
assert.ok(!preview.includes('seasonBannerTitle')&&!preview.includes('loginGreeting'));
assert.ok(preview.includes("classList.toggle('hidden',name!=='login')"));
assert.ok(preview.includes('v336-festive.css?v=3.36'));
assert.equal(previewLegacy.includes('v336-festive.css?v=3.36'),true);
assert.ok(/body:has\(#authpanel:not\(\.hidden\)\):not\(\.v300-ready\)>header/.test(css));
assert.ok(css.includes('.sags-premium-login-brand{display:none}'));
assert.ok(css.includes("url('./assets/holiday/apron.webp')"));
assert.ok(css.includes("url('./assets/holiday/mobile.webp')"));
assert.ok(css.includes("url('./assets/holiday/apron-detail.webp')"));
assert.ok(css.includes('.v300-main:has(.v300-stats) .sags-premium-hero'));
assert.ok(js.includes("document.querySelectorAll('.sags-festive-banner,.sags-festive-login-greet')"));
assert.ok(!js.includes("header.insertAdjacentElement('afterend'"));
assert.ok(!js.includes("greet.appendChild("));
assert.ok(exportJs.includes("SagsFestiveThemeV336"));
assert.ok(!exportJs.includes("SagsFestiveThemeV334"));
assert.ok(work.includes("SagsFestiveThemeV336?.refresh?.()"));
for(const file of [
 'assets/holiday/apron.webp','assets/holiday/apron-detail.webp',
 'assets/holiday/mobile.webp','assets/holiday/banner.webp',
 'assets/branding/apron-night-v6494.webp','assets/branding/logo.png'
]) assert.ok(fs.existsSync(file)&&fs.statSync(file).size>5000,'Missing original EREPORT image '+file);
for(const content of [js,exportJs,work])new vm.Script(content);
for(const code of preview.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
 if(code[1])new vm.Script(code[1]);
function runSeason(dt,disabled=false){
 const window={localStorage:{getItem:()=>disabled?'off':null},addEventListener:()=>{}};
 const document={readyState:'loading',addEventListener:()=>{}};
 class FakeDate extends Date{static now(){return Date.parse(dt+'T01:00:00+07:00')}}
 vm.runInNewContext(js,{window,document,Date:FakeDate});
 return [window.SagsFestiveThemeV336.windowSeason(),window.SagsFestiveThemeV336.currentSeason()];
}
assert.deepEqual(runSeason('2026-11-26'),['','']);
assert.deepEqual(runSeason('2026-11-27'),['christmas','christmas']);
assert.deepEqual(runSeason('2026-12-26'),['christmas','christmas']);
assert.deepEqual(runSeason('2026-12-27'),['newyear','newyear']);
assert.deepEqual(runSeason('2027-01-03'),['newyear','newyear']);
assert.deepEqual(runSeason('2027-01-04'),['','']);
assert.deepEqual(runSeason('2026-12-01',true),['christmas','']);
console.log('PASS V3.36: no duplicated greeting/banner; login vs workspace separation; dates/toggle; preview; Premium EREPORT assets; live shuttle theme');
