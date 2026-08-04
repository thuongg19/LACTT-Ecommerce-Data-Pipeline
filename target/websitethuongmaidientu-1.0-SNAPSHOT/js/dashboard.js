document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    document.getElementById('fromDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('toDate').value = today.toISOString().split('T')[0];

    fetchDashboardData();
});

function formatCurrency(amount) {
    if (!amount) return '0 ₫';
    return Math.round(amount).toLocaleString('vi-VN') + ' ₫';
}

async function fetchDashboardData() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    if (!fromDate || !toDate) return alert('Vui lòng chọn ngày.');
    if (new Date(fromDate) > new Date(toDate)) return alert('Ngày kết thúc phải sau ngày bắt đầu.');

    try {
        const response = await fetch(`${window.APP_CONTEXT || '/websitethuongmaidientu'}/admin/dashboard-api?action=getDashboard&from=${fromDate}&to=${toDate}`);
        if (!response.ok) return alert('Đã xảy ra lỗi hệ thống.');

        const data = await response.json();

        renderKPIs(data);
        renderOrderStatus(data.ordersByStatus || []);
        
        if (data.dailyRevenueList) {
            renderRevenueChart(data.dailyRevenueList);
        }

        renderCategories(data.categoryList || []);

        if (data.topProducts) {
            renderTopProducts(data.topProducts);
        }
        
        if (data.slowSellingProducts) {
            renderSlowProducts(data.slowSellingProducts);
        }

        renderInventoryOverview(data);

        if (data.inventoryByCategory) {
            renderInventoryChart(data.inventoryByCategory);
        }

        attachZoomEvents();

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        alert('Lỗi kết nối tới server. Vui lòng thử lại.');
    }
}

function renderKPIs(data) {
    const kpiCards = document.querySelectorAll('.g5 .card.kpi');
    if (kpiCards.length < 5) return;

    kpiCards[0].querySelector('.kpi-val').innerText = formatCurrency(data.netRevenue);
    kpiCards[0].querySelector('.kpi-sub').innerText = 'Gross: ' + formatCurrency(data.grossRevenue);

    kpiCards[1].querySelector('.kpi-val').innerText = data.totalOrders || 0;
    kpiCards[1].querySelector('.badge').innerText = (data.cancelRate || 0).toFixed(1) + '% hủy đơn';

    kpiCards[2].querySelector('.kpi-val').innerText = data.deliveredOrders || 0;
    let successRate = data.totalOrders > 0 ? ((data.deliveredOrders || 0) / data.totalOrders * 100) : 0;
    kpiCards[2].querySelector('.kpi-sub').innerText = successRate.toFixed(1) + '% giao thành công';

    kpiCards[3].querySelector('.kpi-val').innerText = formatCurrency(data.aov);

    if (data.customerSegmentList) {
        let newCust = 0;
        let totalCust = 0;
        data.customerSegmentList.forEach(s => {
            let name = s.segmentName || s.name || s.ten_phan_khuc || '';
            if (name === 'Mới' || name === 'New') newCust = s.count || 0;
            totalCust += (s.count || 0);
        });
        let newPct = totalCust > 0 ? (newCust / totalCust * 100) : 0;
        
        kpiCards[4].querySelector('.kpi-val').innerText = `${totalCust} mua · ${newCust} mới`;
        kpiCards[4].querySelector('.badge').innerText = `+${newPct.toFixed(1)}% khách mới`;
    }

    const summaryVals = document.querySelectorAll('.chart-sum .cs-val');
    if (summaryVals.length >= 3) {
        summaryVals[0].innerText = formatCurrency(data.netRevenue);
        summaryVals[1].innerText = data.totalOrders;
        summaryVals[2].innerText = formatCurrency(data.aov);
    }
}

