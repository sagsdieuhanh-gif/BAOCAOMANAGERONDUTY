'use strict';
/* V2.20: workflow-oriented shell over existing operational screens.
   Navigation delegates to the existing #tabs, never duplicates business logic. */
(function(root){
 const GROUPS=[
  {id:'overview',title:'TỔNG QUAN',icon:'⌂',subtitle:'Tình hình khai thác và những việc cần làm',items:[
    ['home','Bảng điều hành','⌂','Theo dõi nhanh'],
    ['quick','Bản tin nhanh','▤','Tổng hợp trong ngày']
  ]},
  {id:'input',title:'CẬP NHẬT',icon:'✎',subtitle:'Mỗi đơn vị cập nhật dữ liệu của mình',items:[
    ['sources','Lịch bay / Excel','▦','Nhập Lần 1 và Lần 2'],
    ['pvhk','Phòng PVHK','♙','Nhân sự, gate, booking'],
    ['pvsd','Phòng PVSĐ','⚙','Nhân sự, thiết bị phục vụ'],
    ['gse','Trang thiết bị','▣','Số xe khả dụng'],
    ['staff','Nhân sự theo ca','♧','Bố trí nguồn lực'],
    ['warehouse','Kho hàng','◫','Hành lý và hàng hóa'],
    ['qa_it','QA & IT','◇','Tình hình an toàn, kỹ thuật'],
    ['doorclose','Door Close','◷','Kiểm tra ngày trước']
  ]},
  {id:'analysis',title:'PHÂN TÍCH',icon:'◷',subtitle:'Nhận diện giờ cao điểm và nguy cơ chồng lấn',items:[
    ['radar','Peak Hours & Radar','▥','Theo giờ và theo 30 phút'],
    ['radar-report','Phân tích Radar','⌁','Báo cáo cao điểm chuyên biệt']
  ]},
  {id:'report',title:'BÁO CÁO',icon:'▤',subtitle:'Xem trước, kiểm tra và xuất file',items:[
    ['report','Báo cáo điều hành','▤','Word / PDF · Lần 1 và 2'],
    ['shuttle-report','Xe giao ca','▰','Bảng xe · PNG / PDF'],
    ['quick','Bản tin nhanh','▷','Bản tin trong ngày']
  ]},
  {id:'admin',title:'QUẢN TRỊ',icon:'⚙',subtitle:'Cấp quyền và quản lý tài khoản',items:[
    ['admin','Tài khoản','⚙','Dành riêng cho ADMIN']
  ]}
 ];
 const $=id=>document.getElementById(id);
 const doc=document;
 let current='overview',selected='home',mounted=false;
 const allowedGroup=g=>g.id!=='admin'||(typeof unit!=='undefined'&&unit==='ADMIN');
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
    '<div class="v220-menu" id="v220Menu"></div>';
   rootNode.appendChild(bar);
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
   $('v220Menu').addEventListener('click',e=>{
     const b=e.target.closest('[data-go]');
     if(!b)return;
     navigate(b.dataset.go);
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
   const g=GROUPS.find(x=>x.id===current)||GROUPS[0];
   doc.body.dataset.v220Group=g.id;
   $('v220GroupTitle').textContent=g.title;
   $('v220GroupSubtitle').textContent=g.subtitle;
   for(const b of $('v220Groups').querySelectorAll('[data-group]')){
     const active=b.dataset.group===current;b.classList.toggle('is-active',active);
     b.hidden=!allowedGroup(GROUPS.find(x=>x.id===b.dataset.group));
     b.setAttribute('aria-pressed',String(active));
   }
   $('v220Menu').replaceChildren();
   const seen=new Set();
   for(const [tab,label,icon,description] of g.items){
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
     if(old.classList.contains('hidden'))b.hidden=true;
     $('v220Menu').appendChild(b);
   }
   const chosen=g.items.find(x=>x[0]===selected);
   $('v220PageLabel').textContent=chosen?.[1]||'';
   updateKpis();
 }
 function updateKpis(){
   const kpis=$('kpis'),summary=$('movementComparison');
   if(kpis)kpis.classList.toggle('v220-compact-hide',current!=='overview');
   if(summary)summary.classList.toggle('v220-compact-hide',current!=='overview');
 }
 function changeGroup(group,openFirst){
   const g=GROUPS.find(x=>x.id===group);
   if(!g||!allowedGroup(g))return;
   current=g.id;
   if(openFirst)navigate(g.items[0][0]);else paint();
 }
 function navigate(tab){
   const old=$('tabs')?.querySelector('[data-tab="'+tab+'"]');
   if(!old||old.classList.contains('hidden'))return;
   old.click();
   sync(tab);
   const app=$('app');
   if(app&&root.scrollTo)try{root.scrollTo({top:Math.max(0,app.getBoundingClientRect().top+(root.scrollY||0)-12),behavior:'smooth'});}catch(e){}
 }
 function sync(tab){
   if(!mounted)mount();
   if(!mounted)return;
   const g=currentGroupForTab(tab);
   current=g.id;selected=tab;paint();
 }
 root.SagsFriendlyUIV220={mount,navigate,sync,changeGroup,refresh:paint,groups:GROUPS.map(x=>x.id)};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})(window);