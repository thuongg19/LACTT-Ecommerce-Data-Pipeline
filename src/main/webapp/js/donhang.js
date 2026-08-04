'use strict';
/* ═══════════════════════════════════════════════════════════════
   donhang.js — Quản lý Đơn hàng Admin LACTT
   Kết nối thật với AdminDonHangServlet /admin/don-hang-api
═══════════════════════════════════════════════════════════════ */

function getAPI() { return (window.APP_CONTEXT || '') + '/admin/don-hang-api'; }
var API = null; // sẽ được gán sau DOMContentLoaded

/* ── Tiện ích ── */
function fmt(n) { return Number(n || 0).toLocaleString('vi-VN') + '₫'; }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function toast(msg, dur) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._tm); t._tm = setTimeout(function(){ t.classList.remove('show'); }, dur || 2800);
}

/* ── Nhãn & màu trạng thái ── */
const STATUS_LABEL = {
  cho_xac_nhan:  'Chờ xác nhận',
  dang_chuan_bi: 'Đang chuẩn bị',
  dang_giao:     'Đang giao hàng',
  da_giao:       'Đã giao',
  hoan_thanh:    'Hoàn thành',
  da_huy:        'Đã huỷ',
  yeu_cau_hoan:  'Yêu cầu hoàn',
  cho_hoan_kho:  'Chờ hoàn kho',
  cho_hoan_tien: 'Chờ hoàn tiền',
  da_hoan_tien:  'Đã hoàn tiền',
};
function statusBadge(s) {
  return '<span class="status-badge s-' + esc(s) + '">' + esc(STATUS_LABEL[s] || s) + '</span>';
}

/* ── Timeline cố định theo luồng ── */
const TIMELINE_STEPS = [
  { key: 'cho_xac_nhan',  label: 'Chờ XN',       icon: '📋' },
  { key: 'dang_chuan_bi', label: 'Chuẩn bị',      icon: '📦' },
  { key: 'dang_giao',     label: 'Đang giao',      icon: '🚚' },
  { key: 'da_giao',       label: 'Đã giao',        icon: '📬' },
  { key: 'hoan_thanh',    label: 'Hoàn thành',     icon: '✅' },
];
const CANCEL_STATUSES  = ['da_huy'];
const RETURN_STATUSES  = ['yeu_cau_hoan','cho_hoan_kho','cho_hoan_tien','da_hoan_tien'];

function buildTimeline(currentStatus) {
  var html = '';
  if (CANCEL_STATUSES.includes(currentStatus)) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0">'
         + '<span class="tl-dot cancel">✕</span>'
         + '<span style="font-size:0.82rem;color:#991B1B;font-weight:600">Đơn hàng đã huỷ</span></div>';
  }
  if (RETURN_STATUSES.includes(currentStatus)) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0">'
         + '<span class="tl-dot active">↩</span>'
         + '<span style="font-size:0.82rem;color:#7E22CE;font-weight:600">'
         + esc(STATUS_LABEL[currentStatus] || currentStatus) + '</span></div>';
  }
  var currentIdx = TIMELINE_STEPS.findIndex(function(s){ return s.key === currentStatus; });
  TIMELINE_STEPS.forEach(function(step, i) {
    var isDone   = i < currentIdx;
    var isActive = i === currentIdx;
    var cls = isDone ? 'done' : (isActive ? 'active' : '');
    html += '<div class="tl-step">'
          + '<div class="tl-dot ' + cls + '">' + (isDone ? '✓' : step.icon) + '</div>'
          + '<div class="tl-label ' + cls + '">' + step.label + '</div>'
          + '</div>';
    if (i < TIMELINE_STEPS.length - 1) {
      html += '<div class="tl-line ' + (isDone ? 'done' : '') + '"></div>';
    }
  });
  return html;
}

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
var state = {
  page: 1, pageSize: 15, totalPages: 1,
  status: 'all', keyword: '',
  currentOrderId: 0, currentOrderStatus: '',
  pendingAction: null,
};

