<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LACTT — Tài Khoản Của Tôi</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="css/index.css" />
    <link rel="stylesheet" href="css/cart-drawer.css" />
    <link rel="stylesheet" href="css/auth-modal.css" />
    <link rel="stylesheet" href="css/taikhoan.css" />
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>

<!-- ANNOUNCEMENT BAR -->
<div class="announcement-bar">
    <div class="announcement-track">
        <span>✦ Miễn phí vận chuyển đơn từ 499K</span>
        <span class="sep">|</span>
        <span>Quà tặng hấp dẫn cho đơn từ 999K ✦</span>
        <span class="sep">|</span>
        <span>Hàng chính hãng 100% ✦</span>
    </div>
</div>

<!-- HEADER -->
<header class="header" id="header">
    <div class="header-top">
        <div class="header-top-inner container">
            <a href="index.jsp" class="logo">LACTT</a>
            <div class="header-search">
                <input type="text" placeholder="Bạn cần tìm sản phẩm, thương hiệu..." />
                <button>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                </button>
            </div>
            <div class="header-icons">
                <a href="TaiKhoanServlet" class="icon-btn account-btn" title="Tài khoản" data-auth-btn>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    <span>Tài khoản</span>
                </a>
                <button class="cart-btn icon-btn" title="Giỏ hàng" style="position:relative;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    <span class="cart-count">0</span>
                    <span>Giỏ hàng</span>
                </button>
            </div>
        </div>
    </div>
</header>

