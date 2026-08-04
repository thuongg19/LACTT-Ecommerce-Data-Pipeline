/* =============================================
   LACTT — taikhoan.js  (v5 — Dynamic Orders + Real-time Timeline)
   ============================================= */
'use strict';

/* ══════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════ */
function fmt(n) { return Number(n || 0).toLocaleString('vi-VN') + '₫'; }
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function showToast(msg, dur) {
  const toast = document.getElementById('tkToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), dur || 3000);
}

/* ══════════════════════════════════════════════
   STATUS CONFIG — map trạng thái sang label + CSS
══════════════════════════════════════════════ */
const TK_STATUS = {
  processing:    { label: 'Đang xử lý',           cls: 'status-processing' },
  pending:       { label: 'Chờ xác nhận',          cls: 'status-processing' },
  confirmed:     { label: 'Chờ lấy hàng',          cls: 'status-confirmed'  },
  packing:       { label: 'Đang đóng gói',         cls: 'status-packing'    },
  shipping:      { label: 'Đang giao',             cls: 'status-delivering' },
  delivering:    { label: 'Đang giao',             cls: 'status-delivering' },
  delivered:     { label: 'Đã giao thành công',    cls: 'status-delivered'  },
  cancelled:     { label: 'Đã hủy',               cls: 'status-cancelled'  },
  refunding:     { label: 'Đang hoàn tiền',        cls: 'status-processing' },
  // ── Trạng thái hoàn hàng từ DB ──
  yeu_cau_hoan:  { label: 'Yêu cầu hoàn hàng',    cls: 'status-processing' },
  cho_hoan_kho:  { label: 'Chờ kho xử lý hoàn',   cls: 'status-processing' },
  cho_hoan_tien: { label: 'Chờ hoàn tiền',         cls: 'status-processing' },
  da_hoan_tien:  { label: 'Đã hoàn tiền',          cls: 'status-delivered'  },
  hoan_thanh:    { label: 'Hoàn thành',            cls: 'status-delivered'  },
};

function getStatus(s) {
  return TK_STATUS[s] || { label: s, cls: 'status-processing' };
}

/* Nhóm status filter — status nào match filter nào */
const FILTER_MAP = {
  all:       () => true,
  pending:   s => s === 'pending' || s === 'processing',
  confirmed: s => s === 'confirmed',
  packing:   s => s === 'packing',
  shipping:  s => s === 'shipping' || s === 'delivering',
  delivered: s => s === 'delivered',
  cancelled: s => s === 'cancelled' || s === 'refunding'
                || s === 'yeu_cau_hoan' || s === 'cho_hoan_kho'
                || s === 'cho_hoan_tien' || s === 'da_hoan_tien',
};

/* ══════════════════════════════════════════════
   TIMELINE — các bước chuẩn của đơn hàng
══════════════════════════════════════════════ */
const TIMELINE_STEPS = [
  { status: 'placed',    label: 'Đã đặt hàng thành công' },
  { status: 'confirmed', label: 'Đơn hàng đã được Admin xác nhận' },
  { status: 'packing',   label: 'Đang đóng gói hàng tại kho' },
  { status: 'shipping',  label: 'Đã bàn giao cho đơn vị vận chuyển (GHN)' },
  { status: 'delivered', label: 'Giao hàng thành công' },
];

/* Ánh xạ status → index trong TIMELINE_STEPS */
const STATUS_IDX = {
  processing:    0,
  pending:       0,
  confirmed:     1,
  packing:       2,
  shipping:      3,
  delivering:    3,
  delivered:     4,
  cancelled:    -1,
  refunding:     4,
  // ── Hoàn hàng (đã giao xong, đang xử lý hoàn) ──
  yeu_cau_hoan:  4,
  cho_hoan_kho:  4,
  cho_hoan_tien: 4,
  da_hoan_tien:  4,
  hoan_thanh:    4,
};

function _parseDate(str) {
  if (!str) return new Date();
  const m1 = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (m1) return new Date(m1[3], m1[2]-1, m1[1], m1[4], m1[5]);
  const m2 = str.match(/(\d{1,2}):(\d{2}).*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m2) return new Date(m2[5], m2[4]-1, m2[3], m2[1], m2[2]);
  return new Date(str);
}

function parseVNDate(str) {
  if (!str) return new Date();
  /* "10:02 · 14/04/2026" hoặc "10:02 14/04/2026" */
  const match = str.match(/(\d{1,2}):(\d{2})[^0-9]*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return new Date(+match[5], +match[4]-1, +match[3], +match[1], +match[2]);
  }
  /* "13/04/2026 09:32" */
  const match2 = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (match2) {
    return new Date(+match2[3], +match2[2]-1, +match2[1], +match2[4], +match2[5]);
  }
  return new Date();
}

function _fmtDateTime(d) {
  try {
    return d.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})
         + ' · ' + d.toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric'});
  } catch(e) { return ''; }
}

/* ── Build HTML timeline từ đơn hàng ── */
function buildTimelineHTML(order) {
  const status     = order.status || 'pending';
  const currentIdx = STATUS_IDX[status] ?? 0;
  const date       = _parseDate(order.date);
  const dateStr    = _fmtDateTime(date);

  /* Đơn bị hủy hoặc đang trong quá trình hoàn hàng */
  const RETURN_STATUSES = ['yeu_cau_hoan', 'cho_hoan_kho', 'cho_hoan_tien', 'da_hoan_tien'];
  if (status === 'cancelled' || status === 'refunding' || RETURN_STATUSES.includes(status)) {
    let cancelLabel;
    if (status === 'yeu_cau_hoan')  cancelLabel = '⏳ Yêu cầu hoàn hàng đã gửi — Admin đang xem xét';
    else if (status === 'cho_hoan_kho')  cancelLabel = '📦 Kho đang xử lý hoàn hàng';
    else if (status === 'cho_hoan_tien') cancelLabel = '💳 Đang chờ hoàn tiền — Vui lòng chờ 3-5 ngày làm việc';
    else if (status === 'da_hoan_tien')  cancelLabel = '✅ Đã hoàn tiền thành công';
    else if (status === 'refunding')     cancelLabel = 'Đang xử lý hoàn tiền — Vui lòng chờ 3-5 ngày làm việc';
    else cancelLabel = 'Đơn hàng đã bị hủy';
    if (order.refunded) cancelLabel = 'Hoàn tiền thành công';

    return `
      <div class="tk-tl-step done">
        <div class="tk-tl-dot"></div>
        <div class="tk-tl-content">
          <p class="tk-tl-label">Đã đặt hàng thành công</p>
          <p class="tk-tl-time">${esc(dateStr)}</p>
        </div>
      </div>
      <div class="tk-tl-step current cancelled-step">
        <div class="tk-tl-dot"></div>
        <div class="tk-tl-content">
          <p class="tk-tl-label">${esc(cancelLabel)}</p>
          ${order.refundAt ? `<p class="tk-tl-time">${esc(order.refundAt)}</p>` : ''}
        </div>
      </div>`;
  }

  /* Build từ tracking data nếu có */
  const trackingMap = {};
  if (order.tracking && order.tracking.length > 0) {
    order.tracking.forEach(t => { trackingMap[t.status] = t; });
  }

  const isDelivered = status === 'delivered';
  let html = '';

  TIMELINE_STEPS.forEach((step, i) => {
    const isDone    = i < currentIdx || isDelivered;
    const isCurrent = !isDelivered && i === currentIdx;
    const isFuture  = !isDelivered && i > currentIdx;

    let cls = '';
    if (isDone)    cls = 'done';
    if (isCurrent) cls = 'current';

    /* Thời gian từ tracking data */
    let timeText = '';
    const tData = trackingMap[step.status];
    if (tData && tData.time) {
      timeText = tData.time;
    } else if (i === 0) {
      timeText = dateStr;
    } else if (isFuture) {
      if (step.status === 'delivered') timeText = 'Dự kiến trong 1-3 ngày';
    } else if (isDone && !isFuture) {
      /* Nếu có approvedAt / deliveredAt */
      if (step.status === 'confirmed' && order.approvedAt) timeText = order.approvedAt;
      if (step.status === 'delivered' && order.deliveredAt) timeText = order.deliveredAt;
    }

    /* Label đặc biệt cho bước current */
    let label = step.label;
    if (isCurrent) {
      if (step.status === 'confirmed')
        label = 'Đơn hàng đã được Admin xác nhận — Đang chờ kho lấy hàng';
      if (step.status === 'packing')
        label = 'Nhân viên kho đang đóng gói đơn của bạn';
      if (step.status === 'shipping')
        label = 'Shipper đang trên đường giao — Dự kiến hôm nay trước 18:00';
    }

    html += `
      <div class="tk-tl-step ${cls}">
        <div class="tk-tl-dot"></div>
        <div class="tk-tl-content">
          <p class="tk-tl-label ${isCurrent ? 'current-label' : ''}">${esc(label)}</p>
          ${timeText ? `<p class="tk-tl-time">${esc(timeText)}</p>` : ''}
        </div>
      </div>`;
  });

  return html;
}

