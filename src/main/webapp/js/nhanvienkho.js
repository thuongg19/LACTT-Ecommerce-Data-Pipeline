/* =============================================
   LACTT — nhanvienkho.js  (v3 — Full 3-way sync)

   LUỒNG ĐƠN HÀNG 3 BÊN:
   ┌─────────────────────────────────────────────────────┐
   │ Khách đặt    → lactt_orders (pending)               │
   │ Admin duyệt  → lactt_admin_orders (confirmed)       │
   │               + sync → lactt_orders                 │
   │ Kho xuất     → lactt_admin_orders (shipping)        │
   │               + sync → lactt_orders  ← Khách thấy  │
   │ Kho giao xong→ lactt_admin_orders (delivered)       │
   │               + sync → lactt_orders  ← Khách thấy  │
   │ Khách hoàn   → lactt_orders (refunding)             │
   │               + sync → lactt_admin_orders           │
   │ Admin duyệt hoàn hàng → refundApproved = true       │
   │ Kho nhập lại → lactt_admin_orders (restocked)       │
   │               + sync → lactt_orders  ← Khách thấy  │
   │ Admin hoàn tiền → cancelled + refunded = true       │
   └─────────────────────────────────────────────────────┘

   localStorage keys (dùng CHUNG với admin.js):
     lactt_admin_orders   — nguồn sự thật Admin & Kho
     lactt_admin_products — tồn kho
     lactt_orders         — bản khách hàng (taikhoan.jsp)
     lactt_nhatky_kho     — nhật ký kho
   ============================================= */

'use strict';

/* ─────────────────────────────────────────────
   STORE
───────────────────────────────────────────── */
const KhoStore = {

  /* Đơn hàng — lấy từ NhanVienKhoServlet (kèm chi tiết sản phẩm từ DB) */
  async fetchOrders() {
    const res  = await fetch((window.APP_CONTEXT||'') + '/NhanVienKhoServlet?action=getDonHang', { credentials:'same-origin' });
    const data = await res.json();
    if (!data.ok) return [];
    return (data.data || []).map(o => ({
      id:              String(o.id),
      _dbId:           o.id,
      status:          _mapStatus(o.trangThai),
      trangThai:       o.trangThai,
      total:           Number(o.tongTien || 0),
      customer:        { name: o.tenNguoiNhan, phone: o.soDienThoai, address: o.diaChiGiao },
      date:            o.ngayDat,
      approvedAt:      o.ngayDat,
      notes:           o.ghiChu,
      shippedBy:       o.shippedBy,
      shippedAt:       o.shippedAt,
      deliveredAt:     o.deliveredAt,
      refundApproved:     o.refundApproved,
      refundReason:       o.refundReason,
      refundApprovedAt:   o.refundApprovedAt,
      phuongThucTT:    o.phuongThucTT,
      items: (o.items || []).map(i => ({
        name:    i.tenSp,
        brand:   i.thuongHieu,
        variant: i.tenVariant || '',
        qty:     i.soLuong,
        price:   i.gia,
        emoji:   '📦',
      })),
    }));
  },
  /* Giữ lại saveOrders để các chỗ gọi không bị lỗi — nhưng không dùng localStorage */
  saveOrders(orders) { /* no-op — data sống trên server */ },

  /* Sản phẩm — CÙNG KEY với admin.js */
  getProducts() {
    try {
      const saved = JSON.parse(localStorage.getItem('lactt_admin_products'));
      return (saved && saved.length > 0) ? saved : _seedProducts();
    } catch { return _seedProducts(); }
  },
  saveProducts(products) {
    localStorage.setItem('lactt_admin_products', JSON.stringify(products));
  },

  /* Nhật ký kho */
  getLogs() {
    try { return JSON.parse(localStorage.getItem('lactt_nhatky_kho')) || []; }
    catch { return []; }
  },
  saveLogs(logs) {
    localStorage.setItem('lactt_nhatky_kho', JSON.stringify(logs));
  },

  /* User đang đăng nhập */
  getUser() {
    try { return JSON.parse(localStorage.getItem('lactt_user')) || {}; }
    catch { return {}; }
  },

  /* ── SYNC VỀ KHÁCH HÀNG (lactt_orders) ──
     Gọi sau mỗi thay đổi để khách thấy ngay trên taikhoan.jsp */
  syncToCustomer(orderId, newStatus, extraData) {
    try {
      const LABELS = {
        packing:    'Đang đóng gói hàng tại kho',
        shipping:   'Đã bàn giao cho đơn vị vận chuyển (GHN)',
        delivered:  'Giao hàng thành công — Cảm ơn bạn đã mua hàng!',
        restocked:  'Kho đã nhận lại hàng — Admin đang xử lý hoàn tiền',
      };
      let userOrds = JSON.parse(localStorage.getItem('lactt_orders') || '[]');
      let found = false;

      userOrds = userOrds.map(o => {
        if (o.id !== orderId) return o;
        found = true;
        const tracking = Array.isArray(o.tracking) ? [...o.tracking] : [];
        const label = LABELS[newStatus];
        if (label && !tracking.find(t => t.status === newStatus)) {
          tracking.forEach(t => { t.current = false; });
          tracking.push({
            status:  newStatus,
            label,
            time:    _nowStr(),
            done:    true,
            current: !['delivered','cancelled'].includes(newStatus),
          });
        }
        return { ...o, status: newStatus, tracking, ...(extraData || {}) };
      });

      /* Nếu đơn chưa có trong lactt_orders → thêm để khách thấy */
      if (!found) {
        const adminOrder = this.getOrders().find(o => o.id === orderId);
        if (adminOrder) userOrds.unshift({ ...adminOrder, status: newStatus, ...(extraData || {}) });
      }

      localStorage.setItem('lactt_orders', JSON.stringify(userOrds));
    } catch(e) { console.error('[syncToCustomer]', e); }
  },
};

/* ─────────────────────────────────────────────
   MAP TRẠNG THÁI DB → shape cũ của UI
───────────────────────────────────────────── */
function _mapStatus(trangThai) {
  const map = {
    cho_xac_nhan:  'pending',
    dang_chuan_bi: 'confirmed',
    dang_giao:     'shipping',
    da_giao:       'delivered',
    hoan_thanh:    'delivered',
    da_huy:        'cancelled',
    yeu_cau_hoan:  'refunding',
    cho_hoan_kho:  'refunding',
    cho_hoan_tien: 'refunding',
    da_hoan_tien:  'refunding',
  };
  return map[trangThai] || trangThai;
}

/* Cache đơn hàng hiện tại trong bộ nhớ (thay thế localStorage) */
let _khoOrders = [];

async function _loadKhoOrders() {
  _khoOrders = await KhoStore.fetchOrders();
  return _khoOrders;
}

