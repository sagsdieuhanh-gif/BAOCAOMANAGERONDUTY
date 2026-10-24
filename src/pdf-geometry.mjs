// Pure geometry helpers shared by PDF renderer and offline regression tests.
// The same placement is used for the source image and data overlay.
export const A4_PORTRAIT=Object.freeze([595.28,841.89]);
export const A4_LANDSCAPE=Object.freeze([841.89,595.28]);

export function containRect(srcWidth,srcHeight,boxX,boxY,boxWidth,boxHeight){
  const sw=Number(srcWidth),sh=Number(srcHeight),bw=Number(boxWidth),bh=Number(boxHeight);
  if(![sw,sh,bw,bh].every(x=>Number.isFinite(x)&&x>0))throw new Error('Kích thước hình hoặc ô ký không hợp lệ');
  const scale=Math.min(bw/sw,bh/sh),width=sw*scale,height=sh*scale;
  return {x:Number(boxX)+(bw-width)/2,y:Number(boxY)+(bh-height)/2,width,height};
}

export function pageGeometry(page){
  const width=Number(page?.width||1241),height=Number(page?.height||1755);
  if(![width,height].every(x=>Number.isFinite(x)&&x>0&&x<=10000))throw new Error('Kích thước mẫu PDF không hợp lệ');
  const [pdfWidth,pdfHeight]=width>height?A4_LANDSCAPE:A4_PORTRAIT;
  const placement=containRect(width,height,0,0,pdfWidth,pdfHeight);
  return {width,height,pdfWidth,pdfHeight,placement};
}

export function fieldRect(field,width,height){
  const [x,y,w,h]=['x','y','w','h'].map(k=>Number(field?.[k]));
  if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)return null;
  if(x<0||y<0||x>1||y>1)return null;
  return {x:x*width,y:y*height,width:Math.min(w,1-x)*width,height:Math.min(h,1-y)*height};
}

export function formPageFields(form,page){
  return (form?.fields||[]).filter(f=>String(f.pageId)===String(page.id));
}

export function pdfFileName(form,flight){
  const safe=v=>String(v??'').replace(/[^A-Za-z0-9._-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,100);
  return `SAGS_${safe(form?.code||form?.id||'FORM')}_${safe(flight?.departure||flight?.arrival||'FLIGHT')}_${safe(flight?.date||'DATE')}.pdf`;
}