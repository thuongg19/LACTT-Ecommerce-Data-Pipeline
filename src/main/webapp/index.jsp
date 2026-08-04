<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LACTT — Mỹ Phẩm Cao Cấp</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/index.css" />
  <link rel="stylesheet" href="css/auth-modal.css" />
  <link rel="stylesheet" href="css/cart-drawer.css" />
  <style>
    /* Loading placeholder styles */
    .loading-placeholder {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: var(--light);
      font-family: var(--ff-body);
      font-size: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .loading-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--border);
      border-top-color: var(--gold);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
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

  <!-- ROW 1: Logo + Search + Icons -->
  <div class="header-top">
    <div class="header-top-inner container">

      <!-- LOGO -->
      <a href="#" class="logo">LACTT</a>

      <!-- SEARCH BAR INLINE -->
      <div class="header-search">
        <input type="text" id="searchInput" placeholder="Bạn cần tìm sản phẩm, thương hiệu..." />
        <button id="searchBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>

      <!-- ICONS: User + Cart -->
      <div class="header-icons">
        <button class="icon-btn" data-auth-btn title="Tài khoản">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span class="icon-label">Tài khoản</span>
        </button>
        <button class="icon-btn cart-btn" title="Giỏ hàng">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span class="icon-label">Giỏ hàng</span>
          <span class="cart-count" id="cartCount">0</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ROW 2: Nav bar với mega menu -->
  <nav class="header-nav" id="headerNav">
    <div class="container header-nav-inner">

      <!-- DANH MỤC (Mega Menu) -->
      <div class="nav-item has-mega" id="navDanhMuc">
        <button class="nav-link nav-cat-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          Danh Mục Sản Phẩm
        </button>
        <div class="mega-menu" id="megaMenu">
          <div class="mega-col">
            <a href="#" class="mega-item" data-filter-cat="skincare">
              <span class="mega-icon">🧴</span>
              <div><strong>Chăm Sóc Da</strong><span>1.240+ sản phẩm</span></div>
            </a>
            <a href="#" class="mega-item" data-filter-cat="makeup">
              <span class="mega-icon">💄</span>
              <div><strong>Trang Điểm</strong><span>980+ sản phẩm</span></div>
            </a>
            <a href="#" class="mega-item" data-filter-cat="perfume">
              <span class="mega-icon">🌹</span>
              <div><strong>Nước Hoa</strong><span>340+ sản phẩm</span></div>
            </a>
          </div>
          <div class="mega-col">
            <a href="#" class="mega-item" data-filter-cat="hair">
              <span class="mega-icon">💇</span>
              <div><strong>Chăm Sóc Tóc</strong><span>420+ sản phẩm</span></div>
            </a>
            <a href="#" class="mega-item" data-filter-cat="sunscreen">
              <span class="mega-icon">☀️</span>
              <div><strong>Chống Nắng</strong><span>180+ sản phẩm</span></div>
            </a>
            <a href="#" class="mega-item" data-filter-cat="body">
              <span class="mega-icon">🛁</span>
              <div><strong>Chăm Sóc Cơ Thể</strong><span>560+ sản phẩm</span></div>
            </a>
          </div>
          <div class="mega-col mega-brands-col">
            <p class="mega-col-title">Thương Hiệu Nổi Bật</p>
            <div class="mega-brands-grid">
              <a href="#" class="mega-brand-tag" data-filter-brand="lancome">LANCÔME</a>
              <a href="#" class="mega-brand-tag" data-filter-brand="skii">SK-II</a>
              <a href="#" class="mega-brand-tag" data-filter-brand="esteelauder">ESTÉE LAUDER</a>
              <a href="#" class="mega-brand-tag" data-filter-brand="chanel">CHANEL</a>
              <a href="#" class="mega-brand-tag" data-filter-brand="dior">DIOR</a>
              <a href="#" class="mega-brand-tag" data-filter-brand="innisfree">INNISFREE</a>
              <a href="#" class="mega-brand-tag" data-filter-brand="laneige">LANEIGE</a>
              <a href="#" class="mega-brand-tag" data-filter-brand="anessa">ANESSA</a>
              <a href="#" class="mega-brand-tag" data-filter-brand="theordinary">THE ORDINARY</a>
              <a href="#" class="mega-brand-tag" data-filter-brand="kiehls">KIEHL'S</a>
            </div>
          </div>
        </div>
      </div>

      <a href="#" class="nav-link" id="navNew">Sản Phẩm Mới</a>
      <a href="#" class="nav-link nav-sale" id="navSale">
        <span>⚡</span> Deal Hot
      </a>
      <a href="#featured" class="nav-link">Bán Chạy</a>
      <a href="#" class="nav-link">Góc Làm Đẹp</a>
      <a href="dangnhap.jsp" class="nav-link" id="navTraCuu">Tra Cứu Đơn Hàng</a>
      <script>
        (function() {
          try {
            var u = JSON.parse(localStorage.getItem('lactt_user') || 'null');
            if (u && u.maNguoiDung) document.getElementById('navTraCuu').href = 'taikhoan.jsp?tab=orders';
          } catch(e) {}
        })();
      </script>
    </div>
  </nav>

