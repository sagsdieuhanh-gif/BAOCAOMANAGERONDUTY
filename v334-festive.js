'use strict';
/* V3.34: match E-REPORT-SAGS V1.2 seasonal window, palette and opt-out.
   This file only adds presentation; it never reads/writes operational records. */
(function(root){
  const key='sags:mod:festive:2026';
  const day=new Date(Date.now()+7*60*60*1000).toISOString().slice(0,10);
  const season=day>='2026-11-27'&&day<='2026-12-26'?'christmas':
    day>='2026-12-27'&&day<='2027-01-03'?'newyear':'';
  let enabled=true;
  try{enabled=root.localStorage?.getItem(key)!=='off'}catch(_){}
  const title=season==='newyear'?'Happy New Year 2027':'Merry Christmas';
  const subtitle=season==='newyear'?'Chúc năm mới bình an · thành công':'& Happy New Year 2027';
  const el=(tag,cls,str)=>{
    const item=document.createElement(tag);
    if(cls)item.className=cls;
    if(str)item.textContent=str;
    return item;
  };
  const active=()=>!!(season&&enabled);
  function decorate(){
    if(!season)return;
    const html=document.documentElement;
    html.setAttribute('data-sags-season-window',season);
    if(active())html.setAttribute('data-sags-season',season);
    else html.removeAttribute('data-sags-season');
    let banner=document.getElementById('sagsFestiveBannerV334');
    const header=document.querySelector('body>header');
    if(header&&!banner){
      banner=el('div','sags-festive-banner');
      banner.id='sagsFestiveBannerV334';
      banner.setAttribute('aria-label','Lời chúc Giáng sinh và năm mới từ SAGS CXR');
      banner.appendChild(el('span','sags-festive-spark','✦'));
      banner.appendChild(el('strong','',title));
      banner.appendChild(el('span','',subtitle));
      banner.appendChild(el('span','sags-festive-spark','✧'));
      header.insertAdjacentElement('afterend',banner);
    }
    if(banner)banner.hidden=!active();
    const account=document.getElementById('accountVersionRow')||header;
    if(account&&!account.querySelector('[data-sags-festive-toggle]')){
      const button=el('button','sags-festive-toggle');
      button.type='button';
      button.setAttribute('data-sags-festive-toggle','');
      button.addEventListener('click',()=>{
        enabled=!enabled;
        try{root.localStorage?.setItem(key,enabled?'on':'off')}catch(_){}
        decorate();
      });
      account.insertBefore(button,account.firstChild);
      const preview=el('button','sags-festive-preview-button','🚌 XEM MẪU ẢNH XE');
      preview.type='button';
      preview.addEventListener('click',()=>{
        const fn=root.SagsShuttleExport?.previewSeasonalSample;
        if(typeof fn==='function')Promise.resolve(fn()).catch(err=>alert(err?.message||String(err)));
        else alert('Chưa tải được trình tạo ảnh xe giao ca. Hãy tải lại trang.');
      });
      account.insertBefore(preview,button.nextSibling);
    }
    const toggle=document.querySelector('[data-sags-festive-toggle]');
    if(toggle){
      toggle.textContent=active()?'☀ GIAO DIỆN THƯỜNG':'🎄 BẬT LỄ HỘI';
      toggle.setAttribute('aria-pressed',active()?'true':'false');
      toggle.setAttribute('aria-label',active()?'Tắt giao diện lễ hội':'Bật giao diện lễ hội');
    }
  }
  root.SagsFestiveThemeV334={
    currentSeason:()=>active()?season:'',
    windowSeason:()=>season,
    enabled:active,
    refresh:decorate
  };
  if(season){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});
    else decorate();
    root.addEventListener('pageshow',decorate,{passive:true});
  }
})(typeof window!=='undefined'?window:globalThis);
