'use strict';

const API_URL = (window.APP_CONTEXT || '') + '/admin/report-api';
let currentTxList = []; // Lưu list giao dịch đối soát để lọc local

// 1. Chuyển Tab
function go(i) {
    [0, 1].forEach(function(j) {
        const tab = document.getElementById('t' + j);
        const panel = document.getElementById('p' + j);
        if(tab) tab.classList.toggle('active', j === i);
        if(panel) panel.classList.toggle('active', j === i);
    });

    // Auto load data khi chuyển tab
    if (i === 0) runReconciliation();
    if (i === 1) loadRevenue();
}

// Format tiền tệ
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
};

// Khởi tạo ngày mặc định
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayStr = today.toISOString().split('T')[0];
    const firstDayStr = firstDay.toISOString().split('T')[0];

    if(document.getElementById('dsFromDate')) document.getElementById('dsFromDate').value = firstDayStr;
    if(document.getElementById('dsToDate')) document.getElementById('dsToDate').value = todayStr;
    if(document.getElementById('revFromDate')) document.getElementById('revFromDate').value = firstDayStr;
    if(document.getElementById('revToDate')) document.getElementById('revToDate').value = todayStr;

    loadCategories();
    go(0); 
});

// ==========================================
// TÍNH NĂNG TAB 1: ĐỐI SOÁT GIAO DỊCH
// ==========================================

async function runReconciliation() {
    const from = document.getElementById('dsFromDate').value;
    const to = document.getElementById('dsToDate').value;

    if (!from || !to) return alert('Vui lòng chọn ngày.');
    if (new Date(from) > new Date(to)) return alert('Ngày kết thúc phải sau ngày bắt đầu.');

    const btn = document.querySelector('.fbar .btn-primary');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Đang đối soát...';
    }

    try {
        const response = await fetch(`${API_URL}?action=reconcile&from=${from}&to=${to}`);
        
        // Bắt lỗi cực mạnh nếu Java bị sập (lỗi 500)
        if (!response.ok) {
            throw new Error(`Backend lỗi ${response.status} - Hãy kiểm tra tab Output của Tomcat!`);
        }

        const data = await response.json();

        if (data.error) {
            showToast('Lỗi: ' + data.error, 'error');
            return;
        }

        // Cập nhật Metrics
        document.getElementById('dsTotal').innerText = data.total || 0;
        document.getElementById('dsMatched').innerText = data.matched || 0;
        document.getElementById('dsMismatch').innerText = data.mismatch || 0;
        document.getElementById('dsPending').innerText = data.pending || 0;

        // Cảnh báo sai lệch
        const alertBox = document.getElementById('dsAlertBox');
        if (data.mismatch > 0) {
            document.getElementById('dsMismatchCount').innerText = `${data.mismatch} giao dịch sai lệch`;
            alertBox.style.display = 'flex';
        } else {
            alertBox.style.display = 'none';
        }

        currentTxList = data.list || [];
        renderReconcileTable();
        showToast('Đối soát hoàn tất!', 'success');

    } catch (error) {
        console.error('Lỗi khi đối soát:', error);
        showToast(error.message || 'Không thể kết nối đến máy chủ. Kiểm tra lại code Java!', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Chạy đối soát';
        }
    }
}

