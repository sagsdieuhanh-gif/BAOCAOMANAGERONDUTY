'use strict';
/* Hourly Peak Hours chart as a distinct movement metric; not a 30min service overlap. */
(function(root){
 const $=id=>document.getElementById(id);
 let current=0;
 async function refresh(){
   const el=$('v219HourlyPeak');if(!el||typeof sb==='undefined'||typeof me==='undefined'||!me)return;
   const stamp=++current,date=$('day')?.value;if(!date)return;
   const [l2,l1,live]=await Promise.all([
     sb.from('ops_forecast_snapshots').select('payload').eq('service_date',date).eq('revision',2).maybeSingle(),
     sb.from('ops_forecast_snapshots').select('payload').eq('service_date',date).eq('revision',1).maybeSingle(),
     sb.from('ops_flights').select('arrival,departure,sta_min,std_min,international,arrival_route,departure_route,bay').eq('service_date',date)
   ]);
   if(stamp!==current)return;
   if(l2.error||l1.error||live.error){el.textContent='Chưa tải được Peak Hours: '+(l2.error||l1.error||live.error).message;return;}
   const api=root.SagsOpsForecastV219;if(!api)return;
   const chart=api.movements(l2.data?.payload||l1.data?.payload||null,live.data||[]);
   const peaks=chart.peak.filter(x=>x.total>0).slice(0,3).map(x=>x.label+' ('+x.total+' lượt)').join('; ');
   el.innerHTML='<div class="v219-peak-chart">'+api.svg(chart)+'</div>'+
     '<p class="note"><b>Đỉnh giờ theo lượt chuyến:</b> '+(peaks||'Chưa có mốc xác nhận')+
     '. Đếm bốn nhóm chuyến theo STA/STD; khác với Radar cặp chuyến phục vụ 30 phút.'+
     (chart.unverified.length?' <strong>'+chart.unverified.length+' lượt thiếu thông tin chặng/giờ, chưa phân loại.</strong>':'')+
     (chart.plusOne?' '+chart.plusOne+' lượt sau 00:00 (+1) được hiển thị ở phần lịch qua ngày, không cộng vào 24 giờ hiện tại.':'')+'</p>';
 }
 root.SagsPeakUIV219={refresh};
})(window);