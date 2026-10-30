const assert=require('node:assert/strict');
(async()=>{
await import('../excel-import.js'); // The app bundle is an ES module in this repository.
const core=globalThis.RadarExcelImport;
assert.ok(core&&typeof core.guess==='function');
const rows=[['Arrival','STA','Departure','STD','Bay'],['VJ785','13:10','VJ786','13:45','52'],['KE467','21:25','KE468','23:05','33']];
const g=core.guess(rows);assert.equal(g.index,0);assert.equal(g.columns.arrival,0);assert.equal(g.columns.bay,4);
const parsed=core.parse(rows,g.columns,0);assert.equal(parsed.records.length,2);
assert.equal(parsed.records[0].bay,'52');assert.equal(core.time(0.5),'12:00');
const diff=core.compare(parsed.records,[{arrival:'VJ785',departure:'VJ786',sta_min:790,std_min:825,bay:null}]);
assert.equal(diff.added.length,1);assert.equal(diff.changed.length,1);
assert.equal(core.parse(rows,{arrival:0},0).records.length,2);
console.log('Radar Excel parsing & comparison: OK');

})().catch(e=>{console.error(e);process.exitCode=1});
