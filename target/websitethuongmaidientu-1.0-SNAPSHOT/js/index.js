/* =============================================
   LACTT — index.js (v4 — HOÀN CHỈNH: Filter + Search + API)
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ── HEADER SCROLL ── */
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 60), { passive: true });

  /* ── SEARCH INLINE ── */
  const searchInput = document.getElementById('searchInput');
  document.getElementById('searchBtn').addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (q) { searchQuery = q.trim(); useAPI = true; applyFilters(); document.getElementById('shop').scrollIntoView({ behavior: 'smooth' }); }
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q) { searchQuery = q.trim(); useAPI = true; applyFilters(); document.getElementById('shop').scrollIntoView({ behavior: 'smooth' }); }
    }
  });

  /* ══════════════════════════════════════════
     MEGA MENU
     ══════════════════════════════════════════ */
  const navDanhMuc = document.getElementById('navDanhMuc');
  const megaMenu   = document.getElementById('megaMenu');

  if (navDanhMuc && megaMenu) {
    let megaTimer;

    function openMega() {
      clearTimeout(megaTimer);
      megaMenu.style.display = 'grid';
      megaMenu.offsetHeight;
      megaMenu.classList.add('open');
    }

    function closeMega() {
      megaTimer = setTimeout(() => {
        megaMenu.classList.remove('open');
        megaMenu.style.display = '';
      }, 200);
    }

    navDanhMuc.addEventListener('mouseenter', openMega);
    navDanhMuc.addEventListener('mouseleave', closeMega);
    megaMenu.addEventListener('mouseenter', openMega);
    megaMenu.addEventListener('mouseleave', closeMega);

    const navCatBtn = navDanhMuc.querySelector('.nav-cat-btn');
    if (navCatBtn) {
      navCatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = megaMenu.classList.contains('open');
        if (isOpen) {
          megaMenu.classList.remove('open');
          megaMenu.style.display = '';
        } else {
          openMega();
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (!navDanhMuc.contains(e.target) && !megaMenu.contains(e.target)) {
        megaMenu.classList.remove('open');
        megaMenu.style.display = '';
      }
    });

    document.querySelectorAll('.mega-item[data-filter-cat]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const cat = item.dataset.filterCat;
        applyFilterByCat(cat);
        megaMenu.classList.remove('open');
        megaMenu.style.display = '';
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      });
    });

    document.querySelectorAll('.mega-brand-tag[data-filter-brand]').forEach(tag => {
      tag.addEventListener('click', e => {
        e.preventDefault();
        const brand = tag.dataset.filterBrand;
        resetAllFilters(false);
        const brandEl = document.querySelector(`.brand-filter[data-value="${brand}"] input`);
        if (brandEl) brandEl.checked = true;
        syncCheckboxes();
        applyFilters();
        megaMenu.classList.remove('open');
        megaMenu.style.display = '';
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ── Nav: Deal Hot ── */
  document.getElementById('navSale')?.addEventListener('click', e => {
    e.preventDefault();
    resetAllFilters(false);
    const saleEl = document.querySelector('.promo-filter[data-value="sale"] input');
    if (saleEl) saleEl.checked = true;
    syncCheckboxes();
    applyFilters();
    document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  });

  /* ── Nav: Sản phẩm mới ── */
  document.getElementById('navNew')?.addEventListener('click', e => {
    e.preventDefault();
    resetAllFilters(false);
    const newEl = document.querySelector('.promo-filter[data-value="new"] input');
    if (newEl) newEl.checked = true;
    syncCheckboxes();
    applyFilters();
    document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
  });

  /* ────────────────────────────────────────────
     CATEGORIES SECTION
  ──────────────────────────────────────────── */
  document.querySelectorAll('.cat-card[data-cat]').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const cat = card.dataset.cat;

      document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active-cat'));
      card.classList.add('active-cat');

      applyFilterByCat(cat);

      const shopEl = document.getElementById('shop');
      const offset = 120;
      const top = shopEl.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  function applyFilterByCat(cat) {
    resetAllFilters(false);
    document.querySelector('.cat-filter[data-value="all"] input').checked = false;
    const catEl = document.querySelector(`.cat-filter[data-value="${cat}"] input`);
    if (catEl) catEl.checked = true;
    else document.querySelector('.cat-filter[data-value="all"] input').checked = true;
    syncCheckboxes();
    applyFilters();
  }

  /* ────────────────────────────────────────────
     FEATURED TABS
  ──────────────────────────────────────────── */
  const featuredGrid = document.getElementById('featuredGrid');
  if (featuredGrid) {
    document.querySelectorAll('.tab[data-tab-cat]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filterCat = tab.dataset.tabCat;

        featuredGrid.querySelectorAll('.product-card').forEach(card => {
          const cardCat = card.dataset.featCat || '';
          if (filterCat === 'all' || cardCat === filterCat) {
            card.classList.remove('tab-hidden');
          } else {
            card.classList.add('tab-hidden');
          }
        });
      });
    });
  }

  /* ── BACK TO TOP ── */
  const backTop = document.getElementById('backTop');
  window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 400), { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── BRANDS MARQUEE ── */
  const viewport = document.getElementById('brandsViewport');
  const track    = document.getElementById('brandsTrack');
  if (viewport && track) {
    const clone = track.cloneNode(true);
    viewport.appendChild(clone);
    let pos = 0, paused = false;
    const speed = 0.7;
    function marqueeStep() {
      if (!paused) {
        const w = track.offsetWidth;
        if (w > 0) {
          pos -= speed;
          if (pos <= -w) pos = 0;
          track.style.transform = `translateX(${pos}px)`;
          clone.style.transform = `translateX(${pos + w}px)`;
        }
      }
      requestAnimationFrame(marqueeStep);
    }
    document.fonts.ready.then(() => requestAnimationFrame(marqueeStep));
    viewport.addEventListener('mouseenter', () => paused = true);
    viewport.addEventListener('mouseleave', () => paused = false);

    function handleBrandClick(e) {
      const span = e.target.closest('span.brand-clickable');
      if (!span) return;
      const brandVal = span.dataset.brand;
      if (!brandVal) return;
      resetAllFilters(true);
      const brandCheckbox = document.querySelector(`.brand-filter[data-value="${brandVal}"] input`);
      if (brandCheckbox) brandCheckbox.checked = true;
      syncCheckboxes();
      applyFilters();
      document.getElementById('shop').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    track.addEventListener('click', handleBrandClick);
    clone.addEventListener('click', handleBrandClick);
  }

  /* ── WISHLIST ── */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    const active = btn.classList.toggle('active');
    btn.querySelector('svg').setAttribute('fill', active ? 'currentColor' : 'none');
  });

  /* ════════════════════════════════════════════
     NÚT "THÊM VÀO GIỎ" → CHUYỂN SANG TRANG CHI TIẾT
     ════════════════════════════════════════════ */
  document.addEventListener('click', function(e) {
    var addBtn = e.target.closest('.btn-add-cart, .fs-buy-btn');
    if (!addBtn) return;
    e.stopPropagation();

    var fsCard = addBtn.closest('.fs-card');
    if (fsCard && fsCard.dataset.productId) {
      window.location.href = 'chitiet.jsp?id=' + fsCard.dataset.productId;
      return;
    }

    var card = addBtn.closest('.product-card');
    if (card && card.dataset.productId) {
      window.location.href = 'chitiet.jsp?id=' + card.dataset.productId;
    }
  });

  /* ── FILTER ACCORDION ── */
  document.querySelectorAll('.filter-group-title').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = document.getElementById(btn.dataset.target);
      if (!body) return;
      const closing = !body.classList.contains('closed');
      body.classList.toggle('closed', closing);
      btn.classList.toggle('collapsed', closing);
    });
  });

  /* ── BRAND SEARCH ── */
  document.getElementById('brandSearch').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#brandList .filter-check').forEach(el => {
      el.style.display = el.querySelector('.label').textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  /* ── CHECKBOX VISUAL SYNC ── */
  function syncCheckboxes() {
    document.querySelectorAll('.filter-check').forEach(label => {
      const inp = label.querySelector('input');
      const cb  = label.querySelector('.cb');
      if (!inp || !cb) return;
      const update = () => {
        cb.style.background   = inp.checked ? 'var(--gold)' : '';
        cb.style.borderColor  = inp.checked ? 'var(--gold)' : '';
        cb.textContent        = inp.checked ? (inp.type === 'radio' ? '' : '✓') : '';
        if (inp.type === 'radio' && inp.checked) {
          cb.style.boxShadow = 'inset 0 0 0 3px #fff, inset 0 0 0 5px var(--gold)';
        } else if (inp.type === 'radio') {
          cb.style.boxShadow = '';
        }
      };
      if (!inp._syncBound) {
        inp.addEventListener('change', update);
        inp._syncBound = true;
      }
      update();
    });
  }
  syncCheckboxes();

  /* ── PRICE SLIDER ── */
  const slider   = document.getElementById('rangeSlider');
  const minInput = document.getElementById('priceMin');
  const maxInput = document.getElementById('priceMax');

  function updateSlider() {
    const pct = (slider.value / slider.max) * 100;
    slider.style.background = `linear-gradient(to right,var(--gold) 0%,var(--gold) ${pct}%,#e8e2da ${pct}%)`;
    maxInput.value = parseInt(slider.value).toLocaleString('vi-VN');
  }
  slider.addEventListener('input', updateSlider);
  maxInput.addEventListener('input', () => {
    const val = parseInt(maxInput.value.replace(/\D/g,'')) || 0;
    slider.value = Math.min(val, 10000000);
    updateSlider();
  });
  minInput.addEventListener('input', () => updateSlider());
  updateSlider();

  document.querySelectorAll('.price-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-quick-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const max = parseInt(btn.dataset.max);
      const min = parseInt(btn.dataset.min) || 0;
      minInput.value = min;
      slider.value = max;
      maxInput.value = max.toLocaleString('vi-VN');
      updateSlider();
    });
  });

  /* ── VIEW TOGGLE ── */
  const productsGrid = document.getElementById('productsGrid');
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      productsGrid.classList.toggle('list-view', btn.dataset.view === 'list');
    });
  });

  /* ── MOBILE FILTER DRAWER ── */
  const filterSidebar = document.getElementById('filterSidebar');
  const filterOverlay = document.getElementById('filterOverlay');
  document.getElementById('mobileFilterBtn').addEventListener('click', () => {
    filterSidebar.classList.add('open');
    filterOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  const closeDrawer = () => {
    filterSidebar.classList.remove('open');
    filterOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };
  filterOverlay.addEventListener('click', closeDrawer);

  /* ════════════════════════════════════════
     CORE FILTER + SORT + PAGINATION ENGINE
     ════════════════════════════════════════ */
  const ITEMS_PER_PAGE = 12;
  let currentPage   = 1;
  let searchQuery   = '';
  let filteredCards = [];
  let useAPI        = true;

  const allCards       = [...document.querySelectorAll('#productsGrid .product-card')];
  const emptyState     = document.getElementById('emptyState');
  const productCountEl = document.getElementById('productCount');
  const paginationWrap = document.getElementById('paginationWrap');
  const pageNumbers    = document.getElementById('pageNumbers');
  const pagePrev       = document.getElementById('pagePrev');
  const pageNext       = document.getElementById('pageNext');

  function getFilters() {
    const catChecks = [...document.querySelectorAll('.cat-filter input:checked')];
    const cats      = catChecks.map(i => i.closest('.filter-check').dataset.value);
    const allCat    = cats.includes('all') || cats.length === 0;

    const brandChecks = [...document.querySelectorAll('.brand-filter input:checked')];
    const brands      = brandChecks.map(i => i.closest('.filter-check').dataset.value);

    const minP = parseInt(minInput.value.replace(/\D/g,'')) || 0;
    const maxP = parseInt(slider.value) || 10000000;

    const ratingVal = parseInt(document.querySelector('.rating-filter input:checked')?.value || '0');

    const promoChecks = [...document.querySelectorAll('.promo-filter input:checked')];
    const promos      = promoChecks.map(i => i.closest('.filter-check').dataset.value);

    return { cats, allCat, brands, minP, maxP, ratingVal, promos };
  }

  async function applyFilters(isResetPage = true) {
    const filters = getFilters();
    
    if (isResetPage) {
      currentPage = 1;
    }

    if (useAPI) {
      try {
        const data = await fetchProductsFromAPI(filters);
        if (data && data.data) {
          renderProductsFromAPI(data.data);
          updateProductCount(data.total);
          renderPaginationFromAPI(data.totalPages);
        }
        updateActiveTags();
        return;
      } catch (e) {
        console.warn('API lỗi, chuyển sang filter client-side:', e);
        useAPI = false;
      }
    }

    // Fallback: filter client-side
    const { cats, allCat, brands, minP, maxP, ratingVal, promos } = filters;

    filteredCards = allCards.filter(card => {
      const cardCat    = card.dataset.cat;
      const cardBrand  = card.dataset.brand;
      const cardPrice  = parseInt(card.dataset.price);
      const cardRating = parseInt(card.dataset.rating);
      const cardPromo  = card.dataset.promo ? card.dataset.promo.split(',') : [];
      const cardName   = (card.dataset.name || '').toLowerCase();

      const catOk    = allCat || cats.includes(cardCat);
      const brandOk  = brands.length === 0 || brands.includes(cardBrand);
      const priceOk  = cardPrice >= minP && cardPrice <= maxP;
      const ratingOk = cardRating >= ratingVal;
      const promoOk  = promos.length === 0 || promos.some(p => cardPromo.includes(p));
      const searchOk = !searchQuery || cardName.includes(searchQuery) || cardBrand.includes(searchQuery);

      return catOk && brandOk && priceOk && ratingOk && promoOk && searchOk;
    });

    const sortVal = document.getElementById('sortSelect').value;
    filteredCards.sort((a, b) => {
      const pa = parseInt(a.dataset.price), pb = parseInt(b.dataset.price);
      const ra = parseInt(a.dataset.rating), rb = parseInt(b.dataset.rating);
      const na = a.dataset.name || '', nb = b.dataset.name || '';
      if (sortVal === 'price-asc')   return pa - pb;
      if (sortVal === 'price-desc')  return pb - pa;
      if (sortVal === 'rating-desc') return rb - ra;
      if (sortVal === 'name-asc')    return na.localeCompare(nb, 'vi');
      return 0;
    });

    renderPageClientSide();
    updateActiveTags();
  }

  async function fetchProductsFromAPI(filters) {
    // Nếu có searchQuery → chỉ tìm kiếm, bỏ qua filter khác
    if (searchQuery) {
      const params = new URLSearchParams({
        action: 'search',
        keyword: searchQuery
      });
      const res = await fetch('/websitethuongmaidientu/SanPhamServlet?' + params.toString());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    }

    // Xác định danh mục
    const catId = filters.cats.includes('all') || filters.cats.length === 0
      ? 0
      : mapCatToId(filters.cats[0]);

    // Build params
    const params = new URLSearchParams();
    params.set('action', 'list');
    params.set('maDanhMuc', catId);
    params.set('giaMin', filters.minP);
    params.set('giaMax', filters.maxP);
    params.set('sapXep', mapSortValue(document.getElementById('sortSelect').value));
    params.set('page', currentPage);
    params.set('pageSize', ITEMS_PER_PAGE);

    // Gửi NHIỀU thương hiệu cùng lúc
    if (filters.brands.length > 0) {
      filters.brands.forEach(brand => {
        params.append('thuongHieu', brand);
      });
    }

    const res = await fetch('/websitethuongmaidientu/SanPhamServlet?' + params.toString());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  }

  function mapCatToId(cat) {
    const map = { 'skincare': 1, 'makeup': 2, 'perfume': 3, 'hair': 4, 'sunscreen': 5, 'body': 6 };
    return map[cat] || 0;
  }

  function mapSortValue(sort) {
    const map = { 'default': 'moi', 'price-asc': 'gia_tang', 'price-desc': 'gia_giam', 'rating-desc': 'danh_gia', 'name-asc': 'moi' };
    return map[sort] || 'moi';
  }

  function renderProductsFromAPI(products) {
    if (!productsGrid) return;
    productsGrid.innerHTML = products.map(sp => {
      const discountPercent = sp.giaGoc && sp.giaGoc > sp.gia
        ? Math.round((sp.giaGoc - sp.gia) / sp.giaGoc * 100) : 0;

      return `
        <div class="product-card"
             data-cat="${sp.maDanhMuc}"
             data-brand="${(sp.thuongHieu || '').toLowerCase()}"
             data-price="${sp.gia}"
             data-rating="${sp.diemDanhGia || 5}"
             data-promo="${sp.isFeatured ? 'hot' : ''}${sp.isNew ? ',new' : ''}"
             data-name="${escHtml(sp.tenSp)}"
             data-product-id="${sp.id}">

          ${discountPercent > 0 ? `<div class="product-badges"><span class="badge badge-sale">-${discountPercent}%</span></div>` : ''}
          ${sp.isNew === 1 ? '<div class="product-badges"><span class="badge badge-new">Mới</span></div>' : ''}

          <button class="wishlist-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          <div class="product-img">
            <img src="${escHtml(sp.hinhAnh || '')}" alt="${escHtml(sp.tenSp)}"
                 style="width:100%;height:100%;object-fit:cover;"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="product-emoji" style="display:none;">🛍️</div>
          </div>

          <div class="product-info">
            <p class="product-brand">${escHtml(sp.thuongHieu || '')}</p>
            <h3 class="product-name">${escHtml(sp.tenSp)}</h3>
            <div class="product-rating">
              <span class="stars">${'★'.repeat(Math.round(sp.diemDanhGia || 5))}</span>
              <span class="rating-count">(${(sp.soDanhGia || 0) >= 1000 ? ((sp.soDanhGia/1000).toFixed(1) + 'k') : (sp.soDanhGia || 0)})</span>
            </div>
            <div class="product-price">
              <span class="price-current">${Number(sp.gia).toLocaleString('vi-VN')}₫</span>
              ${sp.giaGoc && sp.giaGoc > sp.gia ? `<span class="price-old">${Number(sp.giaGoc).toLocaleString('vi-VN')}₫</span>` : ''}
            </div>
          </div>
          <button class="btn-add-cart">Thêm vào giỏ</button>
        </div>`;
    }).join('');

    bindProductCardClick();
  }

  function renderPaginationFromAPI(totalPages) {
    if (totalPages > 1) {
      paginationWrap.style.display = 'flex';
      renderPagination(totalPages);
    } else {
      paginationWrap.style.display = 'none';
    }
  }

  function updateProductCount(total) {
    productCountEl.textContent = total;
    emptyState.style.display = total === 0 ? 'block' : 'none';
  }

  function renderPageClientSide() {
    const total      = filteredCards.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const start      = (currentPage - 1) * ITEMS_PER_PAGE;
    const end        = start + ITEMS_PER_PAGE;

    allCards.forEach(c => { c.style.display = 'none'; c.style.order = ''; });
    filteredCards.slice(start, end).forEach((c, i) => { c.style.display = ''; c.style.order = i; });

    productCountEl.textContent = total;
    emptyState.style.display   = total === 0 ? 'block' : 'none';

    if (totalPages > 1) {
      paginationWrap.style.display = 'flex';
      renderPagination(totalPages);
    } else {
      paginationWrap.style.display = 'none';
    }
  }

  function renderPagination(totalPages) {
    pageNumbers.innerHTML = '';
    pagePrev.disabled     = currentPage === 1;
    pageNext.disabled     = currentPage === totalPages;

    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 7 && i > 3 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
        if (i === 4 || i === totalPages - 2) {
          const dots = document.createElement('span');
          dots.className   = 'page-dots';
          dots.textContent = '...';
          pageNumbers.appendChild(dots);
        }
        continue;
      }
      const btn = document.createElement('button');
      btn.className   = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      btn.addEventListener('click', () => {
        currentPage = i;
        applyFilters(false);
        window.scrollTo({ top: document.getElementById('shop').offsetTop - 80, behavior: 'smooth' });
      });
      pageNumbers.appendChild(btn);
    }
  }

  pagePrev.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; applyFilters(false); window.scrollTo({ top: document.getElementById('shop').offsetTop - 80, behavior: 'smooth' }); }
  });
  pageNext.addEventListener('click', () => {
    currentPage++;
    applyFilters(false);
    window.scrollTo({ top: document.getElementById('shop').offsetTop - 80, behavior: 'smooth' });
  });

  /* ── APPLY BUTTON ── */
  document.getElementById('filterApplyBtn').addEventListener('click', () => {
    applyFilters();
    closeDrawer();
  });

  /* ── SORT realtime ── */
  document.getElementById('sortSelect').addEventListener('change', applyFilters);

  /* ── RESET helper ── */
  function resetAllFilters(clearSearch = true) {
    document.querySelectorAll('.cat-filter input[type="checkbox"]').forEach(i => i.checked = false);
    document.querySelector('.cat-filter[data-value="all"] input').checked = true;
    document.querySelectorAll('.brand-filter input').forEach(i => i.checked = false);
    document.querySelectorAll('.promo-filter input').forEach(i => i.checked = false);
    document.querySelector('.rating-filter[data-value="0"] input').checked = true;
    minInput.value  = 0;
    slider.value    = 10000000;
    maxInput.value  = '10.000.000';
    document.querySelectorAll('.price-quick-btn').forEach(b => b.classList.remove('active'));
    if (clearSearch) { searchQuery = ''; useAPI = true; if (searchInput) searchInput.value = ''; }
    updateSlider();
    syncCheckboxes();
    document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active-cat'));
  }

  /* ── CLEAR ALL ── */
  document.getElementById('clearAll').addEventListener('click', () => { resetAllFilters(true); applyFilters(); });
  document.getElementById('resetBtn').addEventListener('click', () => { resetAllFilters(true); applyFilters(); });

  /* ── ACTIVE FILTER TAGS ── */
  const activeFiltersEl = document.getElementById('activeFilters');
  function updateActiveTags() {
    activeFiltersEl.innerHTML = '';
    const { allCat, cats, brands, minP, maxP, ratingVal, promos } = getFilters();

    if (!allCat) cats.forEach(v => {
      const label = document.querySelector(`.cat-filter[data-value="${v}"] .label`)?.textContent;
      if (label) addTag(label, () => {
        document.querySelector(`.cat-filter[data-value="${v}"] input`).checked = false;
        if (!document.querySelectorAll('.cat-filter:not([data-value="all"]) input:checked').length) {
          document.querySelector('.cat-filter[data-value="all"] input').checked = true;
        }
        applyFilters();
      });
    });
    brands.forEach(v => {
      const label = document.querySelector(`.brand-filter[data-value="${v}"] .label`)?.textContent;
      if (label) addTag(label, () => {
        document.querySelector(`.brand-filter[data-value="${v}"] input`).checked = false;
        applyFilters();
      });
    });
    if (maxP < 10000000) addTag(`Đến ${maxP.toLocaleString('vi-VN')}₫`, () => {
      slider.value   = 10000000;
      maxInput.value = '10.000.000';
      updateSlider();
      applyFilters();
    });
    if (ratingVal > 0) addTag(`${ratingVal}★ trở lên`, () => {
      document.querySelector('.rating-filter[data-value="0"] input').checked = true;
      syncCheckboxes();
      applyFilters();
    });
    promos.forEach(v => {
      const label = document.querySelector(`.promo-filter[data-value="${v}"] .label`)?.textContent;
      if (label) addTag(label, () => {
        document.querySelector(`.promo-filter[data-value="${v}"] input`).checked = false;
        applyFilters();
      });
    });
    if (searchQuery) addTag(`"${searchQuery}"`, () => {
      searchQuery = ''; useAPI = true; if (searchInput) searchInput.value = ''; applyFilters();
    });
  }

  function addTag(text, onRemove) {
    const tag       = document.createElement('span');
    tag.className   = 'filter-tag';
    const removeBtn = document.createElement('button');
    removeBtn.className   = 'tag-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => { onRemove(); syncCheckboxes(); });
    tag.appendChild(document.createTextNode(text + ' '));
    tag.appendChild(removeBtn);
    activeFiltersEl.appendChild(tag);
  }

  /* ── CATEGORY FILTER: "Tất cả" exclusive logic ── */
  document.querySelectorAll('.cat-filter input').forEach(inp => {
    inp.addEventListener('change', () => {
      if (inp.closest('.filter-check').dataset.value === 'all') {
        document.querySelectorAll('.cat-filter:not([data-value="all"]) input').forEach(i => i.checked = false);
      } else {
        document.querySelector('.cat-filter[data-value="all"] input').checked = false;
        if (!document.querySelectorAll('.cat-filter:not([data-value="all"]) input:checked').length) {
          document.querySelector('.cat-filter[data-value="all"] input').checked = true;
        }
      }
      syncCheckboxes();
    });
  });

  /* ── ESCAPE HTML ── */
  function escHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── BIND PRODUCT CARD CLICK → chitiet.jsp ── */
  function bindProductCardClick() {
    productsGrid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.wishlist-btn') || e.target.closest('.btn-add-cart')) return;
        if (this.dataset.productId) {
          window.location.href = `chitiet.jsp?id=${this.dataset.productId}`;
        }
      });
    });
  }

  document.getElementById('productsGrid').addEventListener('click', function(e) {
    if (e.target.closest('.wishlist-btn') || e.target.closest('.btn-add-cart')) return;
    const card = e.target.closest('.product-card');
    if (!card || !card.dataset.productId) return;
    window.location.href = `chitiet.jsp?id=${card.dataset.productId}`;
  });

  document.getElementById('featuredGrid').addEventListener('click', function(e) {
    if (e.target.closest('.wishlist-btn') || e.target.closest('.btn-add-cart')) return;
    const card = e.target.closest('.product-card');
    if (!card || !card.dataset.productId) return;
    window.location.href = `chitiet.jsp?id=${card.dataset.productId}`;
  });

  document.querySelectorAll('.fs-card').forEach((card) => {
    card.addEventListener('click', function(e) {
      if (e.target.closest('.fs-buy-btn')) return;
      if (this.dataset.productId) {
        window.location.href = `chitiet.jsp?id=${this.dataset.productId}`;
      }
    });
  });

  /* ════════════════════════════════════════
     FETCH FLASH SALE & FEATURED TỪ BACKEND
     ════════════════════════════════════════ */
  async function loadFlashSale() {
    try {
      const res = await fetch('/websitethuongmaidientu/SanPhamServlet?action=flashSale');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const products = await res.json();
      renderFlashSaleCards(products);
    } catch (e) {
      console.warn('Flash sale API lỗi, giữ HTML mặc định:', e);
    }
  }

  function renderFlashSaleCards(products) {
    const fsGrid = document.querySelector('.fs-grid');
    if (!fsGrid) return;
    fsGrid.innerHTML = products.map((sp, i) => {
      const discount = sp.giaGoc && sp.giaGoc > sp.gia ? Math.round((sp.giaGoc - sp.gia) / sp.giaGoc * 100) : 0;
      const soldPercent = Math.floor(Math.random() * 40) + 40;
      const isHot = i === 1;
      return `
        <div class="fs-card${isHot ? ' fs-card-hot' : ''}" data-product-id="${sp.id}">
          ${discount > 0 ? `<div class="fs-badge">-${discount}%</div>` : ''}
          ${isHot ? '<div class="fs-hot-ribbon">🔥 Sắp hết</div>' : ''}
          <div class="fs-img-wrap">
            <img src="${escHtml(sp.hinhAnh || '')}" alt="${escHtml(sp.tenSp)}"
                 style="width:100%;height:100%;object-fit:cover;"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="fs-emoji" style="display:none;">🛍️</div>
          </div>
          <div class="fs-card-body">
            <p class="fs-brand-tag">${escHtml(sp.thuongHieu || '')}</p>
            <p class="fs-name">${escHtml(sp.tenSp)}</p>
            <div class="fs-price-row">
              <span class="fs-price-new">${Number(sp.gia).toLocaleString('vi-VN')}₫</span>
              ${sp.giaGoc && sp.giaGoc > sp.gia ? `<span class="fs-price-old">${Number(sp.giaGoc).toLocaleString('vi-VN')}₫</span>` : ''}
            </div>
            <div class="fs-progress-wrap">
              <div class="fs-progress-bar"><div class="fs-progress-fill${isHot ? ' hot' : ''}" style="width:${soldPercent}%"></div></div>
              <span class="fs-sold-label${isHot ? ' critical' : ''}">${isHot ? 'CHỈ CÒN 2' : 'Đã bán ' + soldPercent + '%'}</span>
            </div>
            <button class="fs-buy-btn btn-add-cart">Mua ngay</button>
          </div>
        </div>`;
    }).join('');

    fsGrid.querySelectorAll('.fs-card').forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.fs-buy-btn')) return;
        if (this.dataset.productId) {
          window.location.href = `chitiet.jsp?id=${this.dataset.productId}`;
        }
      });
    });
  }

  async function loadFeatured() {
    try {
      const res = await fetch('/websitethuongmaidientu/SanPhamServlet?action=featured&limit=8');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const products = await res.json();
      renderFeaturedCards(products);
    } catch (e) {
      console.warn('Featured API lỗi, giữ HTML mặc định:', e);
    }
  }

  function renderFeaturedCards(products) {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    grid.innerHTML = products.map(sp => {
      const discountPercent = sp.giaGoc && sp.giaGoc > sp.gia ? Math.round((sp.giaGoc - sp.gia) / sp.giaGoc * 100) : 0;
      return `
        <div class="product-card" data-feat-cat="${mapCatToFeat(sp.maDanhMuc)}" data-product-id="${sp.id}">
          ${discountPercent > 0 ? `<div class="product-badges"><span class="badge badge-sale">-${discountPercent}%</span></div>` : ''}
          ${sp.isNew === 1 ? '<div class="product-badges"><span class="badge badge-new">Mới</span></div>' : ''}
          <button class="wishlist-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <div class="product-img">
            <img src="${escHtml(sp.hinhAnh || '')}" alt="${escHtml(sp.tenSp)}"
                 style="width:100%;height:100%;object-fit:cover;"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="product-emoji" style="display:none;">🛍️</div>
          </div>
          <div class="product-info">
            <p class="product-brand">${escHtml(sp.thuongHieu || '')}</p>
            <h3 class="product-name">${escHtml(sp.tenSp)}</h3>
            <div class="product-rating">
              <span class="stars">${'★'.repeat(Math.round(sp.diemDanhGia || 5))}</span>
              <span class="rating-count">(${(sp.soDanhGia || 0) >= 1000 ? ((sp.soDanhGia/1000).toFixed(1) + 'k') : (sp.soDanhGia || 0)})</span>
            </div>
            <div class="product-price">
              <span class="price-current">${Number(sp.gia).toLocaleString('vi-VN')}₫</span>
              ${sp.giaGoc && sp.giaGoc > sp.gia ? `<span class="price-old">${Number(sp.giaGoc).toLocaleString('vi-VN')}₫</span>` : ''}
            </div>
          </div>
          <button class="btn-add-cart">Thêm vào giỏ</button>
        </div>`;
    }).join('');

    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.wishlist-btn') || e.target.closest('.btn-add-cart')) return;
        if (this.dataset.productId) {
          window.location.href = `chitiet.jsp?id=${this.dataset.productId}`;
        }
      });
    });
  }

  function mapCatToFeat(maDanhMuc) {
    const map = { 1: 'skincare', 2: 'makeup', 3: 'perfume', 4: 'hair', 5: 'sunscreen', 6: 'body' };
    return map[maDanhMuc] || 'skincare';
  }

  /* ── COUNTDOWN ── */
  const hoursEl = document.getElementById('hours');
  const minsEl  = document.getElementById('minutes');
  const secsEl  = document.getElementById('seconds');
  if (hoursEl) {
    let total = 5 * 3600 + 42 * 60 + 17;
    setInterval(() => {
      if (total <= 0) return;
      total--;
      hoursEl.textContent = String(Math.floor(total / 3600)).padStart(2, '0');
      minsEl.textContent  = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
      secsEl.textContent  = String(total % 60).padStart(2, '0');
    }, 1000);
  }

  /* ── NEWSLETTER ── */
  const nlBtn   = document.getElementById('nlBtn');
  const nlInput = document.querySelector('.newsletter-form input[type="email"]');
  nlBtn?.addEventListener('click', () => {
    if (!nlInput?.value.trim()) { nlInput?.focus(); return; }
    nlBtn.textContent    = '✓ Đã đăng ký!';
    nlBtn.style.background = '#3a9e7e';
    nlInput.value = '';
    setTimeout(() => { nlBtn.textContent = 'Đăng Ký'; nlBtn.style.background = ''; }, 2500);
  });

  /* ── SCROLL REVEAL ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.cat-card, .why-card, .testi-card, .fs-card').forEach((el, i) => {
    el.classList.add('reveal-item');
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    revealObserver.observe(el);
  });

  /* ── INIT ── */
  applyFilters();
  loadFlashSale();
  loadFeatured();

});