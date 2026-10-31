'use strict';
/* V2.9: dependency-free Word DOCX and PDF generator for SAGS-CXR reports.
   Both formats are built from the same visible report DOM; no CDN required. */
(function(root){
  const enc=new TextEncoder();
  const xml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const text=x=>String(x??'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim();
  const bytes=x=>typeof x==='string'?enc.encode(x):x;
  const concat=parts=>{const n=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out};
  const u16=n=>new Uint8Array([n&255,(n>>>8)&255]);
  const u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
  const toBytes=data=>{const raw=atob(data.split(',')[1]),arr=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);return arr};
  let crcTable;
  function crc32(data){
    if(!crcTable)crcTable=Array.from({length:256},(_,n)=>{for(let j=0;j<8;j++)n=(n&1)?0xEDB88320^(n>>>1):n>>>1;return n>>>0});
    let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;
  }
  function zip(files){
    const locals=[],centrals=[];let offset=0;
    for(const [name,value] of files){
      const filename=bytes(name),data=bytes(value),crc=crc32(data),flags=0x0800;
      const local=concat([u32(0x04034b50),u16(20),u16(flags),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(filename.length),u16(0),filename,data]);
      locals.push(local);
      centrals.push(concat([u32(0x02014b50),u16(20),u16(20),u16(flags),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(filename.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),filename]));
      offset+=local.length;
    }
    const central=concat(centrals);
    const end=concat([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(central.length),u32(offset),u16(0)]);
    return new Blob([...locals,central,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  const inner=el=>text(el.innerText??el.textContent);
  function blocksFromDOM(rootEl){
    const result=[];
    function visit(el){
      if(!el||el.nodeType!==1)return;
      const tag=el.tagName;
      if(el.classList?.contains('r28-chart')){
        const svg=el.querySelector('svg');if(svg)result.push({kind:'image',svg:svg.outerHTML});return;
      }
      if(el.classList?.contains('r28-kpis')){
        const values=[...el.children].map(x=>inner(x));
        if(values.length)result.push({kind:'table',rows:[values],header:false});return;
      }
      if(tag==='IMG'){const src=el.currentSrc||el.getAttribute('src');if(src)result.push({kind:'image',src,logo:el.classList?.contains('v216-report-logo')});return;}
      if(tag==='TABLE'){
        const rows=[...el.querySelectorAll('tr')].map(r=>[...r.children].filter(x=>x.tagName==='TH'||x.tagName==='TD').map(inner)).filter(x=>x.length);
        if(rows.length)result.push({kind:'table',rows,header:!!el.querySelector('th')});return;
      }
      if(['H1','H2','H3','H4'].includes(tag)){const t=inner(el);if(t)result.push({kind:'heading',level:Number(tag.slice(1)),text:t});return}
      if(tag==='P'){const t=inner(el);if(t)result.push({kind:'paragraph',text:t,pending:/chờ xác nhận|chưa xác nhận/i.test(t)});return}
      if(tag==='LI'){const t=inner(el);if(t)result.push({kind:'paragraph',text:'• '+t,pending:/chờ xác nhận|chưa xác nhận/i.test(t)});return}
      if(['SCRIPT','STYLE','BUTTON','INPUT','TEXTAREA','SELECT','SVG'].includes(tag))return;
      if(el.children.length){for(const c of el.children)visit(c);}
      else {const t=inner(el);if(t&&['HEADER','STRONG'].includes(tag))result.push({kind:'paragraph',text:t});}
    }
    visit(rootEl);
    return result;
  }
  function lines(ctx,s,width){
    const chunks=String(s??'').split(/\n/),out=[];
    for(const chunk of chunks){
      const words=chunk.split(/\s+/).filter(Boolean);
      if(!words.length){out.push('');continue}
      let line='';
      for(let word of words){
        let trial=line?line+' '+word:word;
        if(ctx.measureText(trial).width<=width){line=trial;continue}
        if(line){out.push(line);line=''}
        while(ctx.measureText(word).width>width&&word.length>1){
          let cut=1;while(cut<word.length&&ctx.measureText(word.slice(0,cut+1)).width<=width)cut++;
          out.push(word.slice(0,cut));word=word.slice(cut);
        }
        line=word;
      }
      if(line)out.push(line);
    }
    return out;
  }
  // A4 portrait at 2x raster resolution (595x842 PDF points). All measurements below are pixels.
  const paper={width:1190,height:1684,margin:62,footer:38};
  function pdfFromJpegs(jpegs,options={}){
    // Reports use ISO A4 portrait. Shuttle canvas PDFs keep their historical landscape layout.
    const portrait=options.orientation==='portrait',pdfW=portrait?595:842,pdfH=portrait?842:595;
    const objects=[null,null];const add=x=>{objects.push(x);return objects.length};
    const pageRefs=[];
    for(const item of jpegs){
      const jpeg=item.bytes,iw=item.width,ih=item.height;
      const img=add(concat([bytes('<< /Type /XObject /Subtype /Image /Width '+iw+' /Height '+ih+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n'),jpeg,bytes('\nendstream')]));
      const commands='q '+pdfW+' 0 0 '+pdfH+' 0 0 cm /P Do Q';
      const cm=add('<< /Length '+commands.length+' >>\nstream\n'+commands+'\nendstream');
      const pg=add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pdfW+' '+pdfH+'] /Resources << /XObject << /P '+img+' 0 R >> >> /Contents '+cm+' 0 R >>');
      pageRefs.push(pg+' 0 R');
    }
    objects[0]='<< /Type /Catalog /Pages 2 0 R >>';
    objects[1]='<< /Type /Pages /Kids ['+pageRefs.join(' ')+'] /Count '+pageRefs.length+' >>';
    const parts=[bytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')];let pos=parts[0].length,offsets=[0];
    for(let i=0;i<objects.length;i++){
      const item=concat([bytes((i+1)+' 0 obj\n'),bytes(objects[i]),bytes('\nendobj\n')]);
      offsets.push(pos);parts.push(item);pos+=item.length;
    }
    const xref=pos;
    let trailer='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
    for(let i=1;i<offsets.length;i++)trailer+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
    trailer+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    parts.push(bytes(trailer));
    return new Blob(parts,{type:'application/pdf'});
  }
  async function svgImage(svg,src){
    const url=src||'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    const image=new Image();
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Không tạo được hình Radar; kiểm tra dữ liệu biểu đồ.'));image.src=url;});
    return image;
  }
  // Lay out report content in portrait pages without shrinking the whole
  // landscape report into unreadable A4. Long table cells may flow onto the next
  // sheet; the table heading is repeated and no confirmed text is discarded.
  async function renderPdfPages(blocks){
    if(!blocks.length)throw Error('Báo cáo đang trống, chưa thể xuất PDF.');
    const {width:W,height:H,margin:M,footer}=paper;
    const bottom=H-M-footer,contentW=W-M*2,top=M+18;
    const pages=[];let canvas,ctx,y;
    const font=(n,bold=false)=>{ctx.font=(bold?'700 ':'400 ')+n+'px Arial, "Times New Roman", sans-serif';};
    function newPage(){
      canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
      ctx=canvas.getContext('2d');if(!ctx)throw Error('Thiết bị không hỗ trợ tạo PDF.');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#17536F';ctx.fillRect(M,29,contentW,4);
      y=top;pages.push(canvas);
    }
    function free(height){if(y+height>bottom)newPage();}
    function paragraph(value,{size=19,bold=false,color='#243C4F',after=11,indent=0,heading=false}={}){
      font(size,bold);
      const content=lines(ctx,value,contentW-indent),lh=Math.ceil(size*1.33);
      if(heading&&y+Math.min(content.length,2)*lh+after>bottom)newPage();
      for(const l of content){
        free(lh+3);font(size,bold);ctx.fillStyle=color;
        ctx.fillText(l,M+indent,y+size);y+=lh;
      }
      y+=after;
    }
    function ratiosFor(rows,cols){
      const head=(rows[0]||[]).join(' ').toLowerCase();
      if(cols===2)return [.28,.72];
      if(cols===3)return [.21,.40,.39];
      if(cols===4){
        if(/đơn vị liên quan/.test(head)&&/nhận định/.test(head))return [.16,.29,.43,.12];
        if(/thời hạn/.test(head))return [.18,.49,.13,.20];
        if(/phương án xử lý/.test(head))return [.14,.20,.27,.39];
        return [.17,.25,.36,.22];
      }
      if(cols===5)return [.23,.18,.19,.22,.18];
      return Array(cols).fill(1/cols);
    }
    function table(rows,hasHeader){
      if(!rows.length)return;
      const cols=Math.max(1,...rows.map(r=>r.length)),ratios=ratiosFor(rows,cols);
      const widths=ratios.map(v=>v*contentW),pad=7,fs=16,lh=21,minHeight=36;
      const wrapRow=(row,isHead)=>{
        font(isHead?17:fs,isHead);
        return Array.from({length:cols},(_,i)=>lines(ctx,String(row[i]??''),Math.max(24,widths[i]-pad*2)));
      };
      const prepared=rows.map((r,i)=>wrapRow(r,hasHeader&&i===0));
      const heightOf=row=>Math.max(minHeight,Math.max(...row.map(x=>x.length))*lh+2*pad);
      const header=hasHeader?prepared[0]:null,headerHeight=header?heightOf(header):0;
      const draw=(preparedRow,from,count,isHead)=>{
        const rh=Math.max(minHeight,count*lh+2*pad);let x=M;
        for(let i=0;i<cols;i++){
          const part=preparedRow[i].slice(from,from+count);
          ctx.fillStyle=isHead?'#194D6C':'#fff';ctx.fillRect(x,y,widths[i],rh);
          ctx.strokeStyle='#B7C9D5';ctx.lineWidth=1;ctx.strokeRect(x,y,widths[i],rh);
          ctx.fillStyle=isHead?'#fff':/chờ xác nhận|chưa xác nhận/i.test(rows[0]?.[i]||'')?'#233B4C':'#243B4F';
          // Highlight only the lines containing unconfirmed data, not an entire table column.
          font(isHead?17:fs,isHead);
          part.forEach((line,j)=>{
            if(!isHead&&/chờ xác nhận|chưa xác nhận/i.test(line))ctx.fillStyle='#B91C1C';
            else ctx.fillStyle=isHead?'#fff':'#243B4F';
            ctx.fillText(line,x+pad,y+pad+(isHead?17:fs)+j*lh);
          });
          x+=widths[i];
        }
        y+=rh;
      };
      function repeatHeader(){
        if(!header)return;
        if(y+headerHeight>bottom)newPage();
        draw(header,0,Math.max(...header.map(a=>a.length)),true);
      }
      for(let ri=0;ri<prepared.length;ri++){
        const cells=prepared[ri],isHead=hasHeader&&ri===0;
        const totalLines=Math.max(1,...cells.map(x=>x.length));
        const wholeHeight=heightOf(cells),usablePage=bottom-top-(isHead?0:headerHeight);
        if(wholeHeight<=usablePage&&y+wholeHeight>bottom){
          newPage();if(!isHead)repeatHeader();
        }
        let at=0;
        while(at<totalLines){
          if(bottom-y<minHeight){newPage();if(!isHead)repeatHeader();}
          const fit=Math.floor((bottom-y-2*pad)/lh);
          if(fit<1){newPage();if(!isHead)repeatHeader();continue;}
          const n=Math.min(totalLines-at,fit);
          draw(cells,at,n,isHead);at+=n;
          if(at<totalLines){newPage();if(!isHead)repeatHeader();}
        }
      }
      y+=13;
    }
    newPage();
    for(const block of blocks){
      if(block.kind==='heading'){
        free(46);
        paragraph(block.text,{size:block.level<=2?25:block.level===3?21:19,
          bold:true,color:'#145278',after:14,heading:true});
      }else if(block.kind==='paragraph'){
        paragraph(block.text,{size:19,color:block.pending?'#B91C1C':'#273E52'});
      }else if(block.kind==='table'){
        table(block.rows,block.header);
      }else if(block.kind==='image'){
        const image=await svgImage(block.svg,block.src);
        const naturalW=Math.max(1,image.naturalWidth||image.width||1);
        const naturalH=Math.max(1,image.naturalHeight||image.height||1);
        const targetW=block.logo?150:contentW;
        const targetH=Math.min(block.logo?190:480,Math.round(targetW*naturalH/naturalW));
        free(targetH+18);ctx.drawImage(image,M,y,targetW,targetH);y+=targetH+16;
      }
    }
    pages.forEach((p,i)=>{
      const c=p.getContext('2d');c.fillStyle='#758496';
      c.font='16px Arial, sans-serif';
      c.fillText('SAGS-CXR · TRANG '+(i+1)+'/'+pages.length,M,H-29);
    });
    return pages;
  }
  async function exportPdf(blocks){
    const canvases=await renderPdfPages(blocks);
    const jpegs=canvases.map(canvas=>({
      bytes:toBytes(canvas.toDataURL('image/jpeg',.90)),
      width:canvas.width,height:canvas.height
    }));
    return pdfFromJpegs(jpegs,{orientation:'portrait'});
  }
  function paragraph(v,{bold=false,size=20,color='233B4D',breakBefore=false}={}){
    const lines=String(v??'').split('\n');
    const run=lines.map((line,i)=>'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman"/>'+(bold?'<w:b/>':'')+'<w:color w:val="'+color+'"/><w:sz w:val="'+size+'"/></w:rPr>'+(i?'<w:br/>':'')+'<w:t xml:space="preserve">'+xml(line)+'</w:t></w:r>').join('');
    return '<w:p><w:pPr><w:spacing w:before="'+(breakBefore?180:50)+'" w:after="90"/></w:pPr>'+run+'</w:p>';
  }
  function wordTable(rows,header){
    if(!rows.length)return '';
    const cols=Math.max(1,...rows.map(x=>x.length));
    const control=cols===4&&/Đơn vị liên quan/i.test((rows[0]||[]).join(' '));
    const widths=(cols===2?[3900,10800]:cols===3?[2800,5900,6000]:cols===4?(control?[2500,4100,6350,1750]:[2800,3150,4200,4550]):cols===5?[3550,2750,2500,3000,2900]:Array(cols).fill(Math.floor(14700/cols)));
    let table='<w:tbl><w:tblPr><w:tblW w:w="14700" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="5" w:color="B7CBD8"/><w:bottom w:val="single" w:sz="5" w:color="B7CBD8"/><w:insideH w:val="single" w:sz="5" w:color="B7CBD8"/><w:insideV w:val="single" w:sz="5" w:color="B7CBD8"/></w:tblBorders></w:tblPr><w:tblGrid>'+widths.map(w=>'<w:gridCol w:w="'+w+'"/>').join('')+'</w:tblGrid>';
    rows.forEach((r,ri)=>{
      table+='<w:tr>'+(Array.from({length:cols},(_,i)=>{
        const content=String(r[i]??''),isHead=header&&ri===0;
        const cellPr='<w:tcPr><w:tcW w:w="'+widths[i]+'" w:type="dxa"/>'+(isHead?'<w:shd w:fill="194D6C"/>':'')+'<w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/></w:tcMar></w:tcPr>';
        return '<w:tc>'+cellPr+paragraph(content,{size:17,bold:isHead,color:isHead?'FFFFFF':/chờ xác nhận|chưa xác nhận/i.test(content)?'B91C1C':'213A4B'})+'</w:tc>';
      })).join('')+'</w:tr>';
    });
    return table+'</w:tbl>';
  }
  async function exportDocx(blocks){
    if(!blocks.length)throw Error('Báo cáo đang trống, chưa thể xuất Word.');
    let body='',images=[],rels='';
    for(const b of blocks){
      if(b.kind==='heading')body+=paragraph(b.text,{bold:true,size:b.level<=2?29:b.level===3?24:21,color:'175478',breakBefore:true});
      else if(b.kind==='paragraph')body+=paragraph(b.text,{size:20,color:b.pending?'B91C1C':'233B4D'});
      else if(b.kind==='table')body+=wordTable(b.rows,b.header);
      else if(b.kind==='image'){
        const img=await svgImage(b.svg,b.src),canvas=document.createElement('canvas');
        canvas.width=Math.max(100,img.width||1152);canvas.height=Math.max(80,img.height||250);
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        const png=toBytes(canvas.toDataURL('image/png')),id=images.length+1,relId='rId'+id;
        images.push(['word/media/chart'+id+'.png',png]);
        rels+='<Relationship Id="'+relId+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/chart'+id+'.png"/>';
        const width=b.logo?118:820,height=Math.round(width*canvas.height/canvas.width),cx=width*9525,cy=height*9525;
        body+='<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:docPr id="'+id+'" name="Radar '+id+'"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="Radar '+id+'"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="'+relId+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
      }
    }
    body+='<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="660" w:right="660" w:bottom="660" w:left="660" w:header="300" w:footer="300"/></w:sectPr>';
    const doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>'+body+'</w:body></w:document>';
    const files=[
      ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
      ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
      ['word/document.xml',doc],
      ['word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rels+'</Relationships>'],
      ...images
    ];
    return zip(files);
  }
  function exportCanvasPdf(canvas,filename){
    if(!canvas||!canvas.width||!canvas.height)throw Error('Ảnh báo cáo xe không hợp lệ.');
    // Preserve pixel readability by segmenting exceptionally tall shuttle tables.
    const pageH=Math.max(500,Math.round(canvas.width*595/842));
    const num=Math.ceil(canvas.height/pageH),pages=[];
    for(let i=0;i<num;i++){
      const from=i*pageH,height=Math.min(pageH,canvas.height-from);
      const part=document.createElement('canvas');part.width=canvas.width;part.height=pageH;
      const ctx=part.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,part.width,part.height);
      ctx.drawImage(canvas,0,from,canvas.width,height,0,0,canvas.width,height);
      pages.push({bytes:toBytes(part.toDataURL('image/jpeg',.92)),width:part.width,height:part.height});
    }
    const blob=pdfFromJpegs(pages);download(blob,filename);
    return {bytes:blob.size,pages:num};
  }
  function download(blob,filename){
    const u=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(u),10000);
  }
  async function exportElement(el,format,filename){
    if(!el)throw Error('Không tìm thấy nội dung xem trước. Hãy chọn ngày và tải lịch bay.');
    const blocks=blocksFromDOM(el);
    if(!blocks.length)throw Error('Báo cáo không có nội dung hợp lệ để xuất.');
    const blob=format==='docx'?await exportDocx(blocks):format==='pdf'?await exportPdf(blocks):null;
    if(!blob||blob.size<150)throw Error('Không tạo được file '+format.toUpperCase()+'.');
    download(blob,filename);
    return {bytes:blob.size,blocks:blocks.length,format};
  }
  root.SagsOfficeExportV29={blocksFromDOM,exportDocx,exportPdf,exportCanvasPdf,exportElement,_test:{zip,pdfFromJpegs,crc32,renderPdfPages,paper}};
})(window);