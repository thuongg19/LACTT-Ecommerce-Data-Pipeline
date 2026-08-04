<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Sản phẩm - LACTT Admin</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="css/admin.css?v=<%= System.currentTimeMillis() %>"/>
    <link rel="stylesheet" href="css/qlsanpham.css?v=<%= System.currentTimeMillis() %>"/>
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
            <div class="nav-item active" onclick="switchPage('qlsanpham')">Sản phẩm</div>
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
                    <h1 class="admin-header-title">Quản lý Sản phẩm</h1>
                    <p class="admin-header-subtitle" id="headerDateEl"></p>
                </div>
            </div>
            <div class="admin-header-right">
                <button class="btn btn-outline btn-sm" onclick="switchPage('orders')">Thông báo</button>
                <a href="index.jsp" class="btn btn-primary btn-sm">Quay về trang chủ</a>
            </div>
        </header>

        <div class="sp-container">
            <div class="sp-toolbar">
                <div class="sp-toolbar-left">
                    <input class="sp-input" id="searchInput" placeholder="Tìm tên sản phẩm..." oninput="renderTable()">
                    <span style="color:var(--border);">|</span>
                    
                    <select class="sp-select" id="filterBrand" onchange="renderTable()">
                        <option value="">Tất cả thương hiệu</option>
                        <option value="LA ROCHE-POSAY">La Roche-Posay</option>
                        <option value="THE ORDINARY">The Ordinary</option>
                        <option value="SKIN1004">Skin1004</option>
                        <option value="INNISFREE">Innisfree</option>
                        <option value="CERAVE">CeraVe</option>
                        <option value="AESOP">Aesop</option>
                        <option value="THE BODY SHOP">The Body Shop</option>
                        <option value="LANCÔME">Lancôme</option>
                        <option value="SK-II">SK-II</option>
                        <option value="DIOR BEAUTY">Dior Beauty</option>
                    </select>

                    <select class="sp-select" id="filterCat" onchange="renderTable()">
                        <option value="">Tất cả phân loại</option>
                        <option value="Chăm Sóc Da">Chăm sóc da</option>
                        <option value="Trang Điểm">Trang điểm</option>
                        <option value="Nước Hoa">Nước hoa</option>
                        <option value="Chăm Sóc Tóc">Chăm sóc tóc</option>
                        <option value="Chống Nắng">Chống nắng</option>
                        <option value="Chăm Sóc Cơ Thể">Chăm sóc cơ thể</option>
                    </select>

                    <span style="color:var(--border);">|</span>
                    <div class="sp-filter-tabs">
                        <div class="sp-tab active" onclick="setFilter(this,'all')">Tất cả</div>
                        <div class="sp-tab" onclick="setFilter(this,'active')">Đang bán</div>
                        <div class="sp-tab" onclick="setFilter(this,'inactive')">Ngừng KD</div>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="openModal(null)">+ Thêm sản phẩm</button>
            </div>

            <div class="sp-table-wrap">
                <div class="sp-table-header">
                    <span class="sp-table-title">Danh sách mỹ phẩm</span>
                    <span class="sp-count-badge" id="productCount">0 sản phẩm</span>
                </div>
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;"></th>
                                <th>Tên sản phẩm</th>
                                <th>Thương hiệu</th>
                                <th>Giá bán</th>
                                <th>Tồn kho</th>
                                <th>Phân loại</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="productTable"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>
</div>