/* ══════════════════════════════════════════════
   RENDER MỘT ORDER CARD (accordion)
══════════════════════════════════════════════ */
function renderOrderCard(order) {
  const status  = order.status || 'pending';
  const st      = getStatus(status);
  const date    = _parseDate(order.date);
  const dateStr = date.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
  const timeStr = date.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });

  /* Items */
  const itemsHtml = (order.items || []).map(item => `
    <div class="tk-order-item">
      <div class="tk-order-item-img">
        ${item.image
          ? `<img src="${esc(item.image)}" alt="${esc(item.name || '')}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="tk-order-item-emoji" style="${item.image ? 'display:none' : ''}">🛍️</div>
      </div>
      <div class="tk-order-item-info">
        <p class="tk-order-item-brand">${esc(item.brand || '')}</p>
        <p class="tk-order-item-name">${esc(item.name)}${item.variant ? ' — ' + esc(item.variant) : ''}</p>
        <p class="tk-order-item-qty">x${item.qty}</p>
      </div>
      <span class="tk-order-item-price">${fmt(item.price * item.qty)}</span>
    </div>`).join('');

  /* Tracking */
  const timelineHtml = buildTimelineHTML(order);

  /* Footer actions */
  const footerActions = _buildFooterActions(order);

  /* Tổng tiền */
  const discountHtml = order.discount > 0
    ? `<span style="font-size:.8rem;color:#2d7a5f">Giảm: −${fmt(order.discount)}</span>`
    : '';

  const card = document.createElement('div');
  card.className = 'tk-order-card collapsible';
  card.dataset.status    = status;
  card.dataset.orderId   = order.id;
  card.dataset.numericId = order.numericId || '';

  /* Tạo ID an toàn cho timeline */
  const tlId = 'tl-' + order.id.replace(/[^a-z0-9]/gi, '_');

  card.innerHTML = `
    <div class="tk-order-head tk-order-toggle" style="cursor:pointer">
      <div class="tk-order-head-left">
        <p class="tk-order-id">#${esc(order.id)}</p>
        <p class="tk-order-date">Đặt lúc ${timeStr} · ${dateStr}</p>
      </div>
      <div class="tk-order-head-right">
        <span class="tk-order-summary-price">${fmt(order.total)}</span>
        <span class="tk-status-pill ${st.cls}">${st.label}</span>
        <span class="tk-chevron">▾</span>
      </div>
    </div>
    <div class="tk-order-detail" style="display:none">
      <div class="tk-order-body">${itemsHtml}</div>
      <div class="tk-tracking">
        <p class="tk-tracking-title">📍 Theo dõi đơn hàng</p>
        <div class="tk-timeline" id="${tlId}">${timelineHtml}</div>
      </div>
      <div class="tk-order-foot">
        <div class="tk-order-total-row">
          ${discountHtml}
          <span class="tk-order-total-lbl">Tổng cộng:</span>
          <span class="tk-order-total">${fmt(order.total)}</span>
        </div>
        <div class="tk-order-actions">${footerActions}</div>
      </div>
    </div>`;

  return card;
}

function _buildFooterActions(order) {
  const s = order.status || 'pending';
  if (s === 'pending' || s === 'processing') {
    return `<button class="tk-btn-sm tk-btn-outline" onclick="tkRequestCancel('${esc(String(order.numericId || ''))}')">Yêu cầu hủy</button>`;
  }
  if (s === 'confirmed') {
    return `<button class="tk-btn-sm tk-btn-outline" onclick="showToast('Đang liên hệ hỗ trợ... 📞')">Liên hệ hỗ trợ</button>`;
  }
  if (s === 'packing') {
    return `<button class="tk-btn-sm tk-btn-outline" onclick="showToast('Đang liên hệ hỗ trợ... 📞')">Liên hệ hỗ trợ</button>`;
  }
  if (s === 'shipping' || s === 'delivering') {
    return `<button class="tk-btn-sm tk-btn-outline" onclick="showToast('Đã sao chép mã vận đơn 📋')">Mã vận đơn</button>
            <button class="tk-btn-sm tk-btn-primary" onclick="showToast('Đang liên hệ hỗ trợ... 📞')">Liên hệ hỗ trợ</button>`;
  }
  if (s === 'delivered') {
    const deliveredTime = parseVNDate(order.deliveredAt || order.date);
    const now = new Date();
    const diffDays = (!deliveredTime || isNaN(deliveredTime.getTime()))
      ? 0
      : (now - deliveredTime) / (1000 * 60 * 60 * 24);
    const canRefund = diffDays <= 3;
    return `
      <button class="tk-btn-sm tk-btn-success" onclick="tkXacNhanNhanHang('${esc(String(order.numericId || ''))}')">✓ Đã nhận hàng</button>
      ${canRefund
        ? `<button class="tk-btn-sm tk-btn-danger tk-refund-btn" data-orderid="${esc(order.id)}" data-numericid="${esc(String(order.numericId || ''))}">↩ Hoàn hàng</button>`
        : `<span style="font-size:12px;color:#999">Hết hạn hoàn hàng</span>`}
    `;
}
  if (s === 'hoan_thanh') {
    const deliveredTime = parseVNDate(order.deliveredAt || order.date);
    const now = new Date();
    const diffDays = (!deliveredTime || isNaN(deliveredTime.getTime()))
      ? 99
      : (now - deliveredTime) / (1000 * 60 * 60 * 24);
    const canRefund = diffDays <= 3;
    return `
      <button class="tk-btn-sm tk-btn-outline" onclick="tkReorder('${esc(order.id)}')">🔁 Mua lại</button>
      <button class="tk-btn-sm tk-btn-primary">⭐ Đánh giá</button>
      ${canRefund
        ? `<button class="tk-btn-sm tk-btn-danger tk-refund-btn" data-orderid="${esc(order.id)}" data-numericid="${esc(String(order.numericId || ''))}">↩ Hoàn hàng</button>`
        : `<span style="font-size:12px;color:#999">Hết hạn hoàn hàng</span>`}
    `;
}
if (s === 'refunding') {
    return `<span style="font-size:.83rem;color:var(--mid)">↩ Hoàn tiền đang được xử lý...</span>`;
  }
  if (s === 'yeu_cau_hoan') {
    return `<span style="font-size:.83rem;color:#b45309">⏳ Yêu cầu hoàn hàng đang chờ Admin duyệt</span>`;
  }
  if (s === 'cho_hoan_kho') {
    return `<span style="font-size:.83rem;color:#7e22ce">📦 Kho đang xử lý hoàn hàng</span>`;
  }
  if (s === 'cho_hoan_tien') {
    return `<span style="font-size:.83rem;color:#1d4ed8">💳 Đang chờ hoàn tiền (3-5 ngày làm việc)</span>`;
  }
  if (s === 'da_hoan_tien') {
    return `<span style="font-size:.83rem;color:#2d7a5f">✅ Hoàn tiền thành công</span>`;
  }
  if (s === 'cancelled') {
    if (order.refunded) {
      return `<span style="font-size:.83rem;color:#2d7a5f">✅ Hoàn tiền thành công</span>`;
    }
    return `<button class="tk-btn-sm tk-btn-outline" onclick="showToast('Đang liên hệ hỗ trợ... 📞')">Liên hệ hỗ trợ</button>`;
  }
  return '';
}

/* ── Cập nhật card đã render (không re-render toàn bộ) ── */
function updateOrderCard(order, card) {
  const status = order.status || 'pending';
  const st     = getStatus(status);

  /* Status pill */
  const pill = card.querySelector('.tk-status-pill');
  if (pill) { pill.className = 'tk-status-pill ' + st.cls; pill.textContent = st.label; }

  /* Dataset */
  card.dataset.status = status;

  /* Timeline */
  const tlId  = 'tl-' + order.id.replace(/[^a-z0-9]/gi, '_');
  const tlEl  = document.getElementById(tlId);
  if (tlEl) {
    const newHtml = buildTimelineHTML(order);
    if (tlEl.innerHTML !== newHtml) {
      tlEl.style.transition = 'opacity .3s';
      tlEl.style.opacity = '0';
      setTimeout(() => {
        tlEl.innerHTML = newHtml;
        tlEl.style.opacity = '1';
      }, 150);
    }
  }

  /* Footer actions */
  const actionsEl = card.querySelector('.tk-order-actions');
  if (actionsEl) {
    const newActions = _buildFooterActions(order);
    if (actionsEl.innerHTML !== newActions) actionsEl.innerHTML = newActions;
  }
}

/* ══════════════════════════════════════════════
   RENDER TẤT CẢ ĐƠN HÀNG VÀO PANEL
══════════════════════════════════════════════ */
async function renderAllOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    try {
        const resp = await fetch('TaiKhoanServlet?ajax=1&dataAction=orders');
        
        // KIỂM TRA LỖI SERVER
        if (!resp.ok) throw new Error('Lỗi máy chủ HTTP: ' + resp.status);
        
        const data = await resp.json();
        
        // XỬ LÝ LỖI LOGIC HOẶC REDIRECT TỪ SERVER
        if (!data.success) {
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                showToast('Lỗi tải đơn hàng: ' + (data.message || ''));
            }
            return;
        }

        const orders = data.orders;
        
        // Xử lý khi không có đơn hàng
        if (orders.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px 24px;color:var(--light)">
                <div style="font-size:3rem;margin-bottom:12px">🛍️</div>
                <p style="font-size:1rem;color:var(--mid);font-weight:500">Bạn chưa có đơn hàng nào</p>
                <p style="font-size:.85rem;margin:8px 0 20px">Hãy khám phá và mua sắm tại LACTT nhé!</p>
                <a href="index.jsp" class="tk-btn-sm tk-btn-primary" style="display:inline-block;text-decoration:none">Mua sắm ngay →</a>
                </div>`;
            _updateFilterCounts(orders);
            return;
        }
        
        // Lưu lại các đơn hàng đang mở trước khi render lại
        const expandedIds = new Set();
        container.querySelectorAll('.tk-order-card.expanded').forEach(card => {
            expandedIds.add(card.dataset.orderId);
        });

        // Xóa rỗng container rồi render lại
        container.innerHTML = '';
        orders.forEach(order => {
            const card = renderOrderCard(order);
            container.appendChild(card);
        });
        
        /* Sắp xếp lại theo thứ tự đơn mới nhất */
        _sortOrderCards(container, orders);

        /* Cập nhật accordion (để bấm xổ ra chi tiết đơn) */
        _initAccordion();

        /* Khôi phục trạng thái mở của các accordion trước khi render lại */
        if (expandedIds.size > 0) {
            container.querySelectorAll('.tk-order-card').forEach(card => {
                if (expandedIds.has(card.dataset.orderId)) {
                    const detail  = card.querySelector('.tk-order-detail');
                    const chevron = card.querySelector('.tk-chevron');
                    if (detail) detail.style.display = 'block';
                    card.classList.add('expanded');
                    if (chevron) chevron.style.transform = 'rotate(180deg)';
                }
            });
        }

        /* Cập nhật đếm số lượng trên các nút filter */
        _updateFilterCounts(orders);

        /* Áp dụng filter hiện tại */
        _applyCurrentFilter();
        
    } catch(e) { 
        console.error("Lỗi lấy đơn hàng: ", e); 
        showToast('Lỗi kết nối hoặc dữ liệu không hợp lệ');
    }
}