/* ─────────────────────────────────────────────
   SEED SẢN PHẨM — fallback nếu admin chưa seed
───────────────────────────────────────────── */
function _seedProducts() {
  const seed = [
    { id:'P001', emoji:'🌸', name:'Water Sleeping Mask',          brand:'LANEIGE',      category:'skincare',  price:390000,  stock:24, status:'active' },
    { id:'P002', emoji:'✨', name:'Facial Treatment Essence',     brand:'SK-II',        category:'skincare',  price:2450000, stock:5,  status:'active' },
    { id:'P003', emoji:'💄', name:'Rouge Allure Velvet No.56',    brand:'CHANEL',       category:'makeup',    price:1280000, stock:8,  status:'active' },
    { id:'P004', emoji:'💦', name:'Green Tea Seed Serum',         brand:'INNISFREE',    category:'skincare',  price:250000,  stock:3,  status:'active' },
    { id:'P005', emoji:'🌅', name:'Perfect UV Sunscreen SPF50+',  brand:'ANESSA',       category:'sunscreen', price:450000,  stock:4,  status:'active' },
    { id:'P006', emoji:'🌿', name:'Niacinamide 10% + Zinc 1%',   brand:'THE ORDINARY', category:'skincare',  price:220000,  stock:42, status:'active' },
    { id:'P007', emoji:'🪄', name:'Aqua Intensive Hair Mask',    brand:'SHISEIDO',     category:'hair',      price:780000,  stock:24, status:'active' },
    { id:'P008', emoji:'🌤️', name:'Daily UV Protection SPF36',  brand:'INNISFREE',    category:'sunscreen', price:320000,  stock:67, status:'active' },
  ];
  localStorage.setItem('lactt_admin_products', JSON.stringify(seed));
  return seed;
}

/* ─────────────────────────────────────────────
   TIỆN ÍCH
───────────────────────────────────────────── */
function _nowStr() {
  const d = new Date();
  return d.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
       + ' · ' + d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function fmtMoney(n) { return Number(n).toLocaleString('vi-VN') + '₫'; }

function fmtDateTime(d) {
  const date = d ? new Date(d) : new Date();
  if (isNaN(date)) return String(d || '');
  return date.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
       + ' · ' + date.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function getCustomerName(order) {
  if (!order.customer) return order.customerName || 'Khách hàng';
  if (typeof order.customer === 'string') return order.customer;
  if (typeof order.customer === 'object') return order.customer.name || 'Khách hàng';
  return 'Khách hàng';
}
function getCustomerPhone(order) {
  if (typeof order.customer === 'object' && order.customer) return order.customer.phone || order.phone || '';
  return order.phone || '';
}
function getCustomerAddress(order) {
  if (typeof order.customer === 'object' && order.customer) return order.customer.address || order.address || '';
  return order.address || '';
}

function _actorName() {
  const u = KhoStore.getUser();
  return u.name || (u.firstName ? (u.firstName + ' ' + (u.lastName || '')).trim() : 'NV Kho');
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─────────────────────────────────────────────
   GHI NHẬT KÝ KHO
───────────────────────────────────────────── */
function logAction(type, productId, productName, qty, note, orderId) {
  const logs = KhoStore.getLogs();
  logs.unshift({
    id: 'LOG-' + Date.now(), type, productId, productName,
    qty: Number(qty), note: note || '', orderId: orderId || '',
    actor: _actorName(), time: new Date().toISOString(),
  });
  KhoStore.saveLogs(logs);
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const container = document.getElementById('khoToast');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 3500);
}

/* ─────────────────────────────────────────────
   CONFIRM DIALOG
───────────────────────────────────────────── */
let _confirmResolve = null;
function showConfirm(title, msg, icon = '⚠️') {
  return new Promise(resolve => {
    _confirmResolve = resolve;
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent   = msg;
    document.getElementById('confirmIcon').textContent  = icon;
    document.getElementById('confirmDialog').classList.add('open');
  });
}

/* ─────────────────────────────────────────────
   PANEL SWITCHING
───────────────────────────────────────────── */
function switchPanel(id) {
  document.querySelectorAll('.kho-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-panel]').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + id)?.classList.add('active');
  document.querySelector(`[data-panel="${id}"]`)?.classList.add('active');

  const titles = { orders:'Đơn chờ đóng gói', import:'Nhập hàng mới', inventory:'Kiểm kê tồn kho', logs:'Nhật ký kho' };
  document.getElementById('khoHeaderTitle').textContent    = titles[id] || 'Nhân viên Kho';
  document.getElementById('khoHeaderSubtitle').textContent = _nowStr();

  if (id === 'orders')    renderPendingOrders();
  if (id === 'inventory') renderInventory();
  if (id === 'logs')      renderLogs();
  if (id === 'import')    _renderRecentImport();
}

/* ═══════════════════════════════════════════════
   PANEL 1 — ĐƠN CẦN XỬ LÝ
   Hiển thị: confirmed + shipping + delivered + refunding
═══════════════════════════════════════════════ */

let _khoOrderTab = 'active'; // 'active' | 'delivered' | 'refunding'

function switchKhoOrderTab(tab) {
  _khoOrderTab = tab;
  document.querySelectorAll('.kho-order-tab-btn').forEach(b => {
    const isActive = b.dataset.tab === tab;
    b.style.background = isActive ? '#c4626e' : '#fff';
    b.style.color      = isActive ? '#fff' : 'var(--dark, #1a1208)';
  });
  renderPendingOrders();
}

/* =======================================================
   1. RENDER GIAO DIỆN KANBAN (CHIA 2 CỘT) CHO TAB ĐANG XỬ LÝ
======================================================= */
async function renderPendingOrders() {
  await _loadKhoOrders();
  const allOrders = _khoOrders;
  const listEl    = document.getElementById('pendingOrderList');
  const countEl   = document.getElementById('pendingOrderCount');
  const badge     = document.getElementById('navBadgeOrders');

  const activeOrders    = allOrders.filter(o => ['confirmed','shipping'].includes(o.status));
  const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
  const refundingOrders = allOrders.filter(o => o.status === 'refunding');
  const urgentCount     = activeOrders.length + refundingOrders.filter(o => o.refundApproved).length;

  if (badge) { badge.textContent = urgentCount; badge.style.display = urgentCount > 0 ? '' : 'none'; }

  /* Tạo Tab Bar */
  if (!document.getElementById('khoOrderTabBar')) {
    const tabBar = document.createElement('div');
    tabBar.id = 'khoOrderTabBar';
    tabBar.style.cssText = 'display:flex;gap:8px;margin-bottom:0;padding:14px 20px;background:var(--bg);border-bottom:1px solid var(--border);flex-wrap:wrap;';
    tabBar.innerHTML = `
      <button class="kho-order-tab-btn" data-tab="active" onclick="switchKhoOrderTab('active')" style="padding:7px 16px;border-radius:8px;border:1px solid var(--border);font-size:.82rem;font-weight:500;cursor:pointer;transition:all .2s;background:#c4626e;color:#fff">
        📦 Đang xử lý <span id="tabBadgeActive" style="margin-left:4px;background:rgba(255,255,255,.3);border-radius:10px;padding:1px 7px;font-size:.75rem"></span>
      </button>
      <button class="kho-order-tab-btn" data-tab="delivered" onclick="switchKhoOrderTab('delivered')" style="padding:7px 16px;border-radius:8px;border:1px solid var(--border);font-size:.82rem;font-weight:500;cursor:pointer;transition:all .2s;background:#fff;color:var(--dark)">
        ✅ Đã giao <span id="tabBadgeDelivered" style="margin-left:4px;background:rgba(0,0,0,.08);border-radius:10px;padding:1px 7px;font-size:.75rem"></span>
      </button>
      <button class="kho-order-tab-btn" data-tab="refunding" onclick="switchKhoOrderTab('refunding')" style="padding:7px 16px;border-radius:8px;border:1px solid rgba(196,98,110,.3);font-size:.82rem;font-weight:500;cursor:pointer;transition:all .2s;background:#fff;color:var(--dark)">
        ↩ Hoàn hàng <span id="tabBadgeRefunding" style="margin-left:4px;background:#fde8ea;color:#c4626e;border-radius:10px;padding:1px 7px;font-size:.75rem;font-weight:700"></span>
      </button>`;
    listEl.before(tabBar);
  }

  document.getElementById('tabBadgeActive').textContent = activeOrders.length;
  document.getElementById('tabBadgeDelivered').textContent = deliveredOrders.length;
  document.getElementById('tabBadgeRefunding').textContent = refundingOrders.length || '';

  if (countEl) countEl.textContent = (_khoOrderTab === 'active' ? activeOrders : _khoOrderTab === 'delivered' ? deliveredOrders : refundingOrders).length + ' đơn';

  /* --- NẾU LÀ TAB ĐÃ GIAO HOẶC HOÀN HÀNG --- */
  if (_khoOrderTab !== 'active') {
    let orders = _khoOrderTab === 'delivered' ? deliveredOrders : refundingOrders;
    if (orders.length === 0) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">${_khoOrderTab === 'delivered'?'✅':'↩'}</div><h3>Chưa có dữ liệu</h3></div>`;
      return;
    }
    listEl.innerHTML = renderOrderListHTML(orders);
    return;
  }

  /* =====================================================
     THIẾT KẾ 2 CỘT CHO TAB "ĐANG XỬ LÝ"
     ===================================================== */
  const confirmed = activeOrders.filter(o => o.status === 'confirmed');
  const shipping  = activeOrders.filter(o => o.status === 'shipping');

  let leftHtml = `
    <div class="split-col">
      <div class="split-header">
        <div style="font-weight:700; color:#b45309; font-size:.9rem; display:flex; align-items:center; gap:6px;">
          📦 CHỜ ĐÓNG GÓI XUẤT KHO (${confirmed.length})
        </div>
        ${confirmed.length > 0 ? `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding:8px; background:#fffbeb; border-radius:8px; border:1px solid #fde68a;">
          <label style="font-size:.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px;">
            <input type="checkbox" id="selectAllExport" onchange="toggleSelectAllExport(this)" style="width:15px;height:15px;accent-color:var(--success);"> Chọn tất cả
          </label>
          <button class="btn btn-success btn-sm" id="btnBulkExport" onclick="doBulkExport()" style="display:none; padding:4px 10px;">
            Xuất kho (<span id="bulkCountExport">0</span>)
          </button>
        </div>` : ''}
      </div>
      <div class="split-list">${confirmed.length > 0 ? renderOrderListHTML(confirmed) : '<div style="padding:30px;text-align:center;color:var(--light);font-size:.85rem;">Không có đơn chờ xuất kho</div>'}</div>
    </div>`;

  let rightHtml = `
    <div class="split-col">
      <div class="split-header">
        <div style="font-weight:700; color:#047857; font-size:.9rem; display:flex; align-items:center; gap:6px;">
          🚚 ĐANG VẬN CHUYỂN (${shipping.length})
        </div>
        ${shipping.length > 0 ? `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding:8px; background:#ecfdf5; border-radius:8px; border:1px solid #a7f3d0;">
          <label style="font-size:.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px;">
            <input type="checkbox" id="selectAllDelivered" onchange="toggleSelectAllDelivered(this)" style="width:15px;height:15px;accent-color:var(--pink-dark);"> Chọn tất cả
          </label>
          <button class="btn btn-primary btn-sm" id="btnBulkDelivered" onclick="doBulkDelivered()" style="display:none; padding:4px 10px;">
            Đã giao (<span id="bulkCountDelivered">0</span>)
          </button>
        </div>` : ''}
      </div>
      <div class="split-list">${shipping.length > 0 ? renderOrderListHTML(shipping) : '<div style="padding:30px;text-align:center;color:var(--light);font-size:.85rem;">Không có đơn đang giao</div>'}</div>
    </div>`;

  // Render layout chia đôi giang sơn
  listEl.innerHTML = `
    <div style="display:flex; align-items:stretch; background:var(--bg);">
      <div style="flex:1; padding-bottom:20px;">${leftHtml}</div>
      <div style="width:2px; background:var(--border); margin:0 10px; box-shadow:0 0 5px rgba(0,0,0,0.05);"></div>
      <div style="flex:1; padding-bottom:20px;">${rightHtml}</div>
    </div>`;
}

