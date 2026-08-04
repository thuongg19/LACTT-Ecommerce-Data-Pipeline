/* =============================================
   LACTT — cart.js  (v6 — User-scoped cart, no cross-user leak)
   Nhúng TRƯỚC cart-drawer.js và mọi file JS khác.
   ============================================= */

const Cart = (function () {
  // KEY theo userId để mỗi user có cart riêng — tránh cart của user cũ rò sang user mới
  // Guest (chưa đăng nhập) dùng key mặc định 'lactt_cart_guest'
  function _cartKey() {
    try {
      const raw = localStorage.getItem('lactt_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.maNguoiDung) return 'lactt_cart_' + u.maNguoiDung;
      }
    } catch (e) {}
    return 'lactt_cart_guest';
  }

  function getItems() {
    try {
      const KEY = _cartKey();
      const items = JSON.parse(localStorage.getItem(KEY)) || [];
      // MIGRATION: fix item cũ đã lưu URL ảnh vào field emoji
      let changed = false;
      items.forEach(item => {
        if (item.emoji && (item.emoji.startsWith('http') || item.emoji.startsWith('/'))) {
          item.hinhAnh = item.hinhAnh || item.emoji;
          item.emoji   = '🛍️';
          changed = true;
        }
        if (!item.hinhAnh) item.hinhAnh = '';
      });
      if (changed) localStorage.setItem(_cartKey(), JSON.stringify(items));
      return items;
    }
    catch { return []; }
  }

  function save(items) {
    localStorage.setItem(_cartKey(), JSON.stringify(items));
  }

  function makeKey(id, variant) {
    return id + '|' + (variant || '');
  }

  /* ── Hàm helper: render ảnh sản phẩm (URL thật hoặc emoji) ── */
  function imgHtml(item, cls) {
    cls = cls || 'cd-item-thumb';
    if (item.hinhAnh && item.hinhAnh.startsWith('http')) {
      return '<img src="' + item.hinhAnh + '" alt="' + (item.name || '') + '" class="' + cls + '" loading="lazy">';
    }
    return '<span class="item-emoji">' + (item.emoji || '🛍️') + '</span>';
  }

  function addItem(product, qty) {
    qty = qty || 1;
    const items = getItems();
    const key   = makeKey(product.id, product.variant);
    const exist = items.find(i => i.key === key);
    if (exist) {
  const max = (exist.soLuongTon != null && exist.soLuongTon > 0) ? exist.soLuongTon : 1;
  exist.qty = Math.min(max, exist.qty + qty);
    } else {
      // FIX: tách biệt hinhAnh (URL) và emoji (fallback)
      const rawImg = product.hinhAnh || product.emoji || '';
      const isUrl  = rawImg.startsWith('http') || rawImg.startsWith('/');
      const maxQty = (product.soLuongTon != null && product.soLuongTon > 0) ? product.soLuongTon : 1;
items.push({
  key,
  id:         product.id || '',
  name:       product.name    || 'Sản phẩm',
  brand:      product.brand   || '',
  hinhAnh:    isUrl ? rawImg : '',
  emoji:      isUrl ? '🛍️' : (rawImg || '🛍️'),
  variant:    product.variant || '',
  price:      Number(product.price) || 0,
  soLuongTon: product.soLuongTon || 0,
  qty:        Math.min(maxQty, qty),
});
    }
save(items);
    _updateBadges();
  }
  function updateQty(key, qty) {
    const items = getItems();
    const idx   = items.findIndex(i => i.key === key);
    if (idx === -1) return;
    if (qty <= 0) items.splice(idx, 1);
    else {
  const max = (items[idx].soLuongTon != null && items[idx].soLuongTon > 0) ? items[idx].soLuongTon : 1;
  items[idx].qty = Math.min(max, qty);
}
    save(items);
    _updateBadges();
  }

  function removeItem(key) {
    save(getItems().filter(i => i.key !== key));
    _updateBadges();
  }

  function clearCart() {
    save([]);
    _updateBadges();
  }

  function totalQty() {
    return getItems().reduce((s, i) => s + i.qty, 0);
  }

  function totalPrice() {
    return getItems().reduce((s, i) => s + i.price * i.qty, 0);
  }

  function _updateBadges() {
    const n = totalQty();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = n > 99 ? '99+' : String(n);
      el.classList.toggle('has-items', n > 0);
    });
  }

  function _initCartBtn() {
    _updateBadges();

    document.querySelectorAll('.cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.location.pathname.includes('giohang')) return;
        if (typeof CartDrawer !== 'undefined' && CartDrawer.open) {
          CartDrawer.open();
        } else {
          window.location.href = 'giohang.jsp';
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initCartBtn);
  } else {
    _initCartBtn();
  }

  return { getItems, addItem, updateQty, removeItem, clearCart, totalQty, totalPrice, makeKey, imgHtml };
})();