<div class="sp-modal" id="modalOverlay">
    <div class="sp-modal-content">
        <h3 class="sp-modal-title" id="modalTitle">Thêm sản phẩm mới</h3>
        <p class="sp-modal-sub" id="modalSub">Điền đầy đủ thông tin mỹ phẩm bên dưới</p>
        
        <div class="sp-global-err" id="globalErr">Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.</div>
        
        <div class="status-toggle-row">
            <span class="toggle-label" id="statusLabel">Trạng thái: <strong>Mở bán</strong></span>
            <label class="toggle-switch">
                <input type="checkbox" id="statusToggle" checked onchange="updateStatusLabel()">
                <div class="toggle-track"></div>
                <div class="toggle-thumb"></div>
            </label>
        </div>
        
        <div class="sp-form-row">
            <div class="sp-form-group full">
                <label>Tên mỹ phẩm <span class="req">*</span></label>
                <input type="text" id="f-name" placeholder="VD: Kem dưỡng ẩm ban đêm">
                <span class="sp-error-msg" id="err-name"></span>
            </div>
        </div>
        <div class="sp-form-row">
            <div class="sp-form-group">
                <label>Thương hiệu <span class="req">*</span></label>
                <select id="f-brand">
                    <option value="">-- Chọn thương hiệu --</option>
                    <option value="LA ROCHE-POSAY">La Roche-Posay</option>
                    <option value="THE ORDINARY">The Ordinary</option>
                    <option value="SKIN1004">Skin1004</option>
                    <option value="INNISFREE">Innisfree</option>
                    <option value="CERAVE">CeraVe</option>
                    <option value="AESOP">Aesop</option>
                    <option value="THE BODY SHOP">The Body Shop</option>
                    <option value="LANCÔME">Lancôme</option>
                    <option value="SK-II">SK-II</option>
                    <option value="DIOR BEAUTY">Dior Beauty</option>
                </select>
                <span class="sp-error-msg" id="err-brand"></span>
            </div>
            <div class="sp-form-group">
                <label>Phân loại</label>
                <select id="f-cat">
                    <option value="">-- Chọn loại --</option>
                    <option value="Chăm Sóc Da">Chăm sóc da</option>
                    <option value="Trang Điểm">Trang điểm</option>
                    <option value="Nước Hoa">Nước hoa</option>
                    <option value="Chăm Sóc Tóc">Chăm sóc tóc</option>
                    <option value="Chống Nắng">Chống nắng</option>
                    <option value="Chăm Sóc Cơ Thể">Chăm sóc cơ thể</option>
                </select>
            </div>
        </div>
        <div class="sp-form-row">
            <div class="sp-form-group">
                <label>Giá bán (VNĐ) <span class="req">*</span></label>
                <input type="number" id="f-price" placeholder="VD: 250000" min="0">
                <span class="sp-error-msg" id="err-price"></span>
            </div>
            <div class="sp-form-group">
                <label>Số lượng kho</label>
                <input type="number" id="f-stock" placeholder="VD: 100" min="0">
            </div>
        </div>
        <div class="sp-form-row">
            <div class="sp-form-group full">
                <label>Hình ảnh sản phẩm</label>
                <div class="upload-zone" id="uploadZone">
                    <input type="file" accept="image/jpeg,image/png,image/webp" onchange="handleFile(event)">
                    <div class="upload-label">Kéo thả hoặc <span>chọn ảnh</span> từ máy tính</div>
                    <div class="upload-hint">JPG, PNG, WEBP · Tối đa 5MB</div>
                    <img id="imgPreview" class="preview-img" style="display:none">
                </div>
                <span class="sp-error-msg" id="err-img"></span>
            </div>
        </div>
        <div class="sp-form-row">
            <div class="sp-form-group full">
                <label>Mô tả công dụng</label>
                <textarea id="f-desc" placeholder="Mô tả ngắn về sản phẩm, thành phần, hướng dẫn sử dụng..."></textarea>
            </div>
        </div>
        <div class="sp-modal-footer">
            <button class="btn btn-outline" onclick="closeModal()">Hủy</button>
            <button class="btn btn-primary" onclick="saveProduct()">Lưu sản phẩm</button>
        </div>
    </div>
</div>

<div class="toast" id="toast"></div>

<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/auth-modal.js"></script>
<script src="js/admin.js?v=<%= System.currentTimeMillis() %>"></script>
<script src="js/qlsanpham.js?v=<%= System.currentTimeMillis() %>"></script>

</body>
</html>