/* Hàm phụ trợ generate HTML từng dòng đơn hàng (để dùng chung cho các cột) */
/* Hàm phụ trợ generate HTML từng dòng đơn hàng (Giao diện Cao cấp) */
/* Hàm phụ trợ generate HTML từng dòng đơn hàng (Giao diện Cao cấp) */
function renderOrderListHTML(orders) {
  return orders.map((order, idx) => {
    const safeId       = order.id.replace(/[^a-z0-9]/gi,'');
    const escapedId    = order.id.replace(/'/g,"\\'");
    const custName     = getCustomerName(order);
    const custPhone    = getCustomerPhone(order);
    const custAddress  = getCustomerAddress(order);
    const itemCount    = (order.items || []).length;

    let seqOrCheckboxHtml = `<span class="order-seq-num">${idx + 1}</span>`;
    let quickActionHtml = '';
    let pills = '';

    // Xử lý thông minh tất cả các trạng thái
    if (order.status === 'confirmed') {
      pills = '<span class="status-pill new"><span class="status-pill-dot"></span>Mới</span>';
      seqOrCheckboxHtml = `<input type="checkbox" class="order-cb cb-export" value="${order._dbId || order.id}" onchange="updateBulkUI()" onclick="event.stopPropagation()" style="width:16px;height:16px;accent-color:var(--success);cursor:pointer;">`;
      quickActionHtml = `<button class="btn-quick btn-quick-export" onclick="event.stopPropagation(); doExportOrder('${escapedId}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg> Xuất kho</button>`;
    } else if (order.status === 'shipping') {
      pills = '<span class="status-pill shipping"><span class="status-pill-dot"></span>Đang giao</span>';
      seqOrCheckboxHtml = `<input type="checkbox" class="order-cb cb-delivered" value="${order._dbId || order.id}" onchange="updateBulkUI()" onclick="event.stopPropagation()" style="width:16px;height:16px;accent-color:var(--pink-dark);cursor:pointer;">`;
      quickActionHtml = `<button class="btn-quick btn-quick-delivered" onclick="event.stopPropagation(); doMarkDelivered('${escapedId}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Đã giao</button>`;
    } else if (order.trangThai === 'cho_hoan_kho') {
      pills = '<span class="status-pill need-restock"><span class="status-pill-dot"></span>Cần nhập lại</span>';
      quickActionHtml = `<button class="btn-quick btn-quick-restock" onclick="event.stopPropagation(); doRestockOrder('${escapedId}')">Nhập kho</button>`;
    } else if (order.trangThai === 'cho_hoan_tien' || order.trangThai === 'da_hoan_tien') {
      pills = '<span class="status-pill delivered"><span class="status-pill-dot"></span>Đã nhập kho</span>';
      quickActionHtml = `<span class="quick-done-label" style="color:var(--success)">✓ Đã nhập kho</span>`;
    } else if (order.status === 'delivered') {
      pills = '<span class="status-pill delivered"><span class="status-pill-dot"></span>Đã giao</span>';
      quickActionHtml = `<span class="quick-done-label">Đã giao</span>`;
    } else if (order.trangThai === 'yeu_cau_hoan') {
      pills = '<span class="status-pill wait-admin"><span class="status-pill-dot"></span>Chờ duyệt</span>';
      quickActionHtml = `<span class="quick-wait-label">Chờ duyệt</span>`;
    }

    const itemsHtml = (order.items || []).map(item => `
      <div class="order-item-line">
        <div class="order-item-img">${item.emoji || '📦'}</div>
        <div class="order-item-info">
          <div class="order-item-name">${escHtml(item.name)}</div>
          <div class="order-item-meta">${escHtml(item.brand || '')}${item.variant ? ' &middot; ' + escHtml(item.variant) : ''} &middot; ${fmtMoney(item.price)}</div>
        </div>
        <div class="order-item-qty-badge">
          <span class="order-item-qty-num">${item.qty}</span>
          <span class="order-item-qty-label">${order.status === 'refunding' ? 'hoàn' : 'hộp'}</span>
        </div>
      </div>`).join('');

    return `
    <div class="order-pending-row ${order.status === 'confirmed' ? 'row-urgent' : ''} ${order.trangThai === 'cho_hoan_kho' ? 'row-restock' : ''}" id="orow-${safeId}">
      <div class="order-pending-summary" onclick="toggleOrderDetail('${escapedId}')">
        
        <div class="order-seq-col" onclick="event.stopPropagation()">
          ${seqOrCheckboxHtml}
        </div>
        
        <div class="order-main-col">
          <div class="order-id-row"><span class="order-id-text">#${escHtml(order.id)}</span> ${pills}</div>
          <div class="order-customer-row">
            <span class="order-customer-name">${escHtml(custName)}</span>
            ${custPhone ? `<span class="order-customer-phone">${escHtml(custPhone)}</span>` : ''}
            <span class="order-items-chip"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>${itemCount} sp</span>
          </div>
        </div>
        
        <div class="order-meta-col">
          <div class="order-total-amount">${fmtMoney(order.total)}</div>
          <div class="order-time-text">${escHtml(fmtDateTime(order.approvedAt || order.date || ''))}</div>
        </div>
        
        <div class="order-quick-col">
          ${quickActionHtml}
        </div>
        
        <svg class="order-expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      <div class="order-detail-collapse" id="collapse-${safeId}">
        <div class="order-detail-inner">
          <div class="detail-section full-width"><div class="detail-section-header"><span class="detail-section-title">Danh sách sản phẩm</span></div><div class="detail-section-body">${itemsHtml}</div></div>
          ${custAddress ? `<div class="detail-section"><div class="detail-section-header"><span class="detail-section-title">Giao hàng</span></div><div class="detail-section-body"><div class="address-block"><div class="address-row"><span class="address-icon">📍</span><span class="address-val">${escHtml(custAddress)}</span></div>${order.notes ? `<div style="margin-top:8px; padding:6px; background:var(--warning-bg); border-radius:6px; font-size:.8rem; color:var(--warning)">📝 ${escHtml(order.notes)}</div>` : ''}</div></div></div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}
function _isNewOrder(order) {
  const ref = order.approvedAt || order.confirmedAt;
  if (!ref) return false;
  const m = ref.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return true;
  return (Date.now() - new Date(m[3], m[2]-1, m[1]).getTime()) < 24*3600*1000;
}

function toggleOrderDetail(orderId) {
  const safeId   = orderId.replace(/[^a-z0-9]/gi,'');
  const rowEl    = document.getElementById('orow-' + safeId);
  const collapse = document.getElementById('collapse-' + safeId);
  if (!rowEl || !collapse) return;
  const wasOpen = collapse.classList.contains('open');
  document.querySelectorAll('.order-detail-collapse.open').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.order-pending-row.expanded').forEach(el => el.classList.remove('expanded'));
  if (!wasOpen) { collapse.classList.add('open'); rowEl.classList.add('expanded'); }
}

/* ── XUẤT KHO: dang_chuan_bi → dang_giao ──
   Gọi kho/don-hang-api action=daDongGoi */
async function doExportOrder(orderId) {
  const order = _khoOrders.find(o => o.id === orderId);
  if (!order) { showToast('Không tìm thấy đơn!', 'error'); return; }

  const ok = await showConfirm(
    'Xác nhận xuất kho',
    `Đơn ${orderId} — ${getCustomerName(order)}\n\nSau khi xác nhận:\n• Admin thấy ngay: "Đang giao"\n• Khách thấy ngay: "Đang giao"`,
    '📦'
  );
  if (!ok) return;

  const dbId = order._dbId || order.id;
  try {
    const res  = await fetch((window.APP_CONTEXT || '') + '/NhanVienKhoServlet', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=xuatKho&donHangId=' + encodeURIComponent(dbId)
    });
    const data = await res.json();
    if (!data.ok) { showToast('⚠️ ' + (data.msg || 'Xuất kho thất bại'), 'error'); return; }
  } catch(e) {
    showToast('Lỗi kết nối server!', 'error'); return;
  }

  showToast('🚚 Xuất kho thành công!\n✓ Admin đã thấy "Đang giao"\n✓ Tồn kho đã được trừ', 'success');
  renderPendingOrders();
  try { renderStats(); } catch(e) {}
}

/* ── XÁC NHẬN ĐÃ GIAO: dang_giao → da_giao ──
   Gọi kho/don-hang-api action=daGiao */
async function doMarkDelivered(orderId) {
  const order = _khoOrders.find(o => o.id === orderId);
  if (!order) { showToast('Không tìm thấy đơn!', 'error'); return; }

  const ok = await showConfirm(
    'Xác nhận đã giao hàng thành công',
    `Đơn ${orderId} — ${getCustomerName(order)}\n\nSau khi xác nhận:\n• Admin thấy ngay: "Đã giao"\n• Khách thấy ngay: "Giao thành công"`,
    '✅'
  );
  if (!ok) return;

  try {
    const res  = await fetch((window.APP_CONTEXT || '') + '/NhanVienKhoServlet', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=xacNhanDaGiao&donHangId=' + encodeURIComponent(order._dbId || order.id)
    });
    const data = await res.json();
    if (!data.ok) { showToast('⚠️ ' + (data.msg || 'Lỗi cập nhật'), 'error'); return; }
  } catch(e) {
    showToast('Lỗi kết nối server!', 'error'); return;
  }

  showToast('✅ Đã giao thành công!\n✓ Admin đã thấy "Đã giao"', 'success');
  renderPendingOrders();
  try { renderStats(); } catch(e) {}
}

/* ── NHẬP LẠI KHO KHI KHÁCH HOÀN HÀNG: refunding → restocked ──
   Chỉ chạy sau khi Admin đã duyệt (refundApproved = true)
   Cộng lại tồn kho, ghi nhật ký, thông báo Admin */
async function doRestockOrder(orderId) {
  /* Tìm đơn từ bộ nhớ hiện tại (đã load từ DB) */
  const order = _khoOrders.find(o => o.id === orderId);
  if (!order) { showToast('Không tìm thấy đơn!', 'error'); return; 

  /* Guard: chỉ cho phép khi Admin đã duyệt */
  if (order.trangThai !== 'cho_hoan_kho') { showToast('Đơn chưa ở trạng thái chờ hoàn kho!', 'warning'); return; }
  }

  const itemLines = (order.items || []).map(i => `• ${i.name} × ${i.qty}`).join('\n');
  const ok = await showConfirm(
    'Xác nhận nhập lại kho',
    `Đơn ${orderId} — Khách hoàn hàng\n\nSản phẩm sẽ được nhập lại:\n${itemLines || '(Không có chi tiết)'}\n\nSau khi xác nhận → Admin sẽ xử lý hoàn tiền cho khách.`,
    '↩'
  );
  if (!ok) return;

  /* Gọi NhanVienKhoServlet nhapLaiKho — cộng tồn DB + ghi nhật ký */
  const dbId = order._dbId || order.id;
  try {
    const res  = await fetch((window.APP_CONTEXT || '') + '/NhanVienKhoServlet', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=nhapLaiKho&donHangId=' + encodeURIComponent(dbId)
    });
    const data = await res.json();
    if (!data.ok) { showToast('⚠️ ' + (data.msg || 'Nhập lại kho thất bại'), 'error'); return; }
  } catch(e) {
    showToast('Lỗi kết nối server!', 'error'); return;
  }

  /* Sync sang lactt_orders để khách biết hàng đã về kho */
  KhoStore.syncToCustomer(orderId, 'restocked', { restockedAt: _nowStr() });

  showToast(`↩ Nhập lại kho thành công!\n✓ Admin sẽ thực hiện hoàn tiền cho khách.`, 'success');
  renderPendingOrders();
  try { renderStats(); } catch(e) {}
}
let _selectedProduct = null;