<!-- ══════════════════════════════════════ -->
<!-- TRANG TÀI KHOẢN MỚI - LAYOUT 2 CỘT -->
<!-- ══════════════════════════════════════ -->
<div class="tk-page">
    <div class="container">
        <div class="tk-dashboard">

            <!-- CỘT TRÁI: SIDEBAR -->
            <aside class="tk-sidebar">
                <div class="tk-sidebar-card">
                    <div class="tk-sidebar-profile">
                        <div class="tk-avatar-wrap">
                            <%-- Avatar initials render server-side từ session --%>
                            <div class="tk-avatar" id="tkAvatar">
                                <%
                                    com.mycompany.websitethuongmaidientu.model.TaiKhoan _tk =
                                        (com.mycompany.websitethuongmaidientu.model.TaiKhoan) session.getAttribute("taiKhoan");
                                    String _hoTen = (_tk != null && _tk.getHoTen() != null) ? _tk.getHoTen().trim() : "";
                                    String[] _parts = _hoTen.isEmpty() ? new String[0] : _hoTen.split("\\s+");
                                    String _initials;
                                    if (_parts.length >= 2) {
                                        _initials = ("" + _parts[0].charAt(0) + _parts[_parts.length-1].charAt(0)).toUpperCase();
                                    } else if (_parts.length == 1) {
                                        _initials = ("" + _parts[0].charAt(0)).toUpperCase();
                                    } else {
                                        _initials = "?";
                                    }
                                %>
                                <%=_initials%>
                            </div>
                            <div class="tk-avatar-edit" title="Đổi ảnh" onclick="showToast('Tính năng đang phát triển 🌸')">
                                <i data-lucide="pencil" style="width:14px;height:14px;"></i>
                            </div>
                        </div>
                        <h3 class="tk-sidebar-name" id="tkUserName">${sessionScope.taiKhoan.hoTen}</h3>
                        <span class="tk-tier-badge gold" id="tkTierBadge">
                            <i data-lucide="star" style="width:12px;height:12px;display:inline;vertical-align:middle;margin-right:4px;"></i> Thành Viên Gold
                        </span>
                    </div>
                    <nav class="tk-sidebar-nav">
                        <p class="tk-nav-group-title">
                            <i data-lucide="user-cog" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:6px;"></i> Quản lý tài khoản
                        </p>
                        <a class="tk-nav-item active" data-panel="overview" onclick="switchPanel(this, 'overview')">
                            <i data-lucide="layout-dashboard" class="tk-nav-icon-svg"></i> Tổng quan
                        </a>
                        <a class="tk-nav-item" data-panel="orders" onclick="switchPanel(this, 'orders')">
                            <i data-lucide="package-search" class="tk-nav-icon-svg"></i> Đơn hàng của tôi
                        </a>
                        <a class="tk-nav-item" data-panel="points" onclick="switchPanel(this, 'points')">
                            <i data-lucide="sparkles" class="tk-nav-icon-svg"></i> Điểm & Ưu đãi
                        </a>
                        <a class="tk-nav-item" data-panel="profile" onclick="switchPanel(this, 'profile')">
                            <i data-lucide="user-pen" class="tk-nav-icon-svg"></i> Thông tin cá nhân
                        </a>
                        <a class="tk-nav-item" data-panel="password" onclick="switchPanel(this, 'password')">
                            <i data-lucide="shield-check" class="tk-nav-icon-svg"></i> Đổi mật khẩu
                        </a>
                        <a class="tk-nav-item" data-panel="address" onclick="switchPanel(this, 'address')">
                            <i data-lucide="map-pin-house" class="tk-nav-icon-svg"></i> Sổ địa chỉ
                        </a>

                        <p class="tk-nav-group-title">
                            <i data-lucide="crown" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:6px;"></i> Vai trò đặc biệt
                        </p>
                        <c:if test="${sessionScope.taiKhoan.vaiTro eq 'nhan_vien_kho'}">
                            <a href="nhanvienkho.jsp" class="tk-nav-item">
                                <i data-lucide="warehouse" class="tk-nav-icon-svg"></i> Quản lý Kho
                            </a>
                        </c:if>
                        <c:if test="${sessionScope.taiKhoan.vaiTro eq 'admin'}">
                            <a href="admin.jsp" class="tk-nav-item">
                                <i data-lucide="shield-alert" class="tk-nav-icon-svg"></i> Admin Panel
                            </a>
                        </c:if>

                        <p class="tk-nav-group-title">
                            <i data-lucide="bell" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:6px;"></i> Khác
                        </p>
                        <a class="tk-nav-item" data-panel="newsletter" onclick="switchPanel(this, 'newsletter')">
                            <i data-lucide="mail-open" class="tk-nav-icon-svg"></i> Đăng ký nhận tin
                        </a>
                        <a class="tk-nav-item has-badge" onclick="AuthModal.logout()" style="cursor:pointer;">
                            <i data-lucide="log-out" class="tk-nav-icon-svg"></i> Đăng xuất
                        </a>
                    </nav>
                </div>
            </aside>

            <!-- CỘT PHẢI: MAIN CONTENT -->
            <main class="tk-main-content">

                <div class="tk-panel active" id="panel-overview">

                    <h2 class="tk-section-title">
                        <i data-lucide="hand" style="width:28px;height:28px;display:inline;vertical-align:middle;margin-right:10px;"></i> Chào mừng trở lại
                    </h2>

                    <!-- ===== KPI DASHBOARD ===== -->
                    <div class="tk-stats-row">
                        <div class="tk-stat-card card-orders">
                            <div class="tk-stat-icon blue">
                                <i data-lucide="package"></i>
                            </div>
                            <div>
                                <span id="tkStatOrders" class="tk-stat-num">0</span>
                                <span class="tk-stat-lbl">Đơn hàng</span>
                            </div>
                        </div>

                        <div class="tk-stat-card card-points">
                            <div class="tk-stat-icon">
                                <i data-lucide="coins"></i>
                            </div>
                            <div>
                                <span id="tkStatPoints" class="tk-stat-num">0</span>
                                <span class="tk-stat-lbl">Điểm thưởng</span>
                            </div>
                        </div>

                        <div class="tk-stat-card card-active">
                            <div class="tk-stat-icon">
                                <i data-lucide="truck"></i>
                            </div>
                            <div>
                                <span id="tkStatActive" class="tk-stat-num">0</span>
                                <span class="tk-stat-lbl">Đang giao</span>
                            </div>
                        </div>

                        <div class="tk-stat-card card-voucher">
                            <div class="tk-stat-icon">
                                <i data-lucide="tags"></i>
                            </div>
                            <div>
                                <span class="tk-stat-num">2</span>
                                <span class="tk-stat-lbl">Voucher</span>
                            </div>
                        </div>
                    </div>

                    <!-- ===== GRID ===== -->
                    <div class="tk-overview-grid">

                        <!-- WALLET -->
                        <div class="tk-wallet-card">
                            <div class="tk-wallet-top">
                                <div>
                                    <p class="tk-wallet-label">Ví điểm thưởng</p>
                                    <div class="tk-wallet-pts" id="overviewPoints">0 <span>điểm</span></div>
                                    <p class="tk-wallet-equiv" id="overviewPointsEquiv">≈ 0₫</p>
                                </div>
                                <div class="tk-wallet-tier">
                                    <i data-lucide="shield-half" style="width:32px;height:32px;display:block;margin:0 auto 4px;color:var(--primary-gold);"></i>
                                    <span id="overviewTierName" class="tk-tier-name">Silver</span>
                                </div>
                            </div>

                            <div class="tk-progress-bar">
                                <div id="walletProgress" class="tk-progress-fill"></div>
                            </div>

                            <div class="tk-progress-info">
                                <span id="overviewProgressLabel"></span>
                                <span id="overviewProgressPct"></span>
                            </div>
                        </div>

                        <!-- INFO -->
                        <div class="tk-info-card">
                            <p class="tk-info-card-title">Thông tin tài khoản</p>

                            <div class="tk-info-row">
                                <div class="tk-info-icon">
                                    <i data-lucide="user" style="width:16px;height:16px;"></i>
                                </div>
                                <span class="tk-info-key">Họ tên</span>
                                <span id="infoName" class="tk-info-val">${sessionScope.taiKhoan.hoTen}</span>
                            </div>

                            <div class="tk-info-row">
                                <div class="tk-info-icon">
                                    <i data-lucide="mail" style="width:16px;height:16px;"></i>
                                </div>
                                <span class="tk-info-key">Email</span>
                                <span id="infoEmail" class="tk-info-val">${sessionScope.taiKhoan.email}</span>
                            </div>

                            <div class="tk-info-row">
                                <div class="tk-info-icon">
                                    <i data-lucide="smartphone" style="width:16px;height:16px;"></i>
                                </div>
                                <span class="tk-info-key">Điện thoại</span>
                                <span id="infoPhone" class="tk-info-val">${sessionScope.taiKhoan.soDienThoai}</span>
                            </div>
                        </div>
                    </div>

                    <!-- ===== RECENT ORDERS ===== -->
                    <div class="tk-recent-orders">
                        <div class="tk-recent-header">
                            <h3>
                                <i data-lucide="clock-4" style="width:20px;height:20px;display:inline;vertical-align:middle;margin-right:8px;"></i> Đơn hàng gần đây
                            </h3>
                            <span class="tk-see-all" onclick="switchPanel(document.querySelector('[data-panel=orders]'),'orders')">
                                Xem tất cả <i data-lucide="arrow-right" style="width:14px;height:14px;display:inline;vertical-align:middle;"></i>
                            </span>
                        </div>

                        <div class="tk-table-wrapper">
                            <table class="tk-order-table">
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>Sản phẩm</th>
                                        <th>Tổng tiền</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody id="recentOrdersTableBody"></tbody>
                            </table>
                        </div>
                    </div>

                </div>

                <!-- PANEL: ĐƠN HÀNG -->
                <div class="tk-panel" id="panel-orders">
                    <h2 class="tk-section-title">
                        <i data-lucide="package-search" style="width:28px;height:28px;display:inline;vertical-align:middle;margin-right:10px;"></i> Đơn Hàng Của Tôi
                    </h2>

                    <div class="tk-filter-bar">
                        <button class="tk-filter-btn active" data-filter="all" onclick="filterOrderCards(this,'all')">Tất cả</button>
                        <button class="tk-filter-btn" data-filter="pending" onclick="filterOrderCards(this,'pending')">
                            <i data-lucide="clock" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i> Chờ duyệt
                        </button>
                        <button class="tk-filter-btn" data-filter="confirmed" onclick="filterOrderCards(this,'confirmed')">
                            <i data-lucide="check-circle" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i> Chờ lấy hàng
                        </button>
                        <button class="tk-filter-btn" data-filter="packing" onclick="filterOrderCards(this,'packing')">
                            <i data-lucide="package" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i> Đóng gói
                        </button>
                        <button class="tk-filter-btn" data-filter="shipping" onclick="filterOrderCards(this,'shipping')">
                            <i data-lucide="truck" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i> Đang giao
                        </button>
                        <button class="tk-filter-btn" data-filter="delivered" onclick="filterOrderCards(this,'delivered')">
                            <i data-lucide="circle-check-big" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i> Đã giao
                        </button>
                        <button class="tk-filter-btn" data-filter="cancelled" onclick="filterOrderCards(this,'cancelled')">
                            <i data-lucide="x-circle" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i> Đã hủy
                        </button>
                    </div>

                    <div id="ordersContainer"></div>
                </div>

                <!-- PANEL: ĐIỂM & ƯU ĐÃI -->
                <div class="tk-panel" id="panel-points">
                    <h2 class="tk-section-title">
                        <i data-lucide="sparkles" style="width:28px;height:28px;display:inline;vertical-align:middle;margin-right:10px;color:var(--primary-gold);"></i> Điểm Thưởng & Hạng Thành Viên
                    </h2>

                    <!-- 3 thẻ tổng điểm -->
                    <div class="tk-points-grid">
                        <div class="tk-pts-stat">
                            <span class="tk-pts-stat-num pink" id="ptsCurrentPoints">1.250</span>
                            <span class="tk-pts-stat-lbl">Điểm hiện có</span>
                        </div>
                        <div class="tk-pts-stat">
                            <span class="tk-pts-stat-num" id="ptsTotalPoints">1.250</span>
                            <span class="tk-pts-stat-lbl">Tổng điểm tích lũy</span>
                        </div>
                        <div class="tk-pts-stat">
                            <span class="tk-pts-stat-num" id="ptsUsedPoints">0</span>
                            <span class="tk-pts-stat-lbl">Đã sử dụng</span>
                        </div>
                    </div>

                    <!-- Tier progress banner -->
                    <div class="tk-tier-progress-banner">
                        <div class="tk-tier-progress-icon">
                            <i data-lucide="shield-half" style="width:32px;height:32px;color:var(--primary-gold);"></i>
                        </div>
                        <div class="tk-tier-progress-info">
                            <p class="tk-tier-progress-title">Hạng Silver — Bạn cần <strong style="color:var(--primary-gold)">3.750 điểm</strong> để lên Gold</p>
                            <p class="tk-tier-progress-sub">Tích thêm <strong>3.750 điểm</strong> để mở khoá ưu đãi Gold</p>
                            <div class="tk-tier-bar-wrap">
                                <div class="tk-tier-bar-bg">
                                    <div class="tk-tier-bar-fill" style="width: 25%"></div>
                                </div>
                                <span class="tk-tier-bar-pct">25%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Tier cards -->
                    <h3 class="tk-pts-section-title" style="margin-bottom:18px;">
                        <i data-lucide="medal" style="width:20px;height:20px;display:inline;vertical-align:middle;margin-right:8px;color:var(--primary-rose-light);"></i> Hạng Thành Viên
                    </h3>
                    <div class="tk-tier-cards">
                        <!-- Silver (hạng hiện tại) -->
                        <div class="tk-tier-card current-tier">
                            <span class="tk-tier-current-badge">Hạng của bạn</span>
                            <div class="tk-tier-card-icon-wrap">
                                <i data-lucide="shield-half" style="width:36px;height:36px;color:var(--primary-gold);"></i>
                            </div>
                            <p class="tk-tier-card-name">Silver</p>
                            <p class="tk-tier-req">Tích lũy 0 – 4.999 điểm</p>
                            <div class="tk-tier-divider"></div>
                            <div class="tk-tier-perks">
                                <span class="tk-tier-perk">Tích 1 điểm / 10.000₫</span>
                                <span class="tk-tier-perk">Voucher sinh nhật 50K</span>
                                <span class="tk-tier-perk">Freeship đơn từ 499K</span>
                            </div>
                        </div>
                        <!-- Gold -->
                        <div class="tk-tier-card">
                            <div class="tk-tier-card-icon-wrap">
                                <i data-lucide="shield-half" style="width:36px;height:36px;color:var(--primary-gold);opacity:0.6;"></i>
                            </div>
                            <p class="tk-tier-card-name">Gold</p>
                            <p class="tk-tier-req">Tích lũy 5.000 – 9.999 điểm</p>
                            <div class="tk-tier-divider"></div>
                            <div class="tk-tier-perks">
                                <span class="tk-tier-perk">Tích 1.5 điểm / 10.000₫</span>
                                <span class="tk-tier-perk">Voucher sinh nhật 100K</span>
                                <span class="tk-tier-perk">Freeship đơn từ 299K</span>
                                <span class="tk-tier-perk">Ưu tiên xử lý đơn</span>
                            </div>
                        </div>
                        <!-- Platinum -->
                        <div class="tk-tier-card">
                            <div class="tk-tier-card-icon-wrap">
                                <i data-lucide="shield-half" style="width:36px;height:36px;color:#9B8EC4;"></i>
                            </div>
                            <p class="tk-tier-card-name">Platinum</p>
                            <p class="tk-tier-req">Tích lũy từ 10.000 điểm</p>
                            <div class="tk-tier-divider"></div>
                            <div class="tk-tier-perks">
                                <span class="tk-tier-perk">Tích 2 điểm / 10.000₫</span>
                                <span class="tk-tier-perk">Voucher sinh nhật 200K</span>
                                <span class="tk-tier-perk">Freeship không giới hạn</span>
                                <span class="tk-tier-perk">Quà tặng hàng tháng</span>
                                <span class="tk-tier-perk">Tư vấn beauty riêng</span>
                            </div>
                        </div>
                    </div>

                    <!-- Lịch sử điểm -->
                    <h3 class="tk-pts-section-title">
                        <i data-lucide="history" style="width:20px;height:20px;display:inline;vertical-align:middle;margin-right:8px;color:var(--primary-rose-light);"></i> Lịch Sử Điểm
                    </h3>
                    <div class="tk-pts-table">
                        <div class="tk-pts-table-head">
                            <span>Mô tả</span>
                            <span>Ngày</span>
                            <span style="text-align:right">Điểm</span>
                        </div>
                        <div class="tk-pts-row">
                            <div>
                                <p class="tk-pts-desc">
                                    <i data-lucide="shopping-bag" style="width:14px;height:14px;display:inline;vertical-align:middle;color:var(--primary-rose-light);"></i>
                                    Đơn hàng #LACTT-20260411-003
                                </p>
                                <p class="tk-pts-sub">SK-II Facial Treatment Essence</p>
                            </div>
                            <span class="tk-pts-date">11/04/2026</span>
                            <span class="tk-pts-change pts-plus">+245</span>
                        </div>
                        <div class="tk-pts-row">
                            <div>
                                <p class="tk-pts-desc">
                                    <i data-lucide="gift" style="width:14px;height:14px;display:inline;vertical-align:middle;color:var(--primary-gold);"></i>
                                    Điểm sinh nhật thành viên Gold
                                </p>
                                <p class="tk-pts-sub">Tặng nhân dịp sinh nhật 15/08</p>
                            </div>
                            <span class="tk-pts-date">15/08/2025</span>
                            <span class="tk-pts-change pts-plus">+100</span>
                        </div>
                        <div class="tk-pts-row">
                            <div>
                                <p class="tk-pts-desc">
                                    <i data-lucide="credit-card" style="width:14px;height:14px;display:inline;vertical-align:middle;color:#9B8EC4;"></i>
                                    Đổi điểm giảm giá đơn hàng
                                </p>
                                <p class="tk-pts-sub">Đơn #LACTT-20260210-008</p>
                            </div>
                            <span class="tk-pts-date">10/02/2026</span>
                            <span class="tk-pts-change pts-minus">−500</span>
                        </div>
                        <div class="tk-pts-row">
                            <div>
                                <p class="tk-pts-desc">
                                    <i data-lucide="shopping-bag" style="width:14px;height:14px;display:inline;vertical-align:middle;color:var(--primary-rose-light);"></i>
                                    Đơn hàng #LACTT-20260115-007
                                </p>
                                <p class="tk-pts-sub">Laneige + Innisfree combo</p>
                            </div>
                            <span class="tk-pts-date">15/01/2026</span>
                            <span class="tk-pts-change pts-plus">+189</span>
                        </div>
                        <div class="tk-pts-row">
                            <div>
                                <p class="tk-pts-desc">
                                    <i data-lucide="star" style="width:14px;height:14px;display:inline;vertical-align:middle;color:var(--primary-gold);"></i>
                                    Thưởng đánh giá sản phẩm
                                </p>
                                <p class="tk-pts-sub">Review SK-II Essence 5 sao</p>
                            </div>
                            <span class="tk-pts-date">02/01/2026</span>
                            <span class="tk-pts-change pts-plus">+20</span>
                        </div>
                        <div class="tk-pts-row">
                            <div>
                                <p class="tk-pts-desc">
                                    <i data-lucide="party-popper" style="width:14px;height:14px;display:inline;vertical-align:middle;color:var(--primary-rose-light);"></i>
                                    Thưởng đăng ký thành viên
                                </p>
                                <p class="tk-pts-sub">Bonus chào mừng thành viên mới</p>
                            </div>
                            <span class="tk-pts-date">03/03/2023</span>
                            <span class="tk-pts-change pts-plus">+200</span>
                        </div>
                    </div>
                </div>

                <!-- PANEL: THÔNG TIN CÁ NHÂN -->
                <div class="tk-panel" id="panel-profile">
                    <form method="POST" action="TaiKhoanServlet">
                        <input type="hidden" name="action" value="updateProfile" />
                        <h2 class="tk-section-title">
                            <i data-lucide="user-pen" style="width:28px;height:28px;display:inline;vertical-align:middle;margin-right:10px;"></i> Thông Tin Cá Nhân
                        </h2>
                        <div class="tk-edit-form">
                            <div class="tk-form-row">
                                <div class="tk-field">
                                    <label>Họ & tên đệm</label>
                                    <input type="text" id="editFirstName" />
                                </div>
                                <div class="tk-field">
                                    <label>Tên</label>
                                    <input type="text" id="editLastName" />
                                </div>
                            </div>
                            <div class="tk-form-row">
                                <div class="tk-field">
                                    <label>Email</label>
                                    <input type="email" id="editEmail"/>
                                </div>
                                <div class="tk-field">
                                    <label>Số điện thoại</label>
                                    <input type="tel" id="editPhone" placeholder="09xx xxx xxx" />
                                </div>
                            </div>
                            <div class="tk-form-row">
                                <div class="tk-field">
                                    <label>Ngày sinh</label>
                                    <input type="date" id="editDob" />
                                </div>
                                <div class="tk-field">
                                    <label>Giới tính</label>
                                    <select id="editGender">
                                        <option value="female">Nữ</option>
                                        <option value="male">Nam</option>
                                        <option value="other">Không muốn chia sẻ</option>
                                    </select>
                                </div>
                            </div>
                            <div class="tk-form-row full">
                                <div class="tk-field">
                                    <label>Loại da</label>
                                    <select id="editSkinType">
                                        <option value="oily">Da dầu</option>
                                        <option value="combination">Da hỗn hợp</option>
                                        <option value="dry">Da khô</option>
                                        <option value="sensitive">Da nhạy cảm</option>
                                        <option value="normal">Da thường</option>
                                    </select>
                                </div>
                            </div>
                            <div class="tk-form-actions">
                                <button class="tk-btn-sm tk-btn-primary" type="button" onclick="saveProfile()">
                                    <i data-lucide="save" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i> Lưu thay đổi
                                </button>
                                <button class="tk-btn-sm tk-btn-outline" type="button" onclick="loadProfileForm()">
                                    <i data-lucide="undo-2" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i> Đặt lại
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- PANEL: ĐỔI MẬT KHẨU -->
                <div class="tk-panel" id="panel-password">
                    <h2 class="tk-section-title">
                        <i data-lucide="shield-check" style="width:28px;height:28px;display:inline;vertical-align:middle;margin-right:10px;"></i> Đổi Mật Khẩu
                    </h2>
                    <div class="tk-edit-form" style="max-width:500px">
                        <div class="tk-form-row full">
                            <div class="tk-field">
                                <label>Mật khẩu hiện tại</label>
                                <div class="tk-pwd-wrap">
                                    <input type="password" id="pwdCurrent" placeholder="••••••••" />
                                    <button type="button" class="tk-pwd-eye" onclick="tkTogglePwd('pwdCurrent', this)" tabindex="-1">
                                        <i data-lucide="eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="tk-form-row full">
                            <div class="tk-field">
                                <label>Mật khẩu mới</label>
                                <div class="tk-pwd-wrap">
                                    <input type="password" id="pwdNew" placeholder="Tối thiểu 6 ký tự" />
                                    <button type="button" class="tk-pwd-eye" onclick="tkTogglePwd('pwdNew', this)" tabindex="-1">
                                        <i data-lucide="eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="tk-form-row full">
                            <div class="tk-field">
                                <label>Xác nhận mật khẩu mới</label>
                                <div class="tk-pwd-wrap">
                                    <input type="password" id="pwdConfirm" placeholder="Nhập lại mật khẩu" />
                                    <button type="button" class="tk-pwd-eye" onclick="tkTogglePwd('pwdConfirm', this)" tabindex="-1">
                                        <i data-lucide="eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="tk-form-actions">
                            <button class="tk-btn-sm tk-btn-primary" type="button" onclick="doiMatKhau()">
                                <i data-lucide="key-round" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:6px;"></i> Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>

                <!-- PANEL: ĐỊA CHỈ GIAO HÀNG -->
                <div class="tk-panel" id="panel-address">
                    <h2 class="tk-section-title">
                        <i data-lucide="map-pin-house" style="width:28px;height:28px;display:inline;vertical-align:middle;margin-right:10px;"></i> Địa Chỉ Giao Hàng
                    </h2>
                    <div class="tk-addr-grid" id="addressContainer"></div>
                </div>

                <!-- PANEL: NEWSLETTER -->
                <div class="tk-panel" id="panel-newsletter">
                    <h2 class="tk-section-title">
                        <i data-lucide="mail-open" style="width:28px;height:28px;display:inline;vertical-align:middle;margin-right:10px;"></i> Đăng Ký Nhận Tin
                    </h2>
                    <div class="tk-info-card">
                        <p class="tk-info-card-title">Nhận thông báo về</p>
                        <div class="tk-info-row">
                            <div class="tk-info-icon">
                                <i data-lucide="percent" style="width:16px;height:16px;"></i>
                            </div>
                            <span class="tk-info-key">Khuyến mãi độc quyền</span>
                            <span class="tk-info-val">
                                <input type="checkbox" checked style="width:18px;height:18px;accent-color:var(--primary-rose);">
                            </span>
                        </div>
                        <div class="tk-info-row">
                            <div class="tk-info-icon">
                                <i data-lucide="sparkles" style="width:16px;height:16px;"></i>
                            </div>
                            <span class="tk-info-key">Sản phẩm mới</span>
                            <span class="tk-info-val">
                                <input type="checkbox" checked style="width:18px;height:18px;accent-color:var(--primary-rose);">
                            </span>
                        </div>
                        <div class="tk-info-row">
                            <div class="tk-info-icon">
                                <i data-lucide="lightbulb" style="width:16px;height:16px;"></i>
                            </div>
                            <span class="tk-info-key">Mẹo làm đẹp</span>
                            <span class="tk-info-val">
                                <input type="checkbox" style="width:18px;height:18px;accent-color:var(--primary-rose);">
                            </span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    </div>
