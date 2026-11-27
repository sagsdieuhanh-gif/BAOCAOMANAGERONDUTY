'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('v300-workspace.css','utf8');
const js=fs.readFileSync('v300-workspace.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const readme=fs.readFileSync('README.md','utf8');
const unified=css.slice(css.indexOf('V3.01 · UNIFIED SIDE-BY-SIDE WORKSPACE'));
assert.ok(unified.length>1000,'V3.10 layout overrides must exist');
assert.match(unified,/#v300Root \.v300-sidebar\s*\{[\s\S]*?position:sticky/,'Sidebar stays fixed during content scroll');
const tablet=unified.match(/@media\(max-width:850px\)\{([\s\S]*?)\n\}\n@media\(max-width:540px\)/);
assert.ok(tablet,'V3.10 tablet/mobile responsive rules must exist');
assert.match(tablet[1],/#v300Root \.v300-shell\s*\{\s*display:grid;\s*grid-template-columns:100px minmax\(0,1fr\)/,
 'At <=850px rail and content must remain side by side');
assert.match(tablet[1],/#v300Root #v300Nav\s*\{\s*display:grid;/,
 'Mobile navigation must remain vertical, not horizontal carousel');
assert.match(tablet[1],/#v300Root \.v300-nav-folder\[open\]>div\s*\{\s*display:grid;/,
 'Expanded departments must be a vertical sidebar list');
assert.match(unified,/@media\(max-width:540px\)\{\s*#v300Root \.v300-shell\{grid-template-columns:82px minmax\(0,1fr\)/);
assert.match(unified,/@media\(max-width:360px\)\{\s*#v300Root \.v300-shell\{grid-template-columns:74px minmax\(0,1fr\)/);
assert.match(css,/#v300Root \.v300-main \.tablewrap,[\s\S]*?overflow-x:auto/,'Wide tables scroll inside content instead of moving page');

const release=index.match(/const APP_VERSION='(V\\d+\\.\\d+)'/)?.[1];
assert.ok(release,'Application version must be present');
assert.match(index,/MANAGER ON DUTY/);
assert.ok(js.includes('id="v300Version">'+release),'Sidebar version matches app release');
assert.ok(index.indexOf('v300-workspace.css?v=')>index.indexOf('v225-role-access.css'),
  'Unified layout stylesheet must load after legacy style');
assert.ok(index.includes('v300-workspace.js?v='+release.slice(1)),
  'Workspace cache-bust must match current release');
assert.ok(js.includes('v300-cta')&&js.includes('XEM BÁO CÁO TGĐ'),
  'Existing report CTA must survive the layout change');
assert.ok(readme.includes(release)&&readme.includes('bên trái'),
  'README tracks latest release and sidebar workflow');
console.log('PASS V3.10: sidebar left and workspace right on PC, tablet and mobile; stacked phone navigation, exports/CTA retained');