let _importSearchTimer = null;

function initImportSearch() {
  const input = document.getElementById('importSearchInput');
  const list  = document.getElementById('importSearchResults');
  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(_importSearchTimer);
    const q = input.value.trim();

    // Nếu trống thì load 8 sản phẩm đầu ngay
    const url = (window.APP_CONTEXT || '') + '/NhanVienKhoServlet?action=searchSanPham&q=' + encodeURIComponent(q);
    _importSearchTimer = setTimeout(() => {
      fetch(url, { credentials: 'same-origin' })
        .then(res => res.json())
        .then(data => {
          const ps = (data.ok && data.data) ? data.data : [];
          list.innerHTML = ps.length === 0
            ? `<div style="padding:14px 16px;color:var(--light);font-size:.85rem">Không tìm thấy</div>`
            : ps.map(p => `
                <div class="import-result-item" onclick='selectImportProductFromDB(${p.id}, ${JSON.stringify(p.tenSp)}, ${JSON.stringify(p.thuongHieu)}, ${p.tonKho}, ${JSON.stringify(p.variants||[])})'>
                  <span class="import-result-emoji">📦</span>
                  <div class="import-result-info">
                    <div class="import-result-name">${escHtml(p.tenSp)}</div>
                    <div class="import-result-brand">${escHtml(p.thuongHieu)}${p.coVariant ? ' &middot; <span style="color:#c4626e;font-size:.75rem">Có định lượng</span>' : ''}</div>
                  </div>
                  <div class="import-result-stock">${p.coVariant ? '<span style="color:#c4626e;font-weight:600">Chọn →</span>' : 'Tồn: <strong>' + p.tonKho + '</strong>'}</div>
                </div>`).join('');
          list.classList.add('open');
        })
        .catch(() => {
          list.innerHTML = `<div style="padding:14px 16px;color:var(--danger);font-size:.85rem">Lỗi tải danh sách</div>`;
          list.classList.add('open');
        });
    }, 250);
  });

  input.addEventListener('focus', () => { input.dispatchEvent(new Event('input')); });
  document.addEventListener('click', e => { if (!e.target.closest('.import-search-wrap')) list.classList.remove('open'); });
}

