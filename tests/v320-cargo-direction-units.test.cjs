'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const m=require('../v320-cargo-booking.js')||globalThis.SagsCargoBookingV320;
const cargo=globalThis.SagsCargoBookingV320;
const rows=[
 ['VU1270',1000,'departure'],['VJ730',2500,'departure'],['VJ1782',1500,'departure'],
 ['VJ1774',1500,'departure'],['VJ770',2500,'departure'],['TW034',1500,'departure'],
 ['VJ731',500,'arrival'],['VJ1781',500,'arrival'],['VJ771',300,'arrival']
];
const plans=rows.map(([flight_no,cargo_kg])=>({flight_no,cargo_kg,cargo_pcs:null,ready_by_min:null}));
const pairs=[
 {arrival:'VJ731',departure:'VJ730',bay:31,sta_min:550,std_min:580},
 {arrival:'VJ1781',departure:'VJ1782',bay:39,sta_min:600,std_min:630},
 {arrival:'VJ771',departure:'VJ770',bay:58,sta_min:650,std_min:680},
 {arrival:null,departure:'VU1270',bay:32,sta_min:null,std_min:700},
 {arrival:null,departure:'VJ1774',bay:33,sta_min:null,std_min:730},
 {arrival:null,departure:'TW034',bay:40,sta_min:null,std_min:760}
];
const detail={departures:rows.filter(x=>x[2]==='departure').map(x=>({no:x[0]})),
 arrivals:rows.filter(x=>x[2]==='arrival').map(x=>({no:x[0]}))};
assert.equal(cargo.toKg('1','TAN'),1000);
assert.equal(cargo.toKg('2.5','TAN'),2500);
assert.equal(cargo.toKg('1,5','TAN'),1500);
assert.equal(cargo.toKg('500','KG'),500);
assert.equal(cargo.toKg('0.3','TAN'),300);
assert.equal(cargo.toKg('2.5','KG'),null,'fractional kg must be explicitly corrected');
assert.equal(cargo.toKg('', 'TAN'),null);
assert.equal(cargo.toKg('-1','KG'),null);
const by=cargo.split(plans,pairs,detail);
assert.equal(by.departure.length,6);assert.equal(by.arrival.length,3);
assert.equal(cargo.total(by.departure),10500);
assert.equal(cargo.total(by.arrival),1300);
assert.equal(by.unmatched.length,0);
assert.equal(cargo.formattedTotal(cargo.total(by.departure)),'10.500 kg (10,5 tấn)');
assert.equal(cargo.formattedTotal(cargo.total(by.arrival)),'1.300 kg (1,3 tấn)');
assert.equal(cargo.direction('##VJ731',pairs,detail),'arrival');
assert.equal(cargo.direction('VJ730',pairs,detail),'departure');
assert.equal(cargo.direction('NOFLIGHT',pairs,detail),null);
const unmatched=cargo.split([...plans,{flight_no:'TEST999',cargo_kg:100}],pairs,detail);
assert.equal(unmatched.unmatched.length,1);
assert.equal(cargo.total(unmatched.departure),10500,'Unknown direction must not inflate departure total');
const source=fs.readFileSync('v300-workspace.js','utf8');
assert.ok(source.includes("if(u==='KHO')return cargoUnitTables()"));
assert.ok(source.includes("const kg=model.toKg(entered,unit)"),'Persist normalized kilograms only');
assert.ok(source.includes("if(hasSchedule&&matched!==side)"),'Flight number checked against direction');
assert.ok(source.includes('updateCargoTotals();return;'));
assert.ok(source.includes("rootNode.addEventListener('input'"),'Live totals on input');
const injected=source.replace(' root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:',
 ' root.__v320CargoTest={setState:v=>{state=v},cargoUnitTables,cargoEntryRow};\n root.SagsWorkspaceV300={mount,refresh,go,forecast,highlights,_test:');
assert.notEqual(injected,source);
const context={window:{SagsCargoBookingV320:cargo},document:{getElementById:()=>null}};
vm.runInNewContext(injected,context,{filename:'v300-workspace.js'});
context.window.__v320CargoTest.setState({cargo:plans,flights:pairs,plans:[],
 snap1:{payload:{flights:pairs,source_detail:detail}},snap2:null});
const screen=context.window.__v320CargoTest.cargoUnitTables();
assert.ok(screen.includes('CHUYẾN BAY ĐI')&&screen.includes('CHUYẾN BAY ĐẾN'));
assert.ok(screen.includes('10.500 kg (10,5 tấn)')&&screen.includes('1.300 kg (1,3 tấn)'));
assert.equal((screen.match(/data-v320-booking-panel=/g)||[]).length,2);
assert.ok(screen.includes('v320CargoBodydeparture')&&screen.includes('v320CargoBodyarrival'));
const d=context.window.__v320CargoTest.cargoEntryRow({flight_no:'VJ730',cargo_kg:2500},'departure');
assert.ok(d.includes('value="2.5"')&&d.includes('value="TAN" selected'));
const a=context.window.__v320CargoTest.cargoEntryRow({flight_no:'VJ731',cargo_kg:500},'arrival');
assert.ok(a.includes('value="500"')&&a.includes('value="KG" selected'));
const fresh=context.window.__v320CargoTest.cargoEntryRow({},'departure');
assert.ok(fresh.includes('value="TAN" selected'),'Outbound defaults to tonnes, clearly visible');
const editor=fs.readFileSync('v319-report-editorial.js','utf8');
const w={SagsCargoBookingV320:cargo},mock={window:w};
vm.runInNewContext(editor,mock);
const facts={date:'2026-11-02',revision:1,rows:pairs,arrivals:3,departures:6,
 sourcePayload:{source_detail:detail},staff:[],gse:[],cargoPlans:plans,
 equipmentIssues:[],unitPlans:[],note:{},controls:[]};
const topics=Array.from({length:10},()=>({title:'',observation:'',action:''}));
w.SagsReportEditorialV319.refine(facts,topics,{peaks:[],tight:[],wide:[]});
assert.ok(topics[6].observation.includes('Hàng đi đã xác nhận: 6 chuyến, 10.500 kg (10,5 tấn)'));
assert.ok(topics[6].observation.includes('Hàng đến đã xác nhận: 3 chuyến, 1.300 kg (1,3 tấn)'));
assert.ok(topics[6].action.includes('dỡ')&&topics[6].action.includes('xếp hàng đi'));
const ui=fs.readFileSync('index.html','utf8');
assert.ok(ui.includes('v320-cargo-booking.js?v=3.20'));
assert.ok(ui.includes("APP_VERSION='V3.22'"));
console.log('PASS V3.22: separate cargo arrival/departure booking, kg/ton conversion, live totals and real-flight validation');
