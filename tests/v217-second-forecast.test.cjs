'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const p=require('../v217-second-forecast.js');
const ha=['No.','FlightNo','Registration','Aircraft','Route','STA','FlightType','ParkingBay','SSR','TotalPax','Remarks','NatureOfFlight','Booking'];
const hd=['No.','FlightNo','Registration','Aircraft','Route','STD','FlightType','ParkingBay','Gate','SSR','TotalPax','Remarks','NatureOfFlight','Booking','CkiRow','CKIN OPEN','BDG Start','BDG Finish'];
function sheet(kind,headers,records){
 const rows=Array.from({length:11},()=>Array(36).fill(''));
 rows[3][1]=kind;rows[5][12]='Date:';rows[5][13]='31-Oct-2026';
 rows[10]=['',...headers];
 for(const r of records){const x=Array(headers.length+1).fill('');
 for(const [k,v] of Object.entries(r)){let i=headers.indexOf(k);if(i>=0)x[i+1]=v;}rows.push(x);}
 return rows;
}
const arr=sheet('ARRIVAL',ha,[
 {FlightNo:'VJ781',Registration:'VNA639',Aircraft:'A321',Route:'HAN-CXR',STA:'0815',ParkingBay:'53'},
 {FlightNo:'##QQE530',Registration:'A7-CGE',Aircraft:'GLF6',Route:'ICN-CXR',STA:'0840',ParkingBay:'56'},
 {FlightNo:'N43655',Registration:'RA73340',Aircraft:'B777',Route:'KJA-CXR',STA:'1110',ParkingBay:'36'},
 {FlightNo:'VJ618',Registration:'VNA814',Aircraft:'A330',Route:'SGN-CXR',STA:'1200',ParkingBay:'51'},
 {FlightNo:'BX103',Registration:'HL8381',Aircraft:'A321',Route:'ICN-CXR',STA:'2020',ParkingBay:'36'},
 {FlightNo:'TW033',Registration:'HL8382',Aircraft:'B737',Route:'ICN-CXR',STA:'2355',ParkingBay:'33'},
 {FlightNo:'TW041',Registration:'HL8383',Aircraft:'B737',Route:'PUS-CXR',STA:'0040+',ParkingBay:'35'}
]);
const dep=sheet('DEPARTURE',hd,[
 {FlightNo:'VJ782',Registration:'VNA639',Aircraft:'A321',Route:'CXR-HAN',STD:'0845',ParkingBay:'53',Gate:'5',Booking:'0/0/200',CkiRow:'35-37','CKIN OPEN':'0645','BDG Start':'0820','BDG Finish':'0835'},
 {FlightNo:'##QQE530',Registration:'A7-CGE',Aircraft:'GLF6',Route:'CXR-MLE',STD:'0940',ParkingBay:'56',SSR:'FERRY',FlightType:'PAX'},
 {FlightNo:'N43546',Registration:'RA73340',Aircraft:'B777',Route:'CXR-SVO',STD:'1245',ParkingBay:'36',Gate:'G7'},
 {FlightNo:'VJ6874',Registration:'VNA814',Aircraft:'A330',Route:'CXR-KJA',STD:'1300',ParkingBay:'51',Gate:'G2',Booking:'0/10/365'},
 {FlightNo:'BX104',Registration:'HL8381',Aircraft:'A321',Route:'CXR-ICN',STD:'2140',ParkingBay:'36',Gate:'G7',Booking:'0/0/226'},
 {FlightNo:'TW034',Registration:'HL8382',Aircraft:'B737',Route:'CXR-ICN',STD:'0055+',ParkingBay:'33',Gate:'G4',Booking:'0/0/155'},
 {FlightNo:'TW042',Registration:'HL8383',Aircraft:'B737',Route:'CXR-PUS',STD:'0140+',ParkingBay:'35',Gate:'G6',Booking:'0/0/111'}
]);
assert.equal(p.date('31-Oct-2026'),'2026-10-31');
assert.equal(p.time('0040+'),1480);
assert.equal(p.time('43'),null,'43 must not become a real time');
const fakeXLSX={utils:{sheet_to_json:s=>s}};
assert.ok(p.detectWorkbook({SheetNames:['1','2'],Sheets:{'1':arr,'2':dep}},fakeXLSX));
const result=p.parseTables(arr,dep);
assert.equal(result.meta.service_date,'2026-10-31');
assert.equal(result.stats.arrival_count,7);
assert.equal(result.stats.departure_count,7);
assert.equal(result.stats.matched_reg,7);
assert.equal(result.stats.ferry,0,'Charter ## remains normal-service; does not enter FERRY exceptions');
assert.equal(result.stats.booked,5);
assert.equal(result.stats.unmatched,0);
assert.ok(!result.fatal.some(x=>x.includes('##QQE530')),'## marks CHARTER and is not an invalid flight number');
assert.ok(!result.issues.some(x=>x.includes('CHARTER')&&x.includes('QQE530')),'## is informational, never an alert');
const checkin=result.payload.flights.find(x=>x.departure==='VJ782');
assert.equal(checkin.departure_checkin_row,'35-37');
assert.equal(checkin.departure_checkin_open,405);
assert.equal(checkin.departure_boarding_start,500);
assert.equal(checkin.departure_boarding_finish,515);
const fw=result.payload.flights.find(x=>x.departure==='VJ6874');
assert.equal(fw.departure_gate,'G2');
assert.equal(fw.departure_bay,51);
assert.equal(fw.booking_raw,'0/10/365');
assert.equal(fw.booking_sum,375);
assert.equal(fw.departure_pax,null,'Booking never substitutes actual PAX');
const ferry=result.payload.flights.find(x=>x.departure==='QQE530');
assert.equal(ferry.ferry,true);
assert.equal(ferry.charter,true,'## is preserved as Charter metadata without changing operations');
assert.equal(ferry.arrival_raw_no,'##QQE530');
assert.equal(ferry.departure_ssr,'FERRY');
assert.ok(!result.issues.some(x=>x.includes('QQE530')&&x.includes('FERRY')),'Charter ## is handled normally even when legacy SSR mentions FERRY');
const night=result.payload.flights.find(x=>x.departure==='TW034');
assert.equal(night.std_min,1495);
assert.equal(night.match_method,'REG');
const analysis=p.analyze(result.payload);
assert.ok(analysis.wide.some(x=>x.no==='VJ6874'));
assert.ok(analysis.high.some(x=>x.no==='VJ6874'));
assert.ok(!analysis.ferry.some(x=>x.no==='QQE530'),'Charter does not enter FERRY risk analysis');
assert.ok(analysis.night.some(x=>x.no==='TW034'));
const before={flights:[{arrival:'VJ781',departure:'VJ782',bay:52,sta_min:485,std_min:525}]};
assert.ok(p.compare(result.payload,before).some(x=>x.flight==='VJ781'&&x.type==='THAY ĐỔI BÃI ĐỖ'));
assert.ok(p.compare(result.payload,before).some(x=>x.flight==='VJ782'&&x.type==='THAY ĐỔI BÃI ĐỖ'));
const files={html:fs.readFileSync('index.html','utf8'),report:fs.readFileSync('v19-report.js','utf8'),ui:fs.readFileSync('v217-second-ui.js','utf8')};
assert.ok(files.html.indexOf('v217-second-ui.js')<files.html.indexOf('sags-auto.js'),'L2 must intercept before L1 auto-import');
assert.ok(files.ui.includes('p_revision:2')&&files.ui.includes('DUYỆT VÀ LƯU LẦN 2'));
assert.ok(files.report.includes("eq('revision',2)")&&files.report.includes('data.operational'));
assert.ok(files.report.includes('const brief=isL2?data.dailyBrief?.entries||[]:[];')&&files.report.includes('SagsL2BriefV223?.make'));
assert.ok(!files.report.includes('Lần 1 được giữ làm mốc so sánh')&&files.report.includes('firstPayload:s.data?.payload||null'), 'L1 source preserved in data while technical note hidden from TGĐ');
console.log('PASS L2: paired ARRIVAL/DEPARTURE, stands, gate, booking vs pax, ferry, midnight and L1 preservation');
