import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const packageVersion=JSON.parse(read('package.json')).version;
const version='v='+packageVersion;
const files=['src/app.mjs','src/forms.mjs','src/limits.mjs','src/backend.mjs','src/firebase.mjs'];
test('every production caller resolves to exactly one Firebase SDK module and api singleton',()=>{
 const app=read('src/app.mjs'),form=read('src/forms.mjs'),limits=read('src/limits.mjs'),backend=read('src/backend.mjs'),firebase=read('src/firebase.mjs');
 for(const src of [app,form,limits])assert.ok(src.includes("'./backend.mjs?"+version+"'"),'a producer used mismatched backend module url');
 assert.match(backend,new RegExp(`\\./firebase\\.mjs\\?${version.replaceAll('.','\\.')}`));
 assert.match(firebase,new RegExp(`\\./legacy-roster\\.mjs\\?${version.replaceAll('.','\\.')}`));
 for(const [path,src] of [['src/app.mjs',app],['src/backend.mjs',backend],['src/firebase.mjs',firebase],['src/forms.mjs',form],['src/limits.mjs',limits]]){
  assert.doesNotMatch(src,/\?v=1\.[0-7](?:\.|'|\")/,'old versioned module still in '+path);
 }
 assert.match(read('index.html'),new RegExp(`src/app\\.mjs\\?${version.replaceAll('.','\\.')}`));
});
test('LIMITS failing to initialize cannot block an authenticated flight dashboard',()=>{
 const src=read('src/app.mjs');
 assert.match(src,/try\{state\.alertStop=startLimitAlerts\(/);
 assert.match(src,/catch\(e\)\{console\.warn\('A\/C LIMITS listener unavailable'/);
 assert.match(src,/navigate\('flights'\)/);
});
test('SỔ TAY loader retries original assets only after verifying the pinned module sha, and awaits native open',()=>{
 const src=read('src/notebook.mjs'),man=JSON.parse(read('data/upstream-files.json'));
 assert.ok(src.includes(man.files['app/modules/carrier-notebook.v1.js'].sha));
 assert.match(src,/sha1GitBlob\(source\)/);
 assert.match(src,/await assetAvailable\(localData\)/);
 assert.match(src,/loadPinnedOriginalFallback\(\)/);
 assert.match(src,/VERSION='data\/carrier-guide-version\.json'/);
 assert.match(src,/DATA_URL=.*carrier-service-guide\.json/);
 assert.match(src,/await window\.sagsCarrierGuideOpen\(\)/);
 assert.match(src,/E-REPORT-SAGS\//);
});