</div>

<!-- TOAST -->
<div class="tk-toast" id="tkToast"></div>

<!-- MODAL HOÀN HÀNG -->
<div id="refundModal" class="tk-modal" style="display:none">
    <div class="tk-modal-overlay" onclick="closeRefund()"></div>
    <div class="tk-modal-content">
        <h3 style="margin-bottom:15px">
            <i data-lucide="undo-2" style="width:20px;height:20px;display:inline;vertical-align:middle;margin-right:8px;"></i> Yêu cầu hoàn hàng
        </h3>
        <label>Lý do hoàn hàng:</label>
        <select id="refundReason">
            <option value="Sai sản phẩm">Sai sản phẩm</option>
            <option value="Hàng lỗi">Hàng lỗi</option>
            <option value="Không đúng mô tả">Không đúng mô tả</option>
            <option value="Không muốn mua nữa">Không muốn mua nữa</option>
        </select>
        <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">
            <button class="tk-btn-sm tk-btn-outline" onclick="closeRefund()">
                <i data-lucide="x" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px;"></i> Huỷ
            </button>
            <button class="tk-btn-sm tk-btn-danger" onclick="submitRefund()">
                <i data-lucide="send" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px;"></i> Gửi yêu cầu
            </button>
        </div>
    </div>
</div>

