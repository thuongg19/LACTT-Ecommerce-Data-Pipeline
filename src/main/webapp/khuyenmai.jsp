<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Khuyến mãi - LACTT Admin</title>

    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

    <link rel="stylesheet" href="css/admin.css?v=<%= System.currentTimeMillis() %>"/>
    <link rel="stylesheet" href="css/khuyenmai.css?v=<%= System.currentTimeMillis() %>"/>
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
            <div class="nav-item" onclick="switchPage('users')">Người dùng</div>
            <div class="nav-item active" onclick="switchPage('khuyenmai')">Khuyến mãi</div>

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
                    <h1 class="admin-header-title">Khuyến mãi</h1>
                    <p class="admin-header-subtitle" id="headerDateEl"></p>
                </div>
            </div>
            
            <div class="admin-header-right">
                <button class="btn btn-outline btn-sm" onclick="switchPage('orders')">Thông báo</button>
                <a href="index.jsp" class="btn btn-primary btn-sm">Quay về trang chủ</a>
            </div>
        </header>
        
        <div class="km-container">
            
            <div class="km-section">
                <div class="km-header">
                    <h2 class="km-title">Cấu hình điểm thưởng</h2>
                    <button class="btn btn-primary" onclick="openPolicyModal()">Chỉnh sửa</button>
                </div>
                <div class="km-config-grid">
                    <div class="km-config-card">
                        <div class="km-config-label">Tỷ lệ tích điểm</div>
                        <div class="km-config-value" id="valTienTich">...</div>
                        <div class="km-config-sub">chi tiêu nhận 1 điểm</div>
                    </div>
                    <div class="km-config-card">
                        <div class="km-config-label">Quy đổi điểm</div>
                        <div class="km-config-value" id="valQuyDoi">...</div>
                        <div class="km-config-sub">VNĐ cho mỗi 1 điểm</div>
                    </div>
                    <div class="km-config-card">
                        <div class="km-config-label">Freeship từ</div>
                        <div class="km-config-value" id="valFreeship">...</div>
                        <div class="km-config-sub">đơn hàng</div>
                    </div>
                    <div class="km-config-card">
                        <div class="km-config-label">Quà tặng từ</div>
                        <div class="km-config-value" id="valQuaTang">...</div>
                        <div class="km-config-sub">đơn hàng</div>
                    </div>
                </div>
            </div>

            <div class="km-section">
                <div class="km-header">
                    <h2 class="km-title">Danh sách mã khuyến mãi</h2>
                    <button class="btn btn-primary" onclick="openVoucherModal()">Tạo voucher</button>
                </div>
                
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Mã Voucher</th>
                                <th>Tên chương trình</th>
                                <th>Giảm</th>
                                <th>Đơn tối thiểu</th>
                                <th>Thời gian</th>
                                <th>Đã dùng/Tổng</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="voucherTableBody"></tbody>
                    </table>
                </div>
            </div>
            
        </div>
    </main>
</div>

<!-- MODAL CHỈNH SỬA CHÍNH SÁCH -->
<div id="policyModal" class="km-modal">
    <div class="km-modal-content">
        <h3>Cập nhật Chính sách</h3>
        <div class="km-form-group">
            <label>Chi tiêu để nhận 1 điểm (VNĐ)</label>
            <input type="number" id="inpTienTich" class="km-input" min="1">
        </div>
        <div class="km-form-group">
            <label>Giá trị quy đổi của 1 điểm (VNĐ)</label>
            <input type="number" id="inpQuyDoi" class="km-input" min="0">
        </div>
        
        <!-- Khung Preview hiển thị tự động -->
        <div id="previewBox" style="background:#fce8ec; padding:12px; border-radius:6px; margin-bottom:16px; font-size:13px; color:var(--pink); font-weight:500;">
            Chưa có thông tin tính toán.
        </div>

        <div class="km-form-group">
            <label>Mức Freeship từ đơn hàng (VNĐ)</label>
            <input type="number" id="inpFreeship" class="km-input" min="0">
        </div>
        <div class="km-form-group">
            <label>Mức Tặng quà từ đơn hàng (VNĐ)</label>
            <input type="number" id="inpQuaTang" class="km-input" min="0">
        </div>
        
        <p id="policyWarning" style="color:red; font-size:12px; display:none;">Cảnh báo: Tỷ lệ đổi lớn hơn tỷ lệ tích gây thất thoát!</p>
        <div class="km-modal-actions">
            <button class="btn btn-outline" onclick="closeModals()">Hủy</button>
            <button class="btn btn-primary" onclick="savePolicy()">Lưu thay đổi</button>
        </div>
    </div>
</div>

<div id="voucherModal" class="km-modal">
    <div class="km-modal-content km-modal-lg">
        <h3 id="modalVoucherTitle">Tạo Mã Khuyến Mãi Mới</h3>
        <input type="hidden" id="vId" value="">
        <div class="km-grid-2">
            <div class="km-form-group">
                <label>Mã Voucher (Code) *</label>
                <input type="text" id="vCode" class="km-input" style="text-transform:uppercase">
            </div>
            <div class="km-form-group">
                <label>Tên chương trình</label>
                <input type="text" id="vName" class="km-input">
            </div>
            <div class="km-form-group">
                <label>Loại giảm giá</label>
                <select id="vType" class="km-input">
                    <option value="fixed">Giảm số tiền (VNĐ)</option>
                    <option value="percent">Giảm phần trăm (%)</option>
                </select>
            </div>
            <div class="km-form-group">
                <label>Mức giảm *</label>
                <input type="number" id="vValue" class="km-input" min="1">
            </div>
            <div class="km-form-group">
                <label>Đơn tối thiểu (VNĐ)</label>
                <input type="number" id="vMinOrder" class="km-input" value="0">
            </div>
            <div class="km-form-group">
                <label>Số lượt tối đa (Để trống = Vô hạn)</label>
                <input type="number" id="vMaxUse" class="km-input" min="1">
            </div>
            <div class="km-form-group">
                <label>Ngày bắt đầu *</label>
                <input type="date" id="vStart" class="km-input">
            </div>
            <div class="km-form-group">
                <label>Ngày kết thúc *</label>
                <input type="date" id="vEnd" class="km-input">
            </div>
        </div>
        <div class="km-modal-actions">
            <button class="btn btn-outline" onclick="closeModals()">Hủy</button>
            <button class="btn btn-primary" onclick="saveVoucher()">Lưu Voucher</button>
        </div>
    </div>
</div>
<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/auth-modal.js"></script>
<script src="js/admin.js?v=<%= System.currentTimeMillis() %>"></script>
<script src="js/khuyenmai.js?v=<%= System.currentTimeMillis() %>"></script>

</body>
</html>