function renderReconcileTable() {
    const tbody = document.getElementById('dsTableBody');
    if(!tbody) return;
    
    const statusFilter = document.getElementById('dsStatus').value;
    const bankFilter = document.getElementById('dsBank').value;
    const searchStr = document.getElementById('dsSearch').value.toLowerCase();

    const filteredList = currentTxList.filter(t => {
        if (statusFilter && t.trangThai !== statusFilter) return false;
        if (bankFilter && t.nganHang !== bankFilter) return false;
        if (searchStr && !(t.maGD || '').toLowerCase().includes(searchStr)) return false;
        return true;
    });

    if (filteredList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px;">Không có dữ liệu giao dịch</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredList.map(t => {
        let badge = '';
        if (t.trangThai === 'KHOP') badge = '<span class="badge bOk">Khớp</span>';
        else if (t.trangThai === 'SAI_LECH') badge = '<span class="badge bErr">Sai lệch</span>';
        else badge = '<span class="badge bWarn">Chờ xử lý</span>';

        let actionLnk = '';
        if (t.trangThai === 'KHOP') {
            actionLnk = `<span class="lnk" onclick="viewTx('${t.maGD}', false)">Xem</span>`;
        } else {
            actionLnk = `<span class="lnk" onclick="viewTx('${t.maGD}', true)" style="color:var(--pink)">Kiểm tra</span>`;
        }

        return `
            <tr class="${t.chenhLech !== 0 ? 'row-error' : ''}">
                <td class="mono">${t.maGD || '-'}</td>
                <td>${t.ngayGD || '-'}</td>
                <td>${t.khachHang || 'Khách lẻ'}</td>
                <td>${formatCurrency(t.soTienHeThong)}</td>
                <td>${t.soTienNganHang != null ? formatCurrency(t.soTienNganHang) : '—'}</td>
                <td class="${t.chenhLech === 0 ? 'neu' : 'dn'}">${formatCurrency(t.chenhLech)}</td>
                <td>${t.nganHang || '-'}</td>
                <td>${badge}</td>
                <td>${actionLnk}</td>
            </tr>
        `;
    }).join('');
}

function filterTable() {
    renderReconcileTable();
}
document.getElementById('dsStatus')?.addEventListener('change', filterTable);
document.getElementById('dsBank')?.addEventListener('change', filterTable);

