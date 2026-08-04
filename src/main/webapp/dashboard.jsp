<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Dashboard</title>

  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">

  <link rel="stylesheet" href="css/admin.css?v=<%= System.currentTimeMillis() %>"/>
  <link rel="stylesheet" href="css/dashboard.css?v=<%= System.currentTimeMillis() %>"/>
</head>
<body>

<div class="admin-layout">

  <aside class="admin-sidebar" id="adminSidebar">
    <div class="sidebar-brand"><span class="sidebar-logo">LACTT</span><span class="sidebar-role-badge">Admin Panel</span></div>
    <nav class="sidebar-nav">
      <p class="nav-group-title">Tổng quan</p>
      <div class="nav-item active" onclick="switchPage('dashboard')">Dashboard</div>
      <p class="nav-group-title">Kinh doanh</p>
      <div class="nav-item" onclick="switchPage('products')">Sản phẩm</div>
      <div class="nav-item" onclick="switchPage('orders')">Đơn hàng</div>
      <p class="nav-group-title">Quản trị</p>
      <div class="nav-item" onclick="switchPage('users')">Người dùng</div>
      <div class="nav-item" onclick="switchPage('khuyenmai')">Khuyến mãi</div>
      <p class="nav-group-title">Phân tích</p>
      <div class="nav-item" onclick="switchPage('reports')">Báo cáo & Xuất Excel</div>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-avatar">A</div>
        <div style="min-width:0;flex:1"><p class="sidebar-user-name">Admin</p><p class="sidebar-user-email">admin@lactt.vn</p></div>
      </div>
      <button class="sidebar-logout-full" onclick="AuthModal.logout()">Đăng xuất</button>
    </div>
  </aside>

  <main class="admin-main">
    
    <header class="admin-header">
      <div class="header-left">
        <button class="sidebar-toggle" id="sidebarToggleBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div>
          <h1 class="admin-header-title">Dashboard</h1>
          <p class="admin-header-subtitle" id="headerDateEl"></p>
        </div>
      </div>
      <div class="admin-header-right">
        <button class="btn btn-outline btn-sm" onclick="switchPage('orders')">Thông báo</button>
        <a href="index.jsp" class="btn btn-primary btn-sm">Quay về trang chủ</a>
      </div>
    </header>

    <div class="admin-content db-wrapper">
      
      <div class="db-filter-bar">
        <div class="db-filter-group">
            <input type="date" id="fromDate" class="db-date-input">
            <span class="db-date-separator">đến</span>
            <input type="date" id="toDate" class="db-date-input">
            <button class="btn btn-primary btn-sm" onclick="fetchDashboardData()">Thống kê</button>
            <button class="btn btn-outline btn-sm" onclick="exportData('Excel')">Xuất Excel</button>
        </div>
      </div>

      <div>
        <div class="sec-head">Tổng quan</div>
        <div class="g5">
          <div class="card kpi main-card">
            <div class="kpi-lbl"><i class="ti ti-currency-dong"></i>Doanh thu thuần</div>
            <div class="kpi-val">7.590.000 ₫</div>
            <div class="kpi-sub">Gross: 7.995.000 ₫</div>
            <span class="badge bg" style="margin-top:6px">+100% kỳ trước</span>
          </div>

          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-shopping-cart"></i>Tổng đơn hàng</div>
            <div class="kpi-val dark">4</div>
            <div class="kpi-sub">Hôm nay: 3 đơn</div>
            <span class="badge bn">0% hủy đơn</span>
          </div>

          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-truck-delivery"></i>Đơn đã giao</div>
            <div class="kpi-val green">3</div>
            <div class="kpi-sub">75% giao thành công</div>
            <span class="badge bg">Tốt</span>
          </div>

          <div class="card kpi has-tooltip">
            <div class="tip">Doanh thu đã giao / đơn đã giao</div>
            <div class="kpi-lbl"><i class="ti ti-receipt"></i>Giá trị đơn trung bình</div>
            <div class="kpi-val">1.897.500 ₫</div>
            <div class="kpi-sub">Theo đơn đã giao</div>
          </div>

          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-users"></i>Khách hàng</div>
            <div class="kpi-val dark" style="font-size:18px">4 mua · 1 mới</div>
            <div class="kpi-sub">Retention: 75%</div>
            <span class="badge bg">+100% khách mới</span>
          </div>
        </div>
      </div>

      <div>
        <div class="sec-head">Doanh thu & đơn hàng</div>
        <div class="g3a">
          <div class="card">
            <div class="card-hd">
              <div><span class="ct">Doanh thu theo ngày</span></div>
              <span class="clink">Chi tiết →</span>
            </div>
            <div class="leg">
              <span><span class="ld" style="background:var(--color-primary)"></span>Doanh thu</span>
              <span><span class="ld circle" style="background:var(--color-green)"></span>Số đơn</span>
            </div>
            <div class="chart-wrap">
              <canvas id="rev-canvas"></canvas>
            </div>
            <div class="chart-sum">
              <div class="cs-item">
                <div class="cs-lbl">Hôm nay</div>
                <div class="cs-val red">7.590.000 ₫</div>
              </div>
              <div class="cs-item">
                <div class="cs-lbl">Số đơn</div>
                <div class="cs-val">3</div>
              </div>
              <div class="cs-item">
                <div class="cs-lbl">AOV</div>
                <div class="cs-val">2.530.000 ₫</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-hd"><span class="ct">Theo trạng thái đơn</span></div>
            <div class="status-row">
              <div class="status-dot" style="background:#94a3b8"></div>
              <span class="s-name">Chờ xác nhận</span>
              <span class="s-cnt">1</span>
              <span class="s-val">400.000 ₫</span>
            </div>
            <div class="status-row">
              <div class="status-dot" style="background:var(--amber)"></div>
              <span class="s-name">Đang chuẩn bị</span>
              <span class="s-cnt">0</span>
              <span class="s-val">—</span>
            </div>
            <div class="status-row">
              <div class="status-dot" style="background:var(--color-blue)"></div>
              <span class="s-name">Đang giao</span>
              <span class="s-cnt">0</span>
              <span class="s-val">—</span>
            </div>
            <div class="status-row">
              <div class="status-dot" style="background:var(--color-green)"></div>
              <span class="s-name">Đã giao</span>
              <span class="s-cnt" style="color:var(--color-green)">3</span>
              <span class="s-val" style="color:var(--color-green);font-weight:700">7.590.000 ₫</span>
            </div>
            <div class="status-row">
              <div class="status-dot" style="background:var(--red)"></div>
              <span class="s-name">Đã hủy</span>
              <span class="s-cnt" style="color:var(--red)">0</span>
              <span class="s-val">—</span>
            </div>
          </div>

          <div class="card">
            <div class="card-hd">
              <div>
                <div class="ct">Doanh thu theo danh mục</div>
                <div class="cs" style="margin-left:0;margin-top:2px">Chỉ tính đơn đã giao</div>
              </div>
            </div>
            <div style="margin-top:4px">
              <div class="prow">
                <span class="plbl">Chăm sóc da</span>
                <div class="pbg"><div class="pf" style="width:97.6%;background:var(--color-primary)"></div></div>
                <span class="pval" style="color:var(--color-primary)">97.6%</span>
              </div>
              <div class="prow">
                <span class="plbl">Trang điểm</span>
                <div class="pbg"><div class="pf" style="width:11.7%;background:var(--color-primary-lt)"></div></div>
                <span class="pval">11.7%</span>
              </div>
              <div class="prow">
                <span class="plbl">Dưỡng thể</span>
                <div class="pbg"><div class="pf" style="width:3.7%;background:#f4b8c4"></div></div>
                <span class="pval">3.7%</span>
              </div>
            </div>
            <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border)">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:11px;color:var(--color-text-muted)">Chăm sóc da</span>
                <span style="font-size:11px;font-weight:700;color:var(--text)">7.410.000 ₫</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:11px;color:var(--color-text-muted)">Trang điểm</span>
                <span style="font-size:11px;font-weight:700;color:var(--text)">890.000 ₫</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="font-size:11px;color:var(--color-text-muted)">Dưỡng thể</span>
                <span style="font-size:11px;font-weight:700;color:var(--text)">295.000 ₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="sec-head">Hiệu quả sản phẩm</div>
        <div class="g3">
          <div class="card">
            <div class="card-hd">
              <div><span class="ct">Top bán chạy</span><span class="cs">Số lượng bán trong kỳ</span></div>
              <span class="clink">Tất cả →</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0">
                <div class="hn">Facial Treatment Essence</div>
                <div class="hsub">Chăm sóc da</div>
              </div>
              <span class="tag tg">2 sp</span>
              <span style="font-size:12px;font-weight:700;color:var(--color-primary);margin-left:4px;">4.540.000 ₫</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0"><div class="hn">Génifique Advanced Youth</div><div class="hsub">Chăm sóc da</div></div>
              <span class="tag tg">1 sp</span><span style="font-size:12px;font-weight:700;color:var(--color-primary);margin-left:4px;">1.890.000 ₫</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0"><div class="hn">Ultra Facial Cream SPF 30</div><div class="hsub">Chăm sóc da</div></div>
              <span class="tag tg">1 sp</span><span style="font-size:12px;font-weight:700;color:var(--color-primary);margin-left:4px;">590.000 ₫</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0"><div class="hn">Pro Filt'r Soft Matte</div><div class="hsub">Trang điểm</div></div>
              <span class="tag tg">1 sp</span><span style="font-size:12px;font-weight:700;color:var(--color-primary);margin-left:4px;">890.000 ₫</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0"><div class="hn">Green Tea Hyaluronic Acid</div><div class="hsub">Chăm sóc da</div></div>
              <span class="tag tg">1 sp</span><span style="font-size:12px;font-weight:700;color:var(--color-primary);margin-left:4px;">385.000 ₫</span>
            </div>
          </div>

          <div class="card">
            <div class="card-hd"><div><span class="ct">Sản phẩm bán chậm</span><span class="cs">Còn tồn, bán ít trong kỳ</span></div></div>
            <div class="hrow">
              <div style="flex:1;min-width:0">
                <div class="hn">Retinol Night Cream</div>
                <div class="hsub">Tồn: 42 sp</div>
              </div><span class="tag tw">0 đơn</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0"><div class="hn">Vitamin C Serum 30ml</div><div class="hsub">Tồn: 38 sp</div></div>
              <span class="tag tw">0 đơn</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0"><div class="hn">Eye Cream SPF 15</div><div class="hsub">Tồn: 27 sp</div></div>
              <span class="tag tw">0 đơn</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0"><div class="hn">Moisture Surge 100H</div><div class="hsub">Tồn: 55 sp</div></div>
              <span class="tag tw">1 đơn</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0"><div class="hn">Overnight Mask Repair</div><div class="hsub">Tồn: 18 sp</div></div>
              <span class="tag tw">1 đơn</span>
            </div>
          </div>

          <div class="card">
            <div class="card-hd"><div><span class="ct">Sản phẩm đánh giá thấp</span><span class="cs">Điểm thấp nhất</span></div></div>
            <div class="hrow">
              <div style="flex:1;min-width:0">
                <div class="hn">Brightening Mask</div>
                <div class="hsub">8 lượt đánh giá</div>
              </div>
              <span class="star-val">2.3 ★</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0">
                <div class="hn">Foam Cleanser Travel</div>
                <div class="hsub">5 lượt đánh giá</div>
              </div>
              <span class="star-val">2.7 ★</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0">
                <div class="hn">Exfoliating Toner 200ml</div>
                <div class="hsub">12 lượt đánh giá</div>
              </div>
              <span class="star-val">2.9 ★</span>
            </div>
            <div class="hrow">
              <div style="flex:1;min-width:0">
                <div class="hn">BB Cushion SPF50</div>
                <div class="hsub">3 lượt đánh giá</div>
              </div>
              <span class="star-val">3.1 ★</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="sec-head">Tồn kho</div>
        <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-bottom:14px">
          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-stack"></i>Tổng tồn kho</div>
            <div class="kpi-val dark">1.248</div>
            <div class="kpi-sub">đơn vị</div>
          </div>
          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-currency-dong"></i>Giá trị tồn</div>
            <div class="kpi-val" style="font-size:16px;color:var(--text)">142.600.000 ₫</div>
            <div class="kpi-sub">Vốn đang đóng băng</div>
          </div>
          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-alert-triangle"></i>Sắp hết hàng</div>
            <div class="kpi-val amber">5</div>
            <div class="kpi-sub">sản phẩm</div>
            <span class="badge by">Cần nhập thêm</span>
          </div>
          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-ban"></i>Hết hàng</div>
            <div class="kpi-val red">2</div>
            <div class="kpi-sub">sản phẩm</div>
            <span class="badge bdanger">Hết hàng</span>
          </div>
          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-archive"></i>Sản phẩm tồn cao</div>
            <div class="kpi-val" style="color:var(--color-primary)">8</div>
            <div class="kpi-sub">sản phẩm ≥100 units</div>
            <span class="badge br">Cân nhắc xả hàng</span>
          </div>
        </div>

        <div class="card" style="padding:16px 20px">
          <div class="card-hd">
            <div>
              <span class="ct">Tồn kho theo danh mục</span>
              <span class="cs">Cột: số lượng · Đường: giá trị</span>
            </div>
            <span class="insight-badge"><i class="ti ti-trending-up" style="font-size:14px"></i>Chăm sóc da tồn cao nhất</span>
          </div>
          <div class="leg">
            <span><span class="ld" style="background:#f4b8c4"></span>Số lượng tồn</span>
            <span><span class="ld circle" style="background:var(--color-primary)"></span>Giá trị tồn (triệu ₫)</span>
          </div>
          <div style="position:relative;height:160px">
            <canvas id="inv-canvas"></canvas>
          </div>
          <div id="inv-tooltip"></div>
        </div>
      </div>

      <div>
        <div class="sec-head">Khuyến mãi & khách hàng</div>
        <div class="g4p">
          <div class="card">
            <div class="card-hd"><span class="ct"><i class="ti ti-ticket" style="font-size:16px;color:var(--color-primary);vertical-align:-2px;margin-right:4px"></i>Voucher được dùng nhiều</span></div>
            <table class="tbl">
              <thead>
                <tr>
                  <th style="width:34%">Mã voucher</th>
                  <th style="width:18%">Lần dùng</th>
                  <th style="width:30%">Tổng giảm</th>
                  <th style="width:18%">Hiệu quả</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>LACTT10</td><td>12</td><td>1.200.000 ₫</td><td><span class="tag tg">Cao</span></td></tr>
                <tr><td>NEWUSER20</td><td>8</td><td>960.000 ₫</td><td><span class="tag tg">Cao</span></td></tr>
                <tr><td>SALE05</td><td>3</td><td>150.000 ₫</td><td><span class="tag tw">TB</span></td></tr>
              </tbody>
            </table>
          </div>

          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-discount-2"></i>Tổng giảm giá</div>
            <div class="kpi-val" style="font-size:18px;color:var(--text)">405.000 ₫</div>
            <div class="kpi-sub">Trong kỳ lọc</div>
            <span class="badge br">5.0% doanh thu</span>
          </div>

          <div class="card kpi">
            <div class="kpi-lbl"><i class="ti ti-repeat"></i>Khách mua lại</div>
            <div class="kpi-val green">3</div>
            <div class="kpi-sub">≥2 đơn không hủy</div>
            <span class="badge bg">Tốt</span>
          </div>

          <div class="card kpi success-card">
            <div class="kpi-lbl"><i class="ti ti-percentage"></i>Tỷ lệ mua lại</div>
            <div class="kpi-val green">75%</div>
            <div class="kpi-sub">Khách mua lại / tổng mua</div>
            <span class="badge bg">+100% kỳ trước</span>
          </div>
        </div>
      </div>

    </div>
  </main>
</div>

<div id="chartZoomModal" class="db-modal" onclick="document.getElementById('chartZoomModal').style.display='none'">
    <div class="db-modal-content db-zoom-content" onclick="event.stopPropagation()">
        <span class="db-zoom-close" onclick="document.getElementById('chartZoomModal').style.display='none'">&times;</span>
        <div id="zoomTarget"></div>
    </div>
</div>

<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/auth-modal.js"></script>
<script src="js/admin.js?v=<%= System.currentTimeMillis() %>"></script>
<script src="js/dashboard.js?v=<%= System.currentTimeMillis() %>"></script>

</body>
</html>