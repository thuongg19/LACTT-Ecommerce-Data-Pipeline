<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Người dùng - LACTT Admin</title>

    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

    <link rel="stylesheet" href="css/admin.css?v=<%= System.currentTimeMillis() %>"/>
    <link rel="stylesheet" href="css/nguoidung.css?v=<%= System.currentTimeMillis() %>"/>
    
    <style>
    .table-responsive {
        max-height: 100vh;
        overflow-y: auto;
    }
    .admin-table thead th {
        position: sticky;
        top: 0;
        background-color: var(--white);
        z-index: 10;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    /* CSS cho thanh phân trang giống đơn hàng */
    .nd-pagination {
        display: flex;
        gap: 4px;
        align-items: center;
        justify-content: center;
        padding: 16px;
        border-top: 1px solid var(--border);
        margin-top: 10px;
    }
    .page-btn {
        padding: 5px 12px;
        border-radius: 6px;
        border: 1.5px solid var(--border);
        background: var(--white);
        font-size: 0.8rem;
        cursor: pointer;
        transition: all .15s;
        font-family: var(--ff-body);
        color: var(--charcoal);
    }
    .page-btn:hover { 
        border-color: var(--pink-soft); 
    }
    .page-btn.active { 
        background: var(--pink); 
        color: #fff; 
        border-color: var(--pink); 
    }
    .page-btn:disabled { 
        opacity: .4; 
        cursor: not-allowed; 
    }
</style>
    
</head>
<body>
<div class="admin-layout">

    <aside class="admin-sidebar" id="adminSidebar">
        <div class="sidebar-brand">
            <span class="sidebar-logo">LACTT</span>
            <span class="sidebar-role-badge">Admin Panel</span>
        </div>
        <nav class="sidebar-nav">
            <p class="nav-group-title">Tổng quan</p>
            <div class="nav-item" onclick="switchPage('dashboard')">Dashboard</div>

            <p class="nav-group-title">Kinh doanh</p>
            <div class="nav-item" onclick="switchPage('products')">Sản phẩm</div>
            <div class="nav-item" onclick="switchPage('orders')">Đơn hàng</div>

            <p class="nav-group-title">Quản trị</p>
            <div class="nav-item active" onclick="switchPage('users')">Người dùng</div>
            <div class="nav-item" onclick="switchPage('khuyenmai')">Khuyến mãi</div>

            <p class="nav-group-title">Phân tích</p>
            <div class="nav-item" onclick="switchPage('reports')">Báo cáo & Xuất Excel</div>
        </nav>

        <div class="sidebar-footer">
            <div class="sidebar-user">
                <div class="sidebar-user-avatar">A</div>
                <div style="min-width:0;flex:1">
                    <p class="sidebar-user-name">Admin</p>
                    <p class="sidebar-user-email">admin@lactt.vn</p>
                </div>
            </div>
            <button class="sidebar-logout-full" onclick="AuthModal.logout()">Đăng xuất</button>
        </div>
    </aside>

    <main class="admin-main">
        <header class="admin-header">
            <div class="header-left">
                <button class="sidebar-toggle" id="sidebarToggleBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <div>
                    <h1 class="admin-header-title">Quản lý Người dùng</h1>
                    <p class="admin-header-subtitle" id="headerDateEl"></p>
                </div>
            </div>
            <div class="admin-header-right">
                <button class="btn btn-outline btn-sm" onclick="switchPage('orders')">Thông báo</button>
                <a href="index.jsp" class="btn btn-primary btn-sm">Quay về trang chủ</a>
            </div>
        </header>

        <div class="nd-container">
            <div class="nd-section">
                <div class="nd-header">
                    <h2 class="nd-title">Danh sách tài khoản</h2>
                    <div class="nd-filter-tabs">
                        <button class="nd-tab active" onclick="filterTab(this,'all')">Tất cả</button>
                        <button class="nd-tab" onclick="filterTab(this,'kh')">Khách hàng</button>
                        <button class="nd-tab" onclick="filterTab(this,'admin')">Admin</button>
                        <button class="nd-tab" onclick="filterTab(this,'nv')">NV Kho</button>
                    </div>
                </div>

                <div class="table-responsive">
    <table class="admin-table">
        <thead>
            <tr>
                <th style="min-width: 140px;">Họ tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Giới tính</th>
                <th>Ngày sinh</th>
                <th>Vai trò</th>
                <th>Đơn hàng</th>
                <th>Điểm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
            </tr>
        </thead>
        <tbody id="userTable"></tbody>
    </table>
</div>
<div class="nd-pagination" id="paginationControls"></div>
            </div>
        </div>
    </main>
</div>

<!-- MODAL KHÓA TÀI KHOẢN -->
<div class="nd-modal" id="lockModal">
    <div class="nd-modal-content">
        <h3 class="modal-title">⚠ Xác nhận khóa tài khoản</h3>
        <p class="modal-desc">Thao tác này sẽ ngay lập tức hủy phiên đăng nhập hiện tại của người dùng và chặn quyền truy cập hệ thống.</p>

        <div id="lockErrorBanner" class="error-banner"></div>

        <div class="modal-user-info">
            <div class="modal-user-name" id="lockTargetName"></div>
            <div class="modal-user-email" id="lockTargetEmail"></div>
        </div>

        <div class="modal-label">Lý do khóa <span style="color:#c0392b">*</span></div>
        <div class="reason-hint">
            <div class="reason-chip" onclick="setReason(this)">Bom hàng</div>
            <div class="reason-chip" onclick="setReason(this)">Spam đánh giá</div>
            <div class="reason-chip" onclick="setReason(this)">Vi phạm nội quy</div>
            <div class="reason-chip" onclick="setReason(this)">Gian lận thanh toán</div>
        </div>
        <textarea id="lockReason" class="nd-input" placeholder="Nhập lý do khóa tài khoản..."></textarea>

        <div class="nd-modal-actions">
            <button class="btn btn-outline" onclick="closeLockModal()">Hủy</button>
            <button class="btn-confirm-lock" onclick="confirmLock()">Xác nhận khóa</button>
        </div>
    </div>
</div>

<div class="nd-toast" id="ndToast"></div>

<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/auth-modal.js"></script>
<script src="js/admin.js?v=<%= System.currentTimeMillis() %>"></script>
<script src="js/nguoidung.js?v=<%= System.currentTimeMillis() %>"></script>

</body>
</html>