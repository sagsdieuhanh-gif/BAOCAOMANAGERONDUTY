// Create a lazy-loaded, byte-preserving operational copy of pinned original
// E-Report at the SAME origin as SAGS FORM LITE. No backend schema changes.
// Only the original website's redirect-to-Vercel bootstrap is removed.
import{cp,readFile,writeFile,mkdir,stat}from'node:fs/promises';
import{join,resolve}from'node:path';
import{execFileSync}from'node:child_process';
const source=resolve(process.argv[2]||'upstream-old');
const output=resolve(process.argv[3]||'_site/native');
const PIN='41ad37fc9033f160fd00c21008ff9711ddfd7294';
let git;try{git=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{throw Error('Upstream old E-Report Git checkout missing')}
if(git!==PIN)throw Error(`Unsafe native build: expected old commit ${PIN}, got ${git}`);
const needed=['index.html','app','assets','data','forms','pdf-bg','asset-manifest.json','form-configuration.json','manifest.webmanifest','service-worker.js','version.json'];
await mkdir(output,{recursive:true});
for(const name of needed){await stat(join(source,name));await cp(join(source,name),join(output,name),{recursive:true,force:true})}
const path=join(output,'index.html');const old=await readFile(path,'utf8');
const re=/<script\s+id="sagsCanonicalProduction">[\s\S]*?<\/script>/g;
const matched=old.match(re);
if(matched?.length!==1||!matched[0].includes('location.replace'))throw Error('Original redirect bootstrap has changed. Refusing to patch unknown source.');
const next=old.replace(re,'<!-- Native E-Report pinned at SHA '+PIN+'. Disabled only the old github.io-to-Vercel redirect so that it can run securely in the same-origin Lite wrapper. -->');
await writeFile(path,next,'utf8');
console.log('Original E-Report native workspace ready at '+output+'; commit='+PIN+'; files copied='+needed.length);