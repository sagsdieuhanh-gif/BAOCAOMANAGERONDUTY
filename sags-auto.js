'use strict';
(function(){
  const input=document.getElementById('exFile'), lib=window.SagsSchedule;
  if(!input||!lib)return;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tell=(s,fail=false)=>{const el=$('exMessage');el.textContent=s;el.style.color=fail?'#b92835':'#64798b';};
  let delegated=false,busy=false;
  async function xlsx(){
    if(window.XLSX)return;
    await new Promise((resolve,reject)=>{const x=document.createElement('script');
      x.src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      x.onload=resolve;x.onerror=()=>reject(Error('Không tải được thư viện Excel'));
      document.head.appendChild(x);
    });
    if(!window.XLSX)throw Error('Thiếu thư viện đọc XLSX');
  }
  async function oneClick(file){
    if(!canEdit(['ADMIN','DH']))throw Error('Chỉ ĐH và ADMIN được nhập Excel.');
    if(file.size>12*1024*1024)throw Error('File Excel vượt 12 MB.');
    tell('Đang đọc và đối chiếu file Excel '+file.name+'...');
    await xlsx();
    const buf=await file.arrayBuffer();
    const book=window.XLSX.read(buf,{type:'array',cellDates:false});
    if(!book.SheetNames.includes('LB'))return false;
    const raw=window.XLSX.utils.sheet_to_json(book.Sheets.LB,{header:1,raw:true,defval:'',blankrows:true});
    if(!lib.detect(raw).isSags)return false;
    const sags=lib.parse(raw),meta=sags.meta,stats=sags.stats;
    $('day').value=meta.service_date;
    $('forecastRevision').value='1';
    $('forecastSourceName').value=file.name;
    $('exSheet').innerHTML='<option>LB – tự nhận cấu trúc SAGS</option>';
    $('exMapping').classList.add('hidden');
    $('exAnalyze').disabled=true;
    tell('Nhận diện nguồn '+meta.service_date+': '+stats.arrival_count+' chuyến đến / '+
      stats.departure_count+' chuyến đi. Đang lưu an toàn vào Supabase...');
    const digest=await crypto.subtle.digest('SHA-256',buf);
    const sha=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
    const {data,error}=await sb.rpc('ops_import_sags_schedule',{
      p_date:meta.service_date,p_revision:1,p_filename:file.name,
      p_sheet:'LB',p_hash:sha,p_payload:sags.payload
    });
    if(error)throw error;
    await load();
    const details=sags.issues.map(x=>'<li>'+esc(x)+'</li>').join('');
    $('exDiff').innerHTML='<div class="quickTags"><span class="quickTag">Đến: <b>'+stats.arrival_count+'</b></span>'+
      '<span class="quickTag">Đi: <b>'+stats.departure_count+'</b></span>'+
      '<span class="quickTag">Ghép theo đăng bạ: <b>'+stats.matched_reg+'</b></span>'+
      '<span class="quickTag">Ghép theo chặng & giờ: <b>'+stats.matched_route+'</b></span>'+
      '<span class="quickTag">Chưa ghép: <b>'+stats.unmatched+'</b></span></div>'+
      '<p class="note">Tự lưu '+stats.total_records+' hồ sơ, ngày '+esc(meta.service_date)+
      '. '+esc(data?.status||'IMPORTED')+'. Bản nguồn không bị mất khi nhập file mới. Dữ liệu TBA không tự đổi thành số.</p>'+
      (details?'<div class="issue"><b>CẦN ĐỐI CHIẾU / CHƯA XÁC NHẬN:</b><ul>'+details+'</ul></div>':'');
    tell(data?.status==='ALREADY_IMPORTED'?'File đã nhập trước đó; không ghi trùng. Radar đã đồng bộ.':
      'Đã tự lưu lịch bay '+meta.service_date+' và lập Radar thành công.');
    const p=Array.from({length:60},(_,i)=>({s:i*30,n:iNeed(i*30).pairs.length}))
      .sort((a,b)=>b.n-a.n||a.s-b.s)[0];
    selected=p?.s||0;
    $('autoImportBanner').innerHTML='<b>EXCEL ĐÃ TỰ ĐỒNG BỘ:</b> '+esc(file.name)+
      ' · '+stats.arrival_count+' đến / '+stats.departure_count+' đi · '+
      stats.matched_reg+' cặp theo đăng bạ; '+stats.matched_route+
      ' cặp ghép theo chặng (cần đối chiếu); '+stats.unmatched+
      ' chuyến chưa ghép. <button id="autoImportBack">XEM ĐỐI CHIẾU</button>';
    $('autoImportBack').onclick=()=>switchTab('sources');
    switchTab('radar');renderRadar();
    return true;
  }
  // Capture intercepts the existing generic form importer; only known SAGS LB files auto-save.
  input.addEventListener('change',async ev=>{
    if(delegated){delegated=false;return;}
    ev.stopImmediatePropagation();
    const file=input.files?.[0];
    if(!file||busy)return;
    busy=true;
    try{
      const handled=await oneClick(file);
      if(!handled){
        delegated=true;input.dispatchEvent(new Event('change',{bubbles:true}));
        tell('Không phải mẫu sheet LB: chuyển sang chế độ ghép cột và so sánh trước khi lưu.');
      }
    }catch(e){tell('Không tự lưu được: '+e.message+'. Cơ sở dữ liệu không bị ghi nửa chừng.',true);}
    finally{busy=false;}
  },true);
})();