<!-- MODAL SỬA ĐỊA CHỈ -->
<div id="editAddressModal" class="tk-modal" style="display:none">
    <div class="tk-modal-overlay" onclick="closeEditAddress()"></div>
    <div class="tk-modal-content">
        <h3 style="margin-bottom:15px">
            <i data-lucide="pencil" style="width:20px;height:20px;display:inline;vertical-align:middle;margin-right:8px;"></i> Sửa địa chỉ
        </h3>
        <form id="editAddressForm" onsubmit="submitEditAddress(event)">
            <input type="hidden" id="editAddrId" name="id" />
            <div style="margin-bottom: 10px;">
                <label>Tên người nhận</label>
                <input type="text" id="editAddrName" name="tenNguoiNhan" required style="width: 100%; padding: 8px; border:1px solid #ddd; border-radius:4px;" />
            </div>
            <div style="margin-bottom: 10px;">
                <label>Số điện thoại</label>
                <input type="tel" id="editAddrPhone" name="soDienThoai" required style="width: 100%; padding: 8px; border:1px solid #ddd; border-radius:4px;" />
            </div>
            <div style="margin-bottom: 10px;">
                <label>Địa chỉ cụ thể</label>
                <input type="text" id="editAddrDetail" name="diaChiCuThe" required style="width: 100%; padding: 8px; border:1px solid #ddd; border-radius:4px;" />
            </div>
            <div style="margin-bottom: 15px;">
                <label><input type="checkbox" id="editAddrDefault" name="macDinh" /> Đặt làm địa chỉ mặc định</label>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end">
                <button type="button" class="tk-btn-sm tk-btn-outline" onclick="closeEditAddress()">
                    <i data-lucide="x" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px;"></i> Huỷ
                </button>
                <button type="submit" class="tk-btn-sm tk-btn-primary">
                    <i data-lucide="save" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px;"></i> Lưu thay đổi
                </button>
            </div>
        </form>
    </div>