</header>

<!-- HERO -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-content container">
    <p class="hero-sub">Bộ sưu tập mới — Xuân Hè 2026</p>
    <h1 class="hero-title">Vẻ Đẹp<br/><em>Không Giới Hạn</em></h1>
    <p class="hero-desc">Khám phá hàng nghìn sản phẩm mỹ phẩm chính hãng từ các thương hiệu hàng đầu thế giới — Lancôme, L'Oréal, Estée Lauder, Innisfree và hơn 200 thương hiệu khác.</p>
    <div class="hero-cta">
      <a href="#shop" class="btn btn-primary">Khám Phá Ngay</a>
      <a href="#" class="btn btn-outline">Xem Lookbook</a>
    </div>
  </div>
</section>

<!-- BRANDS MARQUEE -->
<div class="brands-strip">
  <div class="brands-label">Thương hiệu chính hãng</div>
  <div class="brands-viewport" id="brandsViewport">
    <div class="brands-track" id="brandsTrack">
      <span class="brand-clickable" data-brand="lancome">LANCÔME</span><i>✦</i>
      <span class="brand-clickable" data-brand="loreal">L'ORÉAL</span><i>✦</i>
      <span class="brand-clickable" data-brand="esteelauder">ESTÉE LAUDER</span><i>✦</i>
      <span class="brand-clickable" data-brand="innisfree">INNISFREE</span><i>✦</i>
      <span class="brand-clickable" data-brand="skii">SK-II</span><i>✦</i>
      <span class="brand-clickable" data-brand="laneige">LANEIGE</span><i>✦</i>
      <span class="brand-clickable" data-brand="theordinary">THE ORDINARY</span><i>✦</i>
      <span class="brand-clickable" data-brand="fentybeauty">FENTY BEAUTY</span><i>✦</i>
      <span class="brand-clickable" data-brand="dior">DIOR BEAUTY</span><i>✦</i>
      <span class="brand-clickable" data-brand="chanel">CHANEL</span><i>✦</i>
      <span class="brand-clickable" data-brand="">SULWHASOO</span><i>✦</i>
      <span class="brand-clickable" data-brand="kiehls">KIEHL'S</span><i>✦</i>
      <span class="brand-clickable" data-brand="clinique">CLINIQUE</span><i>✦</i>
      <span class="brand-clickable" data-brand="shiseido">SHISEIDO</span><i>✦</i>
      <span class="brand-clickable" data-brand="anessa">ANESSA</span><i>✦</i>
      <span class="brand-clickable" data-brand="">JO MALONE</span><i>✦</i>
      <span class="brand-clickable" data-brand="">CHARLOTTE TILBURY</span><i>✦</i>
      <span class="brand-clickable" data-brand="">NARS</span><i>✦</i>
      <span class="brand-clickable" data-brand="">MAC COSMETICS</span><i>✦</i>
      <span class="brand-clickable" data-brand="">URBAN DECAY</span><i>✦</i>
    </div>
  </div>
</div>

<div class="brands-shop-divider"></div>

<!-- FLASH SALE -->
<section class="flash-sale section" id="flash-sale">
  <div class="container">
    <div class="fs-header">
      <div class="fs-header-left">
        <span class="fs-lightning">⚡</span>
        <div class="fs-title-wrap">
          <span class="fs-title">FLASH SALE</span>
          <span class="fs-subtitle">Giảm sốc mỗi ngày</span>
        </div>
      </div>
      <div class="fs-countdown-wrap">
        <span class="fs-countdown-label">Kết thúc sau</span>
        <div class="fs-countdown">
          <div class="fs-cd-block"><span class="fs-cd-num" id="hours">05</span><span class="fs-cd-unit">GIỜ</span></div>
          <span class="fs-cd-sep">:</span>
          <div class="fs-cd-block"><span class="fs-cd-num" id="minutes">42</span><span class="fs-cd-unit">PHÚT</span></div>
          <span class="fs-cd-sep">:</span>
          <div class="fs-cd-block"><span class="fs-cd-num" id="seconds">17</span><span class="fs-cd-unit">GIÂY</span></div>
        </div>
      </div>
      <a href="#shop" class="fs-view-all">Xem tất cả <span>›</span></a>
    </div>
    <div class="fs-grid">
      <!-- Sẽ được JS fetch API render lại -->
      <div class="loading-placeholder">
        <div class="loading-spinner"></div>
        <span>⚡ Đang tải Flash Sale...</span>
      </div>
    </div>
  </div>