/* Sắp xếp cards theo thứ tự orders array */
function _sortOrderCards(container, orders) {
  orders.forEach(order => {
    const card = container.querySelector(`[data-order-id="${order.id}"]`);
    if (card) container.appendChild(card); /* Move về cuối → sẽ đúng thứ tự cuối cùng */
  });
  /* Reverse lại để đơn mới nhất lên trước */
  const cards = [...container.querySelectorAll('[data-order-id]')];
  cards.reverse().forEach(card => container.prepend(card));
}

/* ══════════════════════════════════════════════
   ✅ Cập nhật count trên filter buttons — DÙNG Lucide icons
══════════════════════════════════════════════ */
function _updateFilterCounts(orders) {
  const counts = {};
  orders.forEach(o => {
    const s = o.status || 'pending';
    counts[s] = (counts[s] || 0) + 1;
  });

  const labels = {
    pending:   'Chờ duyệt',
    confirmed: 'Chờ lấy hàng',
    packing:   'Đóng gói',
    shipping:  'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };

  const filterIcons = {
    pending:   'clock',
    confirmed: 'check-circle',
    packing:   'package',
    shipping:  'truck',
    delivered: 'circle-check-big',
    cancelled: 'x-circle',
  };

  const filterBtns = document.querySelectorAll('.tk-filter-btn[data-filter]');
  filterBtns.forEach(btn => {
    const filter = btn.dataset.filter;
    if (filter === 'all') {
      btn.innerHTML = `<i data-lucide="list" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i>Tất cả (${orders.length})`;
      return;
    }
    const matchFn = FILTER_MAP[filter];
    if (!matchFn) return;
    const count = orders.filter(o => matchFn(o.status)).length;
    const icon = filterIcons[filter] || '';
    const iconHTML = icon 
      ? `<i data-lucide="${icon}" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-right:4px;"></i>` 
      : '';
    
    btn.innerHTML = `${iconHTML}${labels[filter] || filter} (${count})`;
  });

  // Kích hoạt lại Lucide icons sau khi thay đổi innerHTML
  if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

/* ══════════════════════════════════════════════
   LOAD TỔNG QUAN — gọi server, cập nhật đúng IDs trong JSP
══════════════════════════════════════════════ */
async function loadOverview() {
    try {
        const resp = await fetch('TaiKhoanServlet?ajax=1&dataAction=overview');
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        if (!data.success) {
            if (data.redirect) window.location.href = data.redirect;
            return;
        }

        /* Ô ĐƠN HÀNG */
        const elOrders = document.getElementById('tkStatOrders');
        if (elOrders) elOrders.textContent = data.tongDon ?? 0;

        /* Ô ĐIỂM THƯỞNG — JSP dùng id="tkStatPoints" */
        const elPoints = document.getElementById('tkStatPoints');
        if (elPoints) elPoints.textContent = (data.tongDiem ?? 0).toLocaleString('vi-VN');

        /* Ô ĐANG GIAO */
        const elActive = document.getElementById('tkStatActive');
        if (elActive) elActive.textContent = data.dangGiao ?? 0;

        /* Cập nhật ví điểm + thanh tiến trình */
        _updatePointsUI(data.tongDiem ?? 0, { giaTriQuyDoi: data.giaTriQuyDoi ?? 0, daSuDung: data.daSuDung ?? 0 });

        /* Tải đơn hàng gần đây */
        _loadRecentOrdersFromServer();

    } catch(e) {
        console.error('loadOverview lỗi:', e);
    }
}

async function _loadRecentOrdersFromServer() {
    try {
        const resp = await fetch('TaiKhoanServlet?ajax=1&dataAction=orders');
        if (!resp.ok) return;
        const data = await resp.json();
        if (!data.success) return;
        const orders = data.orders || [];

        /* Cập nhật bảng đơn hàng gần đây — JSP dùng TBODY id="recentOrdersTableBody" */
        _renderRecentOrders(orders);
    } catch(e) {}
}

/* ══════════════════════════════════════════════
   FILTER
══════════════════════════════════════════════ */
let _currentFilter = 'all';

function filterOrderCards(btn, filter) {
  _currentFilter = filter;
  document.querySelectorAll('.tk-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _applyCurrentFilter();
}

function _applyCurrentFilter() {
  const filter  = _currentFilter;
  const matchFn = FILTER_MAP[filter] || (() => true);
  document.querySelectorAll('#ordersContainer [data-order-id]').forEach(card => {
    const status = card.dataset.status;
    card.style.display = matchFn(status) ? '' : 'none';
  });
}

/* ══════════════════════════════════════════════
   ACCORDION
══════════════════════════════════════════════ */
function _initAccordion() {
  document.querySelectorAll('.tk-order-card.collapsible').forEach(card => {
    if (card._accordionInit) return;
    card._accordionInit = true;

    const toggle  = card.querySelector('.tk-order-toggle');
    const detail  = card.querySelector('.tk-order-detail');
    const chevron = card.querySelector('.tk-chevron');
    if (!toggle || !detail) return;

    toggle.addEventListener('click', e => {
      if (e.target.closest('button, a')) return;
      const isOpen = detail.style.display !== 'none';
      if (isOpen) {
        detail.style.display = 'none';
        card.classList.remove('expanded');
        if (chevron) chevron.style.transform = '';
      } else {
        detail.style.display = 'block';
        card.classList.add('expanded');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      }
    });
  });
}

/* ══════════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════════ */
document.querySelectorAll('.tk-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    if (tab.classList.contains('tk-tab-logout')) return;
    switchTab(tab.dataset.tab);
  });
});

