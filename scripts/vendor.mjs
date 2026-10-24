// Download exact original E-Report source files; verify Git SHA1 object before saving.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';import {dirname,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');const manifest=JSON.parse(await readFile(resolve(root,'data/upstream-files.json'),'utf8'));
const base=`https://raw.githubusercontent.com/sagsdieuhanh-gif/E-REPORT-SAGS/${manifest.commit}/`;
let failures=[];for(const [path,expected] of Object.entries(manifest.files))try{
  const r=await fetch(base+path,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);
  const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length!==expected.size)throw Error(`Unexpected size ${bytes.length}`);
  const hash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');if(hash!==expected.sha)throw Error(`SHA mismatch: ${hash}`);
  const dest=resolve(root,path);await mkdir(dirname(dest),{recursive:true});await writeFile(dest,bytes);console.log(`OK ${path} (${bytes.length} bytes)`);
}catch(e){failures.push(path);console.error(`FAILED ${path}: ${e.message}`)}
console.log(`Verified ${Object.keys(manifest.files).length-failures.length}/${Object.keys(manifest.files).length} upstream assets`);if(failures.length)process.exitCode=1;