/* ══════════════════════════════════════════════
   LOAD DANH SÁCH ĐƠN HÀNG
══════════════════════════════════════════════ */
function loadOrders() {
  var tbody = document.getElementById('orderTbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:30px;color:#9e8e82">Đang tải...</td></tr>';

  var params = '?action=list&page=' + state.page + '&pageSize=' + state.pageSize;
  if (state.status && state.status !== 'all') params += '&trangThai=' + encodeURIComponent(state.status);
  if (state.keyword) params += '&keyword=' + encodeURIComponent(state.keyword);

  fetch(API + params, { credentials: 'same-origin' })
    .then(function(r) {
      if (r.status === 403) { toast('⚠ Phiên đăng nhập hết hạn — vui lòng đăng nhập lại'); window.location.href = window.APP_CONTEXT + '/dangnhap.jsp'; return null; }
      return r.json();
    })
    .then(function(data) {
      if (!data) return;
      if (!data.success) { toast('Lỗi: ' + data.message); return; }
      state.totalPages = data.totalPages || 1;
      renderTable(data.data || []);
      renderPagination(data.total || 0);
    })
    .catch(function(e) { toast('Lỗi kết nối server'); console.error(e); });
}

function renderTable(orders) {
  var tbody = document.getElementById('orderTbody');
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:40px;color:#9e8e82">Không có đơn hàng nào</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(function(o) {
    return '<tr>'
      + '<td><strong style="color:#c4626e;font-size:0.82rem">' + esc(o.maDonHang) + '</strong></td>'
      + '<td>'
        + '<div style="font-weight:500;font-size:0.88rem">' + esc(o.hoTenKH || o.tenNguoiNhan) + '</div>'
        + '<div style="font-size:0.75rem;color:#9e8e82">' + esc(o.soDienThoai) + '</div>'
      + '</td>'
      + '<td style="font-size:0.82rem;color:#9e8e82;white-space:nowrap">' + esc(o.ngayDat) + '</td>'
      + '<td style="font-weight:600;white-space:nowrap">' + fmt(o.tongTien) + '</td>'
      + '<td style="font-size:0.8rem">' + esc(formatPTT(o.phuongThucTT)) + '</td>'
      + '<td>' + statusBadge(o.trangThai) + '</td>'
      + '<td><div class="tbl-actions">'
        + '<button class="btn-tbl primary" onclick="openDetail(' + o.id + ')">Chi tiết</button>'
        + quickActions(o)
      + '</div></td>'
      + '</tr>';
  }).join('');
}

function formatPTT(ptt) {
  var map = { cod:'Tiền mặt', momo:'MoMo', vnpay:'VNPay', zalopay:'ZaloPay', card:'Thẻ', bank:'Chuyển khoản' };
  return map[ptt] || ptt || '—';
}

/* Nút nhanh trên bảng theo trạng thái */
function quickActions(o) {
  var btns = '';
  var s = o.trangThai;
  if (s === 'cho_xac_nhan') {
    btns += '<button class="btn-tbl success" onclick="doAction(' + o.id + ',\'confirmOrder\',\'Xác nhận đơn hàng #' + esc(o.maDonHang) + '?\',\'Xác nhận\')">✓ Xác nhận</button>';
    btns += '<button class="btn-tbl danger" onclick="doAction(' + o.id + ',\'cancelOrder\',\'Huỷ đơn hàng #' + esc(o.maDonHang) + '?\',\'Huỷ\')">✕ Huỷ</button>';
  }
  if (s === 'da_giao') {
    btns += '<button class="btn-tbl success" onclick="doAction(' + o.id + ',\'markCompleted\',\'Xác nhận đơn đã hoàn thành?\',\'Hoàn thành\')">✓ Hoàn thành</button>';
  }
  if (s === 'yeu_cau_hoan') {
    btns += '<button class="btn-tbl" onclick="doAction(' + o.id + ',\'approveReturn\',\'Duyệt yêu cầu hoàn hàng?\',\'Duyệt hoàn\')">Duyệt hoàn</button>';
    btns += '<button class="btn-tbl danger" onclick="doAction(' + o.id + ',\'rejectReturn\',\'Từ chối yêu cầu hoàn hàng?\',\'Từ chối\')">Từ chối</button>';
  }
  if (s === 'cho_hoan_tien') {
    btns += '<button class="btn-tbl success" onclick="doAction(' + o.id + ',\'updateStatus\',\'Xác nhận đã hoàn tiền cho khách?\',\'Hoàn tiền\',\'da_hoan_tien\')">Hoàn tiền</button>';
  }
  return btns;
}