function switchTab(tabId) {
    document.querySelectorAll('.tk-nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tk-panel').forEach(p => p.classList.remove('active'));
    const targetNav = document.querySelector(`[data-panel="${tabId}"]`);
    const targetPanel = document.getElementById('panel-' + tabId);
    if (targetNav) targetNav.classList.add('active');
    if (targetPanel) targetPanel.classList.add('active');

    document.querySelector('.tk-main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Load dữ liệu tương ứng
    // Load dữ liệu tương ứng
    if (tabId === 'overview') loadOverview();      // Đã có sẵn
    else if (tabId === 'orders') renderAllOrders(); // Đã có sẵn
    else if (tabId === 'address') loadAddresses();
    else if (tabId === 'points') loadPoints();
}

/* ══════════════════════════════════════════════
   REAL-TIME POLLING (3s) — cập nhật từ admin
══════════════════════════════════════════════ */
let _lastSnapshot = '';

/* _pollOrderUpdates: không còn dùng localStorage — đã dùng polling trực tiếp trong DOMContentLoaded */
function _pollOrderUpdates() { /* deprecated — kept for compatibility */ }

/* ══════════════════════════════════════════════
   LOAD USER INFO — đọc từ DOM (JSP đã render từ session)
   KHÔNG dùng localStorage vì JSP dùng session Java
══════════════════════════════════════════════ */
function _loadUserInfo() {
  // Nguồn dữ liệu: window.SESSION_USER (inject từ JSP/session server)
  // Fallback: đọc từ DOM đã render
  const hoTen = (window.SESSION_USER && window.SESSION_USER.hoTen)
              || document.getElementById('tkUserName')?.textContent?.trim()
              || '';

  if (hoTen) {
    const parts    = hoTen.split(/\s+/).filter(Boolean);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
      : (parts[0]?.[0] || '?').toUpperCase();

    const avatarEl = document.getElementById('tkAvatar');
    // Chỉ override nếu JSP chưa render đúng (fallback safety)
    if (avatarEl && (avatarEl.textContent.trim() === 'NL' || avatarEl.textContent.trim() === '?')) {
      avatarEl.textContent = initials;
    }
  }
  return { loaded: true };
}

async function loadAddresses() {
    try {
        const resp = await fetch('TaiKhoanServlet?ajax=1&dataAction=addresses');
        
        // KIỂM TRA LỖI SERVER
        if (!resp.ok) throw new Error('Lỗi máy chủ HTTP: ' + resp.status);
        
        const data = await resp.json();
        
        // XỬ LÝ LỖI LOGIC HOẶC REDIRECT TỪ SERVER
        if (!data.success) {
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                showToast('Lỗi tải địa chỉ: ' + (data.message || ''));
            }
            return;
        }

        const addresses = data.addresses;
        window.userAddresses = addresses; // LƯU VÀO ĐÂY

        const container = document.getElementById('addressContainer');
        if (!container) return;

        container.innerHTML = addresses.map(addr => `
            <div class="tk-addr-card ${addr.macDinh ? 'default' : ''}">
                ${addr.macDinh ? '<span class="tk-addr-default-badge">Mặc định</span>' : ''}
                <p class="tk-addr-name">${esc(addr.tenNguoiNhan)}</p>
                <p class="tk-addr-lines">${esc(addr.diaChiCuThe)}<br/>${esc(addr.soDienThoai)}</p>
                <div class="tk-addr-actions">
                    <button class="tk-btn-sm tk-btn-outline" onclick="openEditAddressModal(${addr.id})">Sửa</button>
                    <button class="tk-btn-sm tk-btn-outline" onclick="deleteAddress(${addr.id})">Xóa</button>
                </div>
            </div>
        `).join('') + `
            <div class="tk-addr-card tk-addr-add">
                <form id="addAddressForm">
                    <input type="text" name="tenNguoiNhan" placeholder="Tên người nhận" required style="width: 100%; margin-bottom: 8px; padding: 6px;" />
                    <input type="tel" name="soDienThoai" placeholder="Số điện thoại" required style="width: 100%; margin-bottom: 8px; padding: 6px;"/>
                    <input type="text" name="diaChiCuThe" placeholder="Địa chỉ cụ thể" required style="width: 100%; margin-bottom: 8px; padding: 6px;"/>
                    <label style="display:block; margin-bottom: 10px;"><input type="checkbox" name="macDinh" /> Mặc định</label>
                    <button type="submit" class="tk-btn-sm tk-btn-primary">+ Thêm địa chỉ mới</button>
                </form>
            </div>`;

        document.getElementById('addAddressForm')?.addEventListener('submit', addAddress);
    } catch (e) { 
        console.error(e);
        showToast('Lỗi kết nối hoặc dữ liệu không hợp lệ');
    }
}