</div>

<!-- FOOTER -->
<footer class="footer">
    <div class="container">
        <div class="footer-bottom">
            <p>© 2026 LACTT. Tất cả quyền được bảo lưu.</p>
            <div class="footer-legal">
                <a href="#">Điều khoản</a>
                <a href="#">Bảo mật</a>
                <a href="#">Liên hệ</a>
            </div>
        </div>
    </div>
</footer>

<script src="js/cart.js"></script>
<script src="js/cart-drawer.js"></script>
<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/auth-modal.js"></script>
<script>
window.SESSION_USER = {
  maNguoiDung: ${sessionScope.taiKhoan.id},
  hoTen:       "${sessionScope.taiKhoan.hoTen}",
  email:       "${sessionScope.taiKhoan.email}",
  soDienThoai: "${sessionScope.taiKhoan.soDienThoai}",
  vaiTro:      "${sessionScope.taiKhoan.vaiTro}",
  ngaySinh:    "${sessionScope.taiKhoan.ngaySinh}",
  gioiTinh:    "${sessionScope.taiKhoan.gioiTinh}",
  loaiDa:      "${sessionScope.taiKhoan.loaiDa}"
};
</script>
<script src="js/taikhoan.js"></script>

<script>
    /* ══════════════════════════════════════
       CHUYỂN PANEL
       ══════════════════════════════════════ */
    function switchPanel(el, panelId) {
        document.querySelectorAll('.tk-nav-item').forEach(item => item.classList.remove('active'));
        if (el) el.classList.add('active');

        document.querySelectorAll('.tk-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById('panel-' + panelId);
        if (panel) panel.classList.add('active');

        if (panelId === 'overview') loadOverview();
        if (panelId === 'address') loadAddresses();
        if (panelId === 'orders')  renderAllOrders();
        if (panelId === 'profile') loadProfileForm();
        if (panelId === 'points')  loadPoints();

        if (window.innerWidth < 992) {
            document.querySelector('.tk-main-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /* ══════════════════════════════════════
       TOAST
       ══════════════════════════════════════ */
    function showToast(msg) {
        const toast = document.getElementById('tkToast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    /* ══════════════════════════════════════
       MODAL HOÀN HÀNG
       ══════════════════════════════════════ */
    let currentRefundOrderId = null;

    function openRefund(orderId) {
        currentRefundOrderId = orderId;
        const modal = document.getElementById('refundModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeRefund() {
        currentRefundOrderId = null;
        const modal = document.getElementById('refundModal');
        if (modal) modal.style.display = 'none';
    }

    /* ══════════════════════════════════════
       HIỂN THỊ NÚT THEO ROLE
       ══════════════════════════════════════ */
    (function() {
        var role = (window.SESSION_USER && window.SESSION_USER.vaiTro) || '';
        if (role === 'nhan_vien_kho' || role === 'admin') {
            var btnKho = document.getElementById('btnGoKho');
            if (btnKho) btnKho.style.display = '';
        }
        if (role === 'admin') {
            var btnAdmin = document.getElementById('btnGoAdmin');
            if (btnAdmin) btnAdmin.style.display = '';
        }
    })();

    // Toggle hiện/ẩn mật khẩu
    function tkTogglePwd(inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        // Đổi icon
        const icon = btn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
            lucide.createIcons({ nodes: [icon] });
        }
        btn.style.color = isHidden ? 'var(--primary-rose)' : '';
    }

    // Kích hoạt Lucide icons
    lucide.createIcons();

    // Tự động chuyển tab theo ?tab= trên URL
    (function() {
        var tab = new URLSearchParams(window.location.search).get('tab');
        if (tab) {
            var navEl = document.querySelector('[data-panel="' + tab + '"]');
            if (navEl) switchPanel(navEl, tab);
        }
    })();
</script>
</body>
</html>