<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%
    response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setDateHeader("Expires", 0);
%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title id="pageTitle">Chi Tiết Sản Phẩm — LACTT</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/chitiet.css" />
  <link rel="stylesheet" href="css/cart-drawer.css" />
  <script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
  <script src="js/cart.js"></script>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
      <div class="header-icons">
        <a href="TaiKhoanServlet" class="icon-btn" title="Tài khoản" style="text-decoration:none;">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  <span class="icon-label">Tài khoản</span>
</a>
        <button class="icon-btn cart-btn" title="Giỏ hàng">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span class="icon-label">Giỏ hàng</span>
          <span class="cart-count" id="cartCount">0</span>
        </button>
      </div>
    </div>
  </div>
  <nav class="header-nav">
    <div class="container header-nav-inner">
      <a href="index.jsp" class="nav-link">← Quay lại trang chủ</a>
      <a href="index.jsp#shop" class="nav-link">Tất cả sản phẩm</a>
      <a href="index.jsp#flash-sale" class="nav-link nav-sale"><span>⚡</span> Deal Hot</a>
    </div>
  </nav>
</header>

<!-- BREADCRUMB -->
<div class="breadcrumb-bar">
  <div class="container">
    <nav class="breadcrumb">
      <a href="index.jsp">Trang chủ</a>
      <span class="bc-sep">›</span>
      <a href="index.jsp#shop" id="bcCategory">Sản phẩm</a>
      <span class="bc-sep">›</span>
      <span class="bc-current" id="bcName">Chi tiết sản phẩm</span>
    </nav>
  </div>
</div>