function _updatePointsUI(points, user) {
  const tierBadge = document.getElementById('tkTierBadge');
  const overviewPts  = document.getElementById('overviewPoints');
  const overviewEquiv = document.getElementById('overviewPointsEquiv');
  const overviewTierName = document.getElementById('overviewTierName');
  const overviewProgressLabel = document.getElementById('overviewProgressLabel');
  const overviewProgressPct = document.getElementById('overviewProgressPct');
  const walletProgress = document.getElementById('walletProgress');
  const ptsCurrentPoints = document.getElementById('ptsCurrentPoints');
  const ptsTotalPoints = document.getElementById('ptsTotalPoints');
  const ptsUsedPoints = document.getElementById('ptsUsedPoints');

  /* Xác định hạng */
  let tier = 'Silver', tierLabel = '🥈 Thành Viên Silver', tierName = 'Silver Member';
  let tierMin = 0, nextTier = 5000, nextName = 'Gold';
  if (points >= 10000) {
    tier = 'Platinum'; tierLabel = '💎 Thành Viên Platinum'; tierName = 'Platinum Member';
    tierMin = 10000; nextTier = 10000; nextName = 'Platinum';
  } else if (points >= 5000) {
    tier = 'Gold'; tierLabel = '⭐ Thành Viên Gold'; tierName = 'Gold Member';
    tierMin = 5000; nextTier = 10000; nextName = 'Platinum';
  }

  // Tính % trong khoảng hạng hiện tại (không cộng dồn từ 0)
  const tierRange = nextTier - tierMin;
  const tierProgress = points - tierMin;
  const pctFill = tier === 'Platinum' ? 100 : Math.min(100, Math.round((tierProgress / tierRange) * 100));
  const remaining = Math.max(0, 100 - pctFill);

  if (tierBadge) tierBadge.textContent = tierLabel;
  if (overviewPts) overviewPts.innerHTML = points.toLocaleString('vi-VN') + ' <span>điểm</span>';
  if (overviewEquiv) overviewEquiv.textContent = `≈ ${fmt(points * 100)} giá trị quy đổi`;
  if (overviewTierName) overviewTierName.textContent = tierName;
  if (overviewProgressLabel) overviewProgressLabel.textContent = `${points.toLocaleString('vi-VN')} / ${nextTier.toLocaleString('vi-VN')} điểm → ${nextName}`;
  if (overviewProgressPct) overviewProgressPct.textContent = remaining + '% còn lại';
  if (walletProgress) setTimeout(() => { walletProgress.style.width = pctFill + '%'; }, 400);

  if (ptsCurrentPoints) ptsCurrentPoints.textContent = points.toLocaleString('vi-VN');
  if (ptsTotalPoints) ptsTotalPoints.textContent = points.toLocaleString('vi-VN');
  if (ptsUsedPoints) ptsUsedPoints.textContent = (user.daSuDung ?? 0).toLocaleString('vi-VN');

  /* Đồng bộ ô ĐIỂM THƯỞNG hero (id=tkStatPoints trong JSP) */
  const statPts = document.getElementById('tkStatPoints');
  if (statPts) statPts.textContent = points.toLocaleString('vi-VN');
}