/* ══════════════════════════════════════════════
   STAT CARDS
══════════════════════════════════════════════ */
function loadStats() {
  fetch(API + '?action=countStatus', { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success) return;
      var bar = document.getElementById('statBar');
      var counts = data.counts || {};
      var total  = data.total || 0;
      var cards = [
        { key: 'all',          label: 'Tất cả',           num: total },
        { key: 'cho_xac_nhan', label: 'Chờ xác nhận',    num: counts['cho_xac_nhan'] || 0 },
        { key: 'dang_chuan_bi',label: 'Đang chuẩn bị',   num: counts['dang_chuan_bi'] || 0 },
        { key: 'dang_giao',    label: 'Đang giao',        num: counts['dang_giao'] || 0 },
        { key: 'hoan_thanh',   label: 'Hoàn thành',       num: counts['hoan_thanh'] || 0 },
      ];
      bar.innerHTML = cards.map(function(c) {
        return '<div class="order-stat' + (state.status === c.key ? ' active-stat' : '') + '" data-key="' + c.key + '">'
          + '<div class="stat-num">' + c.num + '</div>'
          + '<div class="stat-label">' + c.label + '</div>'
          + '</div>';
      }).join('');

      // Badge sidebar chờ xác nhận
      var pending = counts['cho_xac_nhan'] || 0;
      var badge = document.getElementById('navBadgePending');
      if (badge) { badge.textContent = pending; badge.style.display = pending ? 'inline' : 'none'; }

      bar.querySelectorAll('.order-stat').forEach(function(card) {
        card.addEventListener('click', function() {
          state.status = card.dataset.key;
          state.page = 1;
          // Sync tab
          document.querySelectorAll('.filter-tab').forEach(function(t){ t.classList.toggle('active', t.dataset.status === state.status); });
          loadOrders();
          loadStats();
        });
      });
    });
}

/* ══════════════════════════════════════════════
   PAGINATION
══════════════════════════════════════════════ */
function renderPagination(total) {
  var pg = document.getElementById('pagination');
  if (!pg || state.totalPages <= 1) { if(pg) pg.innerHTML = ''; return; }
  var html = '';
  html += '<button class="page-btn" ' + (state.page <= 1 ? 'disabled' : '') + ' onclick="gotoPage(' + (state.page-1) + ')">‹</button>';
  for (var i = 1; i <= state.totalPages; i++) {
    if (state.totalPages > 7 && Math.abs(i - state.page) > 2 && i !== 1 && i !== state.totalPages) {
      if (i === 2 || i === state.totalPages - 1) html += '<span style="padding:0 4px;color:#9e8e82">…</span>';
      continue;
    }
    html += '<button class="page-btn' + (i === state.page ? ' active' : '') + '" onclick="gotoPage(' + i + ')">' + i + '</button>';
  }
  html += '<button class="page-btn" ' + (state.page >= state.totalPages ? 'disabled' : '') + ' onclick="gotoPage(' + (state.page+1) + ')">›</button>';
  html += '<span style="font-size:0.78rem;color:#9e8e82;margin-left:8px">Tổng ' + total + ' đơn</span>';
  pg.innerHTML = html;
}
function gotoPage(p) { state.page = p; loadOrders(); }

