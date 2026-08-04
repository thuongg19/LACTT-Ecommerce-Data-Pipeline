<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Panel - LACTT</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="css/admin.css?v=<%= System.currentTimeMillis() %>"/>
</head>
<body>
<div class="admin-layout">

  <!-- DÙNG CHUNG: SIDEBAR -->
  <aside class="admin-sidebar" id="adminSidebar">
    <div class="sidebar-brand"><span class="sidebar-logo">LACTT</span><span class="sidebar-role-badge">Admin Panel</span></div>
    <nav class="sidebar-nav">
      <p class="nav-group-title">Tổng quan</p>
      <div class="nav-item" onclick="switchPage('dashboard')">Dashboard</div>
      <p class="nav-group-title">Kinh doanh</p>
      <div class="nav-item" onclick="switchPage('products')">Sản phẩm</div>
      <div class="nav-item" onclick="switchPage('orders')">Đơn hàng</div>
      <p class="nav-group-title">Quản trị</p>
      <div class="nav-item" onclick="switchPage('users')">Người dùng</div>
      <div class="nav-item" onclick="switchPage('khuyenmai')">Khuyến mãi</div>
      <p class="nav-group-title">Phân tích</p>
      <div class="nav-item" onclick="switchPage('reports')">Báo cáo & Xuất Excel</div>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-avatar">A</div>
        <div style="min-width:0;flex:1"><p class="sidebar-user-name">Admin</p><p class="sidebar-user-email">admin@lactt.vn</p></div>
      </div>
      <button class="sidebar-logout-full" onclick="AuthModal.logout()">Đăng xuất</button>
    </div>
  </aside>

  <main class="admin-main">
    <!-- DÙNG CHUNG: HEADER CÓ HAMBURGER -->
    <header class="admin-header">
      <div class="header-left">
        <button class="sidebar-toggle" id="sidebarToggleBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div>
          <h1 class="admin-header-title">Admin Panel</h1>
          <p class="admin-header-subtitle" id="headerDateEl"></p>
        </div>
      </div>
      <div class="admin-header-right">
        <button class="btn btn-outline btn-sm" onclick="switchPage('orders')">Thông báo</button>
        <a href="index.jsp" class="btn btn-primary btn-sm">Quay về trang chủ</a>
      </div>
    </header>

    <div class="admin-content" style="display: flex; justify-content: center; align-items: center; height: calc(100vh - 60px);">
      <div style="text-align: center; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid var(--border);">
        <h2 style="font-family: var(--ff-display); font-size: 2rem; color: var(--charcoal); margin-bottom: 12px;">Chào mừng trở lại</h2>
        <p style="color: var(--mid); font-size: 0.95rem;">Hãy chọn một chức năng trên trình đơn bên trái để bắt đầu phiên làm việc.</p>
      </div>
    </div>
  </main>
</div>

<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/auth-modal.js"></script>
<script src="js/admin.js?v=<%= System.currentTimeMillis() %>"></script>
<script>
  /* Tự động chuyển sang dashboard khi vào admin.jsp */
  window.location.replace('dashboard.jsp');
</script>
</body>
</html>