function _updateStats(orders) {
  const active    = orders.filter(o => ['shipping','delivering'].includes(o.status)).length;
  const totalOrds = orders.length;

  /* Tháng hiện tại */
  const now = new Date();
  const thisMonth = orders.filter(o => {
    try {
      const d = _parseDate(o.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } catch(e) { return false; }
  });
  const spendThisMonth = thisMonth.reduce((s, o) => s + (o.total || 0), 0);

  const statOrders = document.getElementById('tkStatOrders');
  const statActive = document.getElementById('tkStatActive');
  const actThisMonth = document.getElementById('actThisMonth');
  const actSpend     = document.getElementById('actSpend');
  const actActive    = document.getElementById('actActive');

  if (statOrders) statOrders.textContent = totalOrds;
  if (statActive) statActive.textContent = active;
  if (actThisMonth) actThisMonth.textContent = thisMonth.length + ' đơn';
  if (actSpend) actSpend.textContent = fmt(spendThisMonth);
  if (actActive) actActive.textContent = active + ' đơn';
}

function _renderRecentOrders(orders) {
  /* JSP dùng <tbody id="recentOrdersTableBody"> bên trong một <table> */
  const tbody = document.getElementById('recentOrdersTableBody');
  if (!tbody) return;

  const recent = orders.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#9e8e82">Bạn chưa có đơn hàng nào 🛍️</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(o => {
    const st      = getStatus(o.status);
    const dateStr = (() => { try { return _parseDate(o.date).toLocaleDateString('vi-VN'); } catch(e) { return ''; } })();
    return `<tr style="cursor:pointer" onclick="switchPanel(document.querySelector('[data-panel=orders]'),'orders')">
      <td style="font-weight:600;color:#c4626e">#${esc(o.id)}</td>
      <td style="color:#5c4c42">—</td>
      <td style="font-weight:600">${fmt(o.total)}</td>
      <td><span class="tk-status-pill ${st.cls}">${st.label}</span></td>
      <td style="color:#9e8e82;font-size:.82rem">${dateStr}</td>
      <td><button class="tk-btn-sm tk-btn-outline" onclick="event.stopPropagation();switchPanel(document.querySelector('[data-panel=orders]'),'orders')">Xem</button></td>
    </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   PROFILE FORM
══════════════════════════════════════════════ */
// Đặt lại form từ SESSION_USER (server-side) — không dùng localStorage
function loadProfileForm() {
    const u = window.SESSION_USER || {};
    const hoTen = u.hoTen || document.getElementById('infoName')?.textContent?.trim() || '';
    const email  = u.email || document.getElementById('infoEmail')?.textContent?.trim() || '';
    const phone  = u.soDienThoai || document.getElementById('infoPhone')?.textContent?.trim() || '';
    const ngaySinh = u.ngaySinh || '';   // dạng "yyyy-MM-dd" từ java.sql.Date.toString()
    const gioiTinh = u.gioiTinh || '';
    const loaiDa   = u.loaiDa   || '';

    const parts = hoTen.trim().split(/\s+/);
    const fn = document.getElementById('editFirstName');
    const ln = document.getElementById('editLastName');
    const em = document.getElementById('editEmail');
    const ph = document.getElementById('editPhone');
    const dob = document.getElementById('editDob');
    const gender = document.getElementById('editGender');
    const skin = document.getElementById('editSkinType');

    if (fn) fn.value = parts.slice(0, -1).join(' ') || hoTen;
    if (ln) ln.value = parts.length > 1 ? parts[parts.length - 1] : '';
    if (em) em.value = email;
    if (ph) ph.value = phone;
    // ngaySinh từ Java có thể là "yyyy-MM-dd" hoặc "null" string
    if (dob) dob.value = (ngaySinh && ngaySinh !== 'null') ? ngaySinh : '';
    if (gender && gioiTinh && gioiTinh !== 'null') gender.value = gioiTinh;
    if (skin && loaiDa && loaiDa !== 'null') skin.value = loaiDa;
}

// Lưu thông tin cá nhân qua AJAX
async function saveProfile() {
    // 1. Thu thập dữ liệu
    const firstName = document.getElementById('editFirstName')?.value.trim() || '';
    const lastName = document.getElementById('editLastName')?.value.trim() || '';
    const hoTen = (firstName + ' ' + lastName).trim();
    const email = document.getElementById('editEmail')?.value.trim() || '';
    const phone = document.getElementById('editPhone')?.value.trim() || '';
    const ngaySinh = document.getElementById('editDob')?.value || '';
    const gioiTinh = document.getElementById('editGender')?.value || '';
    const loaiDa = document.getElementById('editSkinType')?.value || '';

    if (!hoTen || !phone) {
        showToast('⚠ Vui lòng nhập đủ Họ tên và Số điện thoại');
        return;
    }

    const formData = new URLSearchParams();
    formData.append('action', 'updateProfile');
    formData.append('ajax', '1');
    formData.append('hoTen', hoTen); 
    formData.append('email', email);
    formData.append('soDienThoai', phone);
    formData.append('ngaySinh', ngaySinh);
    formData.append('gioiTinh', gioiTinh);
    formData.append('loaiDa', loaiDa);

    try {
        const resp = await fetch('TaiKhoanServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        // KIỂM TRA LỖI SERVER
        if (!resp.ok) throw new Error('Lỗi máy chủ HTTP: ' + resp.status);
        
        const result = await resp.json();
        
        // XỬ LÝ LỖI LOGIC HOẶC REDIRECT
        if (result.success) {
            showToast('Cập nhật thông tin thành công ✓');
            
            // Cập nhật window.SESSION_USER (in-memory, server-authoritative) thay vì localStorage
            if (window.SESSION_USER) {
                window.SESSION_USER.hoTen = hoTen;
                window.SESSION_USER.email = email;
                window.SESSION_USER.soDienThoai = phone;
                window.SESSION_USER.ngaySinh = ngaySinh;
                window.SESSION_USER.gioiTinh = gioiTinh;
                window.SESSION_USER.loaiDa = loaiDa;
            }
            // Đồng bộ localStorage nếu có (chỉ để hiển thị header nhanh)
            try {
                let lsUser = JSON.parse(localStorage.getItem('lactt_user') || '{}');
                lsUser.hoTen = hoTen; lsUser.firstName = firstName; lsUser.lastName = lastName;
                lsUser.email = email; lsUser.phone = phone;
                localStorage.setItem('lactt_user', JSON.stringify(lsUser));
            } catch(e) {}
            
            const nameEl   = document.getElementById('tkUserName');
            const infoName = document.getElementById('infoName');
            const infoPhone = document.getElementById('infoPhone');
            const infoEmail = document.getElementById('infoEmail');
            
            if (nameEl)    nameEl.textContent   = hoTen;
            if (infoName)  infoName.textContent  = hoTen;
            if (infoPhone) infoPhone.textContent = phone;
            if (infoEmail) infoEmail.textContent = email;
            
        } else {
             if (result.redirect) {
                window.location.href = result.redirect;
            } else {
                showToast('Lỗi: ' + (result.message || 'Cập nhật thất bại'));
            }
        }
    } catch (e) {
        console.error(e);
        showToast('Lỗi kết nối hoặc dữ liệu không hợp lệ');
    }
}

/* ══════════════════════════════════════════════
   ĐỔI MẬT KHẨU
══════════════════════════════════════════════ */
async function doiMatKhau() {
    const matKhauCu   = document.getElementById('pwdCurrent')?.value || '';
    const matKhauMoi  = document.getElementById('pwdNew')?.value || '';
    const matKhauXN   = document.getElementById('pwdConfirm')?.value || '';

    if (!matKhauCu || !matKhauMoi || !matKhauXN) {
        showToast('⚠ Vui lòng nhập đầy đủ thông tin');
        return;
    }
    if (matKhauMoi.length < 6) {
        showToast('⚠ Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
    }
    if (matKhauMoi !== matKhauXN) {
        showToast('⚠ Mật khẩu xác nhận không khớp');
        return;
    }

    try {
        const resp = await fetch('DoiMatKhauServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ matKhauCu, matKhauMoi }).toString()
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const result = await resp.json();
        if (result.success) {
            showToast('Đổi mật khẩu thành công 🔒');
            // Xoá trắng form sau khi thành công
            document.getElementById('pwdCurrent').value = '';
            document.getElementById('pwdNew').value = '';
            document.getElementById('pwdConfirm').value = '';
        } else {
            if (result.redirect) {
                window.location.href = result.redirect;
            } else {
                showToast('⚠ ' + (result.message || 'Đổi mật khẩu thất bại'));
            }
        }
    } catch (e) {
        console.error(e);
        showToast('Lỗi kết nối, vui lòng thử lại');
    }
}

/* ══════════════════════════════════════════════
   YÊU CẦU HỦY ĐƠN
══════════════════════════════════════════════ */
let currentRefundOrder     = null;
let currentRefundNumericId = null;


/* ══════════════════════════════════════════════
   INJECT TIMELINE CSS
══════════════════════════════════════════════ */
(function injectCSS() {
  if (document.getElementById('tk-dyn-style')) return;
  const style = document.createElement('style');
  style.id = 'tk-dyn-style';
  style.textContent = `
    /* ── Status pills bổ sung ── */
    .status-confirmed  { background: rgba(45,122,95,.12); color: #2d7a5f; border-color: rgba(45,122,95,.25); }
    .status-packing    { background: rgba(240,192,128,.18); color: #9a6a20; border-color: rgba(240,192,128,.4); }

    /* ── Timeline container ── */
    .tk-tracking {
      padding: 20px 24px;
      background: #faf8f7;
      border-top: 1px solid #f0eae8;
    }
    .tk-tracking-title {
      font-size: .78rem;
      font-weight: 600;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #9e8e82;
      margin: 0 0 18px;
    }
    .tk-timeline {
      position: relative;
      padding-left: 28px;
      transition: opacity .3s;
    }
    .tk-timeline::before {
      content: '';
      position: absolute;
      left: 7px; top: 10px; bottom: 10px;
      width: 2px;
      background: #e8ddd9;
      border-radius: 1px;
    }

    /* ── Step ── */
    .tk-tl-step {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding-bottom: 20px;
      opacity: .4;
    }
    .tk-tl-step:last-child { padding-bottom: 0; }
    .tk-tl-step.done, .tk-tl-step.current { opacity: 1; }

    /* ── Dot ── */
    .tk-tl-dot {
      position: absolute;
      left: -22px; top: 2px;
      width: 16px; height: 16px;
      border-radius: 50%;
      border: 2px solid #e8ddd9;
      background: #fff;
      flex-shrink: 0;
      transition: all .3s;
      display: flex; align-items: center; justify-content: center;
    }
    .tk-tl-step.done .tk-tl-dot {
      background: #d99aa0;
      border-color: #d99aa0;
    }
    .tk-tl-step.done .tk-tl-dot::after {
      content: '✓';
      font-size: 9px; color: #fff;
      font-weight: 700; line-height: 1;
    }
    .tk-tl-step.current .tk-tl-dot {
      background: #c4626e;
      border-color: #c4626e;
      box-shadow: 0 0 0 4px rgba(196,98,110,.18);
      animation: tkDotPulse 1.8s ease-in-out infinite;
    }
    @keyframes tkDotPulse {
      0%, 100% { box-shadow: 0 0 0 4px rgba(196,98,110,.18); }
      50%       { box-shadow: 0 0 0 8px rgba(196,98,110,.06); }
    }

    /* ── Content ── */
    .tk-tl-content { flex: 1; min-width: 0; }
    .tk-tl-label {
      font-size: .855rem;
      color: #5c4c42;
      margin: 0 0 3px;
      font-family: 'DM Sans', sans-serif;
      line-height: 1.4;
    }
    .tk-tl-step.done .tk-tl-label   { color: #1a1208; font-weight: 500; }
    .tk-tl-step.current .tk-tl-label,
    .current-label {
      color: #c4626e !important;
      font-weight: 600 !important;
    }
    .tk-tl-time {
      font-size: .75rem;
      color: #9e8e82;
      margin: 0;
    }
    .tk-tl-step.current .tk-tl-time { color: rgba(196,98,110,.7); }

    /* ── Cancelled step ── */
    .cancelled-step .tk-tl-dot {
      background: #c4626e; border-color: #c4626e;
    }
    .cancelled-step .tk-tl-dot::after { content: '✕'; }
    .cancelled-step .tk-tl-label {
      color: #c4626e !important; font-weight: 600 !important;
    }

    /* ── Order head right ── */
    .tk-order-head-right {
      display: flex; align-items: center;
      gap: 10px; flex-shrink: 0;
    }
    .tk-order-summary-price {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem; font-weight: 700; color: #1a1208;
    }
    .tk-chevron {
      font-size: 1.1rem; color: #9e8e82;
      transition: transform .3s; line-height: 1;
    }
    .tk-order-card.expanded .tk-chevron { transform: rotate(180deg); }
  `;
  document.head.appendChild(style);
})();

/* ══════════════════════════════════════════════
   LOGOUT BUTTON
══════════════════════════════════════════════ */
(function addLogoutBtn() {
  const tabsEl = document.querySelector('.tk-tabs');
  if (!tabsEl) return;
  const btn = document.createElement('button');
  btn.className = 'tk-tab tk-tab-logout';
  btn.innerHTML = '🚪 Đăng xuất';
  btn.style.cssText = 'margin-left:auto;color:#c4626e;border-color:rgba(196,98,110,.35);background:rgba(196,98,110,.06)';
  btn.addEventListener('click', () => {
    if (!confirm('Bạn có chắc muốn đăng xuất không?')) return;
    // Gọi server invalidate session trước
    fetch('DangNhapServlet', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=logout'
    }).finally(() => {
      
      localStorage.removeItem('lactt_user');
     
      window.location.replace('dangnhap.jsp');
    });
  });
  tabsEl.appendChild(btn);
})();

/* ══════════════════════════════════════════════
   AUTO-SWITCH TAB sau khi đặt hàng
══════════════════════════════════════════════ */
(function checkPostOrder() {
  const gotoTab = sessionStorage.getItem('lactt_goto_tab');
  if (gotoTab) {
    sessionStorage.removeItem('lactt_goto_tab');
    setTimeout(() => switchTab(gotoTab), 200);
  }
  const newOrderId = sessionStorage.getItem('lactt_new_order_id');
  if (newOrderId) {
    sessionStorage.removeItem('lactt_new_order_id');
    setTimeout(() => showToast(`🎉 Đặt hàng thành công! Mã đơn: #${newOrderId}`), 800);
  }
})();

async function tkXacNhanNhanHang(numericId) {
  if (!numericId) { showToast('⚠ Không xác định được đơn hàng'); return; }
  if (!confirm('Xác nhận bạn đã nhận được hàng?')) return;

  try {
    const resp = await fetch('khach/don-hang-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'hoanThanh',
        id:     numericId
      }).toString()
    });
    const result = await resp.json();
    if (result.success) {
      showToast('✅ Xác nhận nhận hàng thành công!');
      setTimeout(() => renderAllOrders(), 800);
    } else {
      showToast('⚠ ' + (result.message || 'Thất bại'));
    }
  } catch (e) {
    showToast('Lỗi kết nối, vui lòng thử lại');
  }
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* Set initials avatar từ tên đã render trong JSP */
  _loadUserInfo();

  /* Tải tổng quan từ server ngay khi trang load */
  loadOverview();

  /* Render panel đang active (nếu không phải overview) */
  const activePanel = document.querySelector('.tk-panel.active');
  if (activePanel) {
      const panelId = activePanel.id.replace('panel-', '');
      if (panelId === 'orders')  renderAllOrders();
      else if (panelId === 'address') loadAddresses();
  }

  /* Polling nhẹ mỗi 10s để cập nhật trạng thái đơn */
  setInterval(() => {
      const ordersPanel = document.getElementById('panel-orders');
      if (ordersPanel && ordersPanel.classList.contains('active')) {
          renderAllOrders();
      }
  }, 10000);
});

