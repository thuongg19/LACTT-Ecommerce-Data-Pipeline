<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Quản lý Đơn hàng — LACTT Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="css/admin.css?v=<%= System.currentTimeMillis() %>"/>
  <link rel="stylesheet" href="css/donhang.css?v=<%= System.currentTimeMillis() %>"/>
</head>
<body>
<div class="admin-layout">

  <!-- SIDEBAR -->
  <aside class="admin-sidebar" id="adminSidebar">
    <div class="sidebar-brand">
      <span class="sidebar-logo">LACTT</span>
      <span class="sidebar-role-badge">Admin Panel</span>
    </div>
    <nav class="sidebar-nav">
      <p class="nav-group-title">Tổng quan</p>
      <div class="nav-item" onclick="switchPage('dashboard')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Dashboard
      </div>
      <p class="nav-group-title">Kinh doanh</p>
      <div class="nav-item" onclick="switchPage('products')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        Sản phẩm
      </div>
      <div class="nav-item active" onclick="switchPage('orders')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        Đơn hàng
        <span class="nav-badge" id="navBadgePending" style="display:none">0</span>
      </div>
      <p class="nav-group-title">Quản trị</p>
      <div class="nav-item" onclick="switchPage('users')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Người dùng
      </div>
      <div class="nav-item" onclick="switchPage('khuyenmai')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        Khuyến mãi
      </div>
      <p class="nav-group-title">Phân tích</p>
      <div class="nav-item" onclick="switchPage('reports')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        Báo cáo &amp; Xuất Excel
      </div>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-avatar">A</div>
        <div style="min-width:0;flex:1">
          <p class="sidebar-user-name" id="sidebarName">Admin</p>
          <p class="sidebar-user-email" id="sidebarEmail">admin@lactt.vn</p>
        </div>
      </div>
      <button class="sidebar-logout-full" id="btnLogout">Đăng xuất</button>
    </div>
  </aside>
  <div class="sidebar-overlay" id="sidebarOverlay"></div>

  <main class="admin-main">
    <header class="admin-header">
      <div class="header-left">
        <button class="sidebar-toggle" id="sidebarToggleBtn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div>
          <h1 class="admin-header-title">Quản lý Đơn hàng</h1>
          <p class="admin-header-subtitle" id="headerDate"></p>
        </div>
      </div>
      <div class="admin-header-right">
        <a href="index.jsp" class="btn btn-outline btn-sm">← Về trang chủ</a>
      </div>
    </header>

    <div class="admin-content">

      <!-- STAT CARDS TRẠNG THÁI -->
      <div class="order-stat-bar" id="statBar">
        <div class="order-stat loading"></div>
        <div class="order-stat loading"></div>
        <div class="order-stat loading"></div>
        <div class="order-stat loading"></div>
        <div class="order-stat loading"></div>
      </div>

      <!-- BỘ LỌC + TÌM KIẾM -->
      <div class="dh-toolbar">
        <div class="dh-filter-tabs" id="filterTabs">
          <button class="filter-tab active" data-status="all">Tất cả</button>
          <button class="filter-tab" data-status="cho_xac_nhan">Chờ xác nhận</button>
          <button class="filter-tab" data-status="dang_chuan_bi">Đang chuẩn bị</button>
          <button class="filter-tab" data-status="dang_giao">Đang giao</button>
          <button class="filter-tab" data-status="da_giao">Đã giao</button>
          <button class="filter-tab" data-status="hoan_thanh">Hoàn thành</button>
          <button class="filter-tab" data-status="da_huy">Đã huỷ</button>
          <button class="filter-tab" data-status="yeu_cau_hoan">Yêu cầu hoàn</button>
          <button class="filter-tab" data-status="cho_hoan_kho">Chờ hoàn kho</button>
          <button class="filter-tab" data-status="cho_hoan_tien">Chờ hoàn tiền</button>
        </div>
        <div class="dh-search-wrap">
          <input type="text" id="searchInput" placeholder="Tìm mã đơn, khách hàng, SĐT..." class="dh-search"/>
          <button class="btn btn-primary btn-sm" id="btnSearch">Tìm</button>
        </div>
      </div>

      <!-- BẢNG ĐƠN HÀNG -->
      <div class="dh-panel">
        <div class="table-responsive">
          <table class="admin-table" id="orderTable">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày đặt</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody id="orderTbody">
              <tr><td colspan="7" class="text-center" style="padding:40px;color:#9e8e82;">Đang tải...</td></tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div class="dh-pagination" id="pagination"></div>
      </div>

    </div><!-- /admin-content -->
  </main>
</div>

<!-- ══════════════════════════════════════════
     MODAL CHI TIẾT + THAO TÁC ĐƠN HÀNG