</section>

<!-- FEATURED PRODUCTS -->
<section class="featured-products section" id="featured">
  <div class="container">
    <div class="section-header">
      <div><p class="section-tag">Nổi bật</p><h2 class="section-title">Sản Phẩm Bán Chạy</h2></div>
      <div class="product-tabs">
        <button class="tab active" data-tab-cat="all">Tất cả</button>
        <button class="tab" data-tab-cat="skincare">Dưỡng da</button>
        <button class="tab" data-tab-cat="makeup">Trang điểm</button>
        <button class="tab" data-tab-cat="skincare-serum">Serum</button>
      </div>
    </div>
    <div class="featured-grid" id="featuredGrid">
      <!-- Sẽ được JS fetch API render lại -->
      <div class="loading-placeholder">
        <div class="loading-spinner"></div>
        <span>Đang tải sản phẩm bán chạy...</span>
      </div>
    </div>
    <div class="view-more"><a href="#shop" class="btn btn-outline">Xem Tất Cả Sản Phẩm</a></div>
  </div>
</section>

<!-- SHOP SECTION -->
<div id="shop">
  <div class="shop-section-header">
    <div class="container">
      <p class="section-tag" style="color:var(--gold);position:relative;z-index:1;">Sản phẩm</p>
      <h2 class="shop-title">Tất Cả <em>Sản Phẩm</em></h2>
      <p class="shop-desc">Hơn 3.500 sản phẩm chính hãng từ 200+ thương hiệu hàng đầu thế giới</p>
    </div>
  </div>
  <div class="shop-layout container">
    <aside class="filter-sidebar" id="filterSidebar">
      <div class="filter-header"><h3>Bộ Lọc</h3><button class="filter-clear" id="clearAll">Xóa tất cả</button></div>
      <div class="filter-group"><button class="filter-group-title" data-target="grp-cat">Danh Mục<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button><div class="filter-group-body" id="grp-cat"><label class="filter-check cat-filter" data-value="all"><input type="checkbox" checked/><span class="cb"></span><span class="label">Tất cả</span><em>3.500+</em></label><label class="filter-check cat-filter" data-value="skincare"><input type="checkbox"/><span class="cb"></span><span class="label">Chăm Sóc Da</span><em>1.240</em></label><label class="filter-check cat-filter" data-value="makeup"><input type="checkbox"/><span class="cb"></span><span class="label">Trang Điểm</span><em>980</em></label><label class="filter-check cat-filter" data-value="perfume"><input type="checkbox"/><span class="cb"></span><span class="label">Nước Hoa</span><em>340</em></label><label class="filter-check cat-filter" data-value="hair"><input type="checkbox"/><span class="cb"></span><span class="label">Chăm Sóc Tóc</span><em>420</em></label><label class="filter-check cat-filter" data-value="sunscreen"><input type="checkbox"/><span class="cb"></span><span class="label">Chống Nắng</span><em>180</em></label><label class="filter-check cat-filter" data-value="body"><input type="checkbox"/><span class="cb"></span><span class="label">Chăm Sóc Cơ Thể</span><em>560</em></label></div></div>
      <div class="filter-group"><button class="filter-group-title" data-target="grp-brand">Thương Hiệu<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button><div class="filter-group-body" id="grp-brand"><div class="brand-search"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input type="text" placeholder="Tìm thương hiệu..." id="brandSearch"/></div><div class="brand-list" id="brandList"><label class="filter-check brand-filter" data-value="lancome"><input type="checkbox"/><span class="cb"></span><span class="label">LANCÔME</span></label><label class="filter-check brand-filter" data-value="loreal"><input type="checkbox"/><span class="cb"></span><span class="label">L'ORÉAL</span></label><label class="filter-check brand-filter" data-value="esteelauder"><input type="checkbox"/><span class="cb"></span><span class="label">ESTÉE LAUDER</span></label><label class="filter-check brand-filter" data-value="innisfree"><input type="checkbox"/><span class="cb"></span><span class="label">INNISFREE</span></label><label class="filter-check brand-filter" data-value="skii"><input type="checkbox"/><span class="cb"></span><span class="label">SK-II</span></label><label class="filter-check brand-filter" data-value="laneige"><input type="checkbox"/><span class="cb"></span><span class="label">LANEIGE</span></label><label class="filter-check brand-filter" data-value="theordinary"><input type="checkbox"/><span class="cb"></span><span class="label">THE ORDINARY</span></label><label class="filter-check brand-filter" data-value="fentybeauty"><input type="checkbox"/><span class="cb"></span><span class="label">FENTY BEAUTY</span></label><label class="filter-check brand-filter" data-value="chanel"><input type="checkbox"/><span class="cb"></span><span class="label">CHANEL</span></label><label class="filter-check brand-filter" data-value="kiehls"><input type="checkbox"/><span class="cb"></span><span class="label">KIEHL'S</span></label><label class="filter-check brand-filter" data-value="shiseido"><input type="checkbox"/><span class="cb"></span><span class="label">SHISEIDO</span></label><label class="filter-check brand-filter" data-value="anessa"><input type="checkbox"/><span class="cb"></span><span class="label">ANESSA</span></label><label class="filter-check brand-filter" data-value="dior"><input type="checkbox"/><span class="cb"></span><span class="label">DIOR BEAUTY</span></label><label class="filter-check brand-filter" data-value="clinique"><input type="checkbox"/><span class="cb"></span><span class="label">CLINIQUE</span></label></div></div></div>
      <div class="filter-group"><button class="filter-group-title" data-target="grp-price">Khoảng Giá<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button><div class="filter-group-body" id="grp-price"><div class="price-inputs"><div class="price-input-box"><span>Từ</span><input type="number" id="priceMin" value="0"/><span>₫</span></div><div class="price-sep">—</div><div class="price-input-box"><span>Đến</span><input type="number" id="priceMax" value="10000000"/><span>₫</span></div></div><input type="range" class="range-slider" id="rangeSlider" min="0" max="10000000" value="10000000" step="50000"/><div class="price-quick"><button class="price-quick-btn" data-min="0" data-max="500000">Dưới 500K</button><button class="price-quick-btn" data-min="0" data-max="1000000">Dưới 1tr</button><button class="price-quick-btn" data-min="0" data-max="2000000">Dưới 2tr</button><button class="price-quick-btn" data-min="0" data-max="10000000">Tất cả</button></div></div></div>
      <div class="filter-group"><button class="filter-group-title" data-target="grp-rating">Đánh Giá<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button><div class="filter-group-body" id="grp-rating"><label class="filter-check rating-filter" data-value="0"><input type="radio" name="rating" value="0" checked/><span class="cb radio"></span><span class="label">Tất cả</span></label><label class="filter-check rating-filter" data-value="5"><input type="radio" name="rating" value="5"/><span class="cb radio"></span><span class="stars-filter">★★★★★</span></label><label class="filter-check rating-filter" data-value="4"><input type="radio" name="rating" value="4"/><span class="cb radio"></span><span class="stars-filter">★★★★</span><span class="label" style="font-size:11px;color:var(--light)"> trở lên</span></label><label class="filter-check rating-filter" data-value="3"><input type="radio" name="rating" value="3"/><span class="cb radio"></span><span class="stars-filter">★★★</span><span class="label" style="font-size:11px;color:var(--light)"> trở lên</span></label></div></div>
      <div class="filter-group"><button class="filter-group-title" data-target="grp-promo">Khuyến Mãi<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button><div class="filter-group-body" id="grp-promo"><label class="filter-check promo-filter" data-value="sale"><input type="checkbox"/><span class="cb"></span><span class="label">Đang giảm giá</span></label><label class="filter-check promo-filter" data-value="new"><input type="checkbox"/><span class="cb"></span><span class="label">Hàng mới về</span></label><label class="filter-check promo-filter" data-value="hot"><input type="checkbox"/><span class="cb"></span><span class="label">Bán chạy / Yêu thích</span></label><label class="filter-check promo-filter" data-value="limited"><input type="checkbox"/><span class="cb"></span><span class="label">Limited Edition</span></label></div></div>
      <button class="btn btn-primary filter-apply" id="filterApplyBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Áp Dụng Bộ Lọc</button>
    </aside>
    <div class="products-area">
      <div class="products-toolbar">
        <div class="toolbar-left"><span class="result-count">Hiển thị <strong id="productCount">0</strong> sản phẩm</span><div class="active-filters" id="activeFilters"></div></div>
        <div class="toolbar-right"><div class="sort-wrap"><label>Sắp xếp:</label><select class="sort-select" id="sortSelect"><option value="default">Mặc định</option><option value="price-asc">Giá tăng dần</option><option value="price-desc">Giá giảm dần</option><option value="rating-desc">Đánh giá cao</option><option value="name-asc">Tên A → Z</option></select></div><div class="view-toggle"><button class="view-btn active" data-view="grid" title="Lưới"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button><button class="view-btn" data-view="list" title="Danh sách"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button></div><button class="mobile-filter-btn" id="mobileFilterBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>Bộ lọc</button></div>
      </div>
      <div class="sp-grid" id="productsGrid">
        <!-- Sẽ được JS fetch API render lại -->
        <div class="loading-placeholder">
          <div class="loading-spinner"></div>
          <span>Đang tải sản phẩm...</span>
        </div>
      </div>
      <div class="empty-state" id="emptyState" style="display:none"><div class="empty-icon">🔍</div><h3>Không tìm thấy sản phẩm</h3><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác</p><button class="btn btn-outline" id="resetBtn">Xóa bộ lọc</button></div>
      <div class="pagination" id="paginationWrap" style="display:none"><button class="page-btn" id="pagePrev" disabled><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button><div id="pageNumbers"></div><button class="page-btn" id="pageNext"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button></div>
    </div>
  </div>
