<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thanh Toán — LACTT</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/thanhtoan.css" />
  <link rel="stylesheet" href="css/auth-modal.css" />
  <script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
  <script src="js/cart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
</head>
<body>

<div class="announcement-bar">
  <div class="announcement-track">
    <span>✦ Thanh toán bảo mật 256-bit SSL</span>
    <span class="sep">|</span>
    <span>Hàng chính hãng 100% ✦</span>
    <span class="sep">|</span>
    <span>Đổi trả miễn phí 30 ngày ✦</span>
    <span class="sep">|</span>
    <span>Giao hàng 2H tại HN &amp; HCM ✦</span>
  </div>
</div>

<header class="header" id="header">
  <div class="header-top">
    <div class="header-top-inner container">
      <a href="index.jsp" class="logo">LACTT</a>
      <div class="secure-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Thanh toán bảo mật SSL
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <a href="giohang.jsp" style="font-size:13px;color:#9e8e82;display:flex;align-items:center;gap:5px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Quay lại giỏ hàng
        </a>
      </div>
    </div>
  </div>
  <nav class="header-nav">
    <div class="container header-nav-inner">
      <a href="index.jsp" class="nav-link">← Trang chủ</a>
      <a href="giohang.jsp" class="nav-link">Giỏ hàng</a>
    </div>
  </nav>
</header>

<div class="breadcrumb-bar">
  <div class="container">
    <nav class="breadcrumb">
      <a href="index.jsp">Trang chủ</a>
      <span class="bc-sep">›</span>
      <a href="giohang.jsp">Giỏ hàng</a>
      <span class="bc-sep">›</span>
      <span class="bc-current">Thanh toán</span>
    </nav>
  </div>
</div>

<div class="checkout-steps-bar">
  <div class="checkout-steps">
    <div class="ck-step done">
      <span class="ck-step-num">✓</span>
      <span class="ck-step-label">Giỏ hàng</span>
    </div>
    <div class="ck-step-line"></div>
    <div class="ck-step active">
      <span class="ck-step-num">2</span>
      <span class="ck-step-label">Thông tin</span>
    </div>
    <div class="ck-step-line"></div>
    <div class="ck-step">
      <span class="ck-step-num">3</span>
      <span class="ck-step-label">Hoàn tất</span>
    </div>
  </div>
</div>

<main class="checkout-page">
  <div class="container">
    <div class="checkout-layout">

      <div class="checkout-form-col">

        <div class="ck-panel">
          <div class="ck-panel-header">
            <div class="ck-panel-icon">👤</div>
            <h2 class="ck-panel-title">Thông tin người nhận</h2>
          </div>
          <div class="ck-panel-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Họ <span class="req">*</span></label>
                <input type="text" class="form-input" id="firstName" placeholder="Nguyễn" autocomplete="given-name" />
                <span class="field-error" id="err-firstName">Vui lòng nhập họ</span>
              </div>
              <div class="form-group">
                <label class="form-label">Tên <span class="req">*</span></label>
                <input type="text" class="form-input" id="lastName" placeholder="Thị Lan" autocomplete="family-name" />
                <span class="field-error" id="err-lastName">Vui lòng nhập tên</span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Số điện thoại <span class="req">*</span></label>
                <input type="tel" class="form-input" id="phone" placeholder="0901 234 567" autocomplete="tel" />
                <span class="field-error" id="err-phone">Số điện thoại không hợp lệ</span>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="email" placeholder="email@gmail.com" autocomplete="email" />
                <span class="field-error" id="err-email">Email không hợp lệ</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ck-panel">
          <div class="ck-panel-header">
            <div class="ck-panel-icon">📍</div>
            <h2 class="ck-panel-title">Địa chỉ giao hàng</h2>
          </div>
          <div class="ck-panel-body">

            <!-- ── SỔ ĐỊA CHỈ ĐÃ LƯU ── -->
            <div id="savedAddressSection" style="display:none; margin-bottom:20px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                <span style="font-size:0.8rem; font-weight:600; color:#9e8e82; text-transform:uppercase; letter-spacing:0.06em;">Địa chỉ đã lưu</span>
                <button type="button" id="btnNhapTay" style="font-size:0.78rem; color:#c4626e; background:none; border:none; cursor:pointer; text-decoration:underline;">Nhập địa chỉ mới</button>
              </div>
              <div id="savedAddressList" style="display:flex; flex-direction:column; gap:8px;"></div>
            </div>

            <!-- ── NÚT MỞ NHẬP TAY (khi đã chọn từ sổ) ── -->
            <div id="selectedAddressPreview" style="display:none; margin-bottom:16px;">
              <div style="background:#faf8f7; border:1.5px solid #d99aa0; border-radius:10px; padding:12px 16px; position:relative;">
                <div style="font-size:0.72rem; font-weight:600; color:#c4626e; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">Đang giao đến</div>
                <div id="selectedAddressText" style="font-size:0.88rem; color:#1a1208; line-height:1.6;"></div>
                <button type="button" id="btnDoiDiaChi" style="position:absolute; top:10px; right:12px; font-size:0.75rem; color:#c4626e; background:none; border:none; cursor:pointer;">Đổi địa chỉ</button>
              </div>
            </div>

            <!-- ── FORM NHẬP TAY ── -->
            <div id="manualAddressForm">
            <div class="form-row triple">

  <!-- TỈNH -->
  <div class="form-group">
    <label class="form-label">Tỉnh / Thành phố *</label>
    <div class="dropdown">
      <input id="provinceInput" class="form-input" placeholder="Chọn tỉnh/thành">
      <div id="provinceList" class="dropdown-list"></div>
    </div>
  </div>

  <!-- QUẬN -->
  <div class="form-group">
    <label class="form-label">Quận / Huyện *</label>
    <div class="dropdown">
      <input id="districtInput" class="form-input" placeholder="Chọn quận/huyện">
      <div id="districtList" class="dropdown-list"></div>
    </div>
  </div>

  <!-- PHƯỜNG -->
  <div class="form-group">
    <label class="form-label">Phường / Xã *</label>
    <div class="dropdown">
      <input id="wardInput" class="form-input" placeholder="Chọn phường/xã">
      <div id="wardList" class="dropdown-list"></div>
    </div>
  </div>

