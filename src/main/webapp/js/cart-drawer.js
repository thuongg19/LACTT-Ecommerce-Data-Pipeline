/* =============================================
   LACTT — cart-drawer.js  (v2 — Fixed & Optimized)
   Mini cart drawer trượt từ bên phải.
   Nhúng vào: index.jsp, chitiet.jsp
   (KHÔNG nhúng vào giohang.jsp)

   Yêu cầu: cart.js phải được nhúng trước file này.
   ============================================= */

const CartDrawer = (function () {
  let drawerEl  = null;
  let overlayEl = null;
  let isOpen    = false;

  /* ─────────────────────────────────────────
     FORMAT TIỀN
  ───────────────────────────────────────── */
  function fmt(n) {
    return Number(n).toLocaleString('vi-VN') + '₫';
  }

  /* ─────────────────────────────────────────
     TẠO DOM DRAWER (chỉ gọi 1 lần)
  ───────────────────────────────────────── */
  function createDrawer() {
    /* Xóa cũ nếu có (safety) */
    document.getElementById('cartDrawer')?.remove();
    document.getElementById('cartOverlay')?.remove();

    /* Overlay */
    overlayEl = document.createElement('div');
    overlayEl.id        = 'cartOverlay';
    overlayEl.className = 'cart-overlay';
    overlayEl.setAttribute('aria-hidden', 'true');
    overlayEl.addEventListener('click', close);
    document.body.appendChild(overlayEl);

    /* Drawer */
    drawerEl = document.createElement('div');
    drawerEl.id            = 'cartDrawer';
    drawerEl.className     = 'cart-drawer';
    drawerEl.setAttribute('role', 'dialog');
    drawerEl.setAttribute('aria-modal', 'true');
    drawerEl.setAttribute('aria-label', 'Giỏ hàng');
    drawerEl.innerHTML = `
      <div class="cd-header">
        <h2 class="cd-title">Giỏ Hàng</h2>
        <span class="cd-count-label" id="cdCountLabel">0 sản phẩm</span>
        <button class="cd-close" id="cdClose" aria-label="Đóng giỏ hàng">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="cd-body" id="cdBody"></div>

      <div class="cd-footer" id="cdFooter" style="display:none">
        <div class="cd-subtotal-row">
          <span>Tạm tính</span>
          <span class="cd-subtotal" id="cdSubtotal">0₫</span>
        </div>
        <p class="cd-ship-note" id="cdShipNote"></p>
        <a href="giohang.jsp" class="cd-btn-cart" id="cdBtnCart">Xem giỏ hàng</a>
        <button class="cd-btn-buy" id="cdBtnBuy">Mua ngay →</button>
      </div>
    `;
    document.body.appendChild(drawerEl);

    /* Events */
    document.getElementById('cdClose').addEventListener('click', close);

    document.getElementById('cdBtnBuy').addEventListener('click', () => {
      if (Cart.totalQty() === 0) return;
      close();
      setTimeout(() => { window.location.href = 'giohang.jsp'; }, 250);
    });

    /* Đóng bằng phím Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  /* ─────────────────────────────────────────
     RENDER NỘI DUNG DRAWER
  ───────────────────────────────────────── */
  function render() {
    const items      = Cart.getItems();
    const bodyEl     = document.getElementById('cdBody');
    const footerEl   = document.getElementById('cdFooter');
    const countLabel = document.getElementById('cdCountLabel');
    const totalItems = Cart.totalQty();

    countLabel.textContent = totalItems > 0
      ? `${totalItems} sản phẩm`
      : '0 sản phẩm';

    /* ── Giỏ trống ── */
    if (items.length === 0) {
      bodyEl.innerHTML = `
        <div class="cd-empty">
          <div class="cd-empty-icon">🛍️</div>
          <p>Giỏ hàng trống</p>
          <p class="cd-empty-sub">Thêm sản phẩm yêu thích vào giỏ nhé!</p>
        </div>`;
      footerEl.style.display = 'none';
      return;
    }

    /* ── Danh sách sản phẩm ── */
    footerEl.style.display = '';
    bodyEl.innerHTML = items.map(item => `
      <div class="cd-item" data-key="${escHtml(item.key)}">
        <div class="cd-item-img">${item.hinhAnh && item.hinhAnh.startsWith('http')
          ? '<img src="'+item.hinhAnh+'" alt="" class="cd-item-thumb" loading="lazy">'
          : '<span class="item-emoji">'+(item.emoji||'🛍️')+'</span>'
        }</div>
        <div class="cd-item-info">
          <p class="cd-item-brand">${escHtml(item.brand)}</p>
          <p class="cd-item-name">
            <a href="chitiet.jsp?id=${item.id}" style="color:inherit;text-decoration:none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${escHtml(item.name)}${item.variant ? ' — ' + escHtml(item.variant) : ''}</a>
          </p>
          <p class="cd-item-price">${fmt(item.price)}</p>
          <div class="cd-item-qty-row">
            <button class="cd-qty-btn"
                    data-action="minus"
                    data-key="${escHtml(item.key)}"
                    aria-label="Giảm số lượng">−</button>
            <span class="cd-qty-val">${item.qty}</span>
            <button class="cd-qty-btn"
                    data-action="plus"
                    data-key="${escHtml(item.key)}"
                    aria-label="Tăng số lượng">+</button>
            <button class="cd-remove"
                    data-key="${escHtml(item.key)}"
                    title="Xóa sản phẩm"
                    aria-label="Xóa ${escHtml(item.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    /* ── Tổng tiền & ghi chú ship ── */
    const total  = Cart.totalPrice();
    const noteEl = document.getElementById('cdShipNote');
    document.getElementById('cdSubtotal').textContent = fmt(total);

    if (total < 499000) {
      const need = 499000 - total;
      noteEl.textContent = `Mua thêm ${fmt(need)} để được miễn phí vận chuyển 🚚`;
      noteEl.className   = 'cd-ship-note cd-ship-warn';
    } else {
      noteEl.textContent = '✓ Bạn đã được miễn phí vận chuyển!';
      noteEl.className   = 'cd-ship-note cd-ship-ok';
    }

    /* ── Gắn sự kiện cho nút qty & remove ── */
    bodyEl.querySelectorAll('.cd-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key  = btn.dataset.key;
        const item = Cart.getItems().find(i => i.key === key);
        if (!item) return;
        const delta = btn.dataset.action === 'plus' ? 1 : -1;
        Cart.updateQty(key, item.qty + delta);
        render();
      });
    });

    bodyEl.querySelectorAll('.cd-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemEl = btn.closest('.cd-item');
        if (itemEl) {
          itemEl.style.animation = 'cdSlideOut 0.25s ease forwards';
          setTimeout(() => {
            Cart.removeItem(btn.dataset.key);
            render();
          }, 230);
        } else {
          Cart.removeItem(btn.dataset.key);
          render();
        }
      });
    });
  }

  /* ─────────────────────────────────────────
     OPEN / CLOSE
  ───────────────────────────────────────── */

  function open() {
    if (!drawerEl) createDrawer();

    render();

    /* Dùng rAF để CSS transition chạy đúng */
    requestAnimationFrame(() => {
      drawerEl.classList.add('open');
      overlayEl.classList.add('open');
    });

    document.body.style.overflow = 'hidden';
    isOpen = true;

    /* Focus vào drawer để screen-reader nhận biết */
    drawerEl.focus?.();
  }

  function close() {
    if (!drawerEl) return;
    drawerEl.classList.remove('open');
    overlayEl.classList.remove('open');
    document.body.style.overflow = '';
    isOpen = false;
  }

  /* ─────────────────────────────────────────
     TIỆN ÍCH
  ───────────────────────────────────────── */

  /** Animation bounce cho nút giỏ hàng khi thêm sp */
  function animateCartBtn() {
    document.querySelectorAll('.cart-btn').forEach(btn => {
      btn.classList.add('cart-bounce');
      setTimeout(() => btn.classList.remove('cart-bounce'), 600);
    });
  }

  /** Escape HTML để tránh XSS khi render dữ liệu user */
  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─────────────────────────────────────────
     EXPORTS
  ───────────────────────────────────────── */
  return { open, close, render, animateCartBtn };
})();