══════════════════════════════════════════ -->
<div class="dh-modal-backdrop" id="modalBackdrop">
  <div class="dh-modal" id="orderModal">
    <div class="dh-modal-header">
      <div>
        <h3 class="dh-modal-title" id="modalTitle">Chi tiết đơn hàng</h3>
        <span class="dh-modal-code" id="modalCode"></span>
      </div>
      <button class="dh-modal-close" id="modalClose">✕</button>
    </div>

    <div class="dh-modal-body">

      <!-- TIMELINE TRẠNG THÁI -->
      <div class="order-timeline" id="orderTimeline"></div>

      <div class="dh-modal-cols">
        <!-- CỘT TRÁI: thông tin -->
        <div class="dh-modal-left">
          <div class="info-block">
            <div class="info-block-title">Thông tin người nhận</div>
            <div class="info-row"><span class="info-label">Họ tên</span><span id="mTen"></span></div>
            <div class="info-row"><span class="info-label">SĐT</span><span id="mSdt"></span></div>
            <div class="info-row"><span class="info-label">Địa chỉ</span><span id="mDiaChi"></span></div>
            <div class="info-row"><span class="info-label">Email KH</span><span id="mEmail"></span></div>
            <div class="info-row"><span class="info-label">Ghi chú</span><span id="mGhiChu"></span></div>
          </div>

          <div class="info-block">
            <div class="info-block-title">Thanh toán</div>
            <div class="info-row"><span class="info-label">Phương thức</span><span id="mPtt"></span></div>
            <div class="info-row"><span class="info-label">Tạm tính</span><span id="mTamTinh"></span></div>
            <div class="info-row"><span class="info-label">Phí vận chuyển</span><span id="mPhiVC"></span></div>
            <div class="info-row"><span class="info-label">Giảm giá</span><span id="mGiamGia" style="color:#c4626e"></span></div>
            <div class="info-row total-row"><span class="info-label">Tổng cộng</span><span id="mTongTien" style="font-weight:600;color:#c4626e;font-size:1.05rem"></span></div>
          </div>

          <!-- GHI CHÚ ADMIN -->
          <div class="info-block">
            <div class="info-block-title">Ghi chú Admin</div>
            <div class="info-row"><span id="mGhiChuAdmin" style="font-size:0.83rem;color:#9e8e82;font-style:italic;"></span></div>
          </div>
        </div>

        <!-- CỘT PHẢI: sản phẩm -->
        <div class="dh-modal-right">
          <div class="info-block">
            <div class="info-block-title">Sản phẩm trong đơn</div>
            <div id="mChiTiet"></div>
          </div>
        </div>
      </div>

      <!-- ADMIN ACTION PANEL -->
      <div class="admin-action-panel" id="actionPanel"></div>

    </div><!-- /modal-body -->
  </div>
</div>

<!-- MODAL OVERRIDE TRẠNG THÁI (Admin) -->
<div class="dh-modal-backdrop" id="overrideBackdrop">
  <div class="dh-modal" style="max-width:420px">
    <div class="dh-modal-header">
      <h3 class="dh-modal-title">Override Trạng thái (Admin)</h3>
      <button class="dh-modal-close" onclick="document.getElementById('overrideBackdrop').classList.remove('show')">✕</button>
    </div>
    <div class="dh-modal-body" style="padding:20px">
      <label style="font-size:0.82rem;font-weight:600;color:#9e8e82;display:block;margin-bottom:6px;">Chuyển sang trạng thái</label>
      <select id="overrideStatus" class="dh-select" style="width:100%;margin-bottom:12px">
        <option value="cho_xac_nhan">Chờ xác nhận</option>
        <option value="dang_chuan_bi">Đang chuẩn bị</option>
        <option value="dang_giao">Đang giao</option>
        <option value="da_giao">Đã giao</option>
        <option value="hoan_thanh">Hoàn thành</option>
        <option value="da_huy">Đã huỷ</option>
        <option value="yeu_cau_hoan">Yêu cầu hoàn</option>
        <option value="cho_hoan_kho">Chờ hoàn kho</option>
        <option value="cho_hoan_tien">Chờ hoàn tiền</option>
        <option value="da_hoan_tien">Đã hoàn tiền</option>
      </select>
      <label style="font-size:0.82rem;font-weight:600;color:#9e8e82;display:block;margin-bottom:6px;">Ghi chú</label>
      <input type="text" id="overrideNote" class="dh-input" style="width:100%;margin-bottom:16px" placeholder="Lý do thay đổi..."/>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('overrideBackdrop').classList.remove('show')">Huỷ</button>
        <button class="btn btn-primary btn-sm" id="btnConfirmOverride">Xác nhận</button>
      </div>
    </div>
  </div>
</div>

<!-- MODAL XÁC NHẬN / HUỶ -->
<div class="dh-modal-backdrop" id="confirmBackdrop">
  <div class="dh-modal" style="max-width:420px">
    <div class="dh-modal-header">
      <h3 class="dh-modal-title" id="confirmTitle">Xác nhận</h3>
      <button class="dh-modal-close" onclick="document.getElementById('confirmBackdrop').classList.remove('show')">✕</button>
    </div>
    <div class="dh-modal-body" style="padding:20px">
      <p id="confirmMsg" style="font-size:0.9rem;color:#5c4c42;margin-bottom:16px"></p>
      <label style="font-size:0.82rem;font-weight:600;color:#9e8e82;display:block;margin-bottom:6px;" id="confirmNoteLabel">Ghi chú</label>
      <input type="text" id="confirmNote" class="dh-input" style="width:100%;margin-bottom:16px" placeholder="Nhập ghi chú (tuỳ chọn)..."/>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('confirmBackdrop').classList.remove('show')">Huỷ</button>
        <button class="btn btn-sm" id="btnConfirmAction" style="background:#c4626e;color:#fff">Xác nhận</button>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/auth-modal.js"></script>
<script src="js/admin.js?v=<%= System.currentTimeMillis() %>"></script>
<script src="js/donhang.js?v=<%= System.currentTimeMillis() %>"></script>
</body>
</html>