function renderOrderStatus(statusList) {
    const cards = Array.from(document.querySelectorAll('.card'));
    const targetCard = cards.find(c => {
        const ct = c.querySelector('.ct');
        return ct && ct.textContent.includes('Theo trạng thái đơn');
    });
    if (!targetCard) return;

    let html = `<div class='card-hd'><span class='ct'>Theo trạng thái đơn</span></div>`;

    if (!statusList || statusList.length === 0) {
        statusList = []; 
    }

    const statusMap = {
        'cho_xac_nhan': { name: 'Chờ xác nhận', color: '#94a3b8' },
        'dang_chuan_bi': { name: 'Đang chuẩn bị', color: 'var(--amber)' },
        'dang_giao': { name: 'Đang giao', color: 'var(--color-blue)' },
        'da_giao': { name: 'Đã giao', color: 'var(--g)' },
        'da_huy': { name: 'Đã hủy', color: 'var(--red)' }
    };

    const keysToShow = ['cho_xac_nhan', 'dang_chuan_bi', 'dang_giao', 'da_giao', 'da_huy'];

    keysToShow.forEach(k => {
        let s = statusList.find(x => x.status === k) || { orderCount: 0, count: 0, revenue: 0 };
        let qty = s.orderCount !== undefined ? s.orderCount : (s.count || 0);
        let ui = statusMap[k];
        html += `
        <div class='status-row'>
          <div class='status-dot' style='background:${ui.color}'></div>
          <span class='s-name'>${ui.name}</span>
          <span class='s-cnt' style='color:${qty > 0 ? ui.color : 'inherit'}'>${qty}</span>
          <span class='s-val' style='${k === 'da_giao' && s.revenue > 0 ? 'color:var(--g);font-weight:700' : 'color:var(--muted)'}'>
            ${s.revenue > 0 ? formatCurrency(s.revenue) : '—'}
          </span>
        </div>`;
    });
    targetCard.innerHTML = html;
}

function renderCategories(catList) {
    const cards = Array.from(document.querySelectorAll('.card'));
    const targetCard = cards.find(c => {
        const ct = c.querySelector('.ct');
        return ct && ct.textContent.toUpperCase().includes('DANH MỤC');
    });
    if (!targetCard) return;

    let html = `
      <div class='card-hd'>
        <div>
          <div class='ct'>Doanh thu theo danh mục</div>
          <div class='cs' style='margin-left:0;margin-top:2px'>Chỉ tính đơn đã giao</div>
        </div>
      </div>
    `;

    if (!catList || catList.length === 0) {
        html += `<p style='text-align:center; color:#777; padding:20px 0; font-size:12px;'>Chưa có dữ liệu</p>`;
        targetCard.innerHTML = html;
        return;
    }

    html += `<div style='margin-top:4px'>`;
    let colors = ['#c0314a', '#e8637a', '#f4b8c4', '#fbd2da', '#e8f4fb'];
    
    catList.slice(0, 3).forEach((c, i) => {
        let percent = (c.percentage || 0).toFixed(1);
        let name = c.categoryName || c.ten_danh_muc || 'Khác';
        html += `
        <div class='prow'>
          <span class='plbl' title='${name}'>${name}</span>
          <div class='pbg'><div class='pf' style='width:${percent}%;background:${colors[i]}'></div></div>
          <span class='pval' style='${i === 0 ? 'color:var(--color-primary)' : ''}'>${percent}%</span>
        </div>`;
    });

    html += `</div>
      <div style='margin-top:10px;padding-top:8px;border-top:1px solid var(--border)'>
    `;

    catList.slice(0, 3).forEach((c) => {
        let name = c.categoryName || c.ten_danh_muc || 'Khác';
        html += `
        <div style='display:flex;justify-content:space-between;margin-bottom:4px'>
          <span style='font-size:11px;color:var(--color-text-muted)'>${name}</span>
          <span style='font-size:11px;font-weight:700;color:var(--text)'>${formatCurrency(c.revenue || c.doanh_thu)}</span>
        </div>`;
    });

    html += `</div>`;
    targetCard.innerHTML = html;
}

function renderInventoryOverview(data) {
    const invHeaders = document.querySelectorAll('.sec-head');
    let invSec = Array.from(invHeaders).find(h => h.textContent && h.textContent.toLowerCase().includes('tồn kho'));
    if (!invSec) return;
    
    const kpis = invSec.nextElementSibling.querySelectorAll('.card.kpi');
    if (kpis.length >= 5) {
        kpis[0].querySelector('.kpi-val').innerText = (data.totalInventory || 0).toLocaleString('vi-VN');
        kpis[1].querySelector('.kpi-val').innerText = formatCurrency(data.inventoryValue || 0);
        kpis[2].querySelector('.kpi-val').innerText = data.lowStockCount || 0;
        kpis[3].querySelector('.kpi-val').innerText = data.outOfStockCount || 0;
        kpis[4].querySelector('.kpi-val').innerText = data.highStockCount || 0;
    }
}

