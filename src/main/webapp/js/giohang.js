/* =============================================
   LACTT — giohang.js  (v6 — Class Fix + Auth Gate + Enter Login)
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

  function fmt(n) { return Number(n).toLocaleString('vi-VN') + '\u20ab'; }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var header  = document.getElementById('header');
  var backTop = document.getElementById('backTop');
  window.addEventListener('scroll', function() {
    if (header)  header.classList.toggle('scrolled', window.scrollY > 60);
    if (backTop) backTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  if (backTop) backTop.addEventListener('click', function() { window.scrollTo({ top:0, behavior:'smooth' }); });

  var COUPONS = {
    'LACTT10':   { type:'percent', value:10,    label:'Giảm 10%',            desc:'Áp dụng mọi đơn hàng' },
    'LACTT50K':  { type:'fixed',   value:50000, label:'Giảm 50.000\u20ab',   desc:'Đơn từ 200.000\u20ab' },
    'NEWMEMBER': { type:'percent', value:15,    label:'Thành viên mới -15%',  desc:'Chỉ dành cho KH mới'  },
    'FREESHIP':  { type:'ship',    value:0,     label:'Miễn phí vận chuyển', desc:'Mọi đơn hàng'          },
  };
  var appliedCoupon = null;
  var selectedKeys  = new Set();

  /* ─── COUPON ─── */
  function buildCouponUI() {
    var box = document.querySelector('.coupon-box');
    if (!box) return;
    var listHtml = Object.keys(COUPONS).map(function(code) {
      var c = COUPONS[code];
      return '<div class="cpn-item" data-code="'+esc(code)+'">'
           + '<div class="cpn-item-info"><span class="cpn-code">'+esc(code)+'</span>'
           + '<span class="cpn-label">'+esc(c.label)+'</span><span class="cpn-desc">'+esc(c.desc)+'</span></div>'
           + '<button class="cpn-pick-btn" data-code="'+esc(code)+'">Dùng ngay</button></div>';
    }).join('');
    box.innerHTML =
      '<p class="coupon-label">Mã giảm giá</p>'
    + '<button class="cpn-see-btn" id="cpnSeeBtn" type="button">\uD83C\uDF81 Xem mã giảm giá có sẵn'
    + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>'
    + '<div class="cpn-dropdown" id="cpnDropdown">'+listHtml+'</div>'
    + '<div class="coupon-row" style="margin-top:10px">'
    + '<input type="text" class="coupon-input" id="couponInput" placeholder="Nhập mã hoặc chọn từ danh sách..." autocomplete="off"/>'
    + '<button class="coupon-apply" id="couponApply" type="button">Áp dụng</button></div>'
    + '<p class="coupon-msg" id="couponMsg"></p>';

    var seeBtn = document.getElementById('cpnSeeBtn');
    var dropdown = document.getElementById('cpnDropdown');
    var arrow = seeBtn.querySelector('svg');
    seeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var open = dropdown.classList.toggle('open');
      arrow.style.transform = open ? 'rotate(180deg)' : '';
    });
    document.addEventListener('click', function(e) {
      if (!box.contains(e.target)) { dropdown.classList.remove('open'); arrow.style.transform = ''; }
    });
    dropdown.querySelectorAll('.cpn-pick-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('couponInput').value = btn.dataset.code;
        dropdown.classList.remove('open'); arrow.style.transform = '';
        applyCoupon(btn.dataset.code);
      });
    });
    document.getElementById('couponApply').addEventListener('click', function() {
      applyCoupon((document.getElementById('couponInput').value||'').trim().toUpperCase());
    });
    document.getElementById('couponInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') applyCoupon((this.value||'').trim().toUpperCase());
    });
  }

  function applyCoupon(code) {
    var msgEl = document.getElementById('couponMsg');
    if (!code) { msgEl.textContent='Vui lòng nhập hoặc chọn mã.'; msgEl.className='coupon-msg error'; return; }
    var coupon = COUPONS[code];
    if (coupon) {
      appliedCoupon = Object.assign({ code:code }, coupon);
      document.getElementById('couponInput').value = code;
      msgEl.textContent = '\u2713 Áp dụng thành công: '+coupon.label;
      msgEl.className   = 'coupon-msg success';
      document.querySelectorAll('.cpn-item').forEach(function(el) { el.classList.toggle('cpn-active', el.dataset.code===code); });
    } else {
      appliedCoupon = null;
      msgEl.textContent = 'Mã không hợp lệ hoặc đã hết hạn.';
      msgEl.className   = 'coupon-msg error';
    }
    renderSummary();
  }

  /* ─── RENDER CART ─── */
  function renderCart() {
    var items      = Cart.getItems();
    var layout     = document.getElementById('cartLayout');
    var emptyEl    = document.getElementById('ghEmpty');
    var suggestEl  = document.getElementById('ghSuggest');
    var countLabel = document.getElementById('ghCountLabel');

    var totalItems = items.reduce(function(s,i){ return s+i.qty; }, 0);
    if (countLabel) countLabel.textContent = totalItems + ' sản phẩm';

    if (items.length === 0) {
      if (layout)   layout.style.display   = 'none';
      if (emptyEl)  emptyEl.style.display  = '';
      if (suggestEl) suggestEl.style.display = '';
      renderSuggest(); return;
    }
    if (layout)   layout.style.display   = '';
    if (emptyEl)  emptyEl.style.display  = 'none';
    if (suggestEl) suggestEl.style.display = 'none';

    var allKeys = items.map(function(i){ return i.key; });
    selectedKeys.forEach(function(k){ if (allKeys.indexOf(k)===-1) selectedKeys.delete(k); });
    if (selectedKeys.size===0) items.forEach(function(i){ selectedKeys.add(i.key); });

    renderItems(items);
    renderSummary();
    _renderUserStatus();
  }

  /* ─── RENDER ITEMS ───
     Grid CSS: 28px | 1fr | 120px | 130px | 120px | 36px
     Col1=checkbox  Col2=main  Col3=price  Col4=qty  Col5=subtotal  Col6=remove
  ─── */
  function renderItems(items) {
    var list = document.getElementById('ghItemsList');
    if (!list) return;
    var allChecked = items.every(function(i){ return selectedKeys.has(i.key); });

    var html = '<div class="gh-select-all-row">'
      + '<label class="gh-chk-wrap">'
      + '<input type="checkbox" id="checkAll" '+(allChecked?'checked':'')+'/>'
      + '<span class="gh-chk-box"></span>'
      + '<span class="gh-sel-all-lbl">Chọn tất cả ('+items.length+' sản phẩm)</span>'
      + '</label></div>';

    items.forEach(function(item) {
      var checked = selectedKeys.has(item.key);
      html +=
        '<div class="gh-item'+(checked?'':' gh-dim')+'" data-key="'+esc(item.key)+'">'

        /* Col 1 — checkbox */
        +'<label class="gh-chk-wrap gh-item-chk">'
        +'<input type="checkbox" class="gh-item-checkbox" data-key="'+esc(item.key)+'" '+(checked?'checked':'')+'/>'
        +'<span class="gh-chk-box"></span>'
        +'</label>'

        /* Col 2 — ảnh + tên (Đã gắn link cho cả ảnh và tên) */
        +'<div class="gh-item-main">'
        +  '<div class="gh-item-img" style="cursor:pointer;" onclick="window.location.href=\'chitiet.jsp?id='+item.id+'\'">'
        +    (item.hinhAnh && item.hinhAnh.startsWith('http') ? '<img src="'+item.hinhAnh+'" alt="" class="gh-item-thumb" loading="lazy">' : '<span class="item-emoji">'+(item.emoji||'🛍️')+'</span>')
        +  '</div>'
        +  '<div class="gh-item-text">'
        +    '<p class="gh-item-brand">'+esc(item.brand)+'</p>'
        +    '<span class="gh-item-name" style="cursor:pointer;" onclick="window.location.href=\'chitiet.jsp?id='+item.id+'\'">'+esc(item.name)+'</span>'
        +    (item.variant ? '<p class="gh-item-variant">'+esc(item.variant)+'</p>' : '')
        +    '<p class="gh-item-price-mobile">'+fmt(item.price)+'</p>'
        +  '</div>'
        +'</div>'

        /* Col 3 — đơn giá */
        +'<div class="gh-item-price">'+fmt(item.price)+'</div>'

        /* Col 4 — số lượng */
        /* Col 4 — số lượng */
        +(function(){
          var tonKho = item.soLuongTon > 0 ? item.soLuongTon : 99999;
          var atMax  = item.qty >= tonKho;
          var atMin  = item.qty <= 1;
          return '<div class="gh-item-qty">'
            + '<button class="gh-qty-btn'+(atMin?' gh-qty-disabled':'')+'" data-action="minus" data-key="'+esc(item.key)+'" aria-label="Giảm" '+(atMin?'disabled':'')+' style="opacity:'+(atMin?'0.35':'1')+'">\u2212</button>'
            + '<input class="gh-qty-input" type="number" min="1" data-ton-kho="'+tonKho+'" value="'+item.qty+'" data-key="'+esc(item.key)+'"/>'
            + '<button class="gh-qty-btn'+(atMax?' gh-qty-disabled':'')+'" data-action="plus" data-key="'+esc(item.key)+'" aria-label="Tăng" '+(atMax?'disabled':'')+' style="opacity:'+(atMax?'0.35':'1')+'"  >+</button>'
            + '</div>';
        })()

        /* Col 5 — thành tiền */
        +'<div class="gh-item-subtotal">'+fmt(item.price*item.qty)+'</div>'

        /* Col 6 — xóa */
        +'<button class="gh-item-remove" data-key="'+esc(item.key)+'" aria-label="Xóa">'
        +  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>'
        +'</button>'
        +'</div>';
    });

    list.innerHTML = html;

    /* Events */
    document.getElementById('checkAll').addEventListener('change', function() {
      if (this.checked) items.forEach(function(i){ selectedKeys.add(i.key); });
      else              selectedKeys.clear();
      renderItems(items); renderSummary();
    });

    list.querySelectorAll('.gh-item-checkbox').forEach(function(cb) {
      cb.addEventListener('change', function() {
        if (this.checked) selectedKeys.add(this.dataset.key);
        else              selectedKeys.delete(this.dataset.key);
        renderItems(items); renderSummary();
      });
    });

    list.querySelectorAll('.gh-qty-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key    = btn.dataset.key;
        var item   = Cart.getItems().find(function(i){ return i.key===key; });
        if (!item) return;
        var tonKho = item.soLuongTon > 0 ? item.soLuongTon : 99999;
        if (btn.dataset.action === 'plus') {
          if (item.qty >= tonKho) {
            showToast('⚠️ Chỉ còn ' + tonKho + ' sản phẩm trong kho!');
            return;
          }
          Cart.updateQty(key, item.qty + 1);
        } else {
          Cart.updateQty(key, item.qty - 1);
        }
        renderCart();
      });
    });

    list.querySelectorAll('.gh-qty-input').forEach(function(input) {
      input.addEventListener('change', function() {
        var item   = Cart.getItems().find(function(i){ return i.key === input.dataset.key; });
        var tonKho = (item && item.soLuongTon > 0) ? item.soLuongTon : 99999;
        var val    = parseInt(input.value) || 1;
        if (val < 1) val = 1;
        if (val > tonKho) {
          val = tonKho; // ← về đúng max, không về 1
          showToast('⚠️ Chỉ còn ' + tonKho + ' sản phẩm trong kho!');
        }
        input.value = val;
        Cart.updateQty(input.dataset.key, val);
        renderCart();
      });
    });

    list.querySelectorAll('.gh-item-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key    = btn.dataset.key;
        var itemEl = list.querySelector('.gh-item[data-key="'+key+'"]');
        selectedKeys.delete(key);
        if (itemEl) {
          itemEl.style.animation = 'ghItemOut 0.28s ease forwards';
          setTimeout(function(){ Cart.removeItem(key); renderCart(); }, 270);
        } else { Cart.removeItem(key); renderCart(); }
      });
    });
  }
  /* ─── USER STATUS ─── */
  function _renderUserStatus() {
    var el = document.getElementById('ghUserStatus');
    if (!el) return;
    if (typeof AuthModal !== 'undefined' && AuthModal.check()) {
      var user = AuthModal.getUser();
      var roleLabel = {customer:'Khách hàng',admin:'Admin',warehouse:'Nhân viên kho'}[user.role]||'Thành viên';
      el.innerHTML =
        '<span class="gh-user-avatar">'+(user.avatar||'👤')+'</span>'
        +'<div class="gh-user-info"><span class="gh-user-name">'+esc(user.firstName+' '+user.lastName)+'</span>'
        +'<span class="gh-user-role">'+esc(roleLabel)+'</span></div>'
        +(user.points?'<span class="gh-user-points">💎 '+Number(user.points).toLocaleString('vi-VN')+' điểm</span>':'')
        +'<button class="gh-logout-btn" id="ghLogoutBtn">Đăng xuất</button>';
      var logoutBtn = document.getElementById('ghLogoutBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', function() {
        if (confirm('Bạn có chắc muốn đăng xuất?')) { AuthModal.logout(); renderCart(); }
      });
      el.style.display = 'flex';
    } else { el.style.display = 'none'; }
  }

  /* ─── SUMMARY ─── */
  function renderSummary() {
    var items    = Cart.getItems();
    var selected = items.filter(function(i){ return selectedKeys.has(i.key); });
    var selQty   = selected.reduce(function(s,i){ return s+i.qty; }, 0);
    var subtotal = selected.reduce(function(s,i){ return s+i.price*i.qty; }, 0);
    var discount = 0;
    var shipping = (subtotal>0 && subtotal<499000) ? 35000 : 0;

    if (appliedCoupon && subtotal>0) {
      if (appliedCoupon.type==='percent')    discount = Math.round(subtotal*appliedCoupon.value/100);
      else if (appliedCoupon.type==='fixed') discount = Math.min(appliedCoupon.value, subtotal);
      else if (appliedCoupon.type==='ship')  shipping = 0;
    }
    var total = Math.max(0, subtotal - discount + shipping);

    var btn = document.getElementById('ghCheckoutBtn');
    if (btn) {
      if (selected.length===0) {
        btn.disabled=true; btn.textContent='Vui lòng chọn sản phẩm'; btn.style.opacity='0.5'; btn.style.cursor='not-allowed';
      } else {
        btn.disabled=false; btn.style.opacity=''; btn.style.cursor='';
        btn.innerHTML = 'Thanh toán ' + selQty + ' sản phẩm \u2192';
      }
    }

    var rowsEl = document.getElementById('summaryRows');
    if (!rowsEl) return;
    var html = '<div class="summary-row"><span>Đã chọn ('+selQty+' sản phẩm)</span><span>'+fmt(subtotal)+'</span></div>';
    if (discount>0) html += '<div class="summary-row discount"><span>Giảm ('+esc(appliedCoupon.label)+')</span><span>−'+fmt(discount)+'</span></div>';
    html += '<div class="summary-row"><span>Phí vận chuyển</span><span>'+(shipping===0?'<span class="free-ship">Miễn phí</span>':fmt(shipping))+'</span></div>';
    if (shipping>0) html += '<div class="summary-ship-note">Mua thêm <strong>'+fmt(499000-subtotal)+'</strong> để miễn phí vận chuyển 🚚</div>';
    rowsEl.innerHTML = html;
    var totalEl = document.getElementById('ghTotal');
    if (totalEl) totalEl.textContent = fmt(total);
  }

  /* ─── SUGGEST ─── */
  var SUGGEST = [
    { id:'p1',  emoji:'\u2728',       brand:'LANC\u00d4ME', name:'G\u00e9nifique Advanced Youth Activating Serum', price:1250000 },
    { id:'p4',  emoji:'\uD83C\uDF3F', brand:'INNISFREE',    name:'Green Tea Hyaluronic Acid Toner',                price:385000  },
    { id:'p7',  emoji:'\uD83C\uDF19', brand:'THE ORDINARY', name:'Niacinamide 10% + Zinc 1% Serum',               price:230000  },
    { id:'p10', emoji:'\u2600\uFE0F', brand:'ANESSA',       name:'Perfect UV Sunscreen Skincare Milk SPF50+',     price:620000  },
  ];
  function renderSuggest() {
    var grid = document.getElementById('ghSuggestGrid');
    if (!grid) return;
    grid.innerHTML = SUGGEST.map(function(p) {
      return '<div class="product-card" style="cursor:pointer" onclick="location.href=\'chitiet.jsp?id='+p.id+'\'">'
           + '<div class="product-img"><div class="product-emoji">'+p.emoji+'</div></div>'
           + '<div class="product-info"><p class="product-brand">'+esc(p.brand)+'</p>'
           + '<h3 class="product-name">'+esc(p.name)+'</h3>'
           + '<div class="product-price"><span class="price-current">'+fmt(p.price)+'</span></div></div>'
           + '<button class="btn-add-cart" onclick="event.stopPropagation();location.href=\'chitiet.jsp?id='+p.id+'\'">Xem chi tiết</button></div>';
    }).join('');
  }

  /* ─── CLEAR ─── */
  var clearBtn = document.getElementById('ghClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (Cart.totalQty()===0) return;
      if (confirm('Xóa toàn bộ giỏ hàng?')) { Cart.clearCart(); appliedCoupon=null; selectedKeys.clear(); renderCart(); }
    });
  }

  /* ─── CHECKOUT + AUTH GATE ─── */
  var checkoutBtn = document.getElementById('ghCheckoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      var selected = Cart.getItems().filter(function(i){ return selectedKeys.has(i.key); });
      if (selected.length===0) { showToast('\u26A0 Vui lòng chọn ít nhất 1 sản phẩm'); return; }
      
      _proceedCheckout(selected);
    });
  }

  function _proceedCheckout(selected) {
    try {
      sessionStorage.setItem('lactt_checkout_keys', JSON.stringify(selected.map(function(i){ return i.key; })));
      if (appliedCoupon) sessionStorage.setItem('lactt_checkout_coupon', JSON.stringify(appliedCoupon));
      else sessionStorage.removeItem('lactt_checkout_coupon');
      if (typeof AuthModal!=='undefined' && AuthModal.getUser())
        sessionStorage.setItem('lactt_checkout_user', JSON.stringify(AuthModal.getUser()));
    } catch(e) {}
    showToast('Đang chuyển đến thanh toán '+selected.length+' sản phẩm...');
    setTimeout(function(){ window.location.href='thanhtoan.jsp'; }, 900);
  }

  /* ─── TOAST ─── */
  function showToast(msg) {
    var t = document.getElementById('ghToast');
    if (!t) { t=document.createElement('div'); t.id='ghToast'; t.className='toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function(){ t.classList.remove('show'); }, 2800);
  }

  buildCouponUI();
  renderCart();
});