function openRefundPopup(orderId, numericId) {
  currentRefundOrder     = orderId;
  currentRefundNumericId = numericId || '';
  const modal = document.getElementById('refundModal');
  if (!modal) { alert('Không tìm thấy modal!'); return; }
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
}

/* Delegation: bắt click nút hoàn hàng dù render lúc nào */
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.tk-refund-btn');
  if (btn) {
    const orderId   = btn.getAttribute('data-orderid');
    const numericId = btn.getAttribute('data-numericid');
    openRefundPopup(orderId, numericId);
  }
});

function closeRefund() {
  const modal = document.getElementById('refundModal');
  if (modal) modal.style.display = 'none';
}

async function submitRefund() {
  const reason    = document.getElementById('refundReason')?.value?.trim();
  const numericId = currentRefundNumericId;

  if (!reason) {
    showToast('⚠ Vui lòng nhập lý do hoàn hàng');
    return;
  }
  if (!numericId) {
    showToast('⚠ Không xác định được đơn hàng, vui lòng thử lại');
    return;
  }

  const submitBtn = document.querySelector('#refundModal .tk-btn-primary');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const resp = await fetch('khach/don-hang-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'yeuCauHoan',
        id:     numericId,
        lyDo:   reason
      }).toString()
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);

    const result = await resp.json();

    if (result.success) {
      closeRefund();
      showToast('✅ Đã gửi yêu cầu hoàn hàng — Admin sẽ xử lý sớm 📦');
      setTimeout(() => renderAllOrders(), 800);
    } else {
      showToast('⚠ ' + (result.message || 'Gửi yêu cầu thất bại'));
    }
  } catch (e) {
    console.error('submitRefund lỗi:', e);
    showToast('Lỗi kết nối, vui lòng thử lại');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}
/* ══════════════════════════════════════════════
   LẮNG NGHE THAY ĐỔI LOCALSTORAGE TỪ TAB KHÁC
══════════════════════════════════════════════ */
/* storage listener đã bỏ — dùng server polling thay thế */

// ==================== XÓA ĐOẠN CŨ ĐI, CHỈ GIỮ LẠI TỪ DÒNG NÀY TRỞ XUỐNG ====================

// Biến lưu tạm danh sách địa chỉ để Modal móc dữ liệu
window.userAddresses = [];

async function loadAddresses() {
    try {
        const resp = await fetch('TaiKhoanServlet?ajax=1&dataAction=addresses');
        const data = await resp.json();
        if (!data.success) {
            showToast('Lỗi tải địa chỉ: ' + (data.message || ''));
            return;
        }
        const addresses = data.addresses;
        window.userAddresses = addresses; // LƯU VÀO ĐÂY

        const container = document.getElementById('addressContainer');
        if (!container) return;

        container.innerHTML = addresses.map(addr => `
            <div class="tk-addr-card ${addr.macDinh ? 'default' : ''}">
                ${addr.macDinh ? '<span class="tk-addr-default-badge">Mặc định</span>' : ''}
                <p class="tk-addr-name">${esc(addr.tenNguoiNhan)}</p>
                <p class="tk-addr-lines">${esc(addr.diaChiCuThe)}<br/>${esc(addr.soDienThoai)}</p>
                <div class="tk-addr-actions">
                    <button class="tk-btn-sm tk-btn-outline" onclick="openEditAddressModal(${addr.id})">Sửa</button>
                    <button class="tk-btn-sm tk-btn-outline" onclick="deleteAddress(${addr.id})">Xóa</button>
                </div>
            </div>
        `).join('') + `
            <div class="tk-addr-card tk-addr-add">
                <form id="addAddressForm">
                    <input type="text" name="tenNguoiNhan" placeholder="Tên người nhận" required style="width: 100%; margin-bottom: 8px; padding: 6px;" />
                    <input type="tel" name="soDienThoai" placeholder="Số điện thoại" required style="width: 100%; margin-bottom: 8px; padding: 6px;"/>
                    <input type="text" name="diaChiCuThe" placeholder="Địa chỉ cụ thể" required style="width: 100%; margin-bottom: 8px; padding: 6px;"/>
                    <label style="display:block; margin-bottom: 10px;"><input type="checkbox" name="macDinh" /> Mặc định</label>
                    <button type="submit" class="tk-btn-sm tk-btn-primary">+ Thêm địa chỉ mới</button>
                </form>
            </div>`;

        document.getElementById('addAddressForm')?.addEventListener('submit', addAddress);
    } catch (e) { console.error(e); }
}

async function addAddress(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    formData.append('action', 'addAddress');
    formData.append('ajax', '1');
    try {
        const resp = await fetch('TaiKhoanServlet', {
            method: 'POST',
            body: new URLSearchParams(formData)
        });
        const result = await resp.json();
        if (result.success) {
            showToast('Thêm địa chỉ thành công');
            loadAddresses(); // load lại danh sách mới
        } else {
            showToast('Lỗi: ' + (result.message || 'Thêm thất bại'));
        }
    } catch (e) { console.error(e); }
}

