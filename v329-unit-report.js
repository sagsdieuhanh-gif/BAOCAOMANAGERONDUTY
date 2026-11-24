'use strict';
/* V3.29: Shared field-to-report map for unit forms, preview and final executive report.
   Append only confirmed evidence, preserve existing/manual observations. */
(function(root){
 const TITLES=['Lịch bay và sản lượng','Khung giờ cao điểm','Tàu thân rộng/chuyến đặc biệt','Vị trí đỗ và hạ tầng','Nhân lực khai thác','GSE trọng yếu','Hành lý – hàng hóa','OTP và chất lượng','An toàn – an ninh','Kết quả xử lý tồn tại'];
 // [key, label, 1-based topic, target column, prefix]
 const FIELDS={
  DH:[
   ['stand_notes','Thay đổi AOC / bãi đỗ đã xác nhận',4,'observation','ĐH cập nhật AOC/bãi đỗ'],
   ['peak_priority','Ưu tiên cao điểm, chuyến đặc biệt hoặc yêu cầu hãng',2,'action','Phương án ĐH'],
   ['escalation','Vấn đề cần phối hợp / kiến nghị chỉ đạo',10,'action','ĐH đề nghị']],
  PVHK:[
   ['peak_staff','Phương án quầy check-in, gate, boarding và tăng cường',5,'action','PVHK bố trí'],
   ['special_pax','Khách đặc biệt / yêu cầu hãng đã xác nhận',3,'observation','PVHK báo khách đặc biệt'],
   ['widebody_note','Phục vụ tàu thân rộng hoặc chuyến khách đông',3,'action','PVHK chuẩn bị'],
   ['bag_risk','Nguy cơ hành lý và phương án xử lý',7,'action','PVHK phối hợp hành lý']],
  KTS:[
   ['rolling_support','Phương án tăng cường PVSĐ, HLNG, PVTT / hỗ trợ Kho',2,'action','PVSĐ phối hợp cao điểm'],
   ['staff_shortage','Hạn chế nhân sự đã xác nhận (nếu có)',5,'observation','PVSĐ báo nhân sự'],
   ['a330_ready','Khả năng phục vụ A330',3,'action','PVSĐ thiết bị A330'],
   ['b777_ready','Khả năng phục vụ B777',3,'action','PVSĐ thiết bị B777'],
   ['widebody_note','Phương án phục vụ tàu thân rộng, bãi xa',3,'action','PVSĐ chuẩn bị'],
   ['gse_risk','Lưu ý GSE / tuyến di chuyển',6,'observation','PVSĐ lưu ý GSE']],
  KHO:[
   ['handover_priority','Ưu tiên bàn giao theo chuyến, khung giờ',7,'action','Kho Hàng ưu tiên'],
   ['cargo_bottleneck','Nguy cơ chậm bàn giao và nguyên nhân',7,'observation','Kho Hàng báo nguy cơ'],
   ['special_cargo','Hàng đặc biệt hoặc yêu cầu riêng đã xác nhận',7,'observation','Kho Hàng báo hàng đặc biệt']],
  QA_IT:[
   ['weather_fod','An toàn, FOD, thời tiết đã xác nhận',9,'observation','QA/IT báo'],
   ['operational_impact','Ảnh hưởng khai thác và biện pháp phòng ngừa',9,'action','QA/IT kiểm soát'],
   ['open_capa','Tồn tại cần theo dõi / khắc phục',10,'observation','QA/IT ghi nhận tồn tại'],
   ['followup','Tiến độ, phương án và đầu mối theo dõi',10,'action','QA/IT theo dõi']]
 };
 const has=x=>x!=null&&String(x).trim()!=='';
 function format(key,v){
   if(!has(v)||v==='PENDING')return '';
   if(key==='a330_ready'||key==='b777_ready')
     return ({READY:'đã sẵn sàng',LIMITED:'còn hạn chế',UNKNOWN:'chưa xác nhận'})[v]||String(v).trim();
   return String(v).trim();
 }
 function sourceItems(unit,details={}){
   return (FIELDS[unit]||[]).map(([key,label,topic,column,prefix])=>({
     unit,key,label,topic,column,prefix,value:format(key,details[key])
   })).filter(x=>has(x.value));
 }
 function preview(unit,details={},context={}){
   const list=sourceItems(unit,details);
   if(unit==='KTS'&&context.issue?.id){
     const x=context.issue;
     list.push({unit,key:'issue_draft',label:'Xe/thiết bị cần kiểm tra',topic:6,column:'observation',
       prefix:'PVSĐ thiết bị '+x.id,value:[x.fault,x.impact?'Ảnh hưởng: '+x.impact:''].filter(Boolean).join('; ')});
     if(has(x.workaround)||has(x.expected_return))
       list.push({unit,key:'issue_action',label:'Phương án GSE',topic:6,column:'action',
         prefix:'PVSĐ phương án',value:[x.workaround,x.expected_return?'Dự kiến: '+x.expected_return:''].filter(Boolean).join('; ')});
   }
   if(unit==='KHO'&&context.staff?.length){
     const find=shift=>context.staff.find(x=>x.shift===shift)?.value;
     const ms=find('SÁNG'),nt=find('ĐÊM');
     if(has(ms)||has(nt))list.push({unit,key:'warehouse_staff',label:'Nhân sự kho',topic:7,column:'action',
       prefix:'Kho Hàng bố trí nhân sự',value:'sáng '+(has(ms)?ms:'chưa xác nhận')+
         ', tối '+(has(nt)?nt:'chưa xác nhận')+' người'});
   }
   if(context.staff?.length&&['DH','PVHK','KTS'].includes(unit)){
     list.unshift({unit,key:'staff_summary',label:'Quân số theo ca',topic:5,column:'staff',
       prefix:'Bảng quân số',value:'Dữ liệu từng bộ phận và ca sẽ xuất trong bảng chi tiết; không cộng trùng'});
   }
   if(unit==='KHO'&&context.cargo?.length){
     const sides={arrival:0,departure:0};
     for(const x of context.cargo)if(x.flight&&x.kg!==''&&sides[x.side]!=null)sides[x.side]++;
     if(sides.arrival||sides.departure)
       list.unshift({unit,key:'cargo_summary',label:'Booking theo chuyến',topic:7,column:'observation',
         prefix:'Kho Hàng nhập booking',value:sides.departure+' chuyến đi, '+sides.arrival+' chuyến đến (dự kiến sau lưu)'});
   }
   return list;
 }
 function append(topic,column,sentence){
   if(!topic||!sentence)return;
   const original=String(topic[column]||'').trim();
   if(original.includes(sentence))return;
   topic[column]=original?original+'\n'+sentence:sentence;
 }
 function apply(c,topics){
   if(!c||!Array.isArray(topics)||topics.length<10)return topics;
   const plans=(c.unitPlans||[]).filter(p=>p.status==='CONFIRMED');
   for(const p of plans)for(const item of sourceItems(p.unit,p.details||{})){
     const topic=topics[item.topic-1];if(!topic)continue;
     if(String(topic.observation||'').includes(item.value)||String(topic.action||'').includes(item.value))continue;
     append(topic,item.column,item.prefix+': '+item.value+'.');
   }
   if(plans.some(p=>p.unit==='KTS')){
     for(const issue of (c.equipmentIssues||[]).filter(x=>x.issue_status!=='RETURNED'&&has(x.equipment_id))){
       if(has(issue.impact)&&!String(topics[5].observation||'').includes(String(issue.impact).trim()))
         append(topics[5],'observation','PVSĐ xác nhận ảnh hưởng thiết bị '+issue.equipment_id+': '+String(issue.impact).trim()+'.');
       const parts=[has(issue.workaround)?'phương án '+String(issue.workaround).trim():'',
         has(issue.expected_return)?'dự kiến '+String(issue.expected_return).trim():''].filter(Boolean);
       if(parts.length)append(topics[5],'action','Thiết bị '+issue.equipment_id+': '+parts.join('; ')+'.');
     }
   }
   if(plans.some(p=>p.unit==='KHO')){
     const staff=(c.staff||[]).filter(x=>x.unit==='KHO'&&x.role_code==='WAREHOUSE_CARGO'&&x.confirmed_at);
     if(staff.length){
       const find=shift=>staff.find(x=>x.shift===shift)?.quantity;
       const show=x=>x==null?'chưa xác nhận':String(x);
       append(topics[6],'action','Kho Hàng xác nhận nhân sự theo ca: sáng '+show(find('SÁNG'))+
         ', tối '+show(find('ĐÊM'))+' người; quân số bố trí không phải kết luận đủ hoặc thiếu.');
     }
   }
   return topics;
 }
 root.SagsUnitReportV329={FIELDS,TITLES,sourceItems,preview,apply,_test:{format}};
})(typeof window!=='undefined'?window:globalThis);
