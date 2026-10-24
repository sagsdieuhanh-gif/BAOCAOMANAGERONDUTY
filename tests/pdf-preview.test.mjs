import test from 'node:test';
import assert from 'node:assert/strict';
import {containRect,fieldRect,pageGeometry,formPageFields,pdfFileName} from '../src/pdf-geometry.mjs';

const flight={date:'2026-10-24',arrival:'VJ123',departure:'VJ456'};
const cases=[
  ['fsags421','F/SAGS-CXR/42.1',2],
  ['fsags423','F/SAGS-CXR/42.3',2],
  ['fsags551','F/SAGS-CXR/55.1',2],
  ['fsags54','F/SAGS-CXR/54',1],
  ['fsags94','F/SAGS-CXR/94',1],
  ['fsags208','F/SAGS-CXR/208',1]
];

test('six original forms use 9 page layouts and predictable filenames',()=>{
  assert.equal(cases.reduce((n,x)=>n+x[2],0),9);
  for(const [id,code,pageCount] of cases){
    const form={id,code,pages:Array.from({length:pageCount},(_,i)=>({id:'p'+(i+1),width:id==='fsags208'?1491:1241,height:id==='fsags208'?1055:1755}))};
    assert.equal(form.pages.length,pageCount);
    assert.match(pdfFileName(form,flight),/^SAGS_F_SAGS-CXR_[\w.]+_VJ456_2026-10-24\.pdf$/);
    for(const page of form.pages){
      const g=pageGeometry(page);
      assert.ok(g.placement.width>0&&g.placement.height>0);
      assert.ok(g.placement.x>=0&&g.placement.y>=0);
      assert.ok(g.placement.width<=g.pdfWidth&&g.placement.height<=g.pdfHeight);
      assert.equal(g.pdfWidth>g.pdfHeight,id==='fsags208');
    }
  }
});

test('background and overlay use the same contain rectangle – source layout not distorted',()=>{
  const p=pageGeometry({width:1241,height:1755});
  assert.ok(Math.abs(p.placement.width/p.placement.height-1241/1755)<1e-12);
  const h=pageGeometry({width:1491,height:1055});
  assert.ok(Math.abs(h.placement.width/h.placement.height-1491/1055)<1e-12);
});

test('signature remains within box, preserving original aspect ratio',()=>{
  const r=containRect(480,120,100,200,200,70);
  assert.equal(r.width,200);assert.equal(r.height,50);
  assert.equal(r.x,100);assert.equal(r.y,210);
  assert.equal(r.width/r.height,4);
});

test('field positions match normalized source coordinates and stay on correct page',()=>{
  const f={key:'sig',pageId:'p2',x:0.1,y:0.2,w:0.3,h:0.05};
  assert.deepEqual(fieldRect(f,1241,1755),{x:124.10000000000001,y:351,width:372.3,height:87.75});
  assert.deepEqual(formPageFields({fields:[f,{...f,key:'other',pageId:'p1'}]},{id:'p2'}),[f]);
  assert.equal(fieldRect({...f,x:-0.1},1241,1755),null);
});

// Browser-independent PDF generation contract, using the real createPdf orchestration
// with a mocked pdf-lib interface. CI separately verifies SHA1 of original PNG assets.
async function getPdfModule(){
  if(globalThis.__pdfMod)return globalThis.__pdfMod;
  globalThis.window={SAGS_LITE_CONFIG:{sourceRepo:'sagsdieuhanh-gif/E-REPORT-SAGS',sourceCommit:'41ad37fc9033f160fd00c21008ff9711ddfd7294'}};
  globalThis.window.PDFLib={PDFDocument:{create:async()=>{
    const rec={pages:[],embedded:[],subject:'',title:''};globalThis.__pdfRecord=rec;
    return{setTitle:t=>rec.title=t,setSubject:t=>rec.subject=t,
      embedPng:async bytes=>{rec.embedded.push(bytes);return{kind:'png'}} ,
      addPage:arr=>{const page={size:arr,images:[]};rec.pages.push(page);return{drawImage:(img,place)=>page.images.push({img,place})}},
      save:async()=>new Uint8Array([37,80,68,70,45,49,46,55])};
  }}};
  const ops=[];
  globalThis.__pdfDraws=ops;
  globalThis.document={createElement:type=>{
    if(type!=='canvas')throw Error('Unexpected element '+type);
    const canvas={width:0,height:0,getContext:()=>({save(){},restore(){},beginPath(){},rect(){},clip(){},measureText:s=>({width:String(s).length*8}),fillText(){},drawImage:(img,x,y,w,h)=>ops.push({img,x,y,w,h}),set font(v){},set fillStyle(v){},set textBaseline(v){},set textAlign(v){}}),toBlob:cb=>cb(new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'}))};
    return canvas;
  }};
  globalThis.Image=class {naturalWidth=480;naturalHeight=120;width=480;height=120;set src(v){this._src=v}async decode(){}};
  globalThis.fetch=async (url,opts)=>{
    if(opts?.method==='HEAD')return{ok:true};
    return{ok:true,arrayBuffer:async()=>new Uint8Array([137,80,78,71,13,10,26,10]).buffer};
  };
  globalThis.__pdfMod=await import('../src/pdf.mjs');return globalThis.__pdfMod;
}

test('actual PDF builder iterates original pages for all six forms, with exact page placement',async()=>{
  const {createPdf}=await getPdfModule();
  for(const [id,code,pageCount] of cases){
    const pages=Array.from({length:pageCount},(_,i)=>({id:'p'+(i+1),image:`forms/${id}/page-${i+1}.png`,width:id==='fsags208'?1491:1241,height:id==='fsags208'?1055:1755}));
    const form={id,code,pages,fields:[{key:'comment',type:'text',pageId:'p1',label:'Comment',x:0.2,y:0.2,w:0.2,h:0.025,fontSize:20}]};
    const got=await createPdf(form,{comment:'ABC'},flight);
    assert.equal(got.pageCount,pageCount);
    assert.equal(got.formCode,code);
    assert.equal(globalThis.__pdfRecord.pages.length,pageCount);
    assert.equal(globalThis.__pdfRecord.embedded.length,pageCount+1); // every background, and one overlay
    const first=globalThis.__pdfRecord.pages[0].images;
    assert.equal(first.length,2);
    assert.deepEqual(first[0].place,first[1].place); // critical PDF preview and print geometry contract
    assert.equal(got.blob.type,'application/pdf');
  }
});

test('signed fields retain aspect ratio and invalid signature cannot silently disappear',async()=>{
  const {createPdf}=await getPdfModule();
  const form={id:'fsags54',code:'F/SAGS-CXR/54',pages:[{id:'p1',image:'forms/fsags54/page-01.png',width:1241,height:1755}],fields:[{key:'sign',pageId:'p1',type:'signature',x:0.1,y:0.2,w:0.3,h:0.05,label:'Signature'}]};
  globalThis.__pdfDraws.length=0;
  await createPdf(form,{sign:'data:image/png;base64,aGVsbG8='},flight);
  const sign=globalThis.__pdfDraws.at(-1);
  assert.ok(sign);
  assert.ok(Math.abs(sign.w/sign.h-4)<1e-10,'signature not distorted');
  await assert.rejects(()=>createPdf(form,{sign:'not-an-image'},flight),/Chữ ký không hợp lệ/);
});