</div>
            <div class="form-row full">
              <div class="form-group">
                <label class="form-label">Địa chỉ cụ thể <span class="req">*</span></label>
                <input type="text" class="form-input" id="address" placeholder="Số nhà, tên đường, tòa nhà..." autocomplete="street-address" />
                <span class="field-error" id="err-address">Vui lòng nhập địa chỉ</span>
              </div>
            </div>
            </div><!-- end manualAddressForm -->
          </div>
        </div>

        <div class="ck-panel">
          <div class="ck-panel-header">
            <div class="ck-panel-icon">🚚</div>
            <h2 class="ck-panel-title">Phương thức giao hàng</h2>
          </div>
          <div class="ck-panel-body">
            <div class="shipping-options">

              <label class="shipping-opt selected" id="ship-opt-standard">
                <input type="radio" name="shipping" value="standard" checked />
                <div class="shipping-radio"></div>
                <div class="shipping-opt-info">
                  <div class="shipping-opt-name">Giao hàng tiêu chuẩn (GHN / GHTK)</div>
                  <div class="shipping-opt-time">Dự kiến 3–5 ngày làm việc</div>
                </div>
                <span class="shipping-opt-price" id="ship-price-standard">35.000₫</span>
              </label>

              <label class="shipping-opt" id="ship-opt-fast">
                <input type="radio" name="shipping" value="fast" />
                <div class="shipping-radio"></div>
                <div class="shipping-opt-info">
                  <div class="shipping-opt-name">
                    Giao hàng nhanh
                    <span class="shipping-badge">Phổ biến</span>
                  </div>
                  <div class="shipping-opt-time">Nhận hàng trong 1–2 ngày</div>
                </div>
                <span class="shipping-opt-price" id="ship-price-fast">55.000₫</span>
              </label>

              <label class="shipping-opt" id="ship-opt-express">
                <input type="radio" name="shipping" value="express" />
                <div class="shipping-radio"></div>
                <div class="shipping-opt-info">
                  <div class="shipping-opt-name">
                    Giao 2H (HN &amp; HCM)
                    <span class="shipping-badge">Nhanh nhất</span>
                  </div>
                  <div class="shipping-opt-time">Giao trong 2 giờ, đặt trước 20:00</div>
                </div>
                <span class="shipping-opt-price" id="ship-price-express">85.000₫</span>
              </label>

            </div>
          </div>
        </div>

        <div class="ck-panel">
          <div class="ck-panel-header">
            <div class="ck-panel-icon">💳</div>
            <h2 class="ck-panel-title">Phương thức thanh toán</h2>
          </div>
          <div class="ck-panel-body">
            <div class="payment-methods">

              <label class="payment-opt selected" id="pay-opt-cod">
                <input type="radio" name="payment" value="cod" checked />
                <div class="payment-opt-check"></div>
                <img src="https://cdn-icons-png.flaticon.com/512/2897/2897808.png" class="pay-logo" alt="COD" />
                <div class="payment-opt-name">Tiền mặt (COD)</div>
              </label>

              <label class="payment-opt" id="pay-opt-momo">
                <input type="radio" name="payment" value="momo" />
                <div class="payment-opt-check"></div>
                <img src="images/payment/momo.png" class="pay-logo" style="border-radius:6px;" alt="MoMo" />
                <div class="payment-opt-name">Ví MoMo</div>
              </label>

              <label class="payment-opt" id="pay-opt-vnpay">
                <input type="radio" name="payment" value="vnpay" />
                <div class="payment-opt-check"></div>
                <img src="images/payment/vnpay.png" class="pay-logo vnpay-logo" alt="VNPay" />
                <div class="payment-opt-name">VNPay QR</div>
              </label>

              <label class="payment-opt" id="pay-opt-card">
                <input type="radio" name="payment" value="card" />
                <div class="payment-opt-check"></div>
                <img src="https://cdn-icons-png.flaticon.com/512/349/349221.png" class="pay-logo" alt="Visa/MC" />
                <div class="payment-opt-name">Thẻ Visa / MC</div>
              </label>

              <label class="payment-opt" id="pay-opt-zalopay">
                <input type="radio" name="payment" value="zalopay" />
                <div class="payment-opt-check"></div>
                <img src="images/payment/zalopay.png" class="pay-logo" style="border-radius:6px;" alt="ZaloPay" />
                <div class="payment-opt-name">ZaloPay</div>
              </label>

              <label class="payment-opt" id="pay-opt-bank">
                <input type="radio" name="payment" value="bank" />
                <div class="payment-opt-check"></div>
                <img src="https://cdn-icons-png.flaticon.com/512/2830/2830284.png" class="pay-logo" alt="Bank" />
                <div class="payment-opt-name">Chuyển khoản</div>
              </label>

            </div>

            <div class="card-form" id="cardForm">
              <div class="form-row full" style="margin-bottom:12px">
                <div class="form-group">
                  <label class="form-label">Số thẻ</label>
                  <div class="card-number-wrap">
                    <input type="text" class="form-input" id="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" />
                    <div class="card-icons">
                      <span class="card-icon-badge">VISA</span>
                      <span class="card-icon-badge">MC</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tên chủ thẻ</label>
                  <input type="text" class="form-input" id="cardName" placeholder="NGUYEN THI LAN" style="text-transform:uppercase" />
                </div>
                <div class="form-group">
                  <label class="form-label">MM / YY</label>
                  <input type="text" class="form-input" id="cardExpiry" placeholder="06 / 28" maxlength="7" />
                </div>
              </div>
              <div class="form-row" style="margin-bottom:0">
                <div class="form-group">
                  <label class="form-label">CVV</label>
                  <input type="text" class="form-input" id="cardCvv" placeholder="•••" maxlength="4" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="visibility:hidden">_</label>
                  <div style="display:flex;align-items:center;gap:6px;height:44px;font-size:0.75rem;color:#9e8e82;">
                    🔒 Thông tin được mã hóa SSL
                  </div>
                </div>
              </div>
            </div>

            <div class="card-form" id="bankForm">
              <p style="font-size:0.83rem;color:#5c4c42;line-height:1.7;">
                <strong>Ngân hàng:</strong> Vietcombank<br/>
                <strong>Số tài khoản:</strong> 1234 5678 901<br/>
                <strong>Chủ tài khoản:</strong> CONG TY LACTT<br/>
                <strong>Nội dung CK:</strong> <span style="color:#c4626e;font-weight:600;" id="bankRef">LACTT-[Mã đơn]</span><br/>
                <em style="font-size:0.75rem;color:#9e8e82;">Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán.</em>
              </p>
            </div>

            <div class="card-form" id="qrForm"></div>

          </div>
        </div>

        <div class="ck-panel">
          <div class="ck-panel-header">
            <div class="ck-panel-icon">📝</div>
            <h2 class="ck-panel-title">Ghi chú đơn hàng</h2>
          </div>
          <div class="ck-panel-body">
            <textarea class="form-textarea" id="orderNote" placeholder="Ghi chú cho người giao hàng, yêu cầu đặc biệt về đóng gói, thời gian giao hàng..."></textarea>
          </div>
        </div>

      </div><div class="order-summary">
        <div class="summary-card">

          <div class="summary-header">
            <h3>Đơn hàng của bạn</h3>
            <span class="summary-item-count" id="summaryItemCount">0 sản phẩm</span>
          </div>

          <div class="summary-items" id="summaryItems">
            </div>

          <!-- ── KHU VỰC DÙNG ĐIỂM THƯỞNG ── -->