async function confirmAllMatch() {
    if(!confirm('Bạn có chắc chắn muốn xác nhận toàn bộ giao dịch trong kỳ này là KHỚP?')) return;
    const from = document.getElementById('dsFromDate').value;
    const to = document.getElementById('dsToDate').value;

    try {
        const response = await fetch(`${API_URL}?action=confirmAll&from=${from}&to=${to}`);
        if (!response.ok) throw new Error('Lỗi server: ' + response.status);
        const result = await response.json();
        
        if(result.success) {
            showToast('Đã xác nhận toàn bộ giao dịch KHỚP!', 'success');
            runReconciliation();
        } else {
            showToast(result.error || 'Có lỗi xảy ra!', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Lỗi kết nối Backend!', 'error');
    }
}

// ==========================================
// MODAL XEM & KIỂM TRA CHI TIẾT GIAO DỊCH
// ==========================================
function viewTx(maGD, isCheck = false) {
    const tx = currentTxList.find(t => t.maGD === maGD);
    if (!tx) return;

    let modal = document.getElementById('viewTxModal');

    if (!modal) {
        const style = document.createElement('style');
        style.innerHTML = `
            .bc-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; transition: all 0.2s ease; z-index: 9999; }
            .bc-modal.active { opacity: 1; visibility: visible; }
            .bc-modal-content { background: #fff; border-radius: 16px; padding: 28px; width: 100%; max-width: 420px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); transform: translateY(20px); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); font-family: 'DM Sans', sans-serif; }
            .bc-modal.active .bc-modal-content { transform: translateY(0); }
            .bc-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed var(--border); font-size: 14px; }
            .bc-row:last-child { border-bottom: none; padding-bottom: 0; }
            .bc-label { color: var(--light); }
            .bc-val { font-weight: 500; color: var(--charcoal); text-align: right; max-width: 60%; word-break: break-word; }
        `;
        document.head.appendChild(style);

        modal = document.createElement('div');
        modal.id = 'viewTxModal';
        modal.className = 'bc-modal';
        modal.innerHTML = `
            <div class="bc-modal-content">
                <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--charcoal); margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c94068" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Chi tiết giao dịch
                </h3>
                <div>
                    <div class="bc-row"><span class="bc-label">Mã giao dịch</span><span class="bc-val mono" id="v-maGD"></span></div>
                    <div class="bc-row"><span class="bc-label">Ngày GD</span><span class="bc-val" id="v-ngayGD"></span></div>
                    <div class="bc-row"><span class="bc-label">Khách hàng</span><span class="bc-val" id="v-khachHang"></span></div>
                    <div class="bc-row"><span class="bc-label">Ngân hàng</span><span class="bc-val" id="v-nganHang"></span></div>
                    <div class="bc-row"><span class="bc-label">Tiền Hệ thống</span><span class="bc-val" id="v-tienHT"></span></div>
                    <div class="bc-row"><span class="bc-label">Tiền Ngân hàng</span><span class="bc-val" id="v-tienNH"></span></div>
                    <div class="bc-row"><span class="bc-label">Chênh lệch</span><span class="bc-val" id="v-chenhLech" style="font-weight: 600;"></span></div>
                    <div class="bc-row" style="align-items: center;"><span class="bc-label">Trạng thái</span><div id="v-trangThai"></div></div>
                </div>
                <div id="v-footer" style="margin-top: 28px; display: flex; gap: 12px; justify-content: flex-end;"></div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === this) closeViewTxModal();
        });
    }

    // Đổ dữ liệu vào popup
    document.getElementById('v-maGD').textContent = tx.maGD;
    document.getElementById('v-ngayGD').textContent = tx.ngayGD;
    document.getElementById('v-khachHang').textContent = tx.khachHang || 'Khách lẻ';
    document.getElementById('v-nganHang').textContent = tx.nganHang || '-';
    document.getElementById('v-tienHT').textContent = formatCurrency(tx.soTienHeThong) + ' đ';
    document.getElementById('v-tienNH').textContent = tx.soTienNganHang != null ? formatCurrency(tx.soTienNganHang) + ' đ' : '—';

    const clNode = document.getElementById('v-chenhLech');
    clNode.textContent = formatCurrency(tx.chenhLech) + ' đ';
    clNode.style.color = tx.chenhLech === 0 ? 'var(--charcoal)' : '#c94068';

    let badge = '';
    if (tx.trangThai === 'KHOP') badge = '<span class="badge bOk">Khớp</span>';
    else if (tx.trangThai === 'SAI_LECH') badge = '<span class="badge bErr">Sai lệch</span>';
    else badge = '<span class="badge bWarn">Chờ xử lý</span>';
    document.getElementById('v-trangThai').innerHTML = badge;

    // Thay đổi nút dựa trên việc "Xem" hay "Kiểm tra"
    const footer = document.getElementById('v-footer');
    if (isCheck) {
        footer.innerHTML = `
            <button class="btn btn-outline" style="flex:1; justify-content: center;" onclick="closeViewTxModal()">Hủy</button>
            <button class="btn btn-primary" style="flex:1; justify-content: center;" onclick="confirmMatchFromModal('${tx.maGD}', this)">Xác nhận KHỚP</button>
        `;
    } else {
        footer.innerHTML = `
            <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="closeViewTxModal()">Đóng hộp thoại</button>
        `;
    }

    modal.classList.add('active');
}

function closeViewTxModal() {
    document.getElementById('viewTxModal')?.classList.remove('active');
}

async function confirmMatchFromModal(maGD, btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = '<span class="spinner"></span> Đang xử lý...';

    try {
        const response = await fetch(`${API_URL}?action=confirmMatch&maGD=${maGD}`);
        if (!response.ok) throw new Error('Lỗi server: ' + response.status);
        const result = await response.json();
        
        if(result.success) {
            showToast('Đã xác nhận giao dịch ' + maGD + ' là KHỚP!', 'success');
            closeViewTxModal();
            runReconciliation(); // Load lại bảng
        } else {
            showToast(result.error || 'Có lỗi xảy ra!', 'error');
            btnEl.disabled = false;
            btnEl.innerHTML = 'Xác nhận KHỚP';
        }
    } catch (e) {
        console.error(e);
        showToast('Lỗi kết nối Backend. Hãy kiểm tra lại code Java!', 'error');
        btnEl.disabled = false;
        btnEl.innerHTML = 'Xác nhận KHỚP';
    }
}
async function uploadBankFile() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls,.csv';

    fileInput.addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['.xlsx', '.xls', '.csv'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        if (!validTypes.includes(fileExt)) {
            showToast('Chỉ hỗ trợ file .xlsx, .xls hoặc .csv!', 'error');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast('File quá lớn! Tối đa 10MB.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('bankFile', file);
        formData.append('action', 'uploadBankFile');

        const uploadBtn = document.querySelector('.up-btn');
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<span class="spinner"></span> Đang tải lên...';
        }

        try {
            const response = await fetch(`${API_URL}`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                showToast(result.message || 'Tải file thành công!', 'success');
                // Reload doi soat data
                setTimeout(() => runReconciliation(), 500);
            } else {
                showToast(result.error || 'Tải file thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi khi tải file:', error);
            showToast('Không thể kết nối đến máy chủ.', 'error');
        } finally {
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = `
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1v9M5 4l3-3 3 3M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Tải file NH
                `;
            }
        }
    });

    fileInput.click();
}

// ==========================================
// MODAL XEM & KIỂM TRA CHI TIẾT GIAO DỊCH
// ==========================================
function viewTx(maGD, isCheck = false) {
    const tx = currentTxList.find(t => t.maGD === maGD);
    if (!tx) return;

    let modal = document.getElementById('viewTxModal');

    if (!modal) {
        const style = document.createElement('style');
        style.innerHTML = `
            .bc-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; transition: all 0.2s ease; z-index: 9999; }
            .bc-modal.active { opacity: 1; visibility: visible; }
            .bc-modal-content { background: #fff; border-radius: 16px; padding: 28px; width: 100%; max-width: 420px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); transform: translateY(20px); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); font-family: 'DM Sans', sans-serif; }
            .bc-modal.active .bc-modal-content { transform: translateY(0); }
            .bc-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed var(--border); font-size: 14px; }
            .bc-row:last-child { border-bottom: none; padding-bottom: 0; }
            .bc-label { color: var(--light); }
            .bc-val { font-weight: 500; color: var(--charcoal); text-align: right; max-width: 60%; word-break: break-word; }
        `;
        document.head.appendChild(style);

        modal = document.createElement('div');
        modal.id = 'viewTxModal';
        modal.className = 'bc-modal';
        modal.innerHTML = `
            <div class="bc-modal-content">
                <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--charcoal); margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c94068" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Chi tiết giao dịch
                </h3>
                <div>
                    <div class="bc-row"><span class="bc-label">Mã giao dịch</span><span class="bc-val mono" id="v-maGD"></span></div>
                    <div class="bc-row"><span class="bc-label">Ngày GD</span><span class="bc-val" id="v-ngayGD"></span></div>
                    <div class="bc-row"><span class="bc-label">Khách hàng</span><span class="bc-val" id="v-khachHang"></span></div>
                    <div class="bc-row"><span class="bc-label">Ngân hàng</span><span class="bc-val" id="v-nganHang"></span></div>
                    <div class="bc-row"><span class="bc-label">Tiền Hệ thống</span><span class="bc-val" id="v-tienHT"></span></div>
                    <div class="bc-row"><span class="bc-label">Tiền Ngân hàng</span><span class="bc-val" id="v-tienNH"></span></div>
                    <div class="bc-row"><span class="bc-label">Chênh lệch</span><span class="bc-val" id="v-chenhLech" style="font-weight: 600;"></span></div>
                    <div class="bc-row" style="align-items: center;"><span class="bc-label">Trạng thái</span><div id="v-trangThai"></div></div>
                </div>
                
                <!-- Chỗ này đã được anh sửa lại thành div rỗng để code chèn nút động -->
                <div id="v-footer" style="margin-top: 28px; display: flex; gap: 12px; justify-content: flex-end;"></div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === this) closeViewTxModal();
        });
    }

    // Đổ dữ liệu vào popup
    document.getElementById('v-maGD').textContent = tx.maGD;
    document.getElementById('v-ngayGD').textContent = tx.ngayGD;
    document.getElementById('v-khachHang').textContent = tx.khachHang || 'Khách lẻ';
    document.getElementById('v-nganHang').textContent = tx.nganHang || '-';
    document.getElementById('v-tienHT').textContent = formatCurrency(tx.soTienHeThong) + ' đ';
    document.getElementById('v-tienNH').textContent = tx.soTienNganHang != null ? formatCurrency(tx.soTienNganHang) + ' đ' : '—';

    const clNode = document.getElementById('v-chenhLech');
    clNode.textContent = formatCurrency(tx.chenhLech) + ' đ';
    clNode.style.color = tx.chenhLech === 0 ? 'var(--charcoal)' : '#c94068';

    let badge = '';
    if (tx.trangThai === 'KHOP') badge = '<span class="badge bOk">Khớp</span>';
    else if (tx.trangThai === 'SAI_LECH') badge = '<span class="badge bErr">Sai lệch</span>';
    else badge = '<span class="badge bWarn">Chờ xử lý</span>';
    document.getElementById('v-trangThai').innerHTML = badge;

    // Thay đổi nút dựa trên việc "Xem" hay "Kiểm tra"
    const footer = document.getElementById('v-footer');
    if (isCheck) {
        footer.innerHTML = `
            <button class="btn btn-outline" style="flex:1; justify-content: center;" onclick="closeViewTxModal()">Hủy</button>
            <button class="btn btn-primary" style="flex:1; justify-content: center;" onclick="confirmMatchFromModal('${tx.maGD}', this)">Xác nhận KHỚP</button>
        `;
    } else {
        footer.innerHTML = `
            <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="closeViewTxModal()">Đóng hộp thoại</button>
        `;
    }

    modal.classList.add('active');
}

