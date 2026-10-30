'use strict';
/* SAGS-CXR Radar report V2.8: daily overview, >=4-pair peak episodes, DOCX/PDF.
   Read-only derived report; no changes to flight data or confirmation workflow. */
(function(root){
  const $=id=>document.getElementById(id);
  const base=root.SagsReportV19;
  if(!base)return;
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clock=m=>m==null?'—':String(Math.floor((m%1440)/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')+(m>=1440?' +1':'');
  const dateVN=x=>x?x.slice(8,10)+'/'+x.slice(5,7)+'/'+x.slice(0,4):'—';
  const flightId=f=>(f.arrival||'—')+' / '+(f.departure||'—');
  const carrier=f=>(f.airline||String(f.arrival||f.departure||'').match(/^[A-Z0-9]+?(?=\d)/)?.[0]||'').toUpperCase();
  const isWide=f=>/330|777|787|350|747|380/.test(f.aircraft_type||'');
  const area=f=>[31,32,33,34,35,36,37,51,52,53,54,55].includes(Number(f.bay))?'K1':[38,39,40,41,42].includes(Number(f.bay))?'K2':Number(f.bay)>=56&&Number(f.bay)<=71?'K3':'?';
  const serviceMinutes=f=>{
    const a=carrier(f);
    if(['VJ','9G','VU','AK','FD'].includes(a))return 30;
    if(['KE','OZ','BX','TW','RF','LJ','ZE','RS','7C','YP'].includes(a))return 60;
    return Number.isFinite(f.sta_min)&&Number.isFinite(f.std_min)?Math.max(0,(f.std_min<f.sta_min?f.std_min+1440:f.std_min)-f.sta_min):0;
  };
  function interval(f){
    const n=serviceMinutes(f);
    if(n<=0)return null;
    const a=Number.isFinite(f.sta_min)?f.sta_min:null;
    const b=Number.isFinite(f.std_min)?f.std_min:null;
    let start=a==null?(b==null?null:b-n):a;
    if(start==null)return null;
    let end=start+n;
    if(a!=null&&b!=null)end=Math.min(end,b<a?b+1440:b);
    return end>start?{f,start,end,estimated:a==null}:null;
  }
  function analyze(rows,revision){
    const intervals=(rows||[]).map(interval).filter(Boolean);
    const maxEnd=Math.max(1440,...intervals.map(x=>x.end));
    const windows=[];
    for(let s=0;s<Math.min(2880,maxEnd);s+=5){
      const active=intervals.filter(x=>x.start<s+30&&x.end>s);
      windows.push({s,n:active.length,items:active});
    }
    const halfHours=Array.from({length:48},(_,i)=>({s:i*30,n:windows.filter(w=>w.s>=i*30&&w.s<i*30+30).reduce((m,w)=>Math.max(m,w.n),0)}));
    const peaks=windows.filter(w=>w.n>=4);
    const episodes=[];
    for(const w of peaks){
      let e=episodes.at(-1);
      if(!e||w.s!==e.last+5){e={from:w.s,last:w.s,to:w.s+30,peak:w,windows:[],members:new Set()};episodes.push(e);}
      e.last=w.s;e.to=w.s+30;e.windows.push(w);
      if(w.n>e.peak.n)e.peak=w;
      w.items.forEach(i=>e.members.add(i));
    }
    for(const e of episodes){
      e.items=[...e.members].sort((a,b)=>a.start-b.start);
      e.alerts=[];
      e.alerts.push({level:'Theo dõi',kind:'Mật độ phục vụ',detail:'Đỉnh '+e.peak.n+' cặp trong khung '+clock(e.peak.s)+'–'+clock(e.peak.s+30)+'. Đây là số cặp giao với cửa sổ 30 phút, không phải số GSE thực tế đang chiếm dụng.',action:'ĐH phối hợp PVSĐ/PVHK rà soát phân công và khả năng phục vụ theo mốc.'});
      const hot=e.peak.items.map(x=>x.f);
      const outer=hot.filter(f=>['K2','K3'].includes(area(f)));
      if(outer.length)e.alerts.push({level:'Cần rà soát',kind:'Bãi đỗ / đường công vụ',detail:outer.map(f=>flightId(f)+' · bãi '+f.bay+' ('+area(f)+')').join('; '),action:'Kiểm tra tuyến di chuyển, thời điểm tàu lăn/pushback và phương án GSE; không mặc định đường đang bị chặn.'});
      const wide=hot.filter(isWide);
      if(wide.length)e.alerts.push({level:'Cần rà soát',kind:'Tàu thân rộng',detail:wide.map(f=>flightId(f)+' · '+(f.aircraft_type||'chưa rõ loại')).join('; '),action:'PVSĐ xác nhận năng lực, tính tương thích và tình trạng khả dụng của GSE theo đúng loại tàu.'});
      const noBay=hot.filter(f=>f.bay==null||f.bay==='');
      if(noBay.length)e.alerts.push({level:'Chờ xác nhận',kind:'Vị trí đỗ',detail:revision===1?'Lần 1 chưa có bãi đỗ; '+noBay.length+' cặp trong khung đỉnh chưa thể phân tích theo khu vực.':noBay.length+' cặp trong khung đỉnh thiếu vị trí đỗ.',action:'ĐH cập nhật bãi từ lịch AOC khi có nguồn xác nhận.'});
      const cargo=hot.filter(f=>!f.cargo_status||f.cargo_status==='UNKNOWN');
      if(cargo.length)e.alerts.push({level:'Chờ xác nhận',kind:'Hành lý / cargo',detail:cargo.length+' cặp chưa xác nhận trạng thái cargo.',action:'Kho Hàng/PVSĐ xác minh cargo trước khi tính phương án nhân lực; không tự kết luận đủ/thiếu.'});
      const short=hot.filter(f=>Number.isFinite(f.sta_min)&&Number.isFinite(f.std_min)&&serviceMinutes(f)>0&&((f.std_min<f.sta_min?f.std_min+1440:f.std_min)-f.sta_min)<serviceMinutes(f));
      if(short.length)e.alerts.push({level:'Cần rà soát',kind:'Ground-time theo lịch',detail:short.map(f=>flightId(f)).join(', ')+' có ground-time ngắn hơn thời lượng phục vụ quy ước.',action:'ĐH/KTSĐ kiểm soát tiến độ công đoạn; không suy ra thời điểm GSE rảnh từ STD.'});
      const estimated=e.peak.items.filter(x=>x.estimated);
      if(estimated.length)e.alerts.push({level:'Chờ xác nhận',kind:'Giờ phục vụ suy tính',detail:estimated.length+' cặp thiếu STA; khoảng dự báo được suy tính từ STD và thời lượng quy ước.',action:'Rà soát STA/STD lịch nguồn trước khi phát hành chính thức.'});
      e.level=e.alerts.some(a=>a.level==='Cần rà soát')?'CẦN RÀ SOÁT':e.alerts.some(a=>a.level==='Chờ xác nhận')?'CHỜ XÁC NHẬN':'THEO DÕI';
    }
    return {intervals,windows,halfHours,episodes,peak:windows.reduce((a,w)=>w.n>a.n?w:a,{s:0,n:0}),unusable:(rows||[]).filter(f=>!interval(f)).length};
  }
  async function model(){
    const c=await base.source();
    const {data,error}=await sb.from('ops_forecast_snapshots').select('payload,source_filename')
      .eq('service_date',c.date).eq('revision',2).maybeSingle();
    if(error)throw Error('Không kiểm tra được lịch Lần 2: '+error.message);
    c.revision=1;
    if(data?.payload?.flights?.length){
      c.rows=data.payload.flights;c.revision=2;c.sourceFile=data.source_filename||'Lịch Lần 2';
      const cnt=(name,fallback)=>Number.isInteger(data.payload[name])?data.payload[name]:Number.isInteger(data.payload.totals?.[name])?data.payload.totals[name]:fallback;
      c.arrivals=cnt('arrival_count',c.rows.filter(f=>f.arrival).length);
      c.departures=cnt('departure_count',c.rows.filter(f=>f.departure).length);
      c.domestic=cnt('domestic_count',null);c.international=cnt('international_count',null);
    }
    const d=base.build(c);
    d.radar=analyze(c.rows,c.revision);
    return d;
  }
  function dailySvg(d){
    const bars=d.radar.halfHours,w=1152,h=254,left=42,right=22,top=37,bottom=40,plot=h-top-bottom;
    const max=Math.max(4,Math.ceil((d.radar.peak.n||0)/2)*2);
    let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="1152" height="254" role="img" aria-label="Radar 30 phút toàn ngày">';
    s+='<rect width="'+w+'" height="'+h+'" fill="#f8fbfe"/><text x="16" y="22" font-size="16" font-family="Arial" font-weight="bold" fill="#173d5f">RADAR 30 PHÚT TOÀN NGÀY – CẶP CHUYẾN THEO KHUNG</text>';
    for(let i=0;i<=max;i+=2){const y=top+plot*(1-i/max);s+='<line x1="'+left+'" y1="'+y+'" x2="'+(w-right)+'" y2="'+y+'" stroke="#e2eaf0"/><text x="12" y="'+(y+4)+'" font-size="12" font-family="Arial" fill="#577084">'+i+'</text>';}
    const bw=(w-left-right)/48;
    bars.forEach((b,i)=>{const bh=b.n/max*plot,x=left+bw*i+2,y=top+plot-bh;s+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+Math.max(3,bw-4).toFixed(1)+'" height="'+Math.max(1,bh).toFixed(1)+'" rx="2" fill="'+(b.n>=4?'#dc9234':b.n>0?'#287ca8':'#dce7ef')+'"/>';});
    for(let h=0;h<24;h+=2){const x=left+bw*h*2;s+='<text x="'+x+'" y="'+(top+plot+19)+'" font-size="12" font-family="Arial" fill="#486277">'+String(h).padStart(2,'0')+':00</text>';}
    s+='<text x="'+(w-18)+'" y="'+(h-12)+'" font-size="12" text-anchor="end" fill="#52677a" font-family="Arial">Xanh: 1–3 cặp · Cam: ≥4 cặp · Trục số lượng tính theo đỉnh cửa sổ 5 phút trong mỗi nửa giờ</text></svg>';
    return s;
  }
  function episodeSvg(e){
    const rows=e.peak.items.slice(0,20),w=1152,left=230,right=30,h=66+rows.length*32,scale=(w-left-right)/30;
    let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'">';
    s+='<rect width="'+w+'" height="'+h+'" fill="#f8fbfe"/><text x="12" y="20" font-family="Arial" font-size="16" font-weight="bold" fill="#173d5f">ĐỈNH '+esc(clock(e.peak.s))+'–'+esc(clock(e.peak.s+30))+' · '+e.peak.n+' CẶP TRONG KHUNG</text>';
    rows.forEach((x,i)=>{let y=37+i*32;const start=Math.max(0,(x.start-e.peak.s)*scale),end=Math.min(w-left-right,(x.end-e.peak.s)*scale);
      s+='<text x="12" y="'+(y+14)+'" font-family="Arial" font-size="13" fill="#26435b">'+esc(flightId(x.f))+'</text><rect x="'+left+'" y="'+(y-2)+'" width="'+(w-left-right)+'" height="21" fill="#e9f0f5"/>';
      s+='<rect x="'+(left+start)+'" y="'+y+'" width="'+Math.max(2,end-start)+'" height="17" rx="3" fill="'+(['K2','K3'].includes(area(x.f))?'#e2a047':'#2c84af')+'"/>';
    });
    for(let t=0;t<=30;t+=10){const x=left+t*scale;s+='<line x1="'+x+'" x2="'+x+'" y1="31" y2="'+(h-24)+'" stroke="#d1dfe9"/><text x="'+x+'" y="'+(h-7)+'" text-anchor="middle" font-family="Arial" font-size="12" fill="#52677a">'+esc(clock(e.peak.s+t))+'</text>';}
    return s+'</svg>';
  }
  function table(headers,rows){
    return '<table class="r28-table"><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x).replace(/\n/g,'<br>')+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  }
  function alertRows(e){
    return e.alerts.map(a=>[a.level,a.kind,a.detail,a.action]);
  }
  function reportHtml(d){
    const r=d.radar,c=d.c,events=r.episodes;
    let out='<div class="r28-sheet"><header class="r28-header"><strong>SAGS · CẢNG HÀNG KHÔNG QUỐC TẾ CAM RANH</strong><h2>BÁO CÁO DỰ BÁO ĐIỀU HÀNH – RADAR V2.8</h2><p>Ngày '+esc(dateVN(c.date))+' · DỰ BÁO LẦN '+c.revision+' · Nguồn: '+esc(c.sourceFile||'chưa ghi tên file')+' · Người lập: '+esc(c.author)+'</p></header>';
    out+='<section class="r28-section"><h3>I. TÓM TẮT KHAI THÁC</h3><div class="r28-kpis"><div><b>'+c.arrivals+'</b><span>Chuyến đến</span></div><div><b>'+c.departures+'</b><span>Chuyến đi</span></div><div><b>'+r.peak.n+'</b><span>Đỉnh cặp / 30 phút</span></div><div><b>'+events.length+'</b><span>Đợt cao điểm ≥4 cặp</span></div></div><p>'+esc(d.summary)+'</p><p>'+esc(d.comparison).replace(/\n/g,'<br>')+'</p><div class="r28-chart">'+dailySvg(d)+'</div><p class="r28-note">Radar toàn ngày: cửa sổ 30 phút trượt từng 5 phút; mỗi cặp đến–đi tính một lần. Cam = từ 4 cặp. Không suy ra thời điểm GSE được giải phóng từ STD.</p></section>';
    if(d.alerts?.length)out+='<section class="r28-section"><h3>THÔNG TIN CHỜ CÁC ĐƠN VỊ XÁC NHẬN</h3>'+table(['Đơn vị','Nhóm dữ liệu','Nội dung còn thiếu'],d.alerts.map(a=>[a.unit,a.type,a.detail]))+'</section>';
    out+='<section class="r28-section"><h3>II. BẢNG KIỂM SOÁT NGHIỆP VỤ</h3>'+table(['Nội dung','Nhận định','Phương án phục vụ'],d.topics.map(x=>[x.title,x.observation,x.action]))+'</section>';
    out+='<section class="r28-section"><h3>III. RADAR CHI TIẾT CÁC ĐỢT CAO ĐIỂM ≥4 CẶP</h3><p class="r28-note">Phân tích cửa sổ 30 phút trượt từng 5 phút; mỗi cặp đến–đi chỉ tính một lần trong cùng cửa sổ. Khoảng phục vụ quy ước: VJ/9G/VU/AK/FD 30 phút; hãng Hàn Quốc 60 phút; hãng khác theo lịch. Không suy ra GSE được giải phóng tại STD.</p><p><b>Đỉnh:</b> '+esc(clock(r.peak.s))+'–'+esc(clock(r.peak.s+30))+' ('+r.peak.n+' cặp) · <b>Số đợt ≥4 cặp:</b> '+events.length+' · <b>Hồ sơ thiếu cơ sở tính thời lượng:</b> '+r.unusable+'.</p></section>';
    if(!events.length)out+='<section class="r28-section"><p>Không phát hiện khung từ 4 cặp phục vụ trở lên theo lịch nguồn và quy tắc đã chọn.</p></section>';
    events.forEach((e,i)=>{
      out+='<section class="r28-section r28-episode"><h3>III.'+(i+1)+' CAO ĐIỂM '+esc(clock(e.from))+'–'+esc(clock(e.to))+' · ĐỈNH '+e.peak.n+' CẶP <span class="r28-state">'+esc(e.level)+'</span></h3>';
      out+='<p>Khung đỉnh: '+esc(clock(e.peak.s))+'–'+esc(clock(e.peak.s+30))+'. Có '+e.items.length+' hồ sơ từng xuất hiện trong đợt, '+e.peak.items.length+' hồ sơ trong khung đỉnh.</p><div class="r28-chart">'+episodeSvg(e)+'</div>';
      out+=table(['Cặp chuyến (đến / đi)','STA / STD','Bãi / khu','Loại tàu','Thời lượng quy ước'],e.peak.items.map(x=>[flightId(x.f),clock(x.f.sta_min)+' / '+clock(x.f.std_min),x.f.bay==null?'CHỜ XÁC NHẬN':x.f.bay+' / '+area(x.f),x.f.aircraft_type||'Chưa xác nhận',serviceMinutes(x.f)+' phút']));
      out+='<h4>CẢNH BÁO VÀ HÀNH ĐỘNG – NGAY DƯỚI RADAR</h4>'+table(['Mức','Nội dung','Cơ sở / nguy cơ cần rà soát','Hành động điều phối'],alertRows(e))+'</section>';
    });
    out+='<section class="r28-section"><h3>III. TỔNG HỢP CẢNH BÁO TOÀN NGÀY</h3>'+(
      events.length?table(['Đợt cao điểm','Mức','Nhóm cảnh báo','Yêu cầu'],events.flatMap(e=>e.alerts.map(a=>[clock(e.from)+'–'+clock(e.to),a.level,a.kind,a.action]))):'<p>Không có đợt cao điểm thuộc ngưỡng báo cáo.</p>')+'</section>';
    out+='<section class="r28-section"><h3>IV. PHỐI HỢP THỰC HIỆN</h3>'+table(['Nội dung phối hợp','Yêu cầu / phương án','Đơn vị','Thời hạn'],d.coord)+'</section>';
    out+='<section class="r28-section"><h3>V. KIẾN NGHỊ BAN TGĐ</h3><p>'+esc(d.recommendation)+'</p><p class="r28-note">Phân loại “Theo dõi/Cần rà soát/Chờ xác nhận” dựa trên dữ liệu hiện có; không tự kết luận thiếu người, thiếu GSE hay gián đoạn đường công vụ. Dữ liệu chưa xác nhận cần bổ sung trước khi chốt phương án.</p></section></div>';
    return out;
  }
  function ensureStyles(){
    if($('r28-style'))return;
    const el=document.createElement('style');el.id='r28-style';el.textContent=
      '.r28-sheet{font:13px/1.45 Arial,sans-serif;color:#18384e;background:#fff;max-width:1180px;margin:12px auto;padding:16px}.r28-header{text-align:center;border-bottom:3px solid #1b779f;padding:12px}.r28-header strong{color:#176786}.r28-header h2{font-size:21px;margin:8px 0}.r28-section{margin:20px 0;break-inside:auto}.r28-section h3{font-size:15px;background:#eaf3f8;color:#174563;border-left:5px solid #1781ae;padding:8px;margin:0 0 9px}.r28-section h4{margin:10px 0 6px;color:#a26415}.r28-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.r28-kpis>div{border:1px solid #ccdfeb;text-align:center;padding:12px;background:#f3f8fb}.r28-kpis b{font-size:28px;display:block;color:#19547a}.r28-kpis span{font-size:12px}.r28-table{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;margin:8px 0}.r28-table th{background:#1a506e;color:white;border:1px solid #7697aa;padding:7px;text-align:left}.r28-table td{border:1px solid #bfccd6;padding:6px;vertical-align:top;overflow-wrap:anywhere}.r28-table tr{break-inside:avoid}.r28-chart{max-width:100%;overflow:hidden;border:1px solid #d8e3eb;background:#f8fbfe;margin:8px 0}.r28-chart svg{width:100%;height:auto;display:block}.r28-note{font-size:11px;color:#5a6e7f}.r28-state{color:#a2681b;font-size:12px}.r28-episode{break-inside:avoid-page;border-top:2px solid #b9d6e5;padding-top:9px}@media print{.r28-sheet{max-width:none;margin:0;padding:0}.r28-episode{break-inside:avoid-page}}';
    document.head.appendChild(el);
  }
  let loading=null;
  async function loadOnce(){
    if(!loading)loading=model().finally(()=>{loading=null});
    return loading;
  }
  async function preview(){
    const el=$('v19ReportPreview');if(!el)return;
    el.innerHTML='<p class="v19-small">Đang tổng hợp Radar theo lịch nguồn…</p>';
    const requested=$('day')?.value;
    try{
      const d=await loadOnce();
      if($('day')?.value!==requested)return;
      ensureStyles();el.innerHTML=reportHtml(d);
    }catch(e){el.innerHTML='<div class="v19-callout">'+esc(e.message)+'</div>';}
  }
  let docxPromise,pdfPromise;
  function getScript(url,test,label){
    return new Promise((resolve,reject)=>{
      if(test())return resolve(test());
      const script=document.createElement('script');script.src=url;
      script.onload=()=>test()?resolve(test()):reject(Error('Không khởi tạo được '+label+'.'));
      script.onerror=()=>reject(Error('Không tải được thư viện '+label+'; kiểm tra kết nối Internet.'));
      document.head.appendChild(script);
    });
  }
  function docxLib(){
    if(!docxPromise)docxPromise=getScript('https://cdn.jsdelivr.net/npm/docx@9.4.1/dist/index.umd.cjs',()=>root.docx?.Document?root.docx:null,'Word').catch(e=>{docxPromise=null;throw e});
    return docxPromise;
  }
  function pdfLib(){
    if(!pdfPromise)pdfPromise=getScript('https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',()=>root.html2pdf||null,'PDF').catch(e=>{pdfPromise=null;throw e});
    return pdfPromise;
  }
  async function pngData(svg){
    const image=new Image();
    const data='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Không tạo được ảnh Radar.'));image.src=data});
    const canvas=document.createElement('canvas');canvas.width=1380;
    canvas.height=Math.round(image.height*canvas.width/image.width);
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    const raw=atob(canvas.toDataURL('image/png').split(',')[1]);
    const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return {bytes,width:canvas.width,height:canvas.height};
  }
  async function wordDoc(d,D){
    const border={style:D.BorderStyle.SINGLE,color:'B7CCD9',size:4};
    const edges={top:border,bottom:border,left:border,right:border};
    const para=(t,opt={})=>new D.Paragraph({alignment:opt.center?D.AlignmentType.CENTER:D.AlignmentType.LEFT,
      spacing:{before:opt.before||0,after:opt.after??80},keepWithNext:!!opt.keep,
      children:String(t==null?'':t).split('\n').map((line,i)=>new D.TextRun({text:line,break:i?1:0,font:'Arial',bold:!!opt.bold,size:opt.size||19,color:opt.color||'213E53'}))});
    const hd=t=>para(t,{size:23,bold:true,color:'175477',before:200,after:100,keep:true});
    function tab(head,rows,widths){
      const cell=(v,isHead)=>new D.TableCell({borders:edges,shading:isHead?{fill:'185576'}:undefined,
        margins:{top:70,bottom:70,left:80,right:80},children:[para(v,{size:17,bold:isHead,color:isHead?'FFFFFF':'233F51',after:0})]});
      return new D.Table({width:{size:14700,type:D.WidthType.DXA},columnWidths:widths,
        rows:[new D.TableRow({children:head.map(v=>cell(v,true)),tableHeader:true,cantSplit:true})].concat(rows.map(r=>new D.TableRow({children:r.map(v=>cell(v,false)),cantSplit:true})))});
    }
    const pic=async(svg,width=680)=>{
      const png=await pngData(svg);
      return new D.Paragraph({spacing:{after:120},children:[new D.ImageRun({data:png.bytes,transformation:{width,height:Math.round(width*png.height/png.width)},type:'png'})]});
    };
    const r=d.radar,c=d.c;
    const children=[
      para('SAGS · CẢNG HÀNG KHÔNG QUỐC TẾ CAM RANH',{center:true,bold:true,color:'167398',size:19}),
      para('BÁO CÁO DỰ BÁO ĐIỀU HÀNH – RADAR V2.8',{center:true,bold:true,color:'17435E',size:28}),
      para('Ngày '+dateVN(c.date)+' · Lần '+c.revision+' · Nguồn: '+(c.sourceFile||'chưa ghi tên file')+' · Người lập: '+c.author),
      hd('I. TÓM TẮT KHAI THÁC'),
      tab(['Đến','Đi','Đỉnh cặp / 30 phút','Số đợt ≥4 cặp'],[[String(c.arrivals),String(c.departures),String(r.peak.n),String(r.episodes.length)]],[3675,3675,3675,3675]),
      para(d.summary),para(d.comparison),
      await pic(dailySvg(d)),
      para('Đỉnh '+clock(r.peak.s)+'–'+clock(r.peak.s+30)+' ('+r.peak.n+' cặp); '+r.episodes.length+' đợt ≥4 cặp. Cửa sổ 30 phút trượt 5 phút. Mỗi cặp đến–đi chỉ tính một lần.'),
      para('Thời lượng quy ước: VJ/9G/VU/AK/FD 30 phút; các hãng Hàn Quốc 60 phút; các hãng còn lại theo lịch. Không coi STD là mốc giải phóng GSE.',{size:17,color:'64798B'}),
      ...(d.alerts?.length?[hd('THÔNG TIN CHỜ CÁC ĐƠN VỊ XÁC NHẬN'),tab(['Đơn vị','Nhóm dữ liệu','Nội dung còn thiếu'],d.alerts.map(a=>[a.unit,a.type,a.detail]),[3100,3900,7700])]:[]),
      hd('II. BẢNG KIỂM SOÁT NGHIỆP VỤ'),
      tab(['Nội dung','Nhận định','Phương án'],d.topics.map(x=>[x.title,x.observation,x.action]),[2750,5850,6100]),
      hd('III. RADAR CHI TIẾT CÁC ĐỢT CAO ĐIỂM ≥4 CẶP')
    ];
    if(!r.episodes.length)children.push(para('Không phát hiện khung từ 4 cặp phục vụ trở lên theo nguồn hiện có.'));
    for(let i=0;i<r.episodes.length;i++){
      const e=r.episodes[i];
      children.push(hd('III.'+(i+1)+' ĐỢT '+clock(e.from)+'–'+clock(e.to)+' | ĐỈNH '+e.peak.n+' CẶP – '+e.level));
      children.push(para('Khung đỉnh '+clock(e.peak.s)+'–'+clock(e.peak.s+30)+'; '+e.items.length+' hồ sơ trong toàn đợt, '+e.peak.items.length+' hồ sơ ở khung đỉnh.'));
      children.push(await pic(episodeSvg(e)));
      children.push(tab(['Cặp đến / đi','STA / STD','Vị trí / khu','Tàu','Thời lượng'],e.peak.items.map(x=>[flightId(x.f),clock(x.f.sta_min)+' / '+clock(x.f.std_min),x.f.bay==null?'CHỜ XÁC NHẬN':x.f.bay+' / '+area(x.f),x.f.aircraft_type||'Chưa rõ',serviceMinutes(x.f)+' phút']),[3380,2700,2920,2800,2900]));
      children.push(para('CẢNH BÁO NGAY DƯỚI RADAR',{bold:true,color:'A36518'}));
      children.push(tab(['Mức','Nội dung','Cơ sở / nguy cơ','Hành động'],alertRows(e),[2150,2800,5100,4650]));
    }
    children.push(hd('III. BẢNG TỔNG HỢP CẢNH BÁO CẢ NGÀY'));
    if(r.episodes.length)children.push(tab(['Đợt cao điểm','Mức','Nhóm','Hành động'],r.episodes.flatMap(e=>e.alerts.map(a=>[clock(e.from)+'–'+clock(e.to),a.level,a.kind,a.action])),[2750,2550,3150,6250]));
    else children.push(para('Không có đợt cao điểm đạt ngưỡng báo cáo.'));
    children.push(hd('IV. PHỐI HỢP THỰC HIỆN'),tab(['Nội dung','Yêu cầu','Đơn vị','Thời hạn'],d.coord,[3400,5400,2800,3100]),hd('V. KIẾN NGHỊ BAN TGĐ'),para(d.recommendation));
    children.push(para('Dữ liệu chưa xác nhận được ghi rõ; cảnh báo là đề nghị kiểm tra, không tự kết luận thiếu GSE/nhân sự hay đường công vụ đang gián đoạn.',{size:17,color:'657888'}));
    return new D.Document({creator:'SAGS-CXR',title:'Báo cáo dự báo Điều hành Radar '+dateVN(c.date),sections:[{properties:{page:{size:{width:16838,height:11906},margin:{top:650,bottom:650,left:650,right:650}}},children}]});
  }
  function download(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
  }
  async function exportWord(){
    if(!['ADMIN','DH'].includes(unit)){alert('Chỉ ĐH/ADMIN được xuất báo cáo.');return;}
    const buttons=[...document.querySelectorAll('[data-v19-export]')];buttons.forEach(x=>{x.disabled=true;x.textContent='ĐANG TẠO WORD…'});
    try{
      const d=await loadOnce(),D=await docxLib(),doc=await wordDoc(d,D),blob=await D.Packer.toBlob(doc);
      if(blob.size<3000)throw Error('DOCX tạo ra không hợp lệ.');
      download(blob,'SAGS_CXR_RADAR_'+d.c.date.replace(/-/g,'')+'_L'+d.c.revision+'.docx');
      const el=$('v19ExportMessage');if(el)el.textContent='Đã tạo Word có Radar toàn ngày, các đợt ≥4 cặp và cảnh báo.';
    }catch(e){alert('Không thể xuất Word: '+e.message);}
    finally{buttons.forEach(x=>{x.disabled=false;x.textContent='XUẤT BÁO CÁO WORD · RADAR (.DOCX)'})}
  }
  async function exportPdf(){
    if(!['ADMIN','DH'].includes(unit)){alert('Chỉ ĐH/ADMIN được xuất báo cáo.');return;}
    const b=$('r28Pdf');if(b){b.disabled=true;b.textContent='ĐANG TẠO PDF…';}
    let node,holder;
    try{
      const d=await loadOnce(),html2pdf=await pdfLib();ensureStyles();
      node=document.createElement('div');node.innerHTML=reportHtml(d);
      node.style.cssText='width:1120px;background:white;';
      holder=document.createElement('div');holder.style.cssText='position:absolute;left:-20000px;top:0;width:1120px';
      holder.appendChild(node);document.body.appendChild(holder);
      await html2pdf().set({margin:[8,9,8,9],filename:'SAGS_CXR_RADAR_'+d.c.date.replace(/-/g,'')+'_L'+d.c.revision+'.pdf',
        image:{type:'jpeg',quality:0.96},html2canvas:{scale:1.6,backgroundColor:'#ffffff',useCORS:true},
        jsPDF:{unit:'mm',format:'a4',orientation:'landscape',compress:true},
        pagebreak:{mode:['css','legacy'],avoid:['.r28-episode','.r28-table tr']}}).from(node).save();
    }catch(e){alert('Không thể xuất PDF: '+e.message);}
    finally{holder?.remove();if(b){b.disabled=false;b.textContent='XUẤT BÁO CÁO PDF · RADAR (.PDF)';}}
  }
  base.exportOne=exportWord;
  base.preview=preview;
  base.exportPdf=exportPdf;
  const btn=$('r28Pdf');if(btn)btn.onclick=exportPdf;
  root.SagsRadarReportV28={analyze,model,preview,exportWord,exportPdf,_test:{interval,serviceMinutes,area,dailySvg,reportHtml}};
})(window);