<div id="pointsSection" style="display:none; margin-bottom:14px; padding:12px 14px; background:#fdf8f0; border:1.5px solid #e8c97a; border-radius:10px;">
  <div style="display:flex; align-items:center; justify-content:space-between;">
    <div>
      <div style="font-size:0.8rem; font-weight:600; color:#9a6a20; text-transform:uppercase; letter-spacing:0.05em;">Điểm thưởng của bạn</div>
      <div style="font-size:0.85rem; color:#5c4c42; margin-top:3px;">
        Bạn có <strong id="displayAvailablePoints">0</strong> điểm
        (tương đương <strong id="displayPointsValue">0₫</strong>)
      </div>
    </div>
    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
      <span style="font-size:0.8rem; color:#5c4c42;">Dùng điểm</span>
      <div class="points-toggle-wrap">
        <input type="checkbox" id="usePointsToggle" style="display:none;">
        <div id="pointsToggleBtn" onclick="toggleUsePoints()" style="width:42px; height:24px; background:#ccc; border-radius:12px; position:relative; cursor:pointer; transition:background 0.2s;">
          <div id="pointsToggleThumb" style="width:18px; height:18px; background:#fff; border-radius:50%; position:absolute; top:3px; left:3px; transition:left 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>
        </div>
      </div>
    </label>
  </div>
  <div id="pointsAppliedNote" style="display:none; margin-top:8px; font-size:0.8rem; color:#2d7a5f; font-weight:600;">
    ✓ Đã áp dụng — giảm <span id="pointsDeductDisplay">0₫</span>
  </div>
