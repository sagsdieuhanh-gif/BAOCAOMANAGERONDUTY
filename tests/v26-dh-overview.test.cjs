const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const v20=fs.readFileSync('radar-cxr/v20-departments.js','utf8');
const v19=fs.readFileSync('radar-cxr/v19-ui.js','utf8');
const grid=fs.readFileSync('radar-cxr/v24-shuttle-grid.js','utf8');
const index=fs.readFileSync('radar-cxr/index.html','utf8');

assert.match(v19,/function renderHome\(\)/);
assert.match(v19,/home\.innerHTML=/);
assert.match(grid,/function mount\(\)/);
assert.match(grid,/if\(id==='tab-home'\)el\.appendChild\(div\)/);
assert.match(grid,/function setUnit\(role\)\{\s*viewRole=role;mount\(\);show\(\);refresh\(\)/);
assert.match(index,/<section id="tab-home"><div id="v19Home"><\/div><\/section>/);
assert.match(index,/renderStages\(\);window\.SagsUIV19\?\.renderHome\(\);window\.SagsUIV20\?\.refresh\(\);window\.SagsShuttleGridV24\?\.refresh\(\)/);
assert.match(index,/<script src="\.\/v20-departments\.js\?v=2\.\d+"><\/script>/);
assert.match(index,/<script src="\.\/v24-shuttle-grid\.js\?v=2\.\d+"><\/script>/);
assert.match(index,/<script src="\.\/v19-ui\.js\?v=2\.7"><\/script>/);

// Exercise exact setUnit function, not a second hand-written copy.
const start=v20.indexOf('function setUnit(role){'),end=v20.indexOf('\n window.SagsUIV20=',start);
assert.ok(start>0&&end>start,'setUnit function must exist');
const code=v20.slice(start,end).trim();
function run(role,overviewThrows=false){
 const events=[];
 const elements=new Map();
 const target=id=>{
  if(!elements.has(id))elements.set(id,{style:{},innerHTML:'',
    closest:()=>({classList:{toggle(){}}})});
  return elements.get(id);
 };
 const context={
  init(){events.push('init')},
  window:{
   SagsUIV19:{setUnit(r){events.push('overview:'+r);if(overviewThrows)throw Error('broken home renderer')}},
   SagsShuttleGridV24:{setUnit(r){events.push('shuttle:'+r)}}
  },
  document:{querySelectorAll:()=>[
   {dataset:{tab:'home'},classList:{toggle(){}},style:{},textContent:''},
   {dataset:{tab:'qa_it'},classList:{toggle(){}},style:{},textContent:''}
  ]},
  $:target,
  allowed:r=>role===r,
  switchTab:t=>events.push('tab:'+t),
  refresh:()=>events.push('refresh'),
  console:{error:(...a)=>events.push('warn')},
 };
 const fn=vm.runInNewContext('('+code+')',context);
 fn(role);
 return {events,elements};
}
const dh=run('DH');
assert.deepEqual(dh.events,['init','overview:DH','tab:home','shuttle:DH','refresh']);
assert.equal(dh.elements.get('v22DhShuttle').style.display,'');
const qa=run('QA');
assert.ok(qa.events.includes('tab:qa_it'));
assert.ok(qa.events.includes('shuttle:QA'));
const it=run('IT');
assert.ok(it.events.includes('tab:qa_it'));
assert.ok(it.events.includes('shuttle:IT'));
const fallback=run('DH',true);
assert.ok(fallback.events.includes('warn'));
assert.ok(fallback.events.includes('shuttle:DH'));
assert.ok(fallback.elements.get('v19Home').innerHTML.includes('PHÒNG ĐIỀU HÀNH'));
console.log('V2.6 ĐH overview + direct-entry shuttle mounted at login and refresh; QA/IT and fallback: OK');
