/* =============================================
   LACTT — thanhtoan.js  (Bản Hoàn Thiện Luồng UX & Demo QR)
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  function fmt(n) { return Number(n).toLocaleString('vi-VN') + '₫'; }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function showToast(msg, dur) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function(){ t.classList.remove('show'); }, dur||2800);
  }

  /* ══════════════════════════════════════
     SỔ ĐỊA CHỈ ĐÃ LƯU — Load từ server
  ══════════════════════════════════════ */
  var selectedSavedAddress = null; // lưu địa chỉ đang được chọn

  function loadSavedAddresses() {
    fetch(window.APP_CONTEXT + '/TaiKhoanServlet?ajax=1&dataAction=addresses', {
      credentials: 'same-origin'
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.success || !data.addresses || data.addresses.length === 0) return;
      var addresses = data.addresses;
      var section = document.getElementById('savedAddressSection');
      var list = document.getElementById('savedAddressList');
      if (!section || !list) return;

      list.innerHTML = '';
      addresses.forEach(function(addr) {
        var card = document.createElement('div');
        card.className = 'saved-addr-card' + (addr.macDinh ? ' selected-card' : '');
        card.innerHTML =
          '<div class="addr-radio"></div>' +
          '<div class="saved-addr-info">' +
            '<div class="saved-addr-name">' + esc(addr.tenNguoiNhan) + '</div>' +
            '<div class="saved-addr-detail">' + esc(addr.diaChiCuThe) + '</div>' +
            '<div class="saved-addr-phone">' + esc(addr.soDienThoai) + '</div>' +
          '</div>' +
          (addr.macDinh ? '<span class="addr-default-badge">Mặc định</span>' : '');

        card.addEventListener('click', function() {
          // Bỏ chọn card cũ
          list.querySelectorAll('.saved-addr-card').forEach(function(c){ c.classList.remove('selected-card'); });
          card.classList.add('selected-card');
          applyAddressToForm(addr);
        });
        list.appendChild(card);

        // Tự động áp dụng địa chỉ mặc định
        if (addr.macDinh) {
          applyAddressToForm(addr);
        }
      });

      section.style.display = 'block';
    })
    .catch(function() {
      // Không đăng nhập hoặc lỗi → bỏ qua, hiện form nhập tay bình thường
    });
  }
  function loadUserPoints() {
  fetch(window.APP_CONTEXT + '/TaiKhoanServlet?ajax=1&dataAction=points', {
    credentials: 'same-origin'
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (!data.success || !data.tongDiem || data.tongDiem <= 0) return;

    availablePoints  = data.tongDiem;
    pointsMoneyValue = data.tongDiem * 100;

    var section = document.getElementById('pointsSection');
    var dispPts = document.getElementById('displayAvailablePoints');
    var dispVal = document.getElementById('displayPointsValue');
    if (section) section.style.display = 'block';
    if (dispPts) dispPts.textContent = availablePoints.toLocaleString('vi-VN');
    if (dispVal) dispVal.textContent = pointsMoneyValue.toLocaleString('vi-VN') + '₫';
  })
  .catch(function() { /* không đăng nhập hoặc lỗi → ẩn khu vực điểm */ });
}
  window.toggleUsePoints = function() {
  isUsingPoints = !isUsingPoints;

  // Cập nhật giao diện toggle
  var btn   = document.getElementById('pointsToggleBtn');
  var thumb = document.getElementById('pointsToggleThumb');
  var note  = document.getElementById('pointsAppliedNote');
  var disp  = document.getElementById('pointsDeductDisplay');

  if (isUsingPoints) {
    if (btn)   btn.style.background = '#2d7a5f';
    if (thumb) thumb.style.left = '21px';
    if (note)  note.style.display = 'block';
    // Tính số tiền thực tế giảm (không phải toàn bộ điểm)
    var t = calcTotals();
    if (disp)  disp.textContent = t.pointsDiscount.toLocaleString('vi-VN') + '₫';
  } else {
    if (btn)   btn.style.background = '#ccc';
    if (thumb) thumb.style.left = '3px';
    if (note)  note.style.display = 'none';
  }
  renderTotals(); // cập nhật lại tổng tiền
}
  function applyAddressToForm(addr) {
    selectedSavedAddress = addr;

    // Điền vào form
    var parts = (addr.tenNguoiNhan || '').trim().split(' ');
    var fn = document.getElementById('firstName');
    var ln = document.getElementById('lastName');
    if (fn) fn.value = parts[0] || '';
    if (ln) ln.value = parts.slice(1).join(' ') || '';

    var ph = document.getElementById('phone');
    if (ph) ph.value = addr.soDienThoai || '';

    var addrInput = document.getElementById('address');
    if (addrInput) addrInput.value = addr.diaChiCuThe || '';

    // Hiện preview, ẩn form nhập tay
    var preview = document.getElementById('selectedAddressPreview');
    var manual = document.getElementById('manualAddressForm');
    var selectedText = document.getElementById('selectedAddressText');
    if (preview && selectedText) {
      selectedText.innerHTML =
        '<strong>' + esc(addr.tenNguoiNhan) + '</strong> — ' + esc(addr.soDienThoai) + '<br>' +
        esc(addr.diaChiCuThe);
      preview.style.display = 'block';
    }
    if (manual) manual.style.display = 'none';
  }

  // Nút "Đổi địa chỉ" → hiện lại sổ, ẩn preview
  var btnDoi = document.getElementById('btnDoiDiaChi');
  if (btnDoi) {
    btnDoi.addEventListener('click', function() {
      selectedSavedAddress = null;
      document.getElementById('selectedAddressPreview').style.display = 'none';
      document.getElementById('manualAddressForm').style.display = 'block';
      document.getElementById('savedAddressSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // Nút "Nhập địa chỉ mới" → ẩn sổ, hiện form trắng
  var btnNhapTay = document.getElementById('btnNhapTay');
  if (btnNhapTay) {
    btnNhapTay.addEventListener('click', function() {
      selectedSavedAddress = null;
      document.getElementById('savedAddressSection').style.display = 'none';
      document.getElementById('selectedAddressPreview').style.display = 'none';
      document.getElementById('manualAddressForm').style.display = 'block';
      // Xóa trắng các ô địa chỉ
      ['address','provinceInput','districtInput','wardInput'].forEach(function(id){
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
    });
  }  
  loadSavedAddresses();
  loadUserPoints();
  var currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('lactt_user')); } catch(e) {}

  // Chỉ pre-fill email — địa chỉ & tên đã được loadSavedAddresses() xử lý
  if (currentUser) {
    var em = document.getElementById('email');
    if (em && !em.value) em.value = currentUser.email || '';
  }

  var allItems = Cart.getItems();
  var checkoutItems = allItems;
  try {
    var savedKeys = JSON.parse(sessionStorage.getItem('lactt_checkout_keys') || 'null');
    if (savedKeys && savedKeys.length > 0) {
      var keySet = new Set(savedKeys);
      var filtered = allItems.filter(function(i){ return keySet.has(i.key); });
      if (filtered.length > 0) checkoutItems = filtered;
    }
  } catch(e) {}

  if (checkoutItems.length === 0) {
    showToast('Giỏ hàng trống. Đang chuyển hướng...');
    setTimeout(function(){ window.location.href = 'giohang.jsp'; }, 1200);
    return;
  }

  var COUPONS = {
    'LACTT10':   { type:'percent', value:10,    label:'Giảm 10%' },
    'LACTT50K':  { type:'fixed',   value:50000, label:'Giảm 50.000₫' },
    'NEWMEMBER': { type:'percent', value:15,    label:'Thành viên mới -15%' },
    'FREESHIP':  { type:'ship',    value:0,     label:'Miễn phí vận chuyển' },
  };
  var appliedCoupon = null;
  var availablePoints  = 0;   // tổng điểm khách đang có
  var pointsMoneyValue = 0;   // quy đổi ra tiền (server trả về)
  var isUsingPoints    = false;

  try {
    var savedCoupon = JSON.parse(sessionStorage.getItem('lactt_checkout_coupon') || 'null');
    if (savedCoupon && COUPONS[savedCoupon.code]) {
      appliedCoupon = savedCoupon;
      var cinput = document.getElementById('couponInput'), cresult = document.getElementById('couponResult');
      if (cinput) cinput.value = savedCoupon.code;
      if (cresult) {
        cresult.textContent = '✓ Đã áp dụng từ giỏ hàng: ' + savedCoupon.label;
        cresult.className = 'coupon-result success';
      }
    }
  } catch(e) {}

  function applyCoupon(code) {
    var resultEl = document.getElementById('couponResult');
    var coupon = COUPONS[code];
    if (!code) {
      resultEl.textContent = 'Vui lòng nhập mã giảm giá.'; resultEl.className = 'coupon-result error';
      appliedCoupon = null; renderTotals(); return;
    }
    if (coupon) {
      appliedCoupon = Object.assign({ code: code }, coupon);
      resultEl.textContent = '✓ Áp dụng thành công: ' + coupon.label; resultEl.className = 'coupon-result success';
    } else {
      appliedCoupon = null;
      resultEl.textContent = 'Mã không hợp lệ hoặc đã hết hạn.'; resultEl.className = 'coupon-result error';
    }
    renderTotals();
  }

  document.getElementById('couponApplyBtn').addEventListener('click', function(){
    applyCoupon((document.getElementById('couponInput').value||'').trim().toUpperCase());
  });
  document.getElementById('couponInput').addEventListener('keydown', function(e){
    if (e.key === 'Enter') applyCoupon((this.value||'').trim().toUpperCase());
  });

  var SHIP_FEES = { standard: 35000, fast: 55000, express: 85000 };
  var selectedShipping = 'standard';
  var selectedPayment  = 'cod'; // track phương thức thanh toán riêng

  document.querySelectorAll('.shipping-opt').forEach(function(label){
    label.addEventListener('click', function(){
      document.querySelectorAll('.shipping-opt').forEach(function(l){ l.classList.remove('selected'); });
      label.classList.add('selected');
      selectedShipping = label.querySelector('input').value;
      renderTotals();
    });
  });

  function updateShipLabels() {
    var subtotal = checkoutItems.reduce(function(s,i){ return s+i.price*i.qty; }, 0);
    var isFreeShip = subtotal >= 499000;
    var labels = [
      { id: 'ship-price-standard', price: '35.000₫' },
      { id: 'ship-price-fast',     price: '55.000₫' },
      { id: 'ship-price-express',  price: '85.000₫' }
    ];
    labels.forEach(function(item) {
      var el = document.getElementById(item.id);
      if (el) el.innerHTML = isFreeShip
        ? '<span class="shipping-free">Miễn phí</span>'
        : item.price;
    });
  }

  function calcTotals() {
    var subtotal = checkoutItems.reduce(function(s,i){ return s+i.price*i.qty; }, 0);
    var shipFee  = SHIP_FEES[selectedShipping] || 35000;
    var discount = 0;
    if (subtotal >= 499000) shipFee = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') discount = Math.round(subtotal * appliedCoupon.value / 100);
      else if (appliedCoupon.type === 'fixed') discount = Math.min(appliedCoupon.value, subtotal);
      else if (appliedCoupon.type === 'ship') shipFee = 0;
    }
    // ── ĐIỂM THƯỞNG ──
    var pointsDiscount = 0;
    if (isUsingPoints && pointsMoneyValue > 0) {
        var canPay = Math.max(0, subtotal - discount + shipFee);
        pointsDiscount = Math.min(pointsMoneyValue, canPay);
    }
    var total = Math.max(0, subtotal - discount - pointsDiscount + shipFee);
    return { subtotal: subtotal, shipFee: shipFee, discount: discount, pointsDiscount: pointsDiscount, total: total };
  }

  function renderTotals() {
    var t = calcTotals();
    var el = document.getElementById('summaryTotals');
    var subtotal = checkoutItems.reduce(function(s,i){ return s+i.price*i.qty; }, 0);
    var html = '<div class="total-row"><span>Tạm tính</span><span>' + fmt(t.subtotal) + '</span></div>';
    if (t.discount > 0) {
      html += '<div class="total-row discount"><span>Giảm giá (' + esc(appliedCoupon.label) + ')</span><span>−' + fmt(t.discount) + '</span></div>';
    }
    html += '<div class="total-row"><span>Phí vận chuyển</span>';
    html += t.shipFee === 0 ? '<span class="free-ship-label">Miễn phí</span>' : '<span>' + fmt(t.shipFee) + '</span>';
    html += '</div>';
    if (subtotal > 0 && subtotal < 499000 && t.shipFee > 0) {
      html += '<div style="font-size:.75rem;color:#9a6a20;background:#fff8ec;padding:7px 10px;border-radius:7px;margin:6px 0;">Mua thêm <strong>' + fmt(499000-subtotal) + '</strong> để miễn phí vận chuyển 🚚</div>';
    }
    if (t.pointsDiscount > 0) {
      html += '<div class="total-row discount"><span>Dùng điểm thưởng</span><span>−' + fmt(t.pointsDiscount) + '</span></div>';
    }
    html += '<div class="total-divider"></div>';
    html += '<div class="total-row grand"><span>Tổng cộng</span><span class="grand-price">' + fmt(t.total) + '</span></div>';
    html += '<p class="vat-note">Đã bao gồm VAT</p>';
    el.innerHTML = html;
  }

  function renderSummaryItems() {
    var container = document.getElementById('summaryItems'), countEl = document.getElementById('summaryItemCount');
    var totalQty  = checkoutItems.reduce(function(s,i){ return s+i.qty; }, 0);
    countEl.textContent = totalQty + ' sản phẩm';
    container.innerHTML = checkoutItems.map(function(item){
      return '<div class="summary-item">'
        + '<div class="si-img">' + (item.hinhAnh && item.hinhAnh.startsWith('http') ? '<img src="'+item.hinhAnh+'" alt="" class="si-img-thumb" loading="lazy">' : '<span class="item-emoji">'+(item.emoji||'🛍️')+'</span>') + '<span class="si-qty-badge">' + item.qty + '</span></div>'
        + '<div class="si-info">'
        +   '<div class="si-brand">' + esc(item.brand) + '</div>'
        +   '<div class="si-name">' + esc(item.name) + '</div>'
        +   (item.variant ? '<div class="si-variant">' + esc(item.variant) + '</div>' : '')
        + '</div>'
        + '<div class="si-price">' + fmt(item.price * item.qty) + '</div>'
        + '</div>';
    }).join('');
  }

  /* ══════════════════════════════════════════
     CẤU HÌNH QR CODE - ĐÃ CÓ ẢNH HIỂN THỊ
  ══════════════════════════════════════════ */
  var QR_CONFIG = {
    momo: {
      color: '#A50064', bgGradient: 'linear-gradient(145deg, #ffffff 0%, #fff5f7 100%)',
      logoUrl: 'images/payment/momo.png', 
      name: 'Ví MoMo', note: 'Mở App MoMo → Chọn "Quét mã" → Xác nhận',
      deeplink: (orderId, amount) => `momo://app?type=qr&id=${orderId}&amt=${amount}`
    },
    vnpay: {
      color: '#005AAB', bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)',
      logoUrl: 'images/payment/vnpay.png', 
      name: 'VNPay QR', note: 'Mở App Ngân hàng/VNPay → Chọn QR Pay',
      deeplink: (orderId, amount) => `https://vnpay.vn/qr/${orderId}?amount=${amount}`
    },
    zalopay: {
      color: '#0068FF', bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f0f8ff 100%)',
      logoUrl: 'images/payment/zalopay.png', 
      name: 'ZaloPay', note: 'Mở App ZaloPay → Quét mã QR',
      deeplink: (orderId, amount) => `zalopay://app/pay?token=${orderId}&amount=${amount}`
    }
  };

  function generateQRDataURL(text, options, callback) {
    if (typeof QRCode === 'undefined') { console.error('Thư viện QRCode chưa load.'); return; }
    QRCode.toDataURL(text, options, function (err, url) {
      if (err) console.error(err);
      if (callback) callback(url);
    });
  }

  function showPaymentPanel(method) {
    document.getElementById('cardForm').classList.remove('show');
    document.getElementById('bankForm').classList.remove('show');
    document.getElementById('qrForm').classList.remove('show');

    // LOGIC CHUẨN UX: Ẩn nút "Đặt hàng ngay" nếu dùng QR
    var mainBtn = document.getElementById('btnPlaceOrder');
    
    if (method === 'card') {
      document.getElementById('cardForm').classList.add('show');
      mainBtn.style.display = 'block';
    } else if (method === 'bank' || method === 'cod') {
      if(document.getElementById('bankForm') && method === 'bank') {
        document.getElementById('bankForm').classList.add('show');
      }
      mainBtn.style.display = 'block';
    } else if (QR_CONFIG[method]) {
      // Ẩn nút "Đặt hàng ngay" màu hồng đi để khách không bấm nhầm
      mainBtn.style.display = 'none'; 
      
      var cfg = QR_CONFIG[method];
      var t   = calcTotals();
      var qrEl = document.getElementById('qrForm');
      var orderRef = 'LACTT' + String(Date.now()).slice(-8) + String(Math.floor(Math.random()*100));
      var deeplinkUrl = cfg.deeplink(orderRef, t.total);

      // Thêm 2 nút Giả Lập vào giao diện HTML của mã QR
      qrEl.innerHTML =
        '<div style="padding: 5px;">' +
        '  <div class="qr-premium-header" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:#fff;border:1px solid #eee;margin-bottom:20px;">' +
        '    <img src="' + cfg.logoUrl + '" style="width:40px;height:40px;border-radius:10px;object-fit:cover;background:#fff;border:1px solid #eee;padding:4px;" />' +
        '    <div>' +
        '      <div style="font-weight:700;font-size:1rem;color:#111;">' + cfg.name + '</div>' +
        '      <div style="font-size:0.8rem;color:#777;">Quét mã bằng ứng dụng</div>' +
        '    </div>' +
        '  </div>' +
        '  <div style="text-align: center;">' +
        '    <div class="qr-code-container" style="display: inline-block; padding: 24px; background: ' + cfg.bgGradient + '; border-radius: 32px; box-shadow: 0 25px 40px -10px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.03);">' +
        '      <div id="qr-placeholder" style="width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 16px;">' +
        '        <span style="color: #9e8e82; font-size: 0.8rem;">Đang tạo mã QR...</span>' +
        '      </div>' +
        '    </div>' +
        '    <div style="margin-top: 18px; font-weight: 600; font-size: 1.2rem; color: #1a1208;">' + fmt(t.total) + '</div>' +
        '    <div style="margin-top: 5px; font-size: 0.8rem; color: #9e8e82;">Mã GD: <span style="font-weight: 600; color: #5c4c42;">' + orderRef + '</span></div>' +
        '  </div>' +
        '  <div style="margin-top: 28px; background: #f8f6f5; border-radius: 16px; padding: 18px;">' +
        '    <div style="font-size: 0.85rem; color: #2d2010; line-height: 1.6;">' +
        '      <strong style="display: block; margin-bottom: 10px; font-size: 0.9rem;">📱 Trạng thái thanh toán</strong>' +
        '      <div style="display: flex; align-items: center; gap: 8px; font-weight: 500; color: #c4626e; margin-bottom: 15px;">' +
        '        <div class="spinner" style="width:14px; height:14px; border-width:2px;"></div> Đang chờ bạn thanh toán...' +
        '      </div>' +
        '      ' +
        '      <div style="border-top: 1px dashed #d99aa0; padding-top: 15px; margin-top: 15px; text-align: center;">' +
        '        <div style="font-size: 0.75rem; color: #9e8e82; margin-bottom: 8px;">*Khu vực dành cho Demo hệ thống</div>' +
        '        <div style="display: flex; gap: 8px; justify-content: center;">' +
        '          <button id="demoQrSuccess" style="padding: 8px 12px; background: #2d7a5f; color: #fff; border-radius: 8px; border: none; font-size: 0.8rem; font-weight: bold; cursor: pointer; transition: 0.2s;">Đã thanh toán (Thành công)</button>' +
        '          <button id="demoQrFail" style="padding: 8px 12px; background: #fff; color: #c4626e; border: 1px solid #c4626e; border-radius: 8px; font-size: 0.8rem; font-weight: bold; cursor: pointer; transition: 0.2s;">Hủy / Thất bại</button>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      qrEl.classList.add('show');

      var placeholder = document.getElementById('qr-placeholder');
      if (placeholder) {
        generateQRDataURL(deeplinkUrl, {
          width: 220, margin: 2, color: { dark: '#000000', light: '#ffffff' }
        }, function(qrDataUrl) {
          placeholder.innerHTML = '';
          
          var relativeDiv = document.createElement('div');
          relativeDiv.style.position = 'relative';
          relativeDiv.style.width = '220px';
          relativeDiv.style.height = '220px';
          
          var img = document.createElement('img');
          img.src = qrDataUrl;
          img.style.width = '100%'; img.style.height = '100%';
          img.style.display = 'block'; img.style.borderRadius = '12px';
          relativeDiv.appendChild(img);
          
          if (cfg.logoUrl) {
            var logoImg = document.createElement('img');
            logoImg.src = cfg.logoUrl;
            logoImg.style.position = 'absolute';
            logoImg.style.top = '50%'; logoImg.style.left = '50%';
            logoImg.style.transform = 'translate(-50%, -50%)';
            logoImg.style.width = '48px'; logoImg.style.height = '48px';
            logoImg.style.borderRadius = '12px';
            logoImg.style.backgroundColor = '#ffffff';
            logoImg.style.padding = '4px';
            logoImg.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
            logoImg.style.border = '1px solid rgba(0,0,0,0.05)';
            
            img.onload = function() { relativeDiv.appendChild(logoImg); };
            setTimeout(() => { if (!relativeDiv.contains(logoImg)) relativeDiv.appendChild(logoImg); }, 50);
          }
          
          placeholder.appendChild(relativeDiv);
        });
      }
      
      // GẮN SỰ KIỆN CHO 2 NÚT DEMO
      document.getElementById('demoQrSuccess').addEventListener('click', function(e) {
        e.preventDefault();
        showToast('✓ Hệ thống đã nhận được tiền! Đang khởi tạo đơn hàng...', 2000);
        // Thay đổi UI để nhìn thật hơn
        this.innerHTML = 'Đang xử lý...';
        this.style.opacity = '0.7';
        document.getElementById('demoQrFail').style.display = 'none';
        
        setTimeout(function() {
          _doPlaceOrder(); // Gọi hàm đặt hàng tự động
        }, 1500);
      });

      document.getElementById('demoQrFail').addEventListener('click', function(e) {
        e.preventDefault();
        showToast('⚠ Giao dịch đã bị hủy trên ứng dụng.', 2000);
        // Reset lại chọn Tiền mặt
        document.getElementById('pay-opt-cod').click();
      });

    }
  }

  document.querySelectorAll('.payment-opt').forEach(function(label){
    label.addEventListener('click', function(){
      document.querySelectorAll('.payment-opt').forEach(function(l){ l.classList.remove('selected'); });
      label.classList.add('selected');
      var val = label.querySelector('input').value;
      // Map về ENUM hợp lệ trong DB: cod | banking | momo
      selectedPayment = (val === 'momo' || val === 'zalopay') ? 'momo'
                      : (val === 'vnpay' || val === 'bank' || val === 'card') ? 'banking'
                      : 'cod';
      showPaymentPanel(val);
    });
  });

  var cardNumInput = document.getElementById('cardNumber');
  if (cardNumInput) {
    cardNumInput.addEventListener('input', function(){
      var v = this.value.replace(/\D/g,'').substring(0,16);
      this.value = v.replace(/(.{4})/g,'$1 ').trim();
    });
  }
  var cardExpInput = document.getElementById('cardExpiry');
  if (cardExpInput) {
    cardExpInput.addEventListener('input', function(){
      var v = this.value.replace(/\D/g,'').substring(0,4);
      if (v.length >= 2) v = v.substring(0,2) + ' / ' + v.substring(2);
      this.value = v;
    });
  }


  function validateField(id, fn) {
    var el = document.getElementById(id), err = document.getElementById('err-' + id);
    var ok = fn(el ? el.value.trim() : '');
    if (el)  el.classList.toggle('error', !ok);
    if (err) err.classList.toggle('show', !ok);
    return ok;
  }
  function validateAll() {
    var ok = true;
    ok = validateField('firstName', function(v){ return v.length > 0; }) && ok;
    ok = validateField('lastName',  function(v){ return v.length > 0; }) && ok;
    ok = validateField('phone',     function(v){ return /^0[3-9]\d{8}$/.test(v.replace(/\s/g,'')); }) && ok;
    ok = validateField('address',   function(v){ return v.length >= 5; }) && ok;
    return ok;
  }
  ['firstName','lastName','phone','address'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.addEventListener('blur', function(){ validateField(id, function(v){ return v.length > 0; }); });
  });

  // ── MODAL OTP ──────────────────────────────
  function hienModalOtp(sdt, hoTen, email, onSuccess) {
    // Xóa modal cũ nếu có
    var old = document.getElementById('otpModal');
    if (old) old.remove();

    var html =
      '<div id="otpModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;">' +
        '<div style="background:#fff;border-radius:16px;padding:28px 24px;width:340px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">' +
          '<div style="font-weight:700;font-size:1.1rem;margin-bottom:6px;">📱 Xác nhận số điện thoại</div>' +
          '<div style="font-size:0.85rem;color:#666;margin-bottom:16px;">Mã xác thực đã được gửi đến <strong>' + sdt + '</strong></div>' +
          '<div id="otpModalThongBao" style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:10px 14px;font-size:0.9rem;color:#2e7d32;margin-bottom:14px;"></div>' +
          '<input id="otpModalInput" type="text" maxlength="6" placeholder="Nhập mã 6 số..." ' +
            'style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid #ddd;border-radius:8px;font-size:1.2rem;letter-spacing:8px;text-align:center;margin-bottom:8px;" />' +
          '<div id="otpModalErr" style="color:#c0392b;font-size:0.82rem;margin-bottom:12px;display:none;"></div>' +
          '<button id="otpModalBtn" style="width:100%;padding:12px;background:#e8624a;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;">Xác nhận</button>' +
          '<div style="text-align:center;margin-top:10px;">' +
            '<a href="#" id="otpModalHuy" style="font-size:0.82rem;color:#999;">Hủy</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('otpModalHuy').addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('otpModal').remove();
    });

    document.getElementById('otpModalBtn').addEventListener('click', function() {
      var otp = document.getElementById('otpModalInput').value.trim();
      var errEl = document.getElementById('otpModalErr');
      if (otp.length !== 6) {
        errEl.textContent = 'Mã OTP phải đủ 6 số'; errEl.style.display = 'block'; return;
      }
      errEl.style.display = 'none';
      this.disabled = true; this.textContent = 'Đang xác thực...';
      var btn = this;

      fetch(window.APP_CONTEXT + '/OtpServlet', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=xacThucOtp&soDienThoai=' + encodeURIComponent(sdt) + '&maOtp=' + encodeURIComponent(otp)
            + '&hoTen=' + encodeURIComponent(hoTen || '') + '&email=' + encodeURIComponent(email || '')
      })
      .then(function(r){ return r.json(); })
      .then(function(data) {
        btn.disabled = false; btn.textContent = 'Xác nhận';
        if (data.success) {
          localStorage.setItem('lactt_user', JSON.stringify({
            maNguoiDung: data.maNguoiDung, hoTen: data.hoTen
          }));
          // Merge giỏ hàng guest → user trước khi đặt hàng
          try {
            var guestKey = 'lactt_cart_guest';
            var userKey  = 'lactt_cart_' + data.maNguoiDung;
            var guestRaw = localStorage.getItem(guestKey);
            if (guestRaw) {
              var guestItems = JSON.parse(guestRaw) || [];
              if (guestItems.length > 0) {
                var userItems = JSON.parse(localStorage.getItem(userKey) || '[]');
                guestItems.forEach(function(gi) {
                  var exist = userItems.find(function(ui) { return ui.key === gi.key; });
                  if (exist) { exist.qty = Math.min(99, exist.qty + gi.qty); }
                  else { userItems.push(gi); }
                });
                localStorage.setItem(userKey, JSON.stringify(userItems));
              }
              localStorage.removeItem(guestKey);
            }
          } catch(e) {}
          document.getElementById('otpModal').remove();
          onSuccess(); // tiếp tục đặt hàng
        } else {
          errEl.textContent = data.message; errEl.style.display = 'block';
        }
      })
      .catch(function() {
        btn.disabled = false; btn.textContent = 'Xác nhận';
        document.getElementById('otpModalErr').textContent = 'Lỗi kết nối, thử lại.';
        document.getElementById('otpModalErr').style.display = 'block';
      });
    });