/* ══════════════════════════════════════════════
   MODAL CHI TIẾT
══════════════════════════════════════════════ */
function openDetail(id) {
  fetch(API + '?action=detail&id=' + id, { credentials: 'same-origin' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success) { toast('Không tải được chi tiết đơn hàng'); return; }
      var dh = data.donHang;
      state.currentOrderId = dh.id;
      state.currentOrderStatus = dh.trangThai;

      document.getElementById('modalTitle').textContent = 'Chi tiết đơn hàng';
      document.getElementById('modalCode').textContent  = '#' + dh.maDonHang;
      document.getElementById('orderTimeline').innerHTML = buildTimeline(dh.trangThai);

      document.getElementById('mTen').textContent      = dh.tenNguoiNhan || '—';
      document.getElementById('mSdt').textContent      = dh.soDienThoai  || '—';
      document.getElementById('mDiaChi').textContent   = dh.diaChiGiao   || '—';
      document.getElementById('mEmail').textContent    = dh.emailKH       || '—';
      document.getElementById('mGhiChu').textContent   = dh.ghiChu        || '—';
      document.getElementById('mPtt').textContent      = formatPTT(dh.phuongThucTT);
      document.getElementById('mTamTinh').textContent  = fmt(dh.tongTamTinh);
      document.getElementById('mPhiVC').textContent    = fmt(dh.phiVanChuyen);
      document.getElementById('mGiamGia').textContent  = dh.giamGia > 0 ? '-' + fmt(dh.giamGia) : '0₫';
      document.getElementById('mTongTien').textContent = fmt(dh.tongTien);
      document.getElementById('mGhiChuAdmin').textContent = dh.ghiChuAdmin || 'Chưa có ghi chú';

      // Chi tiết sản phẩm
      var ctHtml = (data.chiTiet || []).map(function(ct) {
        return '<div class="ct-item">'
          + '<div class="ct-img">' + (ct.hinhAnh ? '<img src="' + esc(ct.hinhAnh) + '" style="width:44px;height:44px;object-fit:cover;border-radius:6px"/>' : '📦') + '</div>'
          + '<div style="flex:1;min-width:0">'
            + '<div class="ct-name">' + esc(ct.tenSanPham) + '</div>'
            + '<div class="ct-variant">' + esc(ct.tenVariant || ct.thuongHieu || '') + ' × ' + ct.soLuong + '</div>'
          + '</div>'
          + '<div class="ct-price">'
            + '<div class="ct-price unit">' + fmt(ct.gia) + '/sp</div>'
            + '<div class="ct-price total">' + fmt(ct.thanhTien) + '</div>'
          + '</div>'
          + '</div>';
      }).join('');
      document.getElementById('mChiTiet').innerHTML = ctHtml || '<p style="color:#9e8e82;font-size:0.83rem">Không có dữ liệu</p>';

      // Action panel
      document.getElementById('actionPanel').innerHTML = buildActionPanel(dh.trangThai, dh.id);
      document.getElementById('modalBackdrop').classList.add('show');
    })
    .catch(function(e) { toast('Lỗi kết nối'); console.error(e); });
}

function buildActionPanel(status, id) {
  var html = '<div class="action-panel-title">Thao tác Admin</div><div class="action-btns">';

  if (status === 'cho_xac_nhan') {
    html += '<button class="btn btn-success btn-sm" onclick="doActionModal(\'confirmOrder\',\'Xác nhận đơn hàng và chuyển sang kho chuẩn bị?\')">✓ Xác nhận đơn</button>';
    html += '<button class="btn btn-danger btn-sm" onclick="doActionModal(\'cancelOrder\',\'Huỷ đơn hàng này?\')">✕ Huỷ đơn</button>';
  }
  if (status === 'da_giao') {
    html += '<button class="btn btn-success btn-sm" onclick="doActionModal(\'markCompleted\',\'Xác nhận đơn đã hoàn thành?\')">✓ Đánh dấu Hoàn thành</button>';
    html += '<button class="btn btn-sm btn-warning" onclick="doActionModal(\'approveReturn\',\'Chuyển đơn sang trạng thái yêu cầu hoàn?\')">Cho phép hoàn hàng</button>';
  }
  if (status === 'yeu_cau_hoan') {
    html += '<button class="btn btn-sm btn-warning" onclick="doActionModal(\'approveReturn\',\'Duyệt yêu cầu hoàn hàng — chuyển cho kho xử lý?\')">Duyệt hoàn hàng</button>';
    html += '<button class="btn btn-danger btn-sm" onclick="doActionModal(\'rejectReturn\',\'Từ chối yêu cầu hoàn hàng?\')">Từ chối hoàn</button>';
  }
  if (status === 'cho_hoan_tien') {
    html += '<button class="btn btn-success btn-sm" onclick="doActionModal(\'updateStatus\',\'Xác nhận đã hoàn tiền cho khách?\',\'da_hoan_tien\')">✓ Đã hoàn tiền</button>';
  }
  if (!['da_huy','da_hoan_tien','hoan_thanh'].includes(status)) {
    html += '<button class="btn btn-danger btn-sm" onclick="doActionModal(\'cancelOrder\',\'Admin huỷ đơn hàng này?\')">✕ Huỷ đơn (Admin)</button>';
  }
  // Admin override luôn có
  html += '<button class="btn btn-outline btn-sm" onclick="openOverride()">⚙ Override trạng thái</button>';
  html += '</div>';
  return html;
}