<!-- MAIN PRODUCT DETAIL -->
<main class="product-detail-page">
  <div class="container">
    <div class="pd-layout">

      <!-- LEFT: Image Gallery -->
      <div class="pd-gallery">
        <div class="pd-main-img" id="pdMainImg">
          <div class="pd-emoji" id="pdEmoji">✨</div>
          <div class="pd-badges" id="pdBadges"></div>
          <button class="pd-wishlist" id="pdWishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <!-- Thumbnails giả lập -->
        <div class="pd-thumbs">
          <div class="pd-thumb active" data-emoji="" id="thumb0"></div>
          <div class="pd-thumb" data-emoji="🔬" id="thumb1">🔬</div>
          <div class="pd-thumb" data-emoji="📦" id="thumb2">📦</div>
          <div class="pd-thumb" data-emoji="🌿" id="thumb3">🌿</div>
        </div>
      </div>

      <!-- RIGHT: Product Info -->
      <div class="pd-info">
        <p class="pd-brand" id="pdBrand">LANCÔME</p>
        <h1 class="pd-name" id="pdName">Génifique Advanced Youth Activating Serum</h1>

        <div class="pd-rating-row">
          <span class="pd-stars" id="pdStars">★★★★★</span>
          <span class="pd-rating-count" id="pdRatingCount">(2.4k đánh giá)</span>
          <span class="pd-sold">| Đã bán <strong>12.5k</strong></span>
        </div>

        <div class="pd-price-box">
          <span class="pd-price-current" id="pdPrice">1.250.000₫</span>
          <span class="pd-price-old" id="pdPriceOld">1.560.000₫</span>
          <span class="pd-discount-badge" id="pdDiscount">-20%</span>
        </div>

        <div class="pd-promo-tags" id="pdPromoTags">
          <span class="promo-tag">🚚 Freeship đơn từ 499K</span>
          <span class="promo-tag">🎁 Quà tặng kèm</span>
          <span class="promo-tag">✅ Hàng chính hãng</span>
        </div>

        <!-- Volume / Variant — filled by chitiet.js -->
        <div class="pd-option-group" id="pdVariantGroup">
          <p class="pd-option-label">Dung tích / Khối lượng</p>
          <div class="pd-options" id="pdVolumes"></div>
        </div>

        <!-- Quantity -->
        <div class="pd-option-group">
          <p class="pd-option-label">Số lượng</p>
          <div class="pd-qty-wrap">
            <button class="pd-qty-btn" id="qtyMinus">−</button>
            <input type="number" class="pd-qty-input" id="qtyInput" value="1" min="1" max="1"/>
            <button class="pd-qty-btn" id="qtyPlus">+</button>
            <span class="pd-qty-stock">Còn <strong>87</strong> sản phẩm</span>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="pd-cta">
          <button class="btn-cart-main" id="btnAddCart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Thêm vào giỏ hàng
          </button>
          <button class="btn-buy-now" id="btnBuyNow">Mua ngay</button>
        </div>

        <!-- Trust badges -->
        <div class="pd-trust">
          <div class="trust-item">
            <span class="trust-icon">🏆</span>
            <span>Chính hãng 100%</span>
          </div>
          <div class="trust-item">
            <span class="trust-icon">🔄</span>
            <span>Đổi trả 30 ngày</span>
          </div>
          <div class="trust-item">
            <span class="trust-icon">🚚</span>
            <span>Giao 2H tại HN &amp; HCM</span>
          </div>
          <div class="trust-item">
            <span class="trust-icon">💳</span>
            <span>Trả góp 0%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TABS: Description / Ingredients / Reviews -->
    <div class="pd-tabs-section">
      <div class="pd-tabs">
        <button class="pd-tab active" data-tab="desc">Mô tả sản phẩm</button>
        <button class="pd-tab" data-tab="ingr">Thành phần</button>
        <button class="pd-tab" data-tab="how">Hướng dẫn sử dụng</button>
        <button class="pd-tab" data-tab="review">Đánh giá (2.4k)</button>
      </div>

      <div class="pd-tab-content active" id="tab-desc">
        <div class="pd-desc-grid">
          <div>
            <h3>Giới thiệu sản phẩm</h3>
            <p id="pdDescription">Serum làm trẻ hóa da hàng đầu từ Lancôme với công nghệ Bifidus Probiotic giúp kích hoạt khả năng phục hồi tự nhiên của da. Công thức được nghiên cứu trong hơn 30 năm, giúp da trông trẻ hơn sau 7 ngày sử dụng.</p>
            <ul class="pd-benefits" id="pdBenefits">
              <li>Da mềm mịn và căng bóng hơn sau 7 ngày</li>
              <li>Giảm rõ rệt nếp nhăn và đường nhăn mịn</li>
              <li>Dưỡng ẩm sâu, da sáng khỏe rạng rỡ</li>
              <li>Tăng cường sức đề kháng tự nhiên của da</li>
              <li>Phù hợp mọi loại da, kể cả da nhạy cảm</li>
            </ul>
          </div>
          <div class="pd-specs">
            <h3>Thông tin sản phẩm</h3>
            <table class="spec-table">
              <tr><td>Thương hiệu</td><td id="specBrand">Lancôme</td></tr>
              <tr><td>Xuất xứ</td><td>Pháp</td></tr>
              <tr><td>Loại da</td><td>Mọi loại da</td></tr>
              <tr><td>Dung tích</td><td>30ml / 50ml / 100ml</td></tr>
              <tr><td>Hạn sử dụng</td><td>36 tháng từ NSX</td></tr>
              <tr><td>Trạng thái</td><td><span id="specTrangThai" style="color:#3a9e7e;font-weight:500;">Còn hàng</span></td></tr>
            </table>
          </div>
        </div>
      </div>

      <div class="pd-tab-content" id="tab-ingr">
        <div class="ingr-content">
          <h3>Thành phần chính</h3>
          <div class="ingr-tags">
            <span class="ingr-tag key">Bifidus Probiotic</span>
            <span class="ingr-tag key">Hyaluronic Acid</span>
            <span class="ingr-tag key">Glycerin</span>
            <span class="ingr-tag">Niacinamide</span>
            <span class="ingr-tag">Adenosine</span>
            <span class="ingr-tag">Centella Asiatica</span>
            <span class="ingr-tag">Panthenol</span>
            <span class="ingr-tag">Vitamin E</span>
          </div>
          <p class="ingr-note">Sản phẩm đã được kiểm nghiệm Da liễu. Không chứa Paraben, không chứa chất tạo màu nhân tạo. Thân thiện với da nhạy cảm.</p>
        </div>
      </div>

      <div class="pd-tab-content" id="tab-how">
        <div class="how-steps">
          <div class="how-step">
            <div class="step-num">01</div>
            <div class="step-info"><h4>Làm sạch da</h4><p>Rửa mặt sạch, thấm khô nhẹ nhàng bằng khăn mềm.</p></div>
          </div>
          <div class="how-step">
            <div class="step-num">02</div>
            <div class="step-info"><h4>Thoa toner</h4><p>Dùng toner để cân bằng độ pH trước khi thoa serum.</p></div>
          </div>
          <div class="how-step">
            <div class="step-num">03</div>
            <div class="step-info"><h4>Thoa serum</h4><p>Lấy 3–5 giọt serum, thoa nhẹ từ trung tâm khuôn mặt ra ngoài. Massage nhẹ cho đến khi thấm hết.</p></div>
          </div>
          <div class="how-step">
            <div class="step-num">04</div>
            <div class="step-info"><h4>Dưỡng ẩm + chống nắng</h4><p>Hoàn thiện với kem dưỡng ẩm. Ban ngày nhớ dùng kem chống nắng SPF 30+.</p></div>
          </div>
        </div>
      </div>

      <div class="pd-tab-content" id="tab-review">
        <div class="review-summary">
          <div class="review-score">
            <span class="score-num">4.9</span>
            <span class="score-stars">★★★★★</span>
            <span class="score-total">2.412 đánh giá</span>
          </div>
          <div class="review-bars">
            <div class="rbar-row"><span>5★</span><div class="rbar"><div class="rbar-fill" style="width:82%"></div></div><span>82%</span></div>
            <div class="rbar-row"><span>4★</span><div class="rbar"><div class="rbar-fill" style="width:13%"></div></div><span>13%</span></div>
            <div class="rbar-row"><span>3★</span><div class="rbar"><div class="rbar-fill" style="width:3%"></div></div><span>3%</span></div>
            <div class="rbar-row"><span>2★</span><div class="rbar"><div class="rbar-fill" style="width:1%"></div></div><span>1%</span></div>
            <div class="rbar-row"><span>1★</span><div class="rbar"><div class="rbar-fill" style="width:1%"></div></div><span>1%</span></div>
          </div>
        </div>
        <div class="review-list">
          <div class="review-item">
            <div class="review-header"><div class="rv-avatar">MH</div><div><p class="rv-name">Minh Hương</p><p class="rv-date">12/03/2026 — Đã mua tại LACTT</p></div><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">Mình dùng được 2 tuần, da mềm mịn hẳn ra, đặc biệt là vùng má hay bị khô giờ căng mọng hơn nhiều. Serum thấm rất nhanh, không nhờn rít. Sẽ mua lại!</p>
          </div>
          <div class="review-item">
            <div class="review-header"><div class="rv-avatar">TL</div><div><p class="rv-name">Thu Lan</p><p class="rv-date">05/03/2026 — Đã mua tại LACTT</p></div><span class="rv-stars">★★★★★</span></div>
            <p class="rv-text">Hàng chính hãng, seal còn nguyên. Mùi thơm nhẹ dễ chịu. Giao hàng nhanh trong ngày, đóng gói cẩn thận có hộp quà rất sang. Xứng đáng 5 sao!</p>
          </div>
          <div class="review-item">
            <div class="review-header"><div class="rv-avatar">NA</div><div><p class="rv-name">Ngọc Anh</p><p class="rv-date">28/02/2026 — Đã mua tại LACTT</p></div><span class="rv-stars">★★★★☆</span></div>
            <p class="rv-text">Sản phẩm tốt, da mình khá nhạy cảm nhưng dùng không bị kích ứng gì. Chỉ thấy hơi đắt nhưng được cái hàng xịn thật sự.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- RELATED PRODUCTS -->
    <div class="related-section">
      <div class="section-header-pd">
        <p class="section-tag-pd">Có thể bạn thích</p>
        <h2 class="section-title-pd">Sản Phẩm Liên Quan</h2>
      </div>
      <div class="related-grid" id="relatedGrid">
        <!-- Filled by JS -->
      </div>
    </div>

  </div>