function renderRevenueChart(dailyList) {
    var canvas = document.getElementById('rev-canvas');
    if (!canvas) return;

    var wrap = canvas.parentElement;
    var W = wrap.clientWidth || 500;
    var H = wrap.clientHeight || 160;
    var dpr = window.devicePixelRatio || 1;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    if (dailyList.length === 0) {
        ctx.fillStyle = '#777';
        ctx.font = '12px DM Sans';
        ctx.textAlign = 'center';
        ctx.fillText('Chưa có dữ liệu giao dịch trong kỳ', W / 2, H / 2);
        return;
    }

    var displayData = dailyList.slice(-14);

    var days = displayData.map(d => {
        let dateObj = new Date(d.date || d.ngay);
        return dateObj.getDate() + '/' + (dateObj.getMonth() + 1);
    });
    var rev = displayData.map(d => d.revenue || d.doanh_thu || 0);
    var ords = displayData.map(d => d.orders || d.so_don || d.orderCount || 0);

    var padL = 36, padR = 10, padT = 10, padB = 22;
    var chartW = W - padL - padR;
    var chartH = H - padT - padB;
    var n = days.length;
    
    var barW = chartW / n * 0.58;
    if (barW > 40) barW = 40; 
    
    var maxRev = Math.max.apply(null, rev) || 1;
    var maxOrd = Math.max.apply(null, ords) || 1;

    ctx.strokeStyle = '#ece6e2';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
        var yg = padT + chartH - (g / 4) * chartH;
        ctx.beginPath(); ctx.moveTo(padL, yg); ctx.lineTo(W - padR, yg); ctx.stroke();
        if (g > 0) {
            ctx.fillStyle = '#777'; ctx.font = '10px DM Sans,sans-serif'; ctx.textAlign = 'right';
            let val = Math.round(maxRev * (g / 4) / 1000);
            ctx.fillText(val >= 1000 ? (val/1000).toFixed(1) + 'tr' : val + 'k', padL - 6, yg + 4);
        }
    }

    days.forEach(function (d, i) {
        var x = padL + (i / n) * chartW + (chartW / n - barW) / 2;
        var h = (rev[i] / maxRev) * chartH;
        var y = padT + chartH - h;
        var isToday = i === n - 1;
        ctx.fillStyle = isToday ? '#c0314a' : '#fce8ec';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barW, h, [4, 4, 0, 0]); else ctx.rect(x, y, barW, h);
        ctx.fill();
    });

    ctx.beginPath();
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    days.forEach(function (d, i) {
        var xc = padL + (i / n) * chartW + chartW / n / 2;
        var yc = padT + chartH - (ords[i] / maxOrd) * chartH * 0.85;
        if (i === 0) ctx.moveTo(xc, yc); else ctx.lineTo(xc, yc);
    });
    ctx.stroke();

    days.forEach(function (d, i) {
        var xc = padL + (i / n) * chartW + chartW / n / 2;
        var yc = padT + chartH - (ords[i] / maxOrd) * chartH * 0.85;
        ctx.beginPath(); ctx.arc(xc, yc, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#27ae60'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    ctx.fillStyle = '#777'; ctx.font = '10px DM Sans,sans-serif'; ctx.textAlign = 'center';
    days.forEach(function (d, i) {
        var xc = padL + (i / n) * chartW + chartW / n / 2;
        ctx.fillText(d, xc, H - 4);
    });
}

function renderInventoryChart(invList) {
    var canvas = document.getElementById('inv-canvas');
    if (!canvas) return;

    var wrap = canvas.parentElement;
    var W = wrap.clientWidth || 700;
    var H = wrap.clientHeight || 160;
    var dpr = window.devicePixelRatio || 1;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    if (!invList || invList.length === 0) {
        ctx.fillStyle = '#777';
        ctx.font = '12px DM Sans';
        ctx.textAlign = 'center';
        ctx.fillText('Chưa có dữ liệu tồn kho', W / 2, H / 2);
        return;
    }

    var displayData = invList.slice(0, 5);
    var cats = displayData.map(c => c.categoryName || c.ten_danh_muc);
    var qty  = displayData.map(c => c.quantity || c.tong_ton || 0);
    var val  = displayData.map(c => (c.revenue || c.gia_tri_ton || 0) / 1000000); 

    var padL = 36, padR = 14, padT = 10, padB = 26;
    var chartW = W - padL - padR;
    var chartH = H - padT - padB;
    var n = cats.length;
    
    var barW = chartW / n * 0.5;
    if (barW > 40) barW = 40; 
    
    var maxQ = Math.max.apply(null, qty) || 1;
    var maxV = Math.max.apply(null, val) || 1;

    ctx.strokeStyle = '#ece6e2'; ctx.lineWidth = 1;
    for(var g=0; g<=4; g++){
      var yg = padT + chartH - (g/4)*chartH;
      ctx.beginPath(); ctx.moveTo(padL, yg); ctx.lineTo(W-padR, yg); ctx.stroke();
      if(g>0){
        ctx.fillStyle = '#777'; ctx.font = '10px DM Sans,sans-serif'; ctx.textAlign='right';
        ctx.fillText(Math.round(maxQ*(g/4)), padL-6, yg+4);
      }
    }

    cats.forEach(function(c, i){
      var x = padL + (i/n)*chartW + (chartW/n - barW)/2;
      var h = (qty[i]/maxQ)*chartH;
      var y = padT + chartH - h;
      ctx.fillStyle = '#f4b8c4';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barW, h, [4,4,0,0]); else ctx.rect(x, y, barW, h);
      ctx.fill();
      ctx.strokeStyle = '#e8637a'; ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barW, h, [4,4,0,0]); else ctx.rect(x, y, barW, h);
      ctx.stroke();
    });

    ctx.beginPath(); ctx.strokeStyle = '#c0314a'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    cats.forEach(function(c, i){
      var xc = padL + (i/n)*chartW + chartW/n/2;
      var yc = padT + chartH - (val[i]/maxV)*chartH;
      if(i===0) ctx.moveTo(xc, yc); else ctx.lineTo(xc, yc);
    });
    ctx.stroke();

    cats.forEach(function(c, i){
      var xc = padL + (i/n)*chartW + chartW/n/2;
      var yc = padT + chartH - (val[i]/maxV)*chartH;
      ctx.beginPath(); ctx.arc(xc, yc, 4.5, 0, Math.PI*2);
      ctx.fillStyle = '#c0314a'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    });

    ctx.fillStyle = '#777'; ctx.font = '10px DM Sans,sans-serif'; ctx.textAlign='center';
    cats.forEach(function(c, i){
      var xc = padL + (i/n)*chartW + chartW/n/2;
      ctx.fillText(c, xc, H-6);
    });

    var tooltip = document.getElementById('inv-tooltip');
    if (!tooltip) return;
    canvas.addEventListener('mousemove', function(e){
      var canvasRect = canvas.getBoundingClientRect();
      var scaleX = canvasRect.width / W;
      var mx = (e.clientX - canvasRect.left) / scaleX;
      var found = false;
      cats.forEach(function(c, i){
        var xc = padL + (i/n)*chartW + chartW/n/2;
        if(Math.abs(mx - xc) < chartW/n/2){
          found = true;
          tooltip.style.display = 'block';
          tooltip.style.left = (e.clientX + 16) + 'px';
          tooltip.style.top = (e.clientY - 36) + 'px';
          tooltip.innerHTML = '<strong>' + c + '</strong><br>Số lượng: ' + qty[i].toLocaleString('vi') + ' sp<br>Giá trị: ' + val[i].toFixed(1) + ' triệu ₫';
        }
      });
      if(!found) tooltip.style.display = 'none';
    });
    canvas.addEventListener('mouseleave', function(){ tooltip.style.display='none'; });
}