/* Chọn sản phẩm từ kết quả tìm kiếm DB */
function selectImportProductFromDB(dbId, tenSp, thuongHieu, tonKho, variants) {
  _selectedProduct = { _dbId: dbId, id: String(dbId), name: tenSp, brand: thuongHieu, stock: tonKho, variants: variants || [] };
  document.getElementById('importSearchInput').value = `${tenSp} — ${thuongHieu}`;
  document.getElementById('importSearchResults').classList.remove('open');
  const sel = document.getElementById('importSelectedProduct');
  sel.classList.add('visible');
  document.getElementById('impSelEmoji').textContent = '📦';
  document.getElementById('impSelName').textContent  = tenSp;
  document.getElementById('impSelBrand').textContent = thuongHieu;

  // Nếu sản phẩm có variant → ẩn "tồn hộp", hiện bộ chọn variant
  const variantRow = document.getElementById('importVariantRow');
  const variantSel = document.getElementById('importVariantSelect');
  const stockEl    = document.getElementById('impSelStock');

  if (variants && variants.length > 0) {
    stockEl.textContent = '⚠️ Chọn định lượng để nhập hàng:';
    if (variantRow) {
      variantRow.style.display = 'block';
      variantSel.innerHTML = '<option value="">-- Chọn định lượng --</option>'
        + variants.map(v => `<option value="${escHtml(v.ten)}">  ${escHtml(v.ten)}  (tồn: ${v.soLuong})</option>`).join('');
      variantSel.onchange = () => {
        const chosen = variants.find(v => v.ten === variantSel.value);
        if (chosen) stockEl.textContent = `Tồn hiện tại [${chosen.ten}]: ${chosen.soLuong}`;
      };
    }
  } else {
    stockEl.textContent = `Tồn hiện tại: ${tonKho} hộp`;
    if (variantRow) variantRow.style.display = 'none';
    if (variantSel) variantSel.value = '';
  }

  document.getElementById('importQtyInput').value = '';
  document.getElementById('importQtyInput').focus();
}

