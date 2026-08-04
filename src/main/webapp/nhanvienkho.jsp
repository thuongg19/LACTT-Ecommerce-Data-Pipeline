<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>LACTT — Nhân Viên Kho</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="css/nhanvienkho.css"/>
</head>
<body>
<div class="kho-layout">

  <!-- SIDEBAR -->
  <aside class="kho-sidebar" id="khoSidebar">
    <div class="sidebar-brand">
      <span class="sidebar-logo">LACTT</span>
      <span class="sidebar-role-badge">📦 Nhân viên Kho</span>
    </div>

    <nav class="sidebar-nav">
      <p class="nav-group-title">Công việc hôm nay</p>

      <div class="nav-item active" data-panel="orders">
        <span class="nav-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </span>
        Đơn chờ đóng gói
        <span class="nav-badge" id="navBadgeOrders" style="display:none">0</span>
      </div>

      <div class="nav-item" data-panel="import">
        <span class="nav-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </span>
        Nhập hàng mới
      </div>

      <p class="nav-group-title">Quản lý kho</p>

      <div class="nav-item" data-panel="inventory">
        <span class="nav-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
        </span>
        Soi tồn kho
      </div>

      <div class="nav-item" data-panel="logs">
        <span class="nav-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </span>
        Nhật ký kho
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-avatar">🧑‍💼</div>
        <div style="min-width:0;flex:1">
          <p class="sidebar-user-name" id="sidebarUserName">NV Kho</p>
          <p class="sidebar-user-email" id="sidebarUserEmail">kho@lactt.vn</p>
        </div>
      </div>
      <button class="sidebar-logout-full" id="logoutBtn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Đăng xuất
      </button>
    </div>
  </aside>
  <div class="sidebar-overlay" id="sidebarOverlay"></div>

  <!-- MAIN -->
  <main class="kho-main">

    <!-- HEADER -->
    <header class="kho-header">
      <button class="sidebar-toggle" id="sidebarToggleBtn" aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div>
        <h1 class="kho-header-title" id="khoHeaderTitle">Đơn chờ đóng gói</h1>
        <p class="kho-header-subtitle" id="khoHeaderSubtitle"></p>
      </div>
      <div class="kho-header-right">
        <a href="index.jsp"    class="btn btn-outline btn-sm">← Trang chủ</a>
      </div>
    </header>

    <div class="kho-content">

      <!-- STATS TỔNG QUAN -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon orange">📦</div>
          <div class="stat-body">
            <p class="stat-num" id="statPending">0</p>
            <p class="stat-label">Đơn chờ đóng gói</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pink">⚠️</div>
          <div class="stat-body">
            <p class="stat-num" id="statLowStock">0</p>
            <p class="stat-label">Sản phẩm sắp hết</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">⬆️</div>
          <div class="stat-body">
            <p class="stat-num" id="statTodayIn">0</p>
            <p class="stat-label">Nhập hôm nay (hộp)</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">⬇️</div>
          <div class="stat-body">
            <p class="stat-num" id="statTodayOut">0</p>
            <p class="stat-label">Xuất hôm nay (hộp)</p>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════
           PANEL 1 — ĐƠN CHỜ ĐÓNG GÓI
      ══════════════════════════════ -->
      <div class="kho-panel active" id="panel-orders">
        <div class="kho-card">
          <div class="card-header">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="card-title">Đơn hàng chờ đóng gói</span>
              <span class="card-subtitle" id="pendingOrderCount">0 đơn</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="renderPendingOrders()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.52-7.19"/></svg>
              Làm mới
            </button>
          </div>
          <div class="order-pending-list" id="pendingOrderList">
            <!-- render by JS -->
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════
           PANEL 2 — NHẬP HÀNG MỚI
      ══════════════════════════════ -->
      <div class="kho-panel" id="panel-import">
        <div class="kho-card">
          <div class="card-header">
            <span class="card-title">Nhập hàng mới về kho</span>
            <span style="font-size:.8rem;color:var(--light)">Hệ thống sẽ tự cộng tồn và ghi nhật ký</span>
          </div>
          <div class="import-form">

            <!-- Tìm sản phẩm -->
            <div style="margin-bottom:8px;font-size:.83rem;font-weight:600;color:var(--mid)">
              1. Tìm sản phẩm cần nhập
            </div>
            <div class="import-search-wrap">
              <svg class="import-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" id="importSearchInput"
                     class="import-search-input"
                     placeholder="Tìm theo tên, thương hiệu, mã sản phẩm..." autocomplete="off"/>
              <div class="import-search-results" id="importSearchResults"></div>
            </div>

            <!-- Sản phẩm đã chọn -->
            <div class="import-selected-product" id="importSelectedProduct">
              <span class="import-selected-emoji" id="impSelEmoji">📦</span>
              <div class="import-selected-info">
                <div class="import-selected-name"  id="impSelName">—</div>
                <div class="import-selected-brand" id="impSelBrand">—</div>
                <div class="import-selected-stock" id="impSelStock">—</div>
              </div>
            </div>

            <!-- Chọn định lượng / variant (chỉ hiện khi sản phẩm có variant) -->
            <div id="importVariantRow" style="display:none;margin-bottom:14px;">
              <div style="margin-bottom:6px;font-size:.83rem;font-weight:600;color:#c4626e">
                ⚠️ Sản phẩm có nhiều định lượng — chọn đúng loại cần nhập:
              </div>
              <select id="importVariantSelect" style="width:100%;padding:9px 12px;border:1.5px solid #c4626e;border-radius:8px;font-size:.88rem;color:var(--dark);background:#fff;cursor:pointer;outline:none;">
                <option value="">-- Chọn định lượng (30ml / 50ml / 100ml ...) --</option>
              </select>
            </div>

            <!-- Số lượng & ghi chú -->
            <div style="margin-bottom:8px;font-size:.83rem;font-weight:600;color:var(--mid)">
              2. Nhập số lượng và ghi chú
            </div>
            <div class="import-qty-row">
              <label class="import-qty-label">Số hộp nhập:</label>
              <input type="number" id="importQtyInput" class="import-qty-input"
                     placeholder="0" min="1" max="9999"/>
              <input type="text" id="importNoteInput" class="import-note-input"
                     placeholder="Ghi chú (VD: Lô hàng từ nhà phân phối Ohui tháng 4)"/>
            </div>

            <!-- Nút -->
            <div style="display:flex;gap:10px">
              <button class="btn btn-success" id="importSaveBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Lưu — Nhập kho
              </button>
              <button class="btn btn-outline" id="importClearBtn">Xóa form</button>
            </div>
          </div>
        </div>

        <!-- Nhập hàng nhanh gần đây -->
        <div class="kho-card">
          <div class="card-header">
            <span class="card-title">Lịch sử nhập hàng gần đây</span>
          </div>
          <div style="overflow-x:auto">
            <table class="kho-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Sản phẩm</th>
                  <th>Số lượng nhập</th>
                  <th>Nhân viên</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody id="recentImportBody">
                <tr><td colspan="5" style="text-align:center;padding:24px;color:var(--light);font-size:.85rem">Chưa có dữ liệu</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════
           PANEL 3 — TỒN KHO
      ══════════════════════════════ -->
      <div class="kho-panel" id="panel-inventory">
        <div class="kho-card" style="margin-bottom:16px;padding:16px 22px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px;font-size:.85rem">
            <span style="font-size:1.2rem">⚠️</span>
            <span style="color:var(--danger);font-weight:600">Sắp hết hàng:</span>
            <strong id="invLowCount" style="color:var(--danger)">0</strong> sản phẩm
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:.85rem">
            <span style="font-size:1.2rem">🚫</span>
            <span style="color:var(--mid)">Hết hàng:</span>
            <strong id="invZeroCount">0</strong> sản phẩm
          </div>
          <div style="flex:1"></div>
          <button class="btn btn-outline btn-sm" onclick="renderInventory()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.52-7.19"/></svg>
            Làm mới
          </button>
        </div>

        <div class="kho-card">
          <div class="inventory-toolbar">
            <div class="inventory-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--light);flex-shrink:0">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" id="invSearchInput" placeholder="Tìm sản phẩm..."/>
            </div>
            <button class="inv-filter-btn active"  onclick="setInvFilter('all',this)">Tất cả</button>
            <button class="inv-filter-btn"         onclick="setInvFilter('low',this)">⚠️ Sắp hết (&lt;5)</button>
            <button class="inv-filter-btn"         onclick="setInvFilter('out',this)">🚫 Hết hàng</button>
            <button class="inv-filter-btn"         onclick="setInvFilter('ok',this)">✅ Đủ hàng</button>
          </div>
          <div style="overflow-x:auto">
            <table class="kho-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Thương hiệu</th>
                  <th>Tồn kho</th>
                  <th>Tình trạng</th>
                  <th>Giá bán</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody id="inventoryTableBody">
                <!-- render by JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════
           PANEL 4 — NHẬT KÝ KHO
      ══════════════════════════════ -->
      <div class="kho-panel" id="panel-logs">
        <div class="kho-card">
          <div class="card-header">
            <span class="card-title">Nhật ký kho</span>
            <span style="font-size:.78rem;color:var(--light)">Mọi biến động đều được ghi lại</span>
          </div>

          <div class="log-filters">
            <button class="inv-filter-btn active log-type-btn" data-type="all">Tất cả</button>
            <button class="inv-filter-btn log-type-btn" data-type="in">⬆️ Nhập hàng</button>
            <button class="inv-filter-btn log-type-btn" data-type="out">⬇️ Xuất hàng</button>
            <div class="log-search" style="flex:1;min-width:180px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--light);flex-shrink:0">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" id="logSearchInput" placeholder="Tìm theo sản phẩm, mã đơn, nhân viên..."/>
            </div>
          </div>

          <div style="overflow-x:auto">
            <table class="kho-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Loại</th>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Nhân viên / Đơn hàng</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody id="logsTableBody">
                <!-- render by JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div><!-- /kho-content -->
  </main>
</div>

<!-- CONFIRM DIALOG -->
<div class="confirm-dialog" id="confirmDialog">
  <div class="confirm-box">
    <div class="confirm-icon" id="confirmIcon">⚠️</div>
    <h3 class="confirm-title" id="confirmTitle">Xác nhận</h3>
    <p class="confirm-msg"    id="confirmMsg">Bạn có chắc chắn?</p>
    <div class="confirm-actions">
      <button class="btn btn-outline" id="confirmCancelBtn">Hủy</button>
      <button class="btn btn-success" id="confirmOkBtn">✔ Xác nhận</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div class="kho-toast" id="khoToast"></div>
<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/nhanvienkho.js"></script>
</body>
</html>