document.getElementById('otpModalInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('otpModalBtn').click();
  }
});
    // Focus vào ô nhập OTP luôn
    setTimeout(function(){ document.getElementById('otpModalInput').focus(); }, 100);
  }

  function _doPlaceOrder() {
    if (!validateAll()) {
      showToast('⚠ Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

// Lấy SĐT từ form → check xem đã có TK chưa
    var sdtForm = (document.getElementById('phone') ? document.getElementById('phone').value.trim() : '');
    var userHienTai = null;
    try { userHienTai = JSON.parse(localStorage.getItem('lactt_user')); } catch(e) {}

    if (!userHienTai || !userHienTai.maNguoiDung) {
      // Lấy họ tên và email từ form thanh toán
      var hoTenForm = ((document.getElementById('firstName') ? document.getElementById('firstName').value.trim() : '') + ' ' +
                       (document.getElementById('lastName')  ? document.getElementById('lastName').value.trim()  : '')).trim();
      var emailForm = document.getElementById('email') ? document.getElementById('email').value.trim() : '';

      // Chưa đăng nhập → check SĐT với server
      fetch(window.APP_CONTEXT + '/OtpServlet', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=checkSdt&soDienThoai=' + encodeURIComponent(sdtForm)
      })
      .then(function(r){ return r.json(); })
      .then(function(data) {
        if (data.daCoTaiKhoan) {
          // Đã có TK → đăng nhập luôn, đặt hàng luôn
          localStorage.setItem('lactt_user', JSON.stringify({
            maNguoiDung: data.maNguoiDung, hoTen: data.hoTen
          }));
          // Merge giỏ hàng guest → user trước khi đặt hàng
          try {
            var guestKey = 'lactt_cart_guest';
            var userKey  = 'lactt_cart_' + data.maNguoiDung;
            var guestRaw = localStorage.getItem(guestKey);
            if (guestRaw) {
              var guestItems = JSON.parse(guestRaw) || [];
              if (guestItems.length > 0) {
                var userItems = JSON.parse(localStorage.getItem(userKey) || '[]');
                guestItems.forEach(function(gi) {
                  var exist = userItems.find(function(ui) { return ui.key === gi.key; });
                  if (exist) { exist.qty = Math.min(99, exist.qty + gi.qty); }
                  else { userItems.push(gi); }
                });
                localStorage.setItem(userKey, JSON.stringify(userItems));
              }
              localStorage.removeItem(guestKey);
            }
          } catch(e) {}
          _thucSuDatHang();
        } else {
          // Chưa có → gửi OTP rồi hiện modal
          fetch(window.APP_CONTEXT + '/OtpServlet', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=guiOtp&soDienThoai=' + encodeURIComponent(sdtForm)
          })
          .then(function(r){ return r.json(); })
          .then(function(otpData) {
            if (otpData.success) {
              hienModalOtp(sdtForm, hoTenForm, emailForm, function() {
                _thucSuDatHang(); // callback sau khi OTP thành công
              });
              // Hiện OTP demo trong modal
              setTimeout(function(){
                var el = document.getElementById('otpModalThongBao');
                if (el) el.textContent = otpData.message;
              }, 100);
            }
          });
        }
      });
      return; // dừng lại, chờ kết quả async
    }

    _thucSuDatHang();
  }

  // Tách phần thực sự gửi đơn hàng ra hàm riêng
  function _thucSuDatHang() {
  

    var btn = document.getElementById('btnPlaceOrder');
    if(btn) { btn.disabled = true; btn.textContent = 'Đang xử lý...'; }

    /* ── 1. Thu thập thông tin đơn hàng ── */
    var t         = calcTotals();
    var firstName = (document.getElementById('firstName') ? document.getElementById('firstName').value : '') || '';
    var lastName  = (document.getElementById('lastName')  ? document.getElementById('lastName').value  : '') || '';
    var phone     = (document.getElementById('phone')     ? document.getElementById('phone').value     : '') || '';

    var fullAddress;
    if (selectedSavedAddress) {
      // Dùng địa chỉ từ sổ — không cần ghép tỉnh/huyện/phường
      fullAddress = selectedSavedAddress.diaChiCuThe || '';
    } else {
      var address  = (document.getElementById('address')   ? document.getElementById('address').value   : '') || '';
      var province = (document.getElementById('provinceInput') ? document.getElementById('provinceInput').value : '') || '';
      var district = (document.getElementById('districtInput') ? document.getElementById('districtInput').value : '') || '';
      var ward     = (document.getElementById('wardInput')     ? document.getElementById('wardInput').value     : '') || '';
      fullAddress  = [address, ward, district, province].filter(Boolean).join(', ');
    }

    /* ── 2. Build payload gửi lên server ── */
    var donHangPayload = {
      tenNguoiNhan:  (firstName + ' ' + lastName).trim(),
      soDienThoai:   phone,
      diaChiGiao:    fullAddress,
      maDiaChi:      selectedSavedAddress ? selectedSavedAddress.id : null,
      ghiChu:        (document.getElementById('noteInput') ? document.getElementById('noteInput').value : '') || '',
      phuongThucTT:  selectedPayment,
      tongTamTinh:   String(t.subtotal),
      phiVanChuyen:  String(t.shipFee),
      giamGia:       String(t.discount),
      tongTien:      String(t.total),
      diemSuDung:    isUsingPoints ? Math.ceil(t.pointsDiscount / 100) : 0,
      giamGiaDiem:   String(isUsingPoints ? t.pointsDiscount : 0)
    };

    var listChiTietPayload = checkoutItems.map(function(item) {
      return {
        maSanPham:   item.id,
        tenSanPham:  item.name  || '',
        thuongHieu:  item.brand || '',
        tenVariant:  item.variant || '',
        soLuong:     item.qty,
        gia:         String(item.price),
        thanhTien:   String(item.price * item.qty)
      };
    });

    /* ── 3. Xác định cartKey và backup giỏ hàng TRƯỚC khi gửi ── */
    var _cartKey = 'lactt_cart_guest';
    try {
      var _rawUser = localStorage.getItem('lactt_user');
      if (_rawUser) {
        var _u = JSON.parse(_rawUser);
        if (_u && _u.maNguoiDung) _cartKey = 'lactt_cart_' + _u.maNguoiDung;
      }
    } catch(e) {}

    var _checkedKeys  = new Set(checkoutItems.map(function(i){ return i.key; }));
    var _backupCart   = localStorage.getItem(_cartKey); /* backup để rollback nếu lỗi thật */
    var _afterOrder   = [];
    try {
      var _allStored = JSON.parse(_backupCart || '[]');
      _afterOrder = _allStored.filter(function(i){ return !_checkedKeys.has(i.key); });
    } catch(e) {}

    /* XÓA GIỎ NGAY TRƯỚC KHI GỬI — không phụ thuộc vào response */
    localStorage.setItem(_cartKey, JSON.stringify(_afterOrder));
    try {
      var _n = _afterOrder.reduce(function(s,i){ return s+(i.qty||0); }, 0);
      document.querySelectorAll('.cart-count').forEach(function(el){
        el.textContent = _n > 99 ? '99+' : String(_n);
        el.classList.toggle('has-items', _n > 0);
      });
    } catch(e) {}

    /* ── 4. Gửi lên DonHangServlet (ghi vào MySQL) ── */
    fetch(window.APP_CONTEXT + '/DonHangServlet', {
  method:  'POST',
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  body:    JSON.stringify({ donHang: donHangPayload, listChiTiet: listChiTietPayload })
})
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.status === 'success') {
        var orderId = data.maDonHang;

        /* ── 5. Xóa session checkout ── */
        try { sessionStorage.removeItem('lactt_checkout_keys'); } catch(e) {}
        try { sessionStorage.removeItem('lactt_checkout_coupon'); } catch(e) {}

        /* ── 6. Chuyển trang ── */
        sessionStorage.setItem('lactt_goto_tab', 'orders');
        sessionStorage.setItem('lactt_new_order_id', orderId);
        showToast('✓ Đặt hàng thành công!', 1500);
        setTimeout(function(){ window.location.href = 'taikhoan.jsp'; }, 1500);

      } else {
        /* Lỗi từ server — rollback giỏ hàng về như cũ */
        if (_backupCart !== null) localStorage.setItem(_cartKey, _backupCart);
        var errMsg = data.message || 'Đặt hàng thất bại';
        showToast('⚠ ' + errMsg, 3000);
        if (data.message && data.message.indexOf('đăng nhập') !== -1) {
          setTimeout(function(){ window.location.href = 'dangnhap.jsp'; }, 2000);
        }
        if(btn) { btn.disabled = false; btn.textContent = 'Đặt hàng ngay →'; }
      }
    })
    .catch(function(err) {
      /* Lỗi mạng hoặc extension chặn response — giỏ đã xóa rồi, vẫn redirect */
      console.error('Lỗi kết nối server:', err);
      try { sessionStorage.removeItem('lactt_checkout_keys'); } catch(e2) {}
      try { sessionStorage.removeItem('lactt_checkout_coupon'); } catch(e2) {}
      sessionStorage.setItem('lactt_goto_tab', 'orders');
      showToast('✓ Đơn hàng đã gửi!', 1500);
      setTimeout(function(){ window.location.href = 'taikhoan.jsp'; }, 1500);
    });
  }

  var btnPO = document.getElementById('btnPlaceOrder');
  if(btnPO) {
    btnPO.addEventListener('click', function(){ _doPlaceOrder(); });
  }

  var backTop = document.getElementById('backTop');
  window.addEventListener('scroll', function(){
    if (backTop) backTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive:true });
  if (backTop) backTop.addEventListener('click', function(){ window.scrollTo({top:0,behavior:'smooth'}); });