/* Giữ lại để không break quickImport cũ (gọi bằng string id từ localStorage) */
function selectImportProduct(productId) {
  const prod = KhoStore.getProducts().find(p => p.id === productId);
  if (!prod) return;
  _selectedProduct = prod;
  document.getElementById('importSearchInput').value = `${prod.name} — ${prod.brand}`;
  document.getElementById('importSearchResults').classList.remove('open');
  const sel = document.getElementById('importSelectedProduct');
  sel.classList.add('visible');
  document.getElementById('impSelEmoji').textContent = prod.emoji || '📦';
  document.getElementById('impSelName').textContent  = prod.name;
  document.getElementById('impSelBrand').textContent = prod.brand;
  document.getElementById('impSelStock').textContent = `Tồn hiện tại: ${prod.stock} hộp`;
  document.getElementById('importQtyInput').value = '';
  document.getElementById('importQtyInput').focus();
}

function clearImportForm() {
  _selectedProduct = null;
  document.getElementById('importSearchInput').value = '';
  document.getElementById('importSelectedProduct').classList.remove('visible');
  document.getElementById('importQtyInput').value  = '';
  document.getElementById('importNoteInput').value = '';
  const variantRow = document.getElementById('importVariantRow');
  const variantSel = document.getElementById('importVariantSelect');
  if (variantRow) variantRow.style.display = 'none';
  if (variantSel) variantSel.innerHTML = '';
}

function saveImport() {
  if (!_selectedProduct) { showToast('Vui lòng chọn sản phẩm!', 'warning'); return; }
  const qty  = parseInt(document.getElementById('importQtyInput').value, 10);
  const note = document.getElementById('importNoteInput').value.trim();
  if (!qty || qty <= 0) { showToast('Vui lòng nhập số lượng hợp lệ!', 'warning'); return; }

  // Nếu SP có variant → bắt buộc chọn định lượng
  const variantSel  = document.getElementById('importVariantSelect');
  const hasVariants = _selectedProduct.variants && _selectedProduct.variants.length > 0;
  const tenVariant  = (variantSel && hasVariants) ? variantSel.value.trim() : '';
  if (hasVariants && !tenVariant) {
    showToast('⚠️ Vui lòng chọn định lượng (30ml / 50ml / 100ml)!', 'warning');
    variantSel.focus();
    return;
  }

  const btn = document.getElementById('importSaveBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu...'; }

  const body = new URLSearchParams({
    action:     'nhapHang',
    maSanPham:  _selectedProduct._dbId || _selectedProduct.id,
    soLuong:    qty,
    ghiChu:     note || `Nhập hàng từ ${_selectedProduct.brand || ''}`
  });
  if (tenVariant) body.append('tenVariant', tenVariant);

  fetch((window.APP_CONTEXT || '') + '/NhanVienKhoServlet', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        const label = tenVariant ? `${qty} [${tenVariant}]` : `${qty} hộp`;
        const stockInfo = data.coVariant
          ? (data.variants || []).map(v => `${v.ten}: ${v.soLuong}`).join(' | ')
          : `Tồn: ${data.tonCu} → ${data.tonMoi}`;
        showToast(`✅ Nhập ${label} "${_selectedProduct.name}"\n${stockInfo}`, 'success');
        clearImportForm();
        try { renderStats(); } catch(e) {}
        _renderRecentImport();
      } else {
        showToast(`❌ ${data.msg || 'Nhập hàng thất bại'}`, 'error');
      }
    })
    .catch(err => { console.error('saveImport fetch error:', err); showToast('❌ Không thể kết nối server', 'error'); })
    .finally(() => { if (btn) { btn.disabled = false; btn.textContent = 'Xác nhận nhập hàng'; } });
}

function _renderRecentImport() {
  const tbody = document.getElementById('recentImportBody');
  if (!tbody) return;

  fetch((window.APP_CONTEXT || '') + '/NhanVienKhoServlet?action=getNhatKy&loai=IN&limit=10', { credentials: 'same-origin' })
    .then(res => res.json())
    .then(data => {
      const logs = (data.ok && data.data) ? data.data : [];
      tbody.innerHTML = logs.length === 0
        ? `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--light);font-size:.85rem">Chưa có lịch sử</td></tr>`
        : logs.map(l => `
            <tr>
              <td style="font-size:.78rem;color:var(--mid);white-space:nowrap">${fmtDateTime(l.thoiGian)}</td>
              <td style="font-size:.85rem;font-weight:500">${escHtml(l.tenSp)}</td>
              <td style="font-size:.9rem;font-weight:700;color:var(--success)">+${l.soLuong}</td>
              <td style="font-size:.82rem;color:var(--mid)">${escHtml(l.tenNhanVien||'—')}</td>
              <td style="font-size:.78rem;color:var(--light)">${escHtml(l.ghiChu||'—')}</td>
            </tr>`).join('');
    })
    .catch(() => {});
}

/* ═══════════════════════════════════════════════
   PANEL 3 — TỒN KHO
═══════════════════════════════════════════════ */
let _invFilter = 'all';
let _invSearch = '';

function renderInventory() {
  const tbody = document.getElementById('inventoryTableBody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--light);font-size:.85rem">Đang tải dữ liệu...</td></tr>`;

  const params = new URLSearchParams({ action: 'getTonKho', filter: _invFilter });
  if (_invSearch) params.set('q', _invSearch);

  fetch((window.APP_CONTEXT || '') + '/NhanVienKhoServlet?' + params.toString(), { credentials: 'same-origin' })
    .then(res => res.json())
    .then(data => {
      if (!data.ok) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--danger)">Lỗi tải tồn kho</td></tr>`; return; }

      const list = data.data || [];

      // Cập nhật badge đầu trang
      const lowCount  = list.filter(p => p.tonKho > 0 && p.tonKho < 5).length;
      const zeroCount = list.filter(p => p.tonKho === 0).length;
      document.getElementById('invLowCount').textContent  = lowCount;
      document.getElementById('invZeroCount').textContent = zeroCount;

      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📦</div><h3>Không có sản phẩm</h3></div></td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(p => {
        const stock   = p.tonKho;
        const pct     = Math.min(100, Math.round(stock / 50 * 100));
        const fillCls = stock === 0 ? 'low' : stock < 5 ? 'low' : stock < 15 ? 'med' : 'high';
        const isLow   = stock < 5;

        // Render từng variant kèm tồn riêng
        const variantHtml = (p.variants && p.variants.length > 0)
          ? '<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px">'
            + p.variants.map(v => {
                const vLow  = v.soLuong === 0 || v.soLuong < 5;
                const color = v.soLuong === 0 ? '#e53e3e' : v.soLuong < 5 ? '#dd6b20' : '#276749';
                const bg    = v.soLuong === 0 ? '#fff5f5' : v.soLuong < 5 ? '#fffaf0' : '#f0fff4';
                return `<span style="font-size:.7rem;padding:2px 7px;border-radius:10px;background:${bg};color:${color};border:1px solid ${color}33;white-space:nowrap">${escHtml(v.ten)}: <b>${v.soLuong}</b></span>`;
              }).join('')
            + '</div>'
          : '';

        return `
          <tr class="${isLow?'low-stock':''}">
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:1.5rem">📦</span>
                <div>
                  <div style="font-weight:500;font-size:.88rem">${escHtml(p.tenSp)}</div>
                  ${variantHtml}
                  <div style="font-size:.72rem;color:var(--light);margin-top:2px">ID: ${p.id}</div>
                </div>
              </div>
            </td>
            <td style="font-size:.82rem;color:var(--mid)">${escHtml(p.thuongHieu)}</td>
            <td>
              <div class="stock-bar-wrap">
                <div class="stock-bar"><div class="stock-bar-fill ${fillCls}" style="width:${pct}%"></div></div>
                <span class="stock-num ${isLow?'low-text':''}">${stock}</span>
              </div>
            </td>
            <td>${stock===0?'<span class="badge badge-warn">🚫 Hết hàng</span>':isLow?'<span class="low-stock-warn">⚠️ Sắp hết</span>':'<span class="badge badge-ok">✅ Đủ hàng</span>'}</td>
            <td style="font-size:.85rem">${fmtMoney(p.gia)}</td>
            <td><button class="btn btn-outline btn-sm" onclick="quickImportById(${p.id}, '${escHtml(p.tenSp)}', '${escHtml(p.thuongHieu)}', ${stock})">+ Nhập thêm</button></td>
          </tr>`;
      }).join('');
    })
    .catch(() => {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--danger)">Không thể kết nối server</td></tr>`;
    });
}

function quickImport(productId) {
  switchPanel('import');
  setTimeout(() => selectImportProduct(productId), 120);
}

/* Dùng cho nút "+ Nhập thêm" trong bảng tồn kho (data từ DB) */
function quickImportById(dbId, tenSp, thuongHieu, tonKho) {
  _selectedProduct = { _dbId: dbId, id: String(dbId), name: tenSp, brand: thuongHieu, stock: tonKho };
  switchPanel('import');
  setTimeout(() => {
    document.getElementById('importSearchInput').value = `${tenSp} — ${thuongHieu}`;
    document.getElementById('importSearchResults').classList.remove('open');
    const sel = document.getElementById('importSelectedProduct');
    sel.classList.add('visible');
    document.getElementById('impSelEmoji').textContent = '📦';
    document.getElementById('impSelName').textContent  = tenSp;
    document.getElementById('impSelBrand').textContent = thuongHieu;
    document.getElementById('impSelStock').textContent = `Tồn hiện tại: ${tonKho} hộp`;
    document.getElementById('importQtyInput').value = '';
    document.getElementById('importQtyInput').focus();
  }, 120);
}

function setInvFilter(f, btn) {
  _invFilter = f;
  document.querySelectorAll('.inv-filter-btn').forEach(b => b.classList.remove('active','danger-active'));
  btn.classList.add(['low','out'].includes(f) ? 'danger-active' : 'active');
  renderInventory();
}

/* ═══════════════════════════════════════════════
   PANEL 4 — NHẬT KÝ KHO
═══════════════════════════════════════════════ */
let _logType   = 'all';
let _logSearch = '';

function renderLogs() {
  const tbody = document.getElementById('logsTableBody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--light);font-size:.85rem">Đang tải nhật ký...</td></tr>`;

  const params = new URLSearchParams({ action: 'getNhatKy', limit: '100' });
  if (_logType !== 'all') params.set('loai', _logType.toUpperCase());
  if (_logSearch) params.set('q', _logSearch);

  fetch((window.APP_CONTEXT || '') + '/NhanVienKhoServlet?' + params.toString(), { credentials: 'same-origin' })
    .then(res => res.json())
    .then(data => {
      if (!data.ok) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--danger)">Lỗi tải nhật ký</td></tr>`; return; }
      const logs = data.data || [];
      tbody.innerHTML = !logs.length
        ? `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📋</div><h3>Chưa có nhật ký</h3><p>Mọi thao tác nhập/xuất sẽ được ghi tại đây.</p></div></td></tr>`
        : logs.map(l => `
            <tr>
              <td style="font-size:.78rem;color:var(--mid);white-space:nowrap">${fmtDateTime(l.thoiGian)}</td>
              <td><span class="badge ${l.loai==='IN'?'badge-in':'badge-out'}">${l.loai==='IN'?'⬆️ Nhập':'⬇️ Xuất'}</span></td>
              <td style="font-size:.85rem;font-weight:500">${escHtml(l.tenSp)}</td>
              <td style="font-size:.9rem;font-weight:700;color:${l.loai==='IN'?'var(--success)':'var(--danger)'}">
                ${l.loai==='IN'?'+':'-'}${l.soLuong}
              </td>
              <td style="font-size:.82rem;color:var(--mid)">
                ${escHtml(l.tenNhanVien||'—')}
                ${l.maDonHang?`<br><span style="font-size:.7rem;color:var(--light)">Đơn #${l.maDonHang}</span>`:''}
              </td>
              <td style="font-size:.78rem;color:var(--light)">${escHtml(l.ghiChu||'—')}</td>
            </tr>`).join('');
    })
    .catch(() => {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--danger)">Không thể kết nối server</td></tr>`;
    });
}

/* ═══════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════ */
async function renderStats() {
  try {
    const res  = await fetch((window.APP_CONTEXT||'') + '/NhanVienKhoServlet?action=getStats', { credentials:'same-origin' });
    const data = await res.json();
    if (!data.ok) return;

    document.getElementById('statPending').textContent  = data.pending  ?? 0;
    document.getElementById('statLowStock').textContent = data.lowStock ?? 0;
    document.getElementById('statTodayIn').textContent  = data.todayIn  ?? 0;
    document.getElementById('statTodayOut').textContent = data.todayOut ?? 0;

    const badge = document.getElementById('navBadgeOrders');
    if (badge) {
      badge.textContent   = data.badge ?? 0;
      badge.style.display = (data.badge > 0) ? '' : 'none';
    }
  } catch(e) { console.error('[renderStats]', e); }
}

/* ─────────────────────────────────────────────
   POLLING 10s — phát hiện đơn mới từ Admin
───────────────────────────────────────────── */
let _lastConfirmedCount = 0;
let _lastRefundingCount = 0;
let _lastRestockedCount = 0;
function startPolling() {
  setInterval(async () => {
    try {
      const res  = await fetch((window.APP_CONTEXT||'') + '/NhanVienKhoServlet?action=getStats', { credentials:'same-origin' });
      const data = await res.json();
      if (!data.ok) return;

      const confirmed = data.pending  ?? 0;
      const refunding = Math.max(0, (data.badge ?? 0) - confirmed);

      if (confirmed > _lastConfirmedCount) {
        showToast(`\uD83D\uDD14 Có ${confirmed - _lastConfirmedCount} đơn mới cần đóng gói!`, 'info');
        renderStats();
        if (document.getElementById('panel-orders')?.classList.contains('active')) renderPendingOrders();
      }
      if (refunding > _lastRefundingCount) {
        showToast(`\u21A9 Có ${refunding - _lastRefundingCount} yêu cầu hoàn hàng đã được Admin duyệt — cần nhập lại kho!`, 'warning');
        renderStats();
        if (document.getElementById('panel-orders')?.classList.contains('active')) renderPendingOrders();
      }

      _lastConfirmedCount = confirmed;
      _lastRefundingCount = refunding;
    } catch(e) { /* bỏ qua lỗi mạng tạm thời */ }
  }, 10000);
}

/* ─────────────────────────────────────────────
   KHỞI TẠO
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* 1. AUTH (Đã sửa lỗi phân quyền và nháy loạn) */
  const user = KhoStore.getUser();
  const role = user?.vaiTro || user?.role; // Chấp nhận cả chuẩn mới và chuẩn cũ
  
  if (!role || !['nhan_vien_kho', 'warehouse', 'admin'].includes(role)) {
    window.location.replace('dangnhap.jsp'); 
    return;
  }
  
  document.getElementById('sidebarUserName').textContent  = _actorName();
  document.getElementById('sidebarUserEmail').textContent = user.email || '';

  /* Sidebar mobile */
  document.getElementById('sidebarToggleBtn')?.addEventListener('click', () => {
    document.getElementById('khoSidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
  });
  document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
    document.getElementById('khoSidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  });

  /* Nav items */
  document.querySelectorAll('.nav-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => {
      switchPanel(item.dataset.panel);
      document.getElementById('khoSidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('active');
    });
  });

  /* Confirm dialog */
  document.getElementById('confirmOkBtn')?.addEventListener('click', () => {
    document.getElementById('confirmDialog').classList.remove('open');
    if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
  });
  document.getElementById('confirmCancelBtn')?.addEventListener('click', () => {
    document.getElementById('confirmDialog').classList.remove('open');
    if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
  });

  /* 2. LOGOUT (Gọi Server để hủy Session an toàn) */
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
    fetch('DangNhapServlet', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=logout'
    }).finally(() => {
      localStorage.removeItem('lactt_user');
      localStorage.removeItem('lactt_cart');   // Xoá cart khi logout
      window.location.replace('dangnhap.jsp');
    });
  });

  /* Import */
  initImportSearch();
  document.getElementById('importSaveBtn')?.addEventListener('click', saveImport);
  document.getElementById('importClearBtn')?.addEventListener('click', clearImportForm);

  /* Inventory search */
  document.getElementById('invSearchInput')?.addEventListener('input', e => { _invSearch = e.target.value.trim(); renderInventory(); });

  /* Log filters */
  document.getElementById('logSearchInput')?.addEventListener('input', e => { _logSearch = e.target.value.trim(); renderLogs(); });
  document.querySelectorAll('.log-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _logType = btn.dataset.type;
      document.querySelectorAll('.log-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLogs();
    });
  });

  /* Khởi chạy */
  document.getElementById('khoHeaderSubtitle').textContent = _nowStr();
  renderStats();
  switchPanel('orders');
  _renderRecentImport();
  _lastConfirmedCount = 0;
  _lastRefundingCount = 0;
  startPolling();
});