function renderTopProducts(products) {
    const cards = Array.from(document.querySelectorAll('.card'));
    const targetCard = cards.find(c => {
        const ct = c.querySelector('.ct');
        return ct && ct.textContent.includes('Top bán chạy');
    });
    if (!targetCard) return;

    let html = `
      <div class='card-hd'>
        <div><span class='ct'>Top bán chạy</span><span class='cs'>Số lượng bán trong kỳ</span></div>
        <span class='clink'>Tất cả →</span>
      </div>
    `;

    if (!products || products.length === 0) {
        html += `<p style='text-align:center; color:#777; padding:20px 0; font-size:12px;'>Chưa có dữ liệu</p>`;
        targetCard.innerHTML = html;
        return;
    }

    products.slice(0, 5).forEach(p => {
        let name = p.productName || p.ten_sp || p.name || 'Sản phẩm';
        let soldQty = (p.totalSold !== undefined && p.totalSold !== null) ? p.totalSold : 0;
        let rev = p.revenue || p.total_revenue || 0;
        
        html += `
        <div class='hrow'>
          <div style='flex:1;min-width:0'>
            <div class='hn' title='${name}'>${name}</div>
            <div class='hsub'>Sản phẩm</div>
          </div>
          <span class='tag tg'>${soldQty} sp</span>
          <span style='font-size:12px;font-weight:700;color:var(--color-primary);margin-left:4px;white-space:nowrap'>${formatCurrency(rev)}</span>
        </div>`;
    });

    targetCard.innerHTML = html;
}

