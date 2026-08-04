/* =============================================
   LACTT — chitiet.js (v3 — MySQL + Ảnh + Variants)
   ============================================= */

/* ── HELPERS ── */
function getProductId() {
  return parseInt(new URLSearchParams(window.location.search).get('id')) || 0;
}

function formatPrice(n) {
  return Number(n).toLocaleString('vi-VN') + '₫';
}

function starsHtml(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + (full < 5 ? '☆'.repeat(5 - full) : '');
}

function calcDiscount(gia, giaGoc) {
  if (!giaGoc || Number(giaGoc) <= 0 || Number(giaGoc) <= Number(gia)) return null;
  return '-' + Math.round((1 - Number(gia) / Number(giaGoc)) * 100) + '%';
}

function mapDanhMuc(id) {
  const m = { 1:'Chăm Sóc Da', 2:'Trang Điểm', 3:'Nước Hoa', 4:'Chăm Sóc Tóc', 5:'Chống Nắng', 6:'Chăm Sóc Cơ Thể' };
  return m[id] || 'Sản Phẩm';
}

function showToast(msg) {
  let t = document.getElementById('toastEl');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toastEl'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── FETCH TỪ MYSQL ── */
const _CTX = (typeof window.APP_CONTEXT !== 'undefined' ? window.APP_CONTEXT : '');

async function fetchProduct(id) {
  try {
    const res  = await fetch(`${_CTX}/SanPhamServlet?action=detail&id=${id}&_=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data) return data.data;
  } catch (e) { console.error('Lỗi fetch sản phẩm:', e); }
  return null;
}

async function fetchVariants(id) {
  try {
    const res  = await fetch(`${_CTX}/SanPhamServlet?action=variants&id=${id}`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
  } catch (e) { console.error('Lỗi fetch variants:', e); }
  return [];
}

async function fetchLienQuan(maDanhMuc, excludeId) {
  try {
    const res  = await fetch(`${_CTX}/SanPhamServlet?action=lienQuan&maDanhMuc=${maDanhMuc}&excludeId=${excludeId}&limit=4`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
  } catch (e) { console.error('Lỗi fetch liên quan:', e); }
  return [];
}

/* ── RENDER CHI TIẾT SẢN PHẨM ── */
function renderProduct(sp) {
  if (!sp) {
    document.getElementById('pdName').textContent = 'Không tìm thấy sản phẩm';
    return;
  }

  document.title = sp.tenSp + ' — LACTT';

  /* Breadcrumb */
  document.getElementById('bcCategory').textContent = mapDanhMuc(sp.maDanhMuc);
  document.getElementById('bcName').textContent     = sp.tenSp;

  /* ── ẢNH SẢN PHẨM THẬT TỪ CLOUDINARY ── */
  const mainImgEl = document.getElementById('pdMainImg');
  const emojiEl   = document.getElementById('pdEmoji');

  if (sp.hinhAnh && sp.hinhAnh.trim() !== '') {
    /* Có ảnh thật → dùng <img> thay emoji */
    emojiEl.style.display = 'none';
    let imgEl = document.getElementById('pdProductImg');
    if (!imgEl) {
      imgEl = document.createElement('img');
      imgEl.id        = 'pdProductImg';
      imgEl.className = 'pd-product-img';
      imgEl.alt       = sp.tenSp;
      mainImgEl.insertBefore(imgEl, mainImgEl.firstChild);
    }
    imgEl.src = sp.hinhAnh;
    /* Thumbnail đầu tiên cũng dùng ảnh */
    const thumb0 = document.getElementById('thumb0');
    if (thumb0) {
      thumb0.style.backgroundImage = `url('${sp.hinhAnh}')`;
      thumb0.style.backgroundSize  = 'cover';
      thumb0.style.backgroundPosition = 'center';
      thumb0.textContent = '';
    }
  } else {
    /* Không có ảnh → fallback emoji */
    emojiEl.style.display = '';
    emojiEl.textContent   = '🛍️';
    const thumb0 = document.getElementById('thumb0');
    if (thumb0) thumb0.textContent = '🛍️';
  }

  /* Badges */
  const discount = calcDiscount(sp.gia, sp.giaGoc);
  let badgesHtml = '';
  if (discount)       badgesHtml += `<span class="badge badge-sale">${discount}</span>`;
  if (sp.isNew === 1) badgesHtml += `<span class="badge badge-new">Mới</span>`;
  document.getElementById('pdBadges').innerHTML = badgesHtml;

  /* Thông tin chính */
  document.getElementById('pdBrand').textContent       = sp.thuongHieu;
  document.getElementById('pdName').textContent        = sp.tenSp;
  document.getElementById('pdStars').textContent       = starsHtml(sp.diemDanhGia);
  document.getElementById('pdRatingCount').textContent = `(${Number(sp.soDanhGia).toLocaleString('vi-VN')} đánh giá)`;
  document.getElementById('pdPrice').textContent       = formatPrice(sp.gia);
  document.getElementById('pdDescription').textContent = sp.moTa || '';
  document.getElementById('specBrand').textContent     = sp.thuongHieu;

  /* Đã bán */
  const soldEl = document.querySelector('.pd-sold strong');
  if (soldEl) soldEl.textContent = sp.soLuongBan > 999
    ? (sp.soLuongBan / 1000).toFixed(1) + 'k' : sp.soLuongBan;

  /* Giá gốc & % giảm */
  const oldEl  = document.getElementById('pdPriceOld');
  const discEl = document.getElementById('pdDiscount');
  if (discount) {
    oldEl.textContent    = formatPrice(sp.giaGoc);
    oldEl.style.display  = '';
    discEl.textContent   = discount;
    discEl.style.display = '';
  } else {
    oldEl.style.display  = 'none';
    discEl.style.display = 'none';
  }

  /* Tồn kho */
  const stockEl = document.querySelector('.pd-qty-stock');
  if (stockEl && sp.soLuongTon !== undefined) {
    if (sp.soLuongTon === 0) {
      stockEl.innerHTML = '<strong style="color:#c4626e">Hết hàng</strong>';
      document.getElementById('btnAddCart').disabled = true;
      document.getElementById('btnBuyNow').disabled  = true;
    } else {
      stockEl.innerHTML = `Còn <strong>${sp.soLuongTon}</strong> sản phẩm`;
    }
  }

  /* Đồng bộ ô Trạng thái trong bảng thông tin */
  const spanTrangThai = document.getElementById('specTrangThai');
  if (spanTrangThai) {
    if (sp.soLuongTon <= 0) {
      spanTrangThai.textContent = 'Hết hàng';
      spanTrangThai.style.color = '#e53e3e';
    } else {
      spanTrangThai.textContent = 'Còn hàng';
      spanTrangThai.style.color = '#3a9e7e';
    }
  }

  /* KHÔNG dùng max trên input nữa — kiểm soát bằng JS */
  const qtyInput = document.getElementById('qtyInput');
  if (qtyInput) {
    qtyInput.removeAttribute('max');
    qtyInput.dataset.tonKho = sp.soLuongTon || 0;
  }
  

  /* Thành phần → render vào tab */
  if (sp.thanhPhan) {
    const tagsEl = document.querySelector('.ingr-tags');
    if (tagsEl) {
      const tags = sp.thanhPhan.split(',').map(s => s.trim()).filter(Boolean);
      tagsEl.innerHTML = tags.map((tag, i) =>
        `<span class="ingr-tag${i < 3 ? ' key' : ''}">${tag}</span>`
      ).join('');
    }
  }

  /* Hướng dẫn sử dụng → render vào tab */
  if (sp.huongDan && sp.huongDan.trim()) {
    const howEl = document.querySelector('#tab-how .how-steps');
    if (howEl) {
      const steps = sp.huongDan.split('\n').map(s => s.trim()).filter(Boolean);
      if (steps.length > 0) {
        howEl.innerHTML = steps.map((step, i) => `
          <div class="how-step">
            <div class="step-num">${String(i + 1).padStart(2, '0')}</div>
            <div class="step-info"><p>${step}</p></div>
          </div>
        `).join('');
      }
    }
  }
}

/* ── RENDER VARIANTS (30ml / 50ml / 100ml) ── */
function renderVariants(variants, sp) {
  const group     = document.getElementById('pdVariantGroup');
  const container = document.getElementById('pdVolumes');
  if (!group || !container) return;

  /* Không có variant → ẩn section */
  if (!variants || variants.length === 0) {
    group.style.display = 'none';
    return;
  }

  group.style.display = '';
  container.innerHTML = variants.map((v, i) =>
    `<button class="pd-opt ${i === 0 ? 'active' : ''}"
             data-variant-id="${v.id}"
             data-price="${v.gia}"
             data-gia-goc="${v.giaGoc}"
             data-label="${v.tenVariant}"
             data-so-luong="${v.soLuong}">
       ${v.tenVariant}
     </button>`
  ).join('');

  /* Giá variant đầu tiên làm mặc định */
  updatePriceFromVariant(variants[0]);

  container.querySelectorAll('.pd-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.pd-opt').forEach(o => o.classList.remove('active'));
      btn.classList.add('active');
      updatePriceFromVariant({
        gia:      btn.dataset.price,
        giaGoc:   btn.dataset.giagoc || btn.dataset.giaGoc,
        soLuong:  btn.dataset.soLuong,
      });
    });
  });
}

function updatePriceFromVariant(v) {
  document.getElementById('pdPrice').textContent = formatPrice(v.gia);
  const oldEl  = document.getElementById('pdPriceOld');
  const discEl = document.getElementById('pdDiscount');
  const disc   = calcDiscount(v.gia, v.giaGoc);
  if (disc) {
    oldEl.textContent    = formatPrice(v.giaGoc);
    oldEl.style.display  = '';
    discEl.textContent   = disc;
    discEl.style.display = '';
  } else {
    oldEl.style.display  = 'none';
    discEl.style.display = 'none';
  }

  /* 🔴 BỔ SUNG LOGIC: Cập nhật tồn kho và Trạng thái Nút bấm theo Variant */
  const stockEl = document.querySelector('.pd-qty-stock');
  const btnAdd  = document.getElementById('btnAddCart');
  const btnBuy  = document.getElementById('btnBuyNow');

  if (stockEl) {
    const soLuong = parseInt(v.soLuong) || 0;
    if (soLuong > 0) {
      stockEl.innerHTML = `Còn <strong>${soLuong}</strong> sản phẩm`;
      // Mở khóa nút nếu còn hàng
      if (btnAdd) btnAdd.disabled = false;
      if (btnBuy) btnBuy.disabled = false;
    } else {
      stockEl.innerHTML = '<strong style="color:#c4626e">Hết hàng</strong>';
      // Khóa nút nếu hết hàng
      if (btnAdd) btnAdd.disabled = true;
      if (btnBuy) btnBuy.disabled = true;
    }
    const qtyInput = document.getElementById('qtyInput');
    if (qtyInput) {
      qtyInput.removeAttribute('max');
      qtyInput.dataset.tonKho = soLuong;
      qtyInput.value = 1; // reset về 1 khi đổi variant
    }

    /* Đồng bộ ô Trạng thái trong bảng thông tin */
    const spanTrangThai = document.getElementById('specTrangThai');
    if (spanTrangThai) {
      if (soLuong <= 0) {
        spanTrangThai.textContent = 'Hết hàng';
        spanTrangThai.style.color = '#e53e3e';
      } else {
        spanTrangThai.textContent = 'Còn hàng';
        spanTrangThai.style.color = '#3a9e7e';
      }
    }
  }

  /* Flash highlight giá */
  const box = document.querySelector('.pd-price-box');
  if (box) {
    box.style.transition = 'none';
    box.style.background = 'rgba(217,154,160,0.12)';
    requestAnimationFrame(() => {
      box.style.transition = 'background 0.5s ease';
      box.style.background = '';
    });
  }
}

/* ── RENDER SẢN PHẨM LIÊN QUAN ── */
function renderLienQuan(items) {
  const grid = document.getElementById('relatedGrid');
  if (!grid || !items.length) return;

  grid.innerHTML = items.map(sp => {
    const disc = calcDiscount(sp.gia, sp.giaGoc);
    const img  = sp.hinhAnh && sp.hinhAnh.trim() !== ''
      ? `<img src="${sp.hinhAnh}" alt="${sp.tenSp}" class="product-img-real" loading="lazy">`
      : `<div class="product-emoji">🛍️</div>`;
    return `
      <div class="product-card" onclick="window.location.href='chitiet.jsp?id=${sp.id}'">
        <div class="product-badges">
          ${disc ? `<span class="badge badge-sale">${disc}</span>` : ''}
          ${sp.isNew === 1 ? `<span class="badge badge-new">Mới</span>` : ''}
        </div>
        <button class="wishlist-btn" onclick="event.stopPropagation()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <div class="product-img">${img}</div>
        <div class="product-info">
          <p class="product-brand">${sp.thuongHieu}</p>
          <h3 class="product-name">${sp.tenSp}</h3>
          <div class="product-rating">
            <span class="stars">${starsHtml(sp.diemDanhGia)}</span>
            <span class="rating-count">(${Number(sp.soDanhGia).toLocaleString('vi-VN')})</span>
          </div>
          <div class="product-price">
            <span class="price-current">${formatPrice(sp.gia)}</span>
            ${disc ? `<span class="price-old">${formatPrice(sp.giaGoc)}</span>` : ''}
          </div>
        </div>
        <button class="btn-add-cart"
          onclick="event.stopPropagation(); addToCartRelated(${sp.id},'${sp.tenSp.replace(/'/g,"\\'")}','${sp.thuongHieu}',${sp.gia},'${sp.hinhAnh || ''}')">
          Thêm vào giỏ
        </button>
      </div>`;
  }).join('');
}

function addToCartRelated(id, name, brand, price, hinhAnh) {
  Cart.addItem({ id, name, brand, hinhAnh: hinhAnh || '', emoji: '🛍️', price: Number(price) }, 1);
  showToast('✓ Đã thêm vào giỏ hàng!');
  if (typeof CartDrawer !== 'undefined') CartDrawer.animateCartBtn();
}

/* ── LẤY GIÁ & VARIANT ĐANG CHỌN ── */
function getActiveVariantInfo(sp) {
  const activeOpt = document.querySelector('.pd-opt.active');
  return {
    variantLabel: activeOpt ? activeOpt.dataset.label   : '',
    price:        activeOpt ? Number(activeOpt.dataset.price) : Number(sp.gia),
  soLuongTon:   activeOpt ? (parseInt(activeOpt.dataset.soLuong) || 0) : (sp.soLuongTon || 0),
  };
}

/* ═══════════════════════════════════════
   MAIN INIT
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

  const id = getProductId();
  let currentProduct  = null;

  if (id) {
    document.getElementById('pdName').textContent = 'Đang tải...';

    /* Fetch song song: detail + variants */
    const [sp, variants] = await Promise.all([
      fetchProduct(id),
      fetchVariants(id),
    ]);

    currentProduct = sp;
    renderProduct(sp);
    if (sp) {
      renderVariants(variants, sp);
      /* Load liên quan sau để không block render chính */
      fetchLienQuan(sp.maDanhMuc, sp.id).then(renderLienQuan);
    }
  } else {
    document.getElementById('pdName').textContent = 'Không tìm thấy sản phẩm';
  }

  /* ── Header scroll ── */
  const header = document.getElementById('header');
  window.addEventListener('scroll',
    () => header.classList.toggle('scrolled', window.scrollY > 60), { passive: true });

  /* ── Back to top ── */
  const backTop = document.getElementById('backTop');
  window.addEventListener('scroll',
    () => backTop.classList.toggle('visible', window.scrollY > 400), { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── Tabs ── */
  document.querySelectorAll('.pd-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pd-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.pd-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  /* ── Thumbnails ── */
  document.querySelectorAll('.pd-thumb').forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (i === 0 && currentProduct?.hinhAnh) {
        const imgEl = document.getElementById('pdProductImg');
        if (imgEl) imgEl.src = currentProduct.hinhAnh;
      }
    });
  });

  /* ── Số lượng ── */
  const qtyInput = document.getElementById('qtyInput');
  document.getElementById('qtyMinus').addEventListener('click', () => {
    const v = parseInt(qtyInput.value) || 1;
    if (v > 1) qtyInput.value = v - 1;
  });
  document.getElementById('qtyPlus').addEventListener('click', () => {
    const v       = parseInt(qtyInput.value) || 1;
    const tonKho  = parseInt(qtyInput.dataset.tonKho) || 0;
    if (tonKho > 0 && v >= tonKho) {
      showToast(`⚠️ Chỉ còn ${tonKho} sản phẩm trong kho!`);
      return;
    }
    qtyInput.value = v + 1;
  });
  qtyInput.addEventListener('change', () => {
    const tonKho = parseInt(qtyInput.dataset.tonKho) || 0;
    let v = parseInt(qtyInput.value) || 1;
    if (v < 1) v = 1;
    if (tonKho > 0 && v > tonKho) {
      v = tonKho;
      showToast(`⚠️ Chỉ còn ${tonKho} sản phẩm trong kho!`);
    }
    qtyInput.value = v;
  });

  /* ── THÊM VÀO GIỎ ── */
  document.getElementById('btnAddCart').addEventListener('click', () => {
    if (!currentProduct) return;
    const qty = parseInt(qtyInput.value) || 1;
    // ✅ FIX LỖI 3: Destructure thêm soLuongTon từ getActiveVariantInfo
    const { variantLabel, price, soLuongTon } = getActiveVariantInfo(currentProduct);

    Cart.addItem({
      id:         currentProduct.id,
      name:       currentProduct.tenSp,
      brand:      currentProduct.thuongHieu,
      hinhAnh:    currentProduct.hinhAnh || '',
      emoji:      '🛍️',
      variant:    variantLabel,
      price,
      soLuongTon, // ✅ Tồn kho đúng của variant
    }, qty);

    if (typeof CartDrawer !== 'undefined') {
      CartDrawer.open();
      CartDrawer.animateCartBtn();
    }

    const btn  = document.getElementById('btnAddCart');
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Đã thêm!`;
    btn.style.background = '#3a9e7e';
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
    showToast(`✓ Đã thêm ${qty} sản phẩm vào giỏ hàng!`);
  });

  /* ── MUA NGAY ── */
  document.getElementById('btnBuyNow').addEventListener('click', () => {
    if (!currentProduct) return;
    const qty = parseInt(qtyInput.value) || 1;
     const { variantLabel, price, soLuongTon } = getActiveVariantInfo(currentProduct);

    Cart.addItem({
      id:      currentProduct.id,
      name:    currentProduct.tenSp,
      brand:   currentProduct.thuongHieu,
      hinhAnh: currentProduct.hinhAnh || '',
      emoji:   '🛍️',
      variant: variantLabel,
      price,
      soLuongTon, 
    }, qty);

    showToast('Đang chuyển đến giỏ hàng...');
    setTimeout(() => window.location.href = 'giohang.jsp', 800);
  });

  /* ── Wishlist ── */
  document.getElementById('pdWishlist').addEventListener('click', function () {
    this.classList.toggle('active');
    this.querySelector('svg').setAttribute('fill', this.classList.contains('active') ? 'currentColor' : 'none');
    showToast(this.classList.contains('active') ? '❤ Đã lưu vào yêu thích!' : 'Đã bỏ khỏi yêu thích');
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    btn.classList.toggle('active');
    btn.querySelector('svg').setAttribute('fill', btn.classList.contains('active') ? 'currentColor' : 'none');
  });

  /* Khi người dùng quay lại trang (từ giỏ hàng, thanh toán...) 
     → fetch lại tồn kho mới nhất từ DB để hiển thị đúng */
  window.addEventListener('pageshow', async (e) => {
    if (!id || !currentProduct) return;
    const sp = await fetchProduct(id);
    if (!sp) return;
    currentProduct = sp;
    const stockEl = document.querySelector('.pd-qty-stock');
    if (stockEl) {
      if (sp.soLuongTon <= 0) {
        stockEl.innerHTML = '<strong style="color:#c4626e">Hết hàng</strong>';
        const btnAdd = document.getElementById('btnAddCart');
        const btnBuy = document.getElementById('btnBuyNow');
        if (btnAdd) btnAdd.disabled = true;
        if (btnBuy) btnBuy.disabled = true;
      } else {
        stockEl.innerHTML = `Còn <strong>${sp.soLuongTon}</strong> sản phẩm`;
        const btnAdd = document.getElementById('btnAddCart');
        const btnBuy = document.getElementById('btnBuyNow');
        if (btnAdd) btnAdd.disabled = false;
        if (btnBuy) btnBuy.disabled = false;
      }
    }
  });
});