</div>
            
          <div class="summary-coupon">
            <input type="text" id="couponInput" placeholder="Nhập mã giảm giá..." autocomplete="off" />
            <button class="coupon-apply-btn" id="couponApplyBtn">Áp dụng</button>
          </div>
          <p class="coupon-result" id="couponResult"></p>

          <div class="summary-totals" id="summaryTotals">
            </div>

          <button class="btn-place-order" id="btnPlaceOrder">
            Đặt hàng ngay 🛍️
          </button>

          <div class="summary-trust">
            <span>🔒 Thanh toán bảo mật 256-bit SSL</span>
            <span>🏆 Hàng chính hãng 100%</span>
            <span>🔄 Đổi trả miễn phí 30 ngày</span>
            <span>📞 Hỗ trợ 24/7: 1800 6789</span>
          </div>

        </div>
      </div></div></div>
</main>

<div class="success-overlay" id="successOverlay">
  <div class="success-modal">
    <div class="success-icon">🎉</div>
    <h2>Đặt hàng thành công!</h2>
    <p>Cảm ơn bạn đã tin tưởng LACTT. Chúng tôi sẽ xác nhận đơn hàng qua SMS / Email trong vòng 15 phút.</p>
    <div class="success-order-id" id="successOrderId">Mã đơn: #LACTT-000000</div>
    <p style="font-size:0.78rem;">Theo dõi đơn hàng tại <strong>Tài khoản → Đơn hàng của tôi</strong></p>
    <div class="success-btns" style="margin-top:20px;">
      <button class="success-btn-primary" onclick="window.location.href='index.jsp'">Tiếp tục mua sắm</button>
      <button class="success-btn-sec" onclick="document.getElementById('successOverlay').classList.remove('show')">Đóng</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<footer class="footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="index.jsp" class="footer-logo">LACTT</a>
        <p>Hệ thống mỹ phẩm chính hãng hàng đầu Việt Nam. Hơn 200 thương hiệu quốc tế, 3.500+ sản phẩm.</p>
      </div>
      <div class="footer-col">
        <h4>Hỗ Trợ</h4>
        <ul>
          <li><a href="#">Chính sách đổi trả</a></li>
          <li><a href="#">Hướng dẫn mua hàng</a></li>
          <li><a href="#">Theo dõi đơn hàng</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Liên Hệ</h4>
        <ul>
          <li>📞 1800 6789</li>
          <li>✉️ support@lactt.vn</li>
          <li>🕐 8:00 – 22:00 (T2–CN)</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 LACTT. Tất cả quyền được bảo lưu.</p>
      <div class="footer-legal">
        <a href="#">Điều khoản</a>
        <a href="#">Bảo mật</a>
      </div>
      <div class="payment-icons">
        <span>VISA</span><span>MC</span><span>MOMO</span><span>VNPAY</span><span>ZALOPAY</span>
      </div>
    </div>
  </div>
</footer>

<button class="back-top" id="backTop">↑</button>

<script src="js/auth-modal.js"></script>
<script src="js/thanhtoan.js"></script>
</body>
</html>