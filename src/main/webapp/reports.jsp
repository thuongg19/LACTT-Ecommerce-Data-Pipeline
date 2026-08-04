<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Báo cáo & Xuất Excel - LACTT Admin</title>

  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

  <link rel="stylesheet" href="css/admin.css?v=<%= System.currentTimeMillis() %>"/>
  <link rel="stylesheet" href="css/reports.css?v=<%= System.currentTimeMillis() %>"/>
</head>
<body>

<div class="admin-layout">

  <aside class="admin-sidebar" id="adminSidebar">
    <div class="sidebar-brand">
      <span class="sidebar-logo">LACTT</span>
      <span class="sidebar-role-badge">Admin Panel</span>
    </div>
    <nav class="sidebar-nav">
      <p class="nav-group-title">Tổng quan</p>
      <div class="nav-item" onclick="switchPage('dashboard')">Dashboard</div>
      <p class="nav-group-title">Kinh doanh</p>
      <div class="nav-item" onclick="switchPage('products')">Sản phẩm</div>
      <div class="nav-item" onclick="switchPage('orders')">Đơn hàng</div>
      <p class="nav-group-title">Quản trị</p>
      <div class="nav-item" onclick="switchPage('users')">Người dùng</div>
      <div class="nav-item" onclick="switchPage('khuyenmai')">Khuyến mãi</div>
      <p class="nav-group-title">Phân tích</p>
      <div class="nav-item active" onclick="switchPage('reports')">Báo cáo & Xuất Excel</div>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-avatar">A</div>
        <div style="min-width:0;flex:1"><p class="sidebar-user-name">Admin</p><p class="sidebar-user-email">admin@lactt.vn</p></div>
      </div>
      <button class="sidebar-logout-full" onclick="logout()">Đăng xuất</button>
    </div>
  </aside>

  <main class="admin-main">

    <header class="admin-header">
      <div class="header-left">
        <button class="sidebar-toggle" id="sidebarToggleBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div>
          <h1 class="admin-header-title">Báo cáo & Xuất Excel</h1>
          <p class="admin-header-subtitle" id="headerDateEl"></p>
        </div>
      </div>
      <div class="admin-header-right">
        <button class="btn btn-outline btn-sm" onclick="switchPage('orders')">Thông báo</button>
        <a href="index.jsp" class="btn btn-primary btn-sm">Quay về trang chủ</a>
      </div>
    </header>

    <div class="bc-tabs">
      <div class="bc-tab active" id="t0" onclick="go(0)">Đối soát giao dịch</div>
      <div class="bc-tab" id="t1" onclick="go(1)">Báo cáo doanh thu & Xuất dữ liệu</div>
    </div>

    <div class="admin-content">

      <!-- ============================================== -->
      <!-- TAB 1: ĐỐI SOÁT GIAO DỊCH -->
      <!-- ============================================== -->
      <div class="bc-panel active" id="p0">
        <div class="fbar">
          <span class="fl">Từ ngày</span>
          <input class="fi" type="date" id="dsFromDate"/>
          <span class="fsep">đến</span>
          <input class="fi" type="date" id="dsToDate"/>
          <select class="fs" id="dsStatus">
            <option value="">Tất cả trạng thái</option>
            <option value="KHOP">Khớp</option>
            <option value="SAI_LECH">Sai lệch</option>
            <option value="CHO_XU_LY">Chờ xử lý</option>
          </select>
          <select class="fs" id="dsBank">
            <option value="">Tất cả ngân hàng</option>
            <option value="VCB">VCB</option>
            <option value="BIDV">BIDV</option>
            <option value="MOMO">Momo</option>
          </select>
          <div class="fsp"></div>
          <button class="up-btn" id="uploadBtn" onclick="uploadBankFile()">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 1v9M5 4l3-3 3 3M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Tải file NH
          </button>
          <button class="btn btn-primary btn-sm" onclick="runReconciliation()">Chạy đối soát</button>
          <button class="btn btn-outline btn-sm" onclick="exportExcel('reconcile')">Xuất Excel</button>
        </div>

        <div class="alert-box" id="dsAlertBox" style="display: none;">
          <div class="ai"><span>!</span></div>
          <div class="at"><strong id="dsMismatchCount">0 giao dịch sai lệch</strong> được phát hiện trong kỳ đối soát này. Vui lòng kiểm tra và xác nhận.</div>
        </div>

        <div class="krow">
          <div class="kcard"><div class="klbl">Tổng GD hệ thống</div><div class="kval info" id="dsTotal">0</div></div>
          <div class="kcard"><div class="klbl">Giao dịch khớp</div><div class="kval ok" id="dsMatched">0</div></div>
          <div class="kcard"><div class="klbl">Sai lệch</div><div class="kval err" id="dsMismatch">0</div></div>
          <div class="kcard"><div class="klbl">Chờ xử lý</div><div class="kval warn" id="dsPending">0</div></div>
        </div>

        <div class="twrap">
          <div class="thead-row">
            <span class="ttitle">Danh sách giao dịch đối soát</span>
            <div class="tacts">
              <input class="fi" type="text" id="dsSearch" placeholder="Tìm mã giao dịch..." style="width: 200px;" oninput="filterTable()"/>
              <button class="btn btn-outline btn-sm" onclick="confirmAllMatch()">Xác nhận tất cả khớp</button>
            </div>
          </div>
          <table class="admin-table">
            <thead><tr>
              <th>Mã GD hệ thống</th>
              <th>Ngày GD</th>
              <th>Khách hàng</th>
              <th>Số tiền HT (đ)</th>
              <th>Số tiền NH (đ)</th>
              <th>Chênh lệch</th>
              <th>NH</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr></thead>
            <tbody id="dsTableBody">
              <!-- Dữ liệu sẽ được JS đổ vào đây -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- TAB 2: BÁO CÁO DOANH THU & XUẤT DỮ LIỆU -->
      <!-- ============================================== -->
      <div class="bc-panel" id="p1">
        <div class="fbar">
          <span class="fl">Kỳ báo cáo</span>
          <input class="fi" type="date" id="revFromDate"/>
          <span class="fsep">đến</span>
          <input class="fi" type="date" id="revToDate"/>
          <select class="fs" id="revCategory">
            <option value="">Tất cả danh mục</option>
            <!-- Categories sẽ được load bằng JS -->
          </select>
          <div class="fsp"></div>
          <button class="btn btn-primary btn-sm" onclick="loadRevenue()">Xem báo cáo</button>
          <button class="btn btn-outline btn-sm" onclick="exportExcel('revenue')">Xuất Excel</button>
        </div>

        <div class="krow">
          <div class="kcard"><div class="klbl">Doanh thu thuần</div><div class="kval pink" id="revNet">0 đ</div><div class="ksub" style="color:#27ae60;">↑ +100% vs kỳ trước</div></div>
          <div class="kcard"><div class="klbl">Tổng đơn hàng</div><div class="kval ok" id="revTotalOrders">0</div><div class="ksub" style="color:#27ae60;">↑ +8 đơn vs kỳ trước</div></div>
          <div class="kcard"><div class="klbl">AOV (giá trị đơn TB)</div><div class="kval info" id="revAOV">0 đ</div><div class="ksub">1.73 đơn / ngày</div></div>
          <div class="kcard"><div class="klbl">Tỷ lệ hủy đơn</div><div class="kval warn" id="revCancelRate">0%</div><div class="ksub" style="color:#e8637a;">↑ +1.2pp vs kỳ trước</div></div>
          <div class="kcard"><div class="klbl">Tổng SP bán</div><div class="kval info" id="revTotalProducts">0</div></div>
        </div>

        <div class="two-col">
          <div class="bc-card">
            <div class="chd">
              <div><div class="ctitle">Doanh thu thực hiện vs kế hoạch</div><div class="csub">So sánh T5 và T4 / 2026</div></div>
            </div>
            <div class="bar-chart-wrap">
              <div class="bgrp"><div class="bc-bar bpl" style="height:72px"></div><div class="bc-bar b1" style="height:88px"></div><div class="bc-bar b2" style="height:54px"></div></div>
              <div class="bgrp"><div class="bc-bar bpl" style="height:65px"></div><div class="bc-bar b1" style="height:78px"></div><div class="bc-bar b2" style="height:60px"></div></div>
              <div class="bgrp"><div class="bc-bar bpl" style="height:80px"></div><div class="bc-bar b1" style="height:90px"></div><div class="bc-bar b2" style="height:68px"></div></div>
              <div class="bgrp"><div class="bc-bar bpl" style="height:70px"></div><div class="bc-bar b1" style="height:75px"></div><div class="bc-bar b2" style="height:58px"></div></div>
            </div>
            <div class="xlbls"><span class="xlbl">T1</span><span class="xlbl">T2</span><span class="xlbl">T3</span><span class="xlbl">T4</span></div>
            <div class="leg">
              <div class="lgi"><div class="lgd" style="background:var(--pink)"></div>T5/2026</div>
              <div class="lgi"><div class="lgd" style="background:var(--pink-soft)"></div>T4/2026</div>
              <div class="lgi"><div class="lgd" style="background:#E6F1FB;border:1px solid #B5D4F4"></div>Kế hoạch</div>
            </div>
          </div>

          <div class="bc-card">
            <div class="chd"><div class="ctitle">Chi tiết doanh thu theo ngày</div></div>
            <table class="dn-table">
              <thead><tr>
                <th>Ngày</th>
                <th style="text-align:right;">Số đơn</th>
                <th style="text-align:right;">DT thuần (đ)</th>
                <th style="text-align:right;">AOV (đ)</th>
                <th style="text-align:right;">vs hôm qua</th>
              </tr></thead>
              <tbody id="revTableBody">
                <!-- Data will be rendered by JS -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- User Behavior Chart -->
        <div class="two-col">
          <div class="bc-card">
            <div class="chd"><div class="ctitle">Truy cập & Người mua</div><div class="csub">Traffic & Buyer</div></div>
            <div id="chart-traffic"></div>
          </div>

          <div class="bc-card">
            <div class="chd"><div class="ctitle">Phân khúc khách hàng</div><div class="csub">Customer Segment</div></div>
            <div id="chart-segment"></div>
          </div>
        </div>

        <div style="font-size:14px;font-weight:600;color:var(--charcoal);margin-top:8px;">Xuất dữ liệu</div>
        <div class="export-grid">
          <div class="ecard feat">
            <div class="ecard-top">
              <div class="eicon" style="background:#FBEAF0;">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="#c94068" stroke-width="1.4"/><path d="M7 7h6M7 10h6M7 13h4" stroke="#c94068" stroke-width="1.4" stroke-linecap="round"/></svg>
              </div>
              <div><div class="ename">Báo cáo doanh thu</div><span class="badge bPink" style="font-size:10px;margin-top:4px;">Phổ biến</span></div>
            </div>
            <div class="edesc">Doanh thu thuần, gộp, AOV, phân tích theo danh mục và kênh bán hàng.</div>
            <div class="emeta"><span class="etag">Excel .xlsx</span><span class="etag">Theo tháng</span></div>
            <div class="efooter"><span class="elast">Xuất lần cuối: 01/05/2026</span><button class="btn btn-primary btn-sm" onclick="exportExcel('revenue')">Xuất ngay ↓</button></div>
          </div>

          <div class="ecard">
            <div class="ecard-top">
              <div class="eicon" style="background:#EAF3DE;">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="#3B6D11" stroke-width="1.4"/><path d="M7 7h6M7 10h6M7 13h4" stroke="#3B6D11" stroke-width="1.4" stroke-linecap="round"/></svg>
              </div>
              <div><div class="ename">Danh sách đơn hàng</div></div>
            </div>
            <div class="edesc">Chi tiết từng đơn hàng, trạng thái, khách hàng và phương thức thanh toán.</div>
            <div class="emeta"><span class="etag">Excel .xlsx</span><span class="etag">Từng đơn</span></div>
            <div class="efooter"><span class="elast">Xuất lần cuối: 30/04/2026</span><button class="btn btn-outline btn-sm">Xuất ngay ↓</button></div>
          </div>

          <div class="ecard">
            <div class="ecard-top">
              <div class="eicon" style="background:#EAF3DE;">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="8" r="4" stroke="#3B6D11" stroke-width="1.4"/><path d="M4 17c0-3 2.686-5 6-5s6 2 6 5" stroke="#3B6D11" stroke-width="1.4" stroke-linecap="round"/></svg>
              </div>
              <div><div class="ename">Dữ liệu khách hàng</div></div>
            </div>
            <div class="edesc">Thông tin khách hàng, lịch sử mua, phân khúc VIP / mới / quay lại.</div>
            <div class="emeta"><span class="etag">Excel .xlsx</span><span class="etag">CSV</span></div>
            <div class="efooter"><span class="elast">Xuất lần cuối: 28/04/2026</span><button class="btn btn-outline btn-sm">Xuất ngay ↓</button></div>
          </div>

          <div class="ecard">
            <div class="ecard-top">
              <div class="eicon" style="background:#FFF3E0;">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10l3 3 7-7" stroke="#E67E22" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div><div class="ename">Kết quả đối soát</div></div>
            </div>
            <div class="edesc">Toàn bộ kết quả đối soát theo kỳ, bao gồm giao dịch sai lệch.</div>
            <div class="emeta"><span class="etag">Excel .xlsx</span><span class="etag">Theo kỳ</span></div>
            <div class="efooter"><span class="elast">Xuất lần cuối: 02/05/2026</span><button class="btn btn-outline btn-sm" onclick="exportExcel('reconcile')">Xuất ngay ↓</button></div>
          </div>
        </div>

        <div class="twrap" style="margin-top: 24px;">
          <div class="thead-row">
            <span class="ttitle">Lịch sử xuất file</span>
            <select class="fs" style="font-size:12px; padding:6px 10px; width: auto;"><option>Tất cả loại</option><option>Doanh thu</option><option>Đơn hàng</option></select>
          </div>
          <table class="admin-table">
            <colgroup><col style="width:24%"><col style="width:18%"><col style="width:16%"><col style="width:16%"><col style="width:14%"><col style="width:12%"></colgroup>
            <thead><tr><th>Tên file</th><th>Loại báo cáo</th><th>Khoảng thời gian</th><th>Thời điểm xuất</th><th>Người xuất</th><th>Thao tác</th></tr></thead>
            <tbody>
              <tr><td class="mono">DT_T5_2026.xlsx</td><td><span class="badge bPink">Doanh thu</span></td><td>T5/2026</td><td>02/05 08:12</td><td>Admin</td><td><span class="lnk">Tải về</span></td></tr>
              <tr><td class="mono">DH_Apr_2026.xlsx</td><td><span class="badge bBlue">Đơn hàng</span></td><td>30/04/2026</td><td>01/05 07:00</td><td>Tự động</td><td><span class="lnk">Tải về</span></td></tr>
              <tr><td class="mono">DoiSoat_0105.xlsx</td><td><span class="badge bWarn">Đối soát</span></td><td>01/05/2026</td><td>01/05 06:00</td><td>Tự động</td><td><span class="lnk">Tải về</span></td></tr>
              <tr><td class="mono">KH_Q1_2026.xlsx</td><td><span class="badge bOk">Khách hàng</span></td><td>Q1/2026</td><td>28/04 14:33</td><td>Admin</td><td><span class="lnk">Tải về</span></td></tr>
            </tbody>
          </table>
          <div class="pag">
            <span class="pinf">4 file gần nhất</span>
            <div class="pbtns"><button class="pbtn cur">1</button><button class="pbtn">2</button><button class="pbtn">›</button></div>
          </div>
        </div>
      </div>

    </div>
  </main>
</div>

<script>window.APP_CONTEXT = '<%=request.getContextPath()%>';</script>
<script src="js/admin.js?v=<%= System.currentTimeMillis() %>"></script>
<script src="js/reports.js?v=<%= System.currentTimeMillis() %>"></script>
</body>
</html>