function closeViewTxModal() {
    document.getElementById('viewTxModal')?.classList.remove('active');
}

// ==========================================
// TÍNH NĂNG TAB 2: BÁO CÁO DOANH THU
// ==========================================

// Load categories for dropdown
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}?action=getCategories`);
        const data = await response.json();

        if (data.categories) {
            const categorySelect = document.querySelector('#p1 .fbar select');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Tất cả danh mục</option>';
                data.categories.forEach(cat => {
                    categorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
                });
            }
        }
    } catch (e) {
        console.error('Lỗi khi tải danh mục:', e);
    }
}

async function loadRevenue() {
    const from = document.getElementById('revFromDate').value;
    const to = document.getElementById('revToDate').value;

    if (!from || !to) return alert('Vui lòng chọn ngày.');
    if (new Date(from) > new Date(to)) return alert('Ngày kết thúc phải sau ngày bắt đầu.');

    try {
        const response = await fetch(`${API_URL}?action=getRevenue&from=${from}&to=${to}`);
        const data = await response.json();

        if (data.error) {
            alert('Lỗi: ' + data.error);
            return;
        }

        document.getElementById('revNet').innerText = formatCurrency(data.netRevenue) + ' đ';
        document.getElementById('revTotalOrders').innerText = data.totalOrders || 0;
        document.getElementById('revAOV').innerText = formatCurrency(data.aov) + ' đ';
        document.getElementById('revTotalProducts').innerText = data.totalProductsSold || 0;
        document.getElementById('revCancelRate').innerText = (data.cancelRate || 0).toFixed(1) + '%';

        // Render daily revenue table
        renderDailyRevenueTable(data.dailyRevenueList || []);

        // Render user behavior chart
        renderUserBehavior(data.userBehaviorList || []);

        // Render customer segment
        renderCustomerSegment(data.customerSegmentList || []);

        showToast('Tải báo cáo thành công!', 'success');

    } catch (error) {
        console.error('Lỗi khi tải báo cáo:', error);
        alert('Không thể kết nối đến máy chủ.');
    }
}

function renderDailyRevenueTable(dailyList) {
    const tbody = document.getElementById('revTableBody');
    if (!tbody) return;

    if (dailyList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Chưa có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = dailyList.map((d, idx) => {
        const prev = idx > 0 ? dailyList[idx - 1] : null;
        let changeBadge = '— 0%';
        if (prev && prev.revenue > 0) {
            const change = ((d.revenue - prev.revenue) / prev.revenue) * 100;
            const color = change >= 0 ? 'bOk' : 'bErr';
            const arrow = change >= 0 ? '↑' : '↓';
            changeBadge = `<span class="badge ${color}">${arrow} ${Math.abs(change).toFixed(1)}%</span>`;
        }

        return `
            <tr>
                <td>${d.date || '-'}</td>
                <td style="text-align:right;">${d.orderCount || 0}</td>
                <td style="text-align:right; font-weight:600; color:var(--pink);">${formatCurrency(d.revenue)}</td>
                <td style="text-align:right;">${formatCurrency(d.aov)}</td>
                <td>${changeBadge}</td>
            </tr>
        `;
    }).join('');
}

function renderUserBehavior(behaviorList) {
    const el = document.getElementById('chart-traffic');
    if (!el || behaviorList.length === 0) return;

    // Use first 7 items for chart
    const data = behaviorList.slice(0, 7);
    const maxV = Math.max(...data.map(d => d.views || 0));
    const maxB = Math.max(...data.map(d => d.buys || 0));

    el.innerHTML = `
        <div class="chart-legend">
            <span><span class="legend-dot" style="background:#edd; border:1px solid #e8637a"></span>Lượt xem</span>
            <span><span class="legend-dot legend-dot--plan"></span>Lượt mua</span>
        </div>
        <div class="traffic-chart" id="traffic-bars">
            ${data.map((d, i) => `
                <div class="traffic-bar-g">
                    <div class="traffic-bar--view bar" style="height:0%; flex:1" data-h="${maxV > 0 ? (d.views / maxV) * 100 : 0}" title="View: ${d.views}"></div>
                    <div class="traffic-bar--buy bar"  style="height:0%; flex:1" data-h="${maxB > 0 ? (d.buys / maxB) * 100 : 0}"  title="Buy: ${d.buys}"></div>
                </div>
            `).join('')}
        </div>
        <div class="traffic-labels">${data.map((d, i) => `<span>${i + 1}</span>`).join('')}</div>
    `;

    setTimeout(() => {
        el.querySelectorAll('.bar').forEach(bar => {
            bar.style.height = bar.dataset.h + '%';
        });
    }, 400);
}

function renderCustomerSegment(segList) {
    const el = document.getElementById('chart-segment');
    if (!el || segList.length === 0) return;

    const seg = { new: 0, old: 0, vip: 0 };
    segList.forEach(s => {
        if (s.type === 'Mới') seg.new = s.percentage || 0;
        else if (s.type === 'Cũ') seg.old = s.percentage || 0;
        else if (s.type === 'VIP') seg.vip = s.percentage || 0;
    });

    el.innerHTML = `
        <div class="segment-label" style="margin-top:15px;">Phân khúc KH <small style="font-weight:400;color:#bbb">Customer Segment</small></div>
        <div class="segment-bar">
            <div class="segment-seg segment-seg--new" style="flex:${seg.new}">Mới ${seg.new.toFixed(1)}%</div>
            <div class="segment-seg segment-seg--old" style="flex:${seg.old}">Cũ ${seg.old.toFixed(1)}%</div>
            <div class="segment-seg segment-seg--vip" style="flex:${seg.vip}">VIP ${seg.vip.toFixed(1)}%</div>
        </div>
    `;
}

// ==========================================
// TÍNH NĂNG CHUNG: XUẤT EXCEL
// ==========================================
function exportExcel(type) {
    let from, to;
    if (type === 'reconcile') {
        from = document.getElementById('dsFromDate').value;
        to = document.getElementById('dsToDate').value;
    } else {
        from = document.getElementById('revFromDate').value;
        to = document.getElementById('revToDate').value;
    }

    if (!from || !to) return alert('Vui lòng chọn ngày trước khi xuất Excel.');
    if (new Date(from) > new Date(to)) return alert('Ngày kết thúc phải sau ngày bắt đầu.');

    // Mở URL tải file trên tab mới
    const exportUrl = `${API_URL}?action=exportExcel&from=${from}&to=${to}&type=${type}`;
    window.open(exportUrl, '_blank');
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================
function showToast(message, type) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.background = type === 'success' ? '#27ae60' : '#e74c3c';

    // Show
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
    }, 3000);
}