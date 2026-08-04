<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Giỏ Hàng — LACTT</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/chitiet.css" />
  <link rel="stylesheet" href="css/cart-drawer.css" />
  <link rel="stylesheet" href="css/giohang.css" />
  <!-- ✅ FIX: Thêm CSS auth modal -->
  <link rel="stylesheet" href="css/auth-modal.css" />
  <link rel="stylesheet" href="css/auth-additions.css" />
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
        <!-- ✅ FIX: Thêm data-auth-btn để JS nhận diện -->
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
  <nav class="header-nav">
    <div class="container header-nav-inner">
      <a href="index.jsp" class="nav-link">← Tiếp tục mua sắm</a>
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
      <span class="bc-current">Giỏ hàng</span>
    </nav>
  </div>
</div>

<!-- CART PAGE -->
<main class="cart-page">
  <div class="container">

    <div class="cart-page-header">
      <h1 class="cart-page-title">Giỏ Hàng Của Bạn</h1>
      <span class="cart-page-count" id="ghCountLabel">0 sản phẩm</span>
    </div>

    <!-- Steps indicator -->
    <div class="checkout-steps">
      <div class="step active">
        <span class="step-num">1</span>
        <span class="step-label">Giỏ hàng</span>
      </div>
      <div class="step-line"></div>
      <div class="step">
        <span class="step-num">2</span>
        <span class="step-label">Thông tin</span>
      </div>
      <div class="step-line"></div>
      <div class="step">
        <span class="step-num">3</span>
        <span class="step-label">Thanh toán</span>
      </div>
    </div>

    <!-- Layout: Left (items) + Right (summary) -->
    <div class="cart-layout" id="cartLayout">

      <!-- LEFT: Danh sách sản phẩm -->
      <div class="cart-items-col">
        <div class="cart-items-header">
          <span>Sản phẩm</span>
          <span>Đơn giá</span>
          <span>Số lượng</span>
          <span>Thành tiền</span>
          <span></span>
        </div>
        <div id="ghItemsList">
          <!-- Rendered by JS -->
        </div>

        <!-- Actions footer -->
        <div class="cart-actions">
          <button class="btn-clear-cart" id="ghClearBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
            Xóa giỏ hàng
          </button>
          <a href="index.jsp#shop" class="btn-continue-shop">← Tiếp tục mua sắm</a>
        </div>
      </div>

      <!-- RIGHT: Tóm tắt đơn hàng -->
      <div class="cart-summary-col" id="cartSummaryCol">
        <div class="cart-summary">
          <h3 class="summary-title">Tóm Tắt Đơn Hàng</h3>

          <!-- ✅ FIX: ghUserStatus nằm đúng trong body, trong summary -->
          <div id="ghUserStatus" class="gh-user-status"></div>

          <div class="summary-rows" id="summaryRows">
            <!-- Rendered by JS -->
          </div>

          <!-- Coupon -->
          <div class="coupon-box" id="couponDropdownWrap">
            <!-- Nội dung coupon được render bởi giohang.js -->
          </div>

          <div class="summary-total-row">
            <span>Tổng cộng</span>
            <span class="summary-total" id="ghTotal">0₫</span>
          </div>

          <p class="summary-vat-note">Đã bao gồm VAT. Phí vận chuyển tính ở bước tiếp theo.</p>

          <button class="btn-checkout" id="ghCheckoutBtn">
            Tiến hành đặt hàng →
          </button>

          <div class="summary-trust">
            <span>🔒 Thanh toán bảo mật 256-bit SSL</span>
            <span>🏆 Hàng chính hãng 100%</span>
          </div>

          <div class="summary-payment-icons">
            <span>VISA</span><span>MC</span><span>MOMO</span><span>VNPAY</span><span>ZALOPAY</span>
          </div>
        </div>
      </div>

    </div><!-- end .cart-layout -->

    <!-- Empty state -->
    <div class="gh-empty" id="ghEmpty" style="display:none">
      <div class="gh-empty-icon">🛍️</div>
      <h2>Giỏ hàng của bạn đang trống</h2>
      <p>Hãy thêm sản phẩm yêu thích vào giỏ hàng nhé!</p>
      <a href="index.jsp#shop" class="btn-back-shop">Khám phá sản phẩm</a>
    </div>

    <!-- Gợi ý sản phẩm -->
    <div class="gh-suggest" id="ghSuggest" style="display:none">
      <div class="section-header-pd">
        <p class="section-tag-pd">Gợi ý cho bạn</p>
        <h2 class="section-title-pd">Sản Phẩm Bán Chạy</h2>
      </div>
      <div class="related-grid" id="ghSuggestGrid">
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
        <p>Hệ thống mỹ phẩm chính hãng hàng đầu Việt Nam.</p>
        <div class="social-links">
          <a href="#" class="social-link">FB</a><a href="#" class="social-link">IG</a><a href="#" class="social-link">TK</a>
        </div>
      </div>
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

<!-- ✅ FIX: Thứ tự JS đúng — cart.js → auth-modal.js → giohang.js -->
<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/cart.js"></script>
<script src="js/auth-modal.js"></script>
<script src="js/giohang.js"></script>
</body>
</html>