</main>

<!-- FOOTER -->
<footer class="footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="index.jsp" class="footer-logo">LACTT</a>
        <p>Hệ thống mỹ phẩm chính hãng hàng đầu Việt Nam. Hơn 200 thương hiệu quốc tế, 3.500+ sản phẩm.</p>
        <div class="social-links">
          <a href="#" class="social-link">FB</a><a href="#" class="social-link">IG</a><a href="#" class="social-link">TK</a><a href="#" class="social-link">YT</a>
        </div>
      </div>
      <div class="footer-col"><h4>Về LACTT</h4><ul><li><a href="#">Giới thiệu</a></li><li><a href="#">Tuyển dụng</a></li><li><a href="#">Tin tức & Blog</a></li></ul></div>
      <div class="footer-col"><h4>Hỗ Trợ</h4><ul><li><a href="#">Chính sách đổi trả</a></li><li><a href="#">Hướng dẫn mua hàng</a></li><li><a href="#">Theo dõi đơn hàng</a></li></ul></div>
      <div class="footer-col"><h4>Liên Hệ</h4><ul><li>📞 1800 6789</li><li>✉️ support@lactt.vn</li><li>🕐 8:00 – 22:00 (T2–CN)</li></ul></div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 LACTT. Tất cả quyền được bảo lưu.</p>
      <div class="footer-legal"><a href="#">Điều khoản</a><a href="#">Bảo mật</a></div>
      <div class="payment-icons"><span>VISA</span><span>MC</span><span>MOMO</span><span>VNPAY</span><span>ZALOPAY</span></div>
    </div>
  </div>
</footer>

<button class="back-top" id="backTop">↑</button>
<div class="floating-support">
  <button class="support-btn" title="Chat hỗ trợ">💬</button>
  <button class="support-btn" title="Gọi ngay">📞</button>
</div>

<script src="js/cart-drawer.js"></script>
<script src="js/chitiet.js"></script>
</body>
</html>