// ================= DROPDOWN ADDRESS =================

let provinces = [];
let districts = [];
let wards = [];

// load tỉnh
fetch('https://provinces.open-api.vn/api/p/')
  .then(res => res.json())
  .then(data => provinces = data);

// render list
function renderList(list, container, onClick) {
  container.innerHTML = list.map(item =>
    `<div class="dropdown-item" data-id="${item.code}">${item.name}</div>`
  ).join('');

  container.style.display = 'block';

  container.querySelectorAll('.dropdown-item').forEach(el => {
    el.onclick = () => {
      onClick(el.dataset.id, el.textContent);
      container.style.display = 'none';
    };
  });
}

// ===== PROVINCE =====
const provinceInput = document.getElementById('provinceInput');
const provinceList = document.getElementById('provinceList');

if (provinceInput) {
  provinceInput.addEventListener('input', function() {
    const filtered = provinces.filter(p =>
      p.name.toLowerCase().includes(this.value.toLowerCase())
    );

    renderList(filtered, provinceList, (id, name) => {
      provinceInput.value = name;

      const districtInput = document.getElementById('districtInput');
      districtInput.disabled = false;
      districtInput.value = '';

      fetch(`https://provinces.open-api.vn/api/p/${id}?depth=2`)
        .then(res => res.json())
        .then(data => districts = data.districts);
    });
  });
}

// ===== DISTRICT =====
const districtInput = document.getElementById('districtInput');
const districtList = document.getElementById('districtList');

if (districtInput) {
  districtInput.addEventListener('input', function() {
    const filtered = districts.filter(d =>
      d.name.toLowerCase().includes(this.value.toLowerCase())
    );

    renderList(filtered, districtList, (id, name) => {
      districtInput.value = name;

      const wardInput = document.getElementById('wardInput');
      wardInput.disabled = false;
      wardInput.value = '';

      fetch(`https://provinces.open-api.vn/api/d/${id}?depth=2`)
        .then(res => res.json())
        .then(data => wards = data.wards);
    });
  });
}

// ===== WARD =====
const wardInput = document.getElementById('wardInput');
const wardList = document.getElementById('wardList');

if (wardInput) {
  wardInput.addEventListener('input', function() {
    const filtered = wards.filter(w =>
      w.name.toLowerCase().includes(this.value.toLowerCase())
    );

    renderList(filtered, wardList, (id, name) => {
      wardInput.value = name;
    });
  });
}

// click ngoài để đóng
document.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-list').forEach(d => d.style.display = 'none');
  }
});

  renderSummaryItems(); updateShipLabels(); renderTotals();
});