'use strict';
/* V3.37 — single seasonal controller with responsive controls. One source of truth for Christmas/New Year,
   no duplicate greetings/banner on login, no modifications to business data. */
(function(root){
  const key='sags:mod:festive:2026';
  const day=new Date(Date.now()+7*3600000).toISOString().slice(0,10);
  const season=day>='2026-11-27'&&day<='2026-12-26'?'christmas':
    day>='2026-12-27'&&day<='2027-01-03'?'newyear':'';
  let enabled=true;
  try{enabled=root.localStorage?.getItem(key)!=='off'}catch(_){}
  const greeting=season==='newyear'?'Happy New Year 2027':'Merry Christmas';
  const active=()=>Boolean(season&&enabled);
  const make=(tag,cls,t)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(t)el.textContent=t;
    return el;
  };
  function button(label,cls,cb){
    const item=make('button',cls,label);
    item.type='button';
    item.addEventListener('click',cb);
    return item;
  }
  function changeTheme(){
    enabled=!enabled;
    try{root.localStorage?.setItem(key,enabled?'on':'off')}catch(_){}
    render();
  }
  function showSample(){
    const preview=root.SagsShuttleExport?.previewSeasonalSample;
    if(typeof preview!=='function'){
      root.alert?.('Bộ xuất ảnh xe giao ca chưa sẵn sàng. Hãy tải lại trang.');
      return;
    }
    Promise.resolve().then(()=>preview()).catch(err=>root.alert?.(err?.message||String(err)));
  }
  function putButtons(parent,attr){
    if(!parent)return;
    let toggle=parent.querySelector('[data-festive-toggle]');
    if(!toggle){
      toggle=button('','sags-festive-toggle',changeTheme);
      toggle.setAttribute('data-festive-toggle','');
      toggle.setAttribute('data-festive-slot',attr);
      parent.appendChild(toggle);
    }
    if(attr==='workspace'&&!parent.querySelector('[data-festive-preview]')){
      const preview=button('🚌 XEM MẪU ẢNH XE','sags-festive-preview-button',showSample);
      preview.setAttribute('data-festive-preview','');
      parent.insertBefore(preview,toggle);
    }
  }
  function render(){
    if(!season)return;
    const html=document.documentElement;
    html.setAttribute('data-sags-season-window',season);
    if(active())html.setAttribute('data-sags-season',season);
    else html.removeAttribute('data-sags-season');
    // Remove outdated DOM from V3.34/V3.35 if the controller runs after an update.
    // The original E-REPORT apron image already contains "Merry Christmas".
    document.querySelectorAll('.sags-festive-banner,.sags-festive-login-greet').forEach(n=>n.remove());
    const header=document.querySelector('body>header');
    const headerLogo=header?.querySelector('.v23-site-brand img');
    if(headerLogo){
      if(!headerLogo.dataset.sagsNormalSrc)
        headerLogo.dataset.sagsNormalSrc=headerLogo.getAttribute('src')||'./assets/logo-sags.png';
      const wanted=active()?'./assets/branding/logo.png':headerLogo.dataset.sagsNormalSrc;
      if(headerLogo.getAttribute('src')!==wanted)headerLogo.setAttribute('src',wanted);
    }
    const login=document.getElementById('authpanel');
    if(login){
      if(!login.querySelector('.sags-premium-login-brand')){
        const brand=make('div','sags-premium-login-brand');
        const logo=make('img','');
        logo.src='./assets/branding/logo.png';logo.alt='Logo SAGS';
        const title=make('b','','MANAGER ON DUTY · SAGS CXR');
        brand.append(logo,title);
        login.insertBefore(brand,login.firstChild);
      }
      putButtons(login,'login');
    }
    putButtons(document.getElementById('accountVersionRow')||header,'workspace');
    for(const item of document.querySelectorAll('[data-festive-toggle]')){
      item.textContent=active()?'☀ GIAO DIỆN THƯỜNG':'🎄 BẬT GIAO DIỆN LỄ HỘI';
      item.setAttribute('aria-pressed',String(active()));
      item.setAttribute('aria-label',active()?'Tắt trang trí lễ hội':'Bật trang trí lễ hội');
    }
    const home=document.getElementById('sagsPremiumGreeting');
    if(home)home.textContent=greeting;
  }
  root.SagsFestiveThemeV337={
    currentSeason:()=>active()?season:'',
    windowSeason:()=>season,
    enabled:active,
    refresh:render,
    toggle:changeTheme
  };
  if(season){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});
    else render();
    root.addEventListener('pageshow',render,{passive:true});
  }
})(typeof window!=='undefined'?window:globalThis);
