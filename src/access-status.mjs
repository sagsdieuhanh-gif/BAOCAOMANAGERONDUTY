// Distinguish authentication/profile failures from separate Lite flight data access.
// A denied lite_flights query must never be mislabeled as an invalid E-Report login.
export function permissionDenied(error){
  const code=String(error?.code||'').toLowerCase();
  return code==='permission-denied'||code.endsWith('/permission-denied')||/missing or insufficient permissions/i.test(String(error?.message||''));
}
export function flightAccessMessage(error){
  if(permissionDenied(error))return 'Đăng nhập E-Report đã được chấp nhận nhưng Firebase chưa cấp quyền đọc dữ liệu chuyến Lite (lite_flights). AD cần bổ sung Firestore Rules cho riêng lite_flights; không cần tạo lại tài khoản hay đổi mật khẩu.';
  return 'Không tải được dữ liệu chuyến Lite: '+String(error?.message||error||'Lỗi không xác định')+'. Hãy kiểm tra mạng hoặc thử TẢI LẠI.';
}
export function profileAccessMessage(error){
  if(permissionDenied(error))return 'Firebase đã xác thực nhưng từ chối đọc hồ sơ users/{UID}. AD cần kiểm tra quy tắc đọc hồ sơ E-Report hiện tại và trạng thái tài khoản; không thay đổi mật khẩu chỉ vì thông báo này.';
  return 'Không đọc được hồ sơ E-Report users/{UID}: '+String(error?.message||error||'Lỗi không xác định');
}