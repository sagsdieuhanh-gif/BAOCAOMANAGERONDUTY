'use strict';
(function initExcelUI(){
 const core=window.RadarExcelImport;
 const $=id=>document.getElementById(id);
 const note=(t,err=false)=>{ $('exMessage').textContent=t;$('exMessage').style.color=err?'#ba3035':'#637489';};
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let book=null,rows=[],fileName='';
 window.RadarExcelBlocked=false;
 async function library(){
   if(window.XLSX)return;
   await new Promise((resolve,reject)=>{let s=document.createElement('script');
     s.src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
     s.onload=resolve;s.onerror=()=>reject(Error('Không tải được thư viện Excel (SheetJS).'));
     document.head.appendChild(s);
   });
   if(!window.XLSX)throw Error('Chưa có thư viện đọc Excel.');
 }
 function col(n){let s='';for(n++;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
 function renderMap(){
   if(!rows.length)return;
   const head=rows[Math.max(0,Number($('exHeader').value||1)-1)]||[];
   const map=core.guess([head]).columns;
   const count=Math.min(100,Math.max(head.length,...rows.slice(0,20).map(x=>x.length)));
   const control=k=>'<label>'+escape(core.labels[k])+'<select data-excel-key="'+k+'"><option value="">-- Không có --</option>'+
     Array.from({length:count},(_,i)=>'<option value="'+i+'" '+(map[k]===i?'selected':'')+'>'+col(i)+' · '+escape(String(head[i]??'').slice(0,28)||'Cột '+col(i))+'</option>').join('')+'</select></label>';
   $('exMain').innerHTML=['arrival','departure','sta','std','bay'].map(control).join('');
   $('exExtra').innerHTML=['airline','aircraft_type','aircraft_reg','cargo_status'].map(control).join('');
   const i=Math.max(0,Number($('exHeader').value||1)-1);
   $('exPreview').innerHTML='<p class="note">4 hàng đầu để đối chiếu cách đọc:</p><table>'+
     rows.slice(i,i+4).map((row,j)=>'<tr>'+row.slice(0,14).map(cell=>(j===0?'<th>':'<td>')+escape(String(cell??'').slice(0,48))+(j===0?'</th>':'</td>')).join('')+'</tr>').join('')+'</table>';
   $('exMapping').classList.remove('hidden');
 }
 function chooseSheet(){
   if(!book)return;
   rows=window.XLSX.utils.sheet_to_json(book.Sheets[$('exSheet').value],{header:1,raw:true,defval:'',blankrows:true}).slice(0,15000);
   $('exHeader').max=String(Math.max(rows.length,1));
   $('exHeader').value=String(core.guess(rows).index+1);
   renderMap();$('exDiff').innerHTML='';
   window.RadarExcelBlocked=false;
   $('exAnalyze').disabled=!canEdit(['DH','ADMIN']);
   note('Sheet có '+rows.length+' hàng. Kiểm tra các cột ghép rồi bấm ĐỌC EXCEL & SO SÁNH.');
 }
 async function openFile(){
   const f=$('exFile').files?.[0];if(!f)return;
   fileName=f.name;$('exAnalyze').disabled=true;
   if(f.size>12*1024*1024){note('File quá 12 MB. Cần dùng bản lịch bay rút gọn.',true);return;}
   try{
     note('Đang đọc '+fileName+' ...');
     await library();book=window.XLSX.read(await f.arrayBuffer(),{type:'array',cellDates:false});
     if(!book.SheetNames.length)throw Error('Excel không chứa sheet.');
     $('exSheet').innerHTML=book.SheetNames.map(x=>'<option value="'+escape(x)+'">'+escape(x)+'</option>').join('');
     $('forecastSourceName').value=fileName;
     chooseSheet();
   }catch(e){note('Không đọc được file: '+e.message,true);}
 }
 async function analyze(){
   if(!canEdit(['DH','ADMIN']))return note('Chỉ ĐH/ADMIN được cập nhật lịch.',true);
   if(!rows.length)return note('Chưa chọn sheet Excel.',true);
   const mapping={};$('exMapping').querySelectorAll('[data-excel-key]').forEach(e=>{if(e.value!=='')mapping[e.dataset.excelKey]=Number(e.value);});
   if(mapping.arrival===undefined&&mapping.departure===undefined)return note('Chưa chọn cột chuyến đến hoặc chuyến đi.',true);
   const revision=Number($('forecastRevision').value);
   const parsed=core.parse(rows,mapping,Math.max(0,Number($('exHeader').value||1)-1));
   let baseline=flights,source='lịch hiện tại';
   try{
     if(revision===2){
       const {data,error}=await sb.from('ops_forecast_snapshots').select('payload,source_filename').eq('service_date',$('day').value).eq('revision',1).maybeSingle();
       if(error)throw error;
       if(data?.payload?.flights?.length){baseline=data.payload.flights;source='Dự báo Lần 1 ('+(data.source_filename||'đã lưu')+')';}
       else source='lịch hiện tại (chưa chốt Lần 1)';
     }
     const dif=core.compare(parsed.records,baseline);
     window.RadarExcelBlocked=parsed.issues.some(v=>/trùng cặp/.test(v));
     staged=parsed.records.map(newRow);renderDraft();
     const changes=[
       ...dif.added.map(v=>['CHUYẾN MỚI',v.flight,'Chưa có trong nguồn so sánh']),
       ...dif.changed.map(v=>['THAY ĐỔI',v.flight,v.diffs.map(d=>(core.labels[d.field]||d.field)+': '+d.old+' → '+d.now).join('; ')]),
       ...dif.missing.map(v=>['KHÔNG CÒN TRONG FILE',v.flight,'Chờ kiểm tra; không tự xóa.'])
     ];
     $('exDiff').innerHTML='<div class="quickTags"><span class="quickTag">Excel: <b>'+parsed.records.length+'</b></span>'+
       '<span class="quickTag">Chuyến mới: <b>'+dif.added.length+'</b></span><span class="quickTag">Thay đổi: <b>'+dif.changed.length+'</b></span>'+
       '<span class="quickTag">Vắng: <b>'+dif.missing.length+'</b></span><span class="quickTag">Không đổi: <b>'+dif.unchanged+'</b></span></div>'+
       '<p class="note">Đối chiếu với <b>'+escape(source)+'</b>. Dữ liệu vẫn chỉ ở bảng chờ, chưa thay đổi lịch chính thức.</p>'+
       (parsed.issues.length?'<div class="issue"><b>CẦN KIỂM TRA EXCEL:</b><ul>'+parsed.issues.map(v=>'<li>'+escape(v)+'</li>').join('')+'</ul></div>':'')+
       (changes.length?'<table><tr><th>LOẠI</th><th>CHUYẾN</th><th>THÔNG TIN</th></tr>'+
       changes.slice(0,150).map(v=>'<tr><td>'+escape(v[0])+'</td><td>'+escape(v[1].replace('|',' / '))+'</td><td>'+escape(v[2])+'</td></tr>').join('')+'</table>':'<p class="note">Không tìm thấy thay đổi so với lịch nguồn.</p>')+
       '<p class="note">Kiểm tra BẢNG CHỜ XÁC NHẬN bên dưới, bấm LƯU DANH SÁCH ĐÃ DUYỆT rồi chọn XEM RADAR TỰ TẠO. Chuyến vắng trong Excel không tự bị xóa.</p>';
     note('Đã đọc '+parsed.records.length+' cặp/chuyến từ '+fileName+'. '+(window.RadarExcelBlocked?'TRÙNG CẶP – sửa file trước khi lưu.':'Chưa ghi vào Supabase.'));
   }catch(e){note('Lỗi so sánh Excel: '+e.message,true);}
 }
 function openRadar(){
   if(!flights.length)return note('Cần lưu lịch bay trước khi xem Radar.',true);
   const peak=Array.from({length:48},(_,i)=>({s:i*30,n:iNeed(i*30).pairs.length})).sort((a,b)=>b.n-a.n||a.s-b.s)[0];
   selected=peak.s;switchTab('radar');renderRadar();
 }
 if(!core)return note('Thiếu module nhập Excel. Hãy tải lại trang.',true);
 $('exFile').addEventListener('change',openFile);
 $('exSheet').addEventListener('change',chooseSheet);
 $('exHeader').addEventListener('change',renderMap);
 $('exAnalyze').addEventListener('click',analyze);
 $('exOpenRadar').addEventListener('click',openRadar);
})();