const c=window.SAGS_LITE_CONFIG;
const BASE=`https://raw.githubusercontent.com/${c.sourceRepo}/${c.sourceCommit}/`;
export const remoteSource=path=>BASE+String(path).replace(/^\.\//,'');
export async function assetJson(path){try{const res=await fetch('./'+path,{cache:'force-cache'});if(res.ok)return await res.json()}catch{}const r=await fetch(remoteSource(path));if(!r.ok)throw Error('Không tải được tài nguyên gốc '+path+' (HTTP '+r.status+'). Hãy chạy npm run vendor.');return await r.json()}
export function assetImg(path){return './'+String(path).replace(/^\.\//,'')}
export async function loadImage(url){const image=new Image();image.crossOrigin='anonymous';image.decoding='async';image.src=url;await image.decode();return image}
export async function sourceImage(path){const local=assetImg(path);try{let r=await fetch(local,{method:'HEAD'});if(r.ok)return local}catch{}return remoteSource(path)}
let registry=null;export async function formRegistry(){if(registry)return registry;const all=await assetJson('forms/forms.registry.json');if(!Array.isArray(all.forms))throw Error('Form Registry nguồn không hợp lệ');registry=all;return all}
let notebook=null;export async function notebookData(){if(notebook)return notebook;const n=await assetJson('data/carrier-service-guide.json');if(!Array.isArray(n.carriers))throw Error('Sổ tay nguồn không hợp lệ');notebook=n;return n}