/* ══════════════════════════════════════════════
   GỌI API THAY ĐỔI TRẠNG THÁI
══════════════════════════════════════════════ */
function doActionModal(action, msg, extraStatus) {
  state.pendingAction = { action: action, extraStatus: extraStatus };
  document.getElementById('confirmTitle').textContent = 'Xác nhận thao tác';
  document.getElementById('confirmMsg').textContent   = msg;
  document.getElementById('confirmNote').value = '';
  document.getElementById('confirmBackdrop').classList.add('show');
}

function doAction(id, action, msg, btnLabel, extraStatus) {
  state.currentOrderId = id;
  state.pendingAction  = { action: action, extraStatus: extraStatus };
  document.getElementById('confirmTitle').textContent = btnLabel || 'Xác nhận';
  document.getElementById('confirmMsg').textContent   = msg;
  document.getElementById('confirmNote').value = '';
  document.getElementById('confirmBackdrop').classList.add('show');
}

function executeAction() {
  var pa   = state.pendingAction;
  if (!pa || !state.currentOrderId) return;
  var note = document.getElementById('confirmNote').value.trim();

  var body = 'action=' + encodeURIComponent(pa.action)
           + '&id=' + state.currentOrderId
           + '&ghiChu=' + encodeURIComponent(note)
           + '&lyDo='   + encodeURIComponent(note);
  if (pa.extraStatus) body += '&trangThai=' + encodeURIComponent(pa.extraStatus);

  fetch(API, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    document.getElementById('confirmBackdrop').classList.remove('show');
    if (data.success) {
      toast('✓ ' + (data.message || 'Thành công'));
      loadOrders(); loadStats();
      if (document.getElementById('modalBackdrop').classList.contains('show')) {
        openDetail(state.currentOrderId);
      }
    } else {
      toast('✗ ' + (data.message || 'Thất bại'));
    }
  })
  .catch(function() { toast('Lỗi kết nối server'); });
}

/* ── Override ── */
function openOverride() {
  document.getElementById('overrideStatus').value = state.currentOrderStatus;
  document.getElementById('overrideNote').value   = '';
  document.getElementById('overrideBackdrop').classList.add('show');
}
function executeOverride() {
  var newStatus = document.getElementById('overrideStatus').value;
  var note      = document.getElementById('overrideNote').value.trim();
  var body = 'action=updateStatus&id=' + state.currentOrderId
           + '&trangThai=' + encodeURIComponent(newStatus)
           + '&ghiChu='    + encodeURIComponent(note || 'Admin override');
  fetch(API, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    document.getElementById('overrideBackdrop').classList.remove('show');
    if (data.success) {
      toast('✓ Đã cập nhật trạng thái → ' + (STATUS_LABEL[newStatus] || newStatus));
      loadOrders(); loadStats();
      if (document.getElementById('modalBackdrop').classList.contains('show')) {
        openDetail(state.currentOrderId);
      }
    } else {
      toast('✗ ' + (data.message || 'Thất bại'));
    }
  })
  .catch(function(){ toast('Lỗi kết nối'); });
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  API = getAPI();

  // Ngày header
  var hd = document.getElementById('headerDate');
  if (hd) hd.textContent = new Date().toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Sidebar toggle
  var toggleBtn = document.getElementById('sidebarToggleBtn');
  var overlay   = document.getElementById('sidebarOverlay');
  var layout    = document.querySelector('.admin-layout');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      layout && layout.classList.toggle('sidebar-open');
      overlay && overlay.classList.toggle('active');
    });
  }
  if (overlay) overlay.addEventListener('click', function() {
    layout && layout.classList.remove('sidebar-open');
    overlay.classList.remove('active');
  });

  // Logout
  var btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', function() {
    if (confirm('Đăng xuất?')) window.location.href = window.APP_CONTEXT + '/LogoutServlet';
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.filter-tab').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      state.status = tab.dataset.status;
      state.page   = 1;
      loadOrders(); loadStats();
    });
  });

  // Search
  document.getElementById('btnSearch').addEventListener('click', function() {
    state.keyword = document.getElementById('searchInput').value.trim();
    state.page    = 1;
    loadOrders();
  });
  document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('btnSearch').click();
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', function() {
    document.getElementById('modalBackdrop').classList.remove('show');
  });
  document.getElementById('modalBackdrop').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
  });

  // Confirm action
  document.getElementById('btnConfirmAction').addEventListener('click', executeAction);

  // Override confirm
  document.getElementById('btnConfirmOverride').addEventListener('click', executeOverride);

  // Load dữ liệu lần đầu
  loadStats();
  loadOrders();
});