async function deleteAddress(id) {
    if (!confirm('Xóa địa chỉ này?')) return;
    try {
        const resp = await fetch('TaiKhoanServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=deleteAddress&id=${id}&ajax=1`
        });
        
        // KIỂM TRA LỖI SERVER
        if (!resp.ok) throw new Error('Lỗi máy chủ HTTP: ' + resp.status);

        const result = await resp.json();
        if (result.success) {
            showToast('Đã xóa địa chỉ');
            loadAddresses();
        } else {
            if (result.redirect) {
                window.location.href = result.redirect;
            } else {
                showToast('Lỗi: ' + (result.message || 'Xóa thất bại'));
            }
        }
    } catch (e) { 
        console.error(e);
        showToast('Lỗi kết nối hoặc dữ liệu không hợp lệ');
    }
}

// ---- LOGIC SỬA ĐỊA CHỈ ----
function openEditAddressModal(id) {
    // Tìm địa chỉ trong mảng đã lưu
    const addr = window.userAddresses.find(a => a.id === id);
    if (!addr) return;
    
    // Điền dữ liệu vào Modal
    document.getElementById('editAddrId').value = addr.id;
    document.getElementById('editAddrName').value = addr.tenNguoiNhan;
    document.getElementById('editAddrPhone').value = addr.soDienThoai;
    document.getElementById('editAddrDetail').value = addr.diaChiCuThe;
    document.getElementById('editAddrDefault').checked = addr.macDinh;

    // Hiển thị Modal
    const modal = document.getElementById('editAddressModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
    }
}

function closeEditAddress() {
    const modal = document.getElementById('editAddressModal');
    if (modal) modal.style.display = 'none';
}

async function submitEditAddress(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    formData.append('action', 'editAddress');
    formData.append('ajax', '1');

    const isDefault = document.getElementById('editAddrDefault').checked;
    if (isDefault) {
        formData.set('macDinh', 'on');
    } else {
        formData.set('macDinh', 'off'); 
    }
    
    try {
        const resp = await fetch('TaiKhoanServlet', {
            method: 'POST',
            body: new URLSearchParams(formData)
        });
        
        // KIỂM TRA LỖI SERVER
        if (!resp.ok) throw new Error('Lỗi máy chủ HTTP: ' + resp.status);

        const result = await resp.json();
        if (result.success) {
            showToast('Cập nhật địa chỉ thành công ✓');
            closeEditAddress();
            loadAddresses(); // Tự động load lại danh sách mới
        } else {
            if (result.redirect) {
                window.location.href = result.redirect;
            } else {
                showToast('Lỗi: ' + (result.message || 'Cập nhật thất bại'));
            }
        }
    } catch (e) { 
        console.error(e); 
        showToast('Lỗi kết nối hoặc dữ liệu không hợp lệ');
    }
}
/* ══════════════════════════════════════════════
   LOAD ĐIỂM & HẠNG THÀNH VIÊN — panel-points
══════════════════════════════════════════════ */
async function loadPoints() {
    try {
        const resp = await fetch('TaiKhoanServlet?ajax=1&dataAction=overview');
        if (!resp.ok) return;
        const data = await resp.json();
        if (!data.success) return;

        const points   = data.tongDiem  ?? 0;
        const daSuDung = data.daSuDung  ?? 0;
        const tongTich = points + daSuDung; // tổng tích lũy = hiện có + đã dùng

        // Cập nhật 3 ô số điểm
        const elCurrent = document.getElementById('ptsCurrentPoints');
        const elTotal   = document.getElementById('ptsTotalPoints');
        const elUsed    = document.getElementById('ptsUsedPoints');
        if (elCurrent) elCurrent.textContent = points.toLocaleString('vi-VN');
        if (elTotal)   elTotal.textContent   = tongTich.toLocaleString('vi-VN');
        if (elUsed)    elUsed.textContent    = daSuDung.toLocaleString('vi-VN');

        // Xác định hạng dựa trên tổng tích lũy
        let tier = 'Silver', nextTier = 5000, nextName = 'Gold', tierMin = 0;
        if (tongTich >= 10000) {
            tier = 'Platinum'; nextTier = 10000; nextName = 'Platinum'; tierMin = 10000;
        } else if (tongTich >= 5000) {
            tier = 'Gold'; nextTier = 10000; nextName = 'Platinum'; tierMin = 5000;
        }

        const pct    = tier === 'Platinum'
            ? 100
            : Math.min(100, Math.round(((tongTich - tierMin) / (nextTier - tierMin)) * 100));
        const conLai = Math.max(0, nextTier - tongTich);

        // Cập nhật banner tiến trình hạng
        const banner    = document.querySelector('.tk-tier-progress-title');
        const bannerSub = document.querySelector('.tk-tier-progress-sub');
        const barFill   = document.querySelector('.tk-tier-bar-fill');
        const barPct    = document.querySelector('.tk-tier-bar-pct');

        if (banner) {
            banner.innerHTML = tier === 'Platinum'
                ? 'Hạng Platinum — Bạn đã đạt hạng cao nhất! 💎'
                : `Hạng ${tier} — Bạn cần thêm <strong style="color:var(--primary-gold)">${conLai.toLocaleString('vi-VN')} điểm</strong> để lên ${nextName}`;
        }
        if (bannerSub) {
            bannerSub.textContent = tier === 'Platinum'
                ? 'Chúc mừng! Bạn đang ở hạng thành viên cao nhất'
                : `Tích thêm ${conLai.toLocaleString('vi-VN')} điểm để mở khoá ưu đãi ${nextName}`;
        }
        if (barFill) barFill.style.width = pct + '%';
        if (barPct)  barPct.textContent  = pct + '%';

        // Cập nhật badge "Hạng của bạn" trên tier cards
        document.querySelectorAll('.tk-tier-card').forEach(card => {
            card.classList.remove('current-tier');
            const badge = card.querySelector('.tk-tier-current-badge');
            if (badge) badge.remove();
        });
        const tierCards  = document.querySelectorAll('.tk-tier-card');
        const tierIndex  = tier === 'Silver' ? 0 : tier === 'Gold' ? 1 : 2;
        if (tierCards[tierIndex]) {
            tierCards[tierIndex].classList.add('current-tier');
            const newBadge = document.createElement('span');
            newBadge.className   = 'tk-tier-current-badge';
            newBadge.textContent = 'Hạng của bạn';
            tierCards[tierIndex].prepend(newBadge);
        }

        // Cập nhật badge hạng trên sidebar
        const tierBadge = document.getElementById('tkTierBadge');
        if (tierBadge) {
            const badgeText = tier === 'Silver' ? '🥈 Thành Viên Silver'
                            : tier === 'Gold'   ? '⭐ Thành Viên Gold'
                            : '💎 Thành Viên Platinum';
            tierBadge.textContent = badgeText;
        }

    } catch(e) {
        console.error('loadPoints lỗi:', e);
    }
}
async function tkRequestCancel(orderNumericId) {
  if (!orderNumericId) {
    showToast('⚠ Không xác định được đơn hàng');
    return;
  }

  if (!confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;

  try {
    const resp = await fetch('TaiKhoanServlet', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        ajax: '1',
        action: 'cancelOrder',
        orderId: orderNumericId
      }).toString()
    });

    if (!resp.ok) throw new Error('HTTP ' + resp.status);

    const data = await resp.json();

    if (data.success) {
      showToast('✅ Đã hủy đơn hàng thành công');

      setTimeout(function() {
        renderAllOrders();
        loadOverview();
      }, 500);
    } else {
      showToast('⚠ ' + (data.message || 'Không thể hủy đơn hàng này'));
    }
  } catch (e) {
    console.error('tkRequestCancel lỗi:', e);
    showToast('Lỗi kết nối, vui lòng thử lại');
  }
}