/* =======================================================
   CÁC HÀM XỬ LÝ CHỌN TẤT CẢ VÀ THAO TÁC HÀNG LOẠT (KANBAN)
======================================================= */

// 1. Tick chọn tất cả bên cột XUẤT KHO
function toggleSelectAllExport(checkbox) {
  document.querySelectorAll('.cb-export').forEach(cb => cb.checked = checkbox.checked);
  updateBulkUI();
}

// 2. Tick chọn tất cả bên cột ĐÃ GIAO
function toggleSelectAllDelivered(checkbox) {
  document.querySelectorAll('.cb-delivered').forEach(cb => cb.checked = checkbox.checked);
  updateBulkUI();
}

// 3. Cập nhật giao diện (hiện nút & đếm số lượng)
function updateBulkUI() {
  const checkedExport = document.querySelectorAll('.cb-export:checked').length;
  const checkedDelivered = document.querySelectorAll('.cb-delivered:checked').length;
  
  const btnExport = document.getElementById('btnBulkExport');
  const btnDelivered = document.getElementById('btnBulkDelivered');
  
  if (btnExport) {
    btnExport.style.display = checkedExport > 0 ? 'inline-flex' : 'none';
    const countSpan = document.getElementById('bulkCountExport');
    if (countSpan) countSpan.textContent = checkedExport;
  }
  
  if (btnDelivered) {
    btnDelivered.style.display = checkedDelivered > 0 ? 'inline-flex' : 'none';
    const countSpan = document.getElementById('bulkCountDelivered');
    if (countSpan) countSpan.textContent = checkedDelivered;
  }
  
  // Xử lý tự động tick/bỏ tick ô "Chọn tất cả" trên cùng
  const selectAllE = document.getElementById('selectAllExport');
  if (selectAllE) selectAllE.checked = (checkedExport === document.querySelectorAll('.cb-export').length && checkedExport > 0);

  const selectAllD = document.getElementById('selectAllDelivered');
  if (selectAllD) selectAllD.checked = (checkedDelivered === document.querySelectorAll('.cb-delivered').length && checkedDelivered > 0);
}

// 4. Bấm nút Xuất kho hàng loạt
async function doBulkExport() {
  const checkboxes = document.querySelectorAll('.cb-export:checked');
  if (checkboxes.length === 0) return;
  const ok = await showConfirm('Xác nhận xuất kho', `Hệ thống sẽ tự động xuất kho ${checkboxes.length} đơn hàng?`, '📦');
  if (!ok) return;

  const btn = document.getElementById('btnBulkExport');
  if (btn) { btn.innerHTML = '⏳ Đang xử lý...'; btn.style.pointerEvents = 'none'; }

  let successCount = 0;
  for (let cb of checkboxes) {
    try {
      const res = await fetch((window.APP_CONTEXT || '') + '/NhanVienKhoServlet', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=xuatKho&donHangId=' + encodeURIComponent(cb.value)
      });
      if ((await res.json()).ok) successCount++;
    } catch (e) {}
  }
  showToast(`✅ Đã xuất kho thành công ${successCount} đơn hàng!`, 'success');
  renderPendingOrders();
  try { renderStats(); } catch(e) {}
}

// 5. Bấm nút Đã giao hàng loạt
async function doBulkDelivered() {
  const checkboxes = document.querySelectorAll('.cb-delivered:checked');
  if (checkboxes.length === 0) return;
  const ok = await showConfirm('Xác nhận đã giao', `Xác nhận ${checkboxes.length} đơn đã giao thành công?`, '✅');
  if (!ok) return;

  const btn = document.getElementById('btnBulkDelivered');
  if (btn) { btn.innerHTML = '⏳ Đang xử lý...'; btn.style.pointerEvents = 'none'; }

  let successCount = 0;
  for (let cb of checkboxes) {
    try {
      const res = await fetch((window.APP_CONTEXT || '') + '/NhanVienKhoServlet', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=xacNhanDaGiao&donHangId=' + encodeURIComponent(cb.value)
      });
      if ((await res.json()).ok) successCount++;
    } catch (e) {}
  }
  showToast(`✅ Đã xác nhận giao ${successCount} đơn hàng!`, 'success');
  renderPendingOrders();
  try { renderStats(); } catch(e) {}
}