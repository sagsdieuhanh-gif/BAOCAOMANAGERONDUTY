'use strict';
/* V3.39: Actual Chromium smoke test. Runs against a local static copy of the
   Pages deployment; external Supabase requests are disabled and no account
   or operational data is accessed. */
const assert=require('node:assert/strict');
const http=require('node:http');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png'};
function server(){
 return http.createServer((req,res)=>{
   let target;
   try{
     const url=new URL(req.url,'http://localhost');
     target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
     if(!target.startsWith(root+path.sep)||!fs.statSync(target).isFile())throw Error('not a file');
     res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream',
       'Cache-Control':'no-store'});
     fs.createReadStream(target).pipe(res);
   }catch(e){res.writeHead(404);res.end('Not found');}
 });
}
const cmd=process.env.CHROME_BIN||[
 '/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
 '/usr/bin/chromium','/opt/google/chrome/chrome'
].find(f=>fs.existsSync(f));
if(!cmd)throw Error('Chromium/Chrome missing on runner; browser QA cannot be skipped');
const dir=path.join(root,'tests','ui-artifacts');fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const app=server();await new Promise(ok=>app.listen(0,'127.0.0.1',ok));
 const port=app.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:cmd,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  const failures=[],results=[];
  for(const [label,width,height] of [['largeDesktop',2560,1440],['desktop',1440,900],['tablet',768,1024],['phone',390,844],['smallphone',320,640]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,
     locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce'});
   await context.addInitScript(()=>{
     const RealDate=Date;
     class QAClock extends RealDate{static now(){return RealDate.parse('2026-12-10T02:00:00Z')}}
     window.Date=QAClock;
   });
   await context.route('**/cdn.jsdelivr.net/**',r=>r.fulfill({
     status:200,contentType:'text/javascript',body:'window.supabase=undefined;'}));
   await context.route('**/supabase.co/**',r=>r.abort());
   const page=await context.newPage(),runtimeErrors=[];
   page.on('pageerror',e=>runtimeErrors.push(String(e)));
   const origin='http://127.0.0.1:'+port;
   // Real app: login with no external authentication or data connections.
   await page.goto(origin+'/index.html',{waitUntil:'load',timeout:25000});
   await page.waitForTimeout(180);
   const real=await page.evaluate(()=>{
     const card=document.getElementById('authpanel').getBoundingClientRect();
     const head=document.querySelector('body>header');
     const width=window.innerWidth;
     return {
       season:document.documentElement.getAttribute('data-sags-season'),
       headerHidden:head&&getComputedStyle(head).display==='none',
       card:{x:card.x,y:card.y,right:card.right,bottom:card.bottom,width:card.width,height:card.height},
       htmlWidth:document.documentElement.scrollWidth,
       extraGreeting:document.querySelectorAll('.sags-festive-banner,.sags-festive-login-greet').length,
       loginBrand:document.querySelectorAll('#authpanel .sags-premium-login-brand').length,
       uiScripts:!!window.SagsFestiveThemeV337,logoLoaded:document.querySelector('#authpanel .sags-premium-login-brand img')?.naturalWidth>0,
       hasAuthInputs:!!document.getElementById('email')&&!!document.getElementById('password'),
       sdkLoaded:!!window.supabase?.createClient,
       loginStatus:(document.getElementById('authErr')?.textContent||'').trim(),
       loginBackdrop:getComputedStyle(document.querySelector('main.layout')).backgroundImage
     };
   });
   const problems=[];
   if(real.season!=='christmas')problems.push('Main season missing: '+real.season);
   if(!real.headerHidden)problems.push('Header visible on login');
   if(real.extraGreeting!==0)problems.push('Duplicate greeting nodes '+real.extraGreeting);
   if(real.loginBrand!==1||!real.logoLoaded)problems.push('Original SAGS login brand not loaded');
   if(!real.uiScripts||!real.hasAuthInputs)problems.push('Login core scripts or controls missing');
   if(!real.sdkLoaded)problems.push('Locally bundled Supabase auth library not loaded');
   if(!real.loginBackdrop.includes('banner.webp')||!real.loginBackdrop.includes('apron-night-v6494.webp'))
     problems.push('Login still uses old SAGS-labelled vehicle picture: '+real.loginBackdrop);
   if(/Không (kết nối|tải) được thư viện/.test(real.loginStatus))
    problems.push('Auth library load error visible: '+real.loginStatus);
   if(real.card.width<220||real.card.x<0||real.card.right>width+3)
    problems.push('Login card extends beyond viewport: '+JSON.stringify(real.card));
   if(real.htmlWidth>width+3)problems.push('Horizontal overflow: '+real.htmlWidth+' / '+width);
   await page.screenshot({path:path.join(dir,label+'-login.png'),fullPage:true});
   // Exercise the ACTUAL workspace mount using only a synthetic in-memory
   // identity. Network reads are blocked. This does not sign in or write data.
   let simulated;
   try{
     simulated=await page.evaluate(async()=>{
       me={id:'synthetic-ui-test',email:'qa@example.invalid',app_metadata:{}};
       unit='ADMIN';
       document.getElementById('authpanel').classList.add('hidden');
       document.getElementById('app').classList.remove('hidden');
       const ok=window.SagsWorkspaceV300?.mount();
       const outer=document.querySelector('main.layout');
       const shell=document.querySelector('#v300Root .v300-shell');
       const hero=document.querySelector('#v300Root .sags-premium-hero');
       const bounds=x=>{const r=x?.getBoundingClientRect();return r?{left:r.left,right:r.right,width:r.width,height:r.height}:null};
       return {
         mounted:ok,bodyReady:document.body.classList.contains('v300-ready'),
         outer:bounds(outer),shell:bounds(shell),
         winWidth:window.innerWidth,docWidth:document.documentElement.scrollWidth,
         heroImage:hero?getComputedStyle(hero).backgroundImage:'',
         heroOldBrand:hero?.querySelector('small')?getComputedStyle(hero.querySelector('small')).display:'none',
         headlineRepeat:hero?.querySelector('h2 span')?getComputedStyle(hero.querySelector('h2 span')).display:'none'
       };
     });
     if(!simulated.mounted||!simulated.bodyReady)problems.push('Production workspace mount did not enter authenticated layout');
     if(!simulated.shell||Math.abs(simulated.shell.width-width)>3)
       problems.push('Actual authenticated workspace not full width: '+JSON.stringify(simulated.shell));
     if(!simulated.outer||Math.abs(simulated.outer.width-width)>3)
       problems.push('Application outer layout still constrained by 1680px cap: '+JSON.stringify(simulated.outer));
     if(simulated.docWidth>width+3)problems.push('Authenticated workspace horizontally overflows: '+simulated.docWidth);
     if(!simulated.heroImage.includes('banner.webp'))
       problems.push('Old SAGS-marked aircraft photo still used as home hero: '+simulated.heroImage);
     if(simulated.heroOldBrand!=='none'||simulated.headlineRepeat!=='none')
       problems.push('Duplicate SAGS/holiday text still overlaid on image');
     await page.screenshot({path:path.join(dir,label+'-real-workspace.png'),fullPage:true});
     const returned=await page.evaluate(()=>{
       me=null;
       showLoginScreen();
       return {
         ready:document.body.classList.contains('v300-ready'),
         login:document.getElementById('authpanel').classList.contains('hidden'),
         header:getComputedStyle(document.querySelector('body>header')).display,
         app:document.getElementById('app').classList.contains('hidden')
       };
     });
     if(returned.ready||returned.login||returned.header!=='none'||!returned.app)
       problems.push('Login screen did not recover after exit: '+JSON.stringify(returned));
   }catch(err){problems.push('Production workspace simulation error: '+String(err).slice(0,300));}


   // Actual independently authored preview: all 3 tabs and theme switching.
   await page.goto(origin+'/festive-preview-v339.html',{waitUntil:'load',timeout:25000});
   await page.waitForTimeout(100);
   let preview=await page.evaluate(()=>({
     bannerCount:document.querySelectorAll('.sags-festive-banner').length,
     greetingCount:document.querySelectorAll('.sags-festive-login-greet').length,
     headerHidden:getComputedStyle(document.querySelector('body>header')).display==='none',
     width:document.documentElement.scrollWidth
   }));
   if(preview.bannerCount||preview.greetingCount)problems.push('Preview contains duplicate greeting/banner');
   if(!preview.headerHidden)problems.push('Preview login header duplicated');
   if(preview.width>width+3)problems.push('Preview login overflow');
   await page.getByRole('button',{name:'TRANG CHỦ'}).click();
   const home=await page.evaluate(()=>({
     visible:getComputedStyle(document.getElementById('v300Root')).display!=='none',
     hero:getComputedStyle(document.querySelector('#v300Root .sags-premium-hero')).display,
     loginShown:getComputedStyle(document.querySelector('body>header')).display==='none',
     cardColor:getComputedStyle(document.querySelector('#v300Root .v300-main')).color,
     loginLayerHidden:getComputedStyle(document.querySelector('main.layout')).display==='none',
     oldAuthHidden:getComputedStyle(document.getElementById('authpanel')).display==='none',
     overflow:document.documentElement.scrollWidth-window.innerWidth
   }));
   if(!home.visible||home.hero==='none'||home.loginShown||!home.loginLayerHidden||!home.oldAuthHidden)
     problems.push('Home tab/hero/header/login layer collision '+JSON.stringify(home));
   if(home.overflow>3)problems.push('Home horizontal overflow '+home.overflow);
   await page.screenshot({path:path.join(dir,label+'-home.png'),fullPage:true});
   await page.getByRole('button',{name:'ẢNH XE GIAO CA'}).click();
   try{await page.waitForFunction(()=>document.getElementById('shuttleSample').naturalWidth>0,{timeout:18000});}
   catch(e){problems.push('Shuttle sample failed to render: '+await page.locator('#shuttleSample').getAttribute('alt'));}
   const bus=await page.evaluate(()=>({width:document.getElementById('shuttleSample').naturalWidth,
     height:document.getElementById('shuttleSample').naturalHeight,
     overflow:document.documentElement.scrollWidth-window.innerWidth}));
   if(bus.width!==1300)problems.push('Shuttle sample unexpected size: '+bus.width);
   if(bus.height<915)problems.push('Shuttle card height too small, possible overlapping status text: '+bus.height);
   if(bus.overflow>3)problems.push('Shuttle horizontal overflow '+bus.overflow);
   await page.screenshot({path:path.join(dir,label+'-shuttle.png'),fullPage:true});
   await page.getByRole('button',{name:'GIAO DIỆN THƯỜNG'}).click();
   const normal=await page.evaluate(()=>document.documentElement.hasAttribute('data-sags-season'));
   if(normal)problems.push('Normal mode did not clear festive CSS attribute');
   await page.getByRole('button',{name:'TẾT DƯƠNG LỊCH'}).click();
   if(await page.evaluate(()=>document.documentElement.getAttribute('data-sags-season'))!=='newyear')
    problems.push('New Year switch not applied');
   if(runtimeErrors.length)problems.push('Uncaught runtime errors: '+runtimeErrors.join(' | ').slice(0,700));
   results.push({label,width,height,real,simulated,home,bus,problems});
   if(problems.length)failures.push({label,problems});
   await context.close();
  }
  fs.writeFileSync(path.join(dir,'qa-results.json'),JSON.stringify(results,null,2));
  for(const x of results){
   process.stdout.write('UI '+x.label+': '+(x.problems.length?'FAIL '+x.problems.join('; '):'PASS')+'\n');
  }
  assert.deepEqual(failures,[],'Browser UI regression failure');
  console.log('PASS V3.39: actual Chromium login/home/shuttle for desktop/tablet/phone/smallphone; no overlap or runtime errors');
 }finally{if(browser)await browser.close();await new Promise(ok=>app.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1});
