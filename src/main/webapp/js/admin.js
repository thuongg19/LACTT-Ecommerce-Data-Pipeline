'use strict';

/* ================================
   DATA STORE 
================================ */
const AdminStore = (function () {
  const K = { products: 'lactt_admin_products', orders: 'lactt_admin_orders', users: 'lactt_admin_users', vouchers: 'lactt_admin_vouchers', settings: 'lactt_admin_settings', revenue: 'lactt_admin_revenue' };
  function getAll(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
  function saveAll(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
  return { products: { list: () => getAll(K.products) }, orders: { list: () => getAll(K.orders) }, users: { list: () => getAll(K.users) }, vouchers: { list: () => getAll(K.vouchers) }, settings: { get: () => getAll(K.settings) }, revenue: { list: () => getAll(K.revenue) } };
})();

function fmt(n) { return Number(n || 0).toLocaleString('vi-VN') + '₫'; }
function toast(msg) { alert(msg); }
function switchPage(page) {
  // Đã sửa 'admin' thành 'nguoidung' để trỏ đúng file
  var pageMap = { 
    orders: 'donhang', 
    products: 'qlsanpham', 
    users: 'nguoidung', 
    reports: 'reports' 
  };
  var target = pageMap[page] || page;
  window.location.href = target + '.jsp';
}
function logout() { if(confirm('Bạn có chắc chắn muốn đăng xuất?')) window.location.href = 'dangnhap.jsp'; }

/* ================================
   GLOBAL LAYOUT LOGIC (Dùng chung mọi trang)
================================ */
document.addEventListener('DOMContentLoaded', function() {
  // 1. Cập nhật ngày tháng trên Header
  var el = document.getElementById("headerDateEl");
  if (el) el.textContent = new Date().toLocaleDateString("vi-VN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  // 2. Chức năng ẩn/hiện Hamburger
  var toggleBtn = document.getElementById('sidebarToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var layout = document.querySelector('.admin-layout');
      if (layout) {
        layout.classList.toggle('sidebar-closed');
        // Kích hoạt resize để biểu đồ Chart.js tự động co giãn
        setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 300);
      }
    });
  }
});