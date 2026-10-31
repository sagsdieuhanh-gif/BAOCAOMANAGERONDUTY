'use strict';
/* V2.20: workflow-oriented shell over existing operational screens.
   Navigation delegates to the existing #tabs, never duplicates business logic. */
(function(root){
 const GROUPS=[
  {id:'overview',title:'TỔNG QUAN',icon:'⌂',subtitle:'Sản lượng, tình hình khai thác và công việc cần chú ý',items:[
    ['home','Tổng quan ngày','⌂','Thông tin tổng hợp']
  ]},
  {id:'input',title:'CẬP NHẬT',icon:'✎',subtitle:'Chọn đúng đơn vị hoặc dữ liệu cần nhập',items:[
    ['sources','Lịch bay / Excel','▦','Lần 1, Lần 2',false],
    ['norms','ĐỊNH MỨC NHÂN SỰ','▤','Nhập một lần theo loại tàu · cập nhật quân số theo ca',false],
    ['pvhk','Phòng PVHK','♙','Khách và check-in',false],
    ['pvsd','Phòng PVSĐ','⚙','Phục vụ sân đỗ',false],
    ['gse','Trang thiết bị','▣','Xe thang, Cobus, GSE',true],
    ['staff','Quân số theo ca','♧','Định biên và phân ca',true],
    ['warehouse','Kho hàng','◫','Hàng hóa, hành lý',true],
    ['qa_it','QA & IT','◇','An toàn, CNTT',true],
    ['doorclose','Door Close','◷','Ngày khai thác trước',true],
    ['admin','Phân quyền','⚙','Chỉ dành cho ADMIN',true]
  ]},
  {id:'analysis',title:'PHÂN TÍCH',icon:'◷',subtitle:'Peak Hours và Radar 30 phút',items:[
    ['radar','Peak Hours & Radar','▥','Cao điểm từng giờ / 30 phút']
  ]},
  {id:'report',title:'BÁO CÁO',icon:'▤',subtitle:'Xem trước và xuất đầy đủ Word, PDF, PNG',items:[
    ['report','Báo cáo điều hành','▤','Word / PDF · Lần 1–2'],
    ['shuttle-report','Xe giao ca','▰','PNG / PDF · Gợi ý xe'],
    ['quick','Bản tin nhanh','▷','Phát hành sơ bộ'],
    ['radar-report','Báo cáo Radar','⌁','Chi tiết cao điểm']
  ]}
 ];
 const $=id=>document.getElementById(id);
 const doc=document;
 let current='overview',selected='home',mounted=false;
 const isAdmin=()=>typeof unit!=='undefined'&&unit==='ADMIN';
 const access=()=>root.SagsRoleAccessV225;
 const role=()=>typeof unit==='undefined'?null:unit;
 const allowedGroup=g=>g.items.some(x=>access()?.canOpen(role(),x[0])??true);
 function makeButton(label,cls,meta){
   const b=doc.createElement('button');b.type='button';b.className=cls;b.textContent=label;
   Object.entries(meta||{}).forEach(([k,v])=>b.dataset[k]=v);
   return b;
 }
 function mount(){
   if(mounted)return;
   const rootNode=$('v220Hub'),legacy=$('tabs');
   if(!rootNode||!legacy)return;
   mounted=true;
   const bar=doc.createElement('div');bar.className='v220-nav-panel';bar.id='v220Nav';
   bar.innerHTML='<div class="v220-nav-head"><div><span class="v220-eyebrow">MANAGER ON DUTY</span><h2>Điều hành khai thác</h2><p>Chọn công việc cần thực hiện</p></div><span class="v220-nav-date">CXR · SAGS</span></div><div class="v220-groups" id="v220Groups"></div>'+
    '<div class="v220-current"><div><b id="v220GroupTitle"></b><span id="v220GroupSubtitle"></span></div><span id="v220PageLabel"></span></div>'+
    '<div class="v220-menu" id="v220Menu"></div><details id="v220Advanced" class="v220-advanced" hidden><summary>Nâng cao · Các chức năng ít dùng</summary><div class="v220-menu v220-advanced-grid" id="v220AdvancedMenu"></div></details>';
   rootNode.appendChild(bar);
   const comparison=$('movementComparison');
   if(comparison){
     const d=doc.createElement('details');d.id='v220Comparison';d.className='v220-comparison';
     const title=doc.createElement('summary');title.textContent='XEM THÊM · SO SÁNH SẢN LƯỢNG';
     d.appendChild(title);comparison.parentNode.insertBefore(d,comparison);d.appendChild(comparison);
   }
   const groups=$('v220Groups');
   for(const g of GROUPS){
     const b=makeButton(g.icon+'  '+g.title,'v220-group-btn',{group:g.id});
     b.setAttribute('aria-label',g.title);groups.appendChild(b);
   }
   groups.addEventListener('click',e=>{
     const b=e.target.closest('[data-group]');
     if(!b||!groups.contains(b))return;
     changeGroup(b.dataset.group,true);
   });
   for(const list of [$('v220Menu'),$('v220AdvancedMenu')])list.addEventListener('click',e=>{
     const b=e.target.closest('[data-go]');if(b)navigate(b.dataset.go);
   });
   const shown=legacy.querySelector('[data-tab].active')?.dataset.tab||'home';
   sync(shown);
   updateKpis();
 }
 function currentGroupForTab(tab){
   const match=GROUPS.find(g=>g.id===current&&g.items.some(x=>x[0]===tab));
   return match||GROUPS.find(g=>g.items.some(x=>x[0]===tab)&&allowedGroup(g))||GROUPS[0];
 }
 function paint(){
   if(!mounted)return;
   const g=GROUPS.find(x=>x.id===current&&allowedGroup(x))
     ||GROUPS.find(allowedGroup)||GROUPS[0];
   current=g.id;
   doc.body.dataset.v220Group=g.id;
   $('v220GroupTitle').textContent=g.title;
   $('v220GroupSubtitle').textContent=g.subtitle;
   for(const b of $('v220Groups').querySelectorAll('[data-group]')){
     const active=b.dataset.group===current;b.classList.toggle('is-active',active);
     b.hidden=!allowedGroup(GROUPS.find(x=>x.id===b.dataset.group));
     b.setAttribute('aria-pressed',String(active));
   }
   $('v220Menu').replaceChildren();$('v220AdvancedMenu').replaceChildren();
   const seen=new Set();let advancedCount=0;
   for(const [tab,label,icon,description,isAdvanced=false] of g.items){
     if(seen.has(tab))continue;seen.add(tab);
     const old=$('tabs').querySelector('[data-tab="'+tab+'"]');
     if(!old)continue;
     const b=doc.createElement('button');b.type='button';b.className='v220-task';
     b.dataset.go=tab;b.setAttribute('aria-label',label);
     b.innerHTML='<span class="v220-task-icon" aria-hidden="true"></span><span class="v220-task-text"><strong></strong><small></small></span><span class="v220-task-arrow" aria-hidden="true">›</span>';
     b.querySelector('.v220-task-icon').textContent=icon;
     b.querySelector('strong').textContent=label;
     b.querySelector('small').textContent=description;
     b.classList.toggle('is-selected',selected===tab);
     if(!(access()?.canOpen(role(),tab)??true))continue;
     if(isAdvanced){$('v220AdvancedMenu').appendChild(b);advancedCount++;}else $('v220Menu').appendChild(b);
   }
   $('v220Advanced').hidden=advancedCount===0;
   if(g.items.find(x=>x[0]===selected)?.[4])$('v220Advanced').open=true;
   const chosen=g.items.find(x=>x[0]===selected);
   $('v220PageLabel').textContent=chosen?.[1]||'';
   updateKpis();
 }
 function updateKpis(){
   const kpis=$('kpis'),summary=$('movementComparison'),detail=$('v220Comparison');
   // The legacy KPI row repeats the same arrival/departure/peak numbers in v19Home.
   if(kpis)kpis.classList.add('v220-compact-hide');
   if(summary)summary.classList.remove('v220-compact-hide');
   if(detail)detail.hidden=current!=='overview';
 }
 function changeGroup(group,openFirst){
   const g=GROUPS.find(x=>x.id===group);
   if(!g||!allowedGroup(g))return;
   current=g.id;
   if($('v220Advanced'))$('v220Advanced').open=false;
   const target=g.items.find(x=>access()?.canOpen(role(),x[0])??true)?.[0];
   if(openFirst&&target)navigate(target);else paint();
 }
 function navigate(tab){
   const old=$('tabs')?.querySelector('[data-tab="'+tab+'"]');
   if(!old||!(access()?.canOpen(role(),tab)??true))return;
   old.click();
   sync(tab);
   const app=$('app');
   if(app&&root.scrollTo)try{root.scrollTo({top:Math.max(0,app.getBoundingClientRect().top+(root.scrollY||0)-12),behavior:'smooth'});}catch(e){}
 }
 function sync(tab){
   if(!mounted)mount();
   if(!mounted)return;
   const g=currentGroupForTab(tab);
   if(!(access()?.canOpen(role(),tab)??true))return;
   current=g.id;selected=tab;paint();
 }
 root.SagsFriendlyUIV220={mount,navigate,sync,changeGroup,refresh:paint,groups:GROUPS.map(x=>x.id),routes:GROUPS.map(x=>({id:x.id,tabs:x.items.map(y=>y[0])}))};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})(window);