function renderSlowProducts(products) {
    const cards = Array.from(document.querySelectorAll('.card'));
    const targetCard = cards.find(c => {
        const ct = c.querySelector('.ct');
        return ct && ct.textContent.includes('Sản phẩm bán chậm');
    });
    if (!targetCard) return;

    let html = `
      <div class='card-hd'><div><span class='ct'>Sản phẩm bán chậm</span><span class='cs'>Còn tồn, bán ít trong kỳ</span></div></div>
    `;

    if (!products || products.length === 0) {
        html += `<p style='text-align:center; color:#777; padding:20px 0; font-size:12px;'>Chưa có dữ liệu</p>`;
        targetCard.innerHTML = html;
        return;
    }

    products.slice(0, 5).forEach(p => {
        let name = p.productName || p.name || p.ten_sp || 'Sản phẩm';
        let stock = p.stockQuantity || p.so_luong_ton || 0;
        let sold = p.totalSold || p.so_luong_ban || 0;
        
        html += `
        <div class='hrow'>
          <div style='flex:1;min-width:0'>
            <div class='hn' title='${name}'>${name}</div>
            <div class='hsub'>Tồn: ${stock} sp</div>
          </div>
          <span class='tag tw'>${sold} đơn</span>
        </div>`;
    });

    targetCard.innerHTML = html;
}

function attachZoomEvents() {
    document.querySelectorAll('.card:not(.kpi)').forEach(card => {
        if (card.dataset.zoomAttached) return; 
        card.dataset.zoomAttached = 'true';
        
        card.style.cursor = 'zoom-in'; 

        card.addEventListener('click', function(e) {
            if(e.target.closest('a') || e.target.closest('button') || e.target.classList.contains('clink')) return;

            const modal = document.getElementById('chartZoomModal');
            const target = document.getElementById('zoomTarget');
            
            if (!modal || !target) return;

            target.innerHTML = ''; 
            const cloneContent = this.cloneNode(true);
            cloneContent.style.cursor = 'default';
            cloneContent.style.boxShadow = 'none';
            cloneContent.style.border = 'none';
            cloneContent.style.transform = 'none';

            const oldCanvases = this.querySelectorAll('canvas');
            const newCanvases = cloneContent.querySelectorAll('canvas');

            oldCanvases.forEach((oldCanvas, index) => {
                if (newCanvases[index]) {
                    const newCanvas = newCanvases[index];
                    newCanvas.width = oldCanvas.width;
                    newCanvas.height = oldCanvas.height;
                    newCanvas.getContext('2d').drawImage(oldCanvas, 0, 0);
                    newCanvas.style.width = '100%';
                    newCanvas.style.height = '100%';
                }
            });
            
            target.appendChild(cloneContent);
            modal.style.display = 'flex'; 
        });
    });
}

window.closeZoomModal = function(e) {
    if (e.target.id === 'chartZoomModal' || e.target.classList.contains('db-zoom-close')) {
        document.getElementById('chartZoomModal').style.display = 'none';
    }
};

window.addEventListener('click', window.closeZoomModal);

function exportData(type) {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    window.location.href = `${window.APP_CONTEXT || '/websitethuongmaidientu'}/admin/dashboard-api?action=exportExcel&from=${fromDate}&to=${toDate}`;
}