</div>

<!-- PROMO BANNER -->
<section class="promo-banner"><div class="container"><div class="promo-grid"><div class="promo-card promo-left"><p class="promo-tag">Flash Sale mỗi ngày</p><h3>Giảm đến <em>50%</em><br/>Hàng ngàn sản phẩm</h3><a href="#shop" class="btn btn-primary">Xem ngay</a></div><div class="promo-card promo-right"><p class="promo-tag">Thành viên mới</p><h3>Tặng ngay <em>100K</em><br/>Khi đăng ký tài khoản</h3><a href="#" class="btn btn-light">Đăng ký</a></div></div></div></section>

<!-- WHY US -->
<section class="why-us section"><div class="container"><div class="section-header centered"><p class="section-tag">Cam kết</p><h2 class="section-title">Tại Sao Chọn LACTT?</h2></div><div class="why-grid"><div class="why-card"><div class="why-icon">🏆</div><h3>Hàng Chính Hãng 100%</h3><p>Tất cả sản phẩm nhập khẩu trực tiếp từ thương hiệu hoặc nhà phân phối chính thức, có đầy đủ chứng từ kiểm định.</p></div><div class="why-card"><div class="why-icon">🚚</div><h3>Giao Hàng Nhanh 2H</h3><p>Giao hàng trong 2 giờ tại Hà Nội và TP.HCM. Miễn phí vận chuyển cho đơn từ 499K toàn quốc.</p></div><div class="why-card"><div class="why-icon">💳</div><h3>Thanh Toán An Toàn</h3><p>Hỗ trợ 15+ phương thức: Visa, MasterCard, MoMo, ZaloPay, VNPAY, trả góp 0%.</p></div><div class="why-card"><div class="why-icon">🔄</div><h3>Đổi Trả 30 Ngày</h3><p>Cam kết đổi trả trong 30 ngày nếu sản phẩm lỗi hoặc không đúng mô tả. Hoàn tiền trong 24h.</p></div><div class="why-card"><div class="why-icon">👩‍⚕️</div><h3>Tư Vấn Chuyên Gia</h3><p>Đội ngũ chuyên gia da liễu và beauty advisor tư vấn miễn phí 24/7 qua chat, hotline.</p></div><div class="why-card"><div class="why-icon">🎁</div><h3>Quà Tặng Hấp Dẫn</h3><p>Tích điểm thành viên, nhận quà sinh nhật, ưu đãi độc quyền và deal hot mỗi tuần.</p></div></div></div></section>

<!-- TESTIMONIALS -->
<section class="testimonials section"><div class="container"><div class="section-header centered"><p class="section-tag">Đánh giá</p><h2 class="section-title">Khách Hàng Nói Gì?</h2></div><div class="testi-grid"><div class="testi-card"><div class="testi-stars">★★★★★</div><p class="testi-text">"Mình đã mua serum Lancôme ở nhiều nơi nhưng chỉ LACTT đảm bảo hàng thật. Đóng gói cẩn thận, giao nhanh và có quà tặng kèm rất xinh!"</p><div class="testi-author"><div class="testi-avatar">LH</div><div><p class="testi-name">Linh Hoàng</p><p class="testi-role">Thành viên Gold — Hà Nội</p></div></div></div><div class="testi-card featured"><div class="testi-stars">★★★★★</div><p class="testi-text">"Đặt lúc 9h tối, 7h sáng hôm sau đã nhận hàng. Sản phẩm SK-II chính hãng, tem nhập khẩu rõ ràng. Sẽ luôn ủng hộ LACTT!"</p><div class="testi-author"><div class="testi-avatar">MT</div><div><p class="testi-name">Minh Thư</p><p class="testi-role">Thành viên Platinum — TP.HCM</p></div></div></div><div class="testi-card"><div class="testi-stars">★★★★★</div><p class="testi-text">"Được tư vấn rất nhiệt tình để chọn đúng tone kem nền. Nhân viên hiểu da, không push sale, rất chuyên nghiệp!"</p><div class="testi-author"><div class="testi-avatar">NA</div><div><p class="testi-name">Ngọc Anh</p><p class="testi-role">Thành viên Silver — Đà Nẵng</p></div></div></div></div></div></section>

<!-- NEWSLETTER -->
<section class="newsletter"><div class="container"><div class="newsletter-inner"><div class="newsletter-text"><p class="section-tag">Đăng ký nhận tin</p><h2>Nhận Ưu Đãi Độc Quyền</h2><p>Đăng ký nhận bản tin để không bỏ lỡ flash sale, sản phẩm mới và deal hấp dẫn chỉ dành cho thành viên.</p></div><div class="newsletter-form"><input type="email" placeholder="Nhập địa chỉ email của bạn..." /><button class="btn btn-primary" id="nlBtn">Đăng Ký</button><p class="newsletter-note">🔒 Thông tin của bạn được bảo mật tuyệt đối</p></div></div></div></section>

<!-- FOOTER -->
<footer class="footer"><div class="container"><div class="footer-top"><div class="footer-brand"><a href="#" class="footer-logo">LACTT</a><p>Hệ thống mỹ phẩm chính hãng hàng đầu Việt Nam. Hơn 200 thương hiệu quốc tế, 3.500+ sản phẩm.</p><div class="social-links"><a href="#" class="social-link">FB</a><a href="#" class="social-link">IG</a><a href="#" class="social-link">TK</a><a href="#" class="social-link">YT</a></div></div><div class="footer-col"><h4>Về LACTT</h4><ul><li><a href="#">Giới thiệu</a></li><li><a href="#">Tuyển dụng</a></li><li><a href="#">Tin tức & Blog</a></li><li><a href="#">Hệ thống cửa hàng</a></li></ul></div><div class="footer-col"><h4>Hỗ Trợ</h4><ul><li><a href="#">Chính sách đổi trả</a></li><li><a href="#">Hướng dẫn mua hàng</a></li><li><a href="#">Theo dõi đơn hàng</a></li><li><a href="#">FAQ</a></li></ul></div><div class="footer-col"><h4>Liên Hệ</h4><ul><li>📞 1800 6789</li><li>✉️ support@lactt.vn</li><li>🕐 8:00 – 22:00 (T2–CN)</li><li>📍 Mộ Lao, Hà Đông, Hà Nội</li></ul></div></div><div class="footer-bottom"><p>© 2026 LACTT. Tất cả quyền được bảo lưu.</p><div class="footer-legal"><a href="#">Điều khoản</a><a href="#">Bảo mật</a><a href="#">Cookie</a></div><div class="payment-icons"><span>VISA</span><span>MC</span><span>MOMO</span><span>VNPAY</span><span>ZALOPAY</span></div></div></div></footer>

<button class="back-top" id="backTop">↑</button>
<div class="floating-support">
  <button class="support-btn" title="Chat hỗ trợ">💬</button>
  <button class="support-btn" title="Gọi ngay">📞</button>
</div>
<div class="filter-overlay" id="filterOverlay"></div>

<!-- JS files — đúng thứ tự: cart.js → auth-modal.js → cart-drawer.js → index.js -->
<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/cart.js"></script>
<script src="js/auth-modal.js"></script>
<script src="js/cart-drawer.js"></script>
<script src="js/index.js"></script>
</body>
</html>