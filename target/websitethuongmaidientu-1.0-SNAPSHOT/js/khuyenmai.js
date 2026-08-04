document.addEventListener('DOMContentLoaded', () => {
    loadPolicy();
    loadVouchers();
    
    // Cảnh báo động và preview khi nhập tỷ lệ
    document.getElementById('inpQuyDoi').addEventListener('input', updatePreview);
    document.getElementById('inpTienTich').addEventListener('input', updatePreview);
});

// Đóng toàn bộ bảng biểu
function closeModals() {
    document.querySelectorAll('.km-modal').forEach(m => m.classList.remove('active'));
}

/* ==============================================
   NGHIỆP VỤ 1: CẤU HÌNH ĐIỂM THƯỞNG
============================================== */

function updatePreview() {
    let tich = Number(document.getElementById('inpTienTich').value);
    let quyDoi = Number(document.getElementById('inpQuyDoi').value);
    let w = document.getElementById('policyWarning');
    let p = document.getElementById('previewBox');
    
    if (tich > 0 && quyDoi >= 0) {
        let phanTram = ((quyDoi / tich) * 100).toFixed(2);
        p.innerText = 'Preview: Khách chi tiêu ' + tich.toLocaleString('vi-VN') + 'đ sẽ tích được 1 điểm. Điểm này đổi được ' + quyDoi.toLocaleString('vi-VN') + 'đ. Tương đương mức hoàn tiền ' + phanTram + '%.';
    } else {
        p.innerText = 'Vui lòng nhập số hợp lệ để xem trước.';
    }

    if(quyDoi > tich) { 
        w.style.display = 'block'; 
    } else { 
        w.style.display = 'none'; 
    }
}

async function loadPolicy() {
    try {
        const res = await fetch('/websitethuongmaidientu/admin/khuyenmai-api?action=getPolicy');
        const data = await res.json();
        
        // Hiển thị ra ngoài thẻ HTML
        document.getElementById('valTienTich').innerText = Number(data.tienTich1Diem).toLocaleString('vi-VN');
        document.getElementById('valQuyDoi').innerText = Number(data.motDiemQuyDoi).toLocaleString('vi-VN');
        if (document.getElementById('valFreeship')) document.getElementById('valFreeship').innerText = Number(data.freeshipTu).toLocaleString('vi-VN');
        if (document.getElementById('valQuaTang')) document.getElementById('valQuaTang').innerText = Number(data.quaTangTu).toLocaleString('vi-VN');
        
        // Gắn số liệu vào Popup để chỉnh sửa
        document.getElementById('inpTienTich').value = data.tienTich1Diem;
        document.getElementById('inpQuyDoi').value = data.motDiemQuyDoi;
        if (document.getElementById('inpFreeship')) document.getElementById('inpFreeship').value = data.freeshipTu;
        if (document.getElementById('inpQuaTang')) document.getElementById('inpQuaTang').value = data.quaTangTu;

        updatePreview();
    } catch (e) { 
        console.error('Lỗi lấy dữ liệu cấu hình:', e); 
    }
}

function openPolicyModal() {
    document.getElementById('policyModal').classList.add('active');
    updatePreview();
}

async function savePolicy() {
    let tich = Number(document.getElementById('inpTienTich').value);
    let quyDoi = Number(document.getElementById('inpQuyDoi').value);
    let freeship = Number(document.getElementById('inpFreeship').value);
    let quaTang = Number(document.getElementById('inpQuaTang').value);
    
    if (tich <= 0 || quyDoi < 0 || freeship < 0 || quaTang < 0) {
        return alert("Lỗi: Vui lòng nhập số liệu hợp lệ.");
    }
    
    if (quyDoi > tich && !confirm("CẢNH BÁO: Tỷ lệ quy đổi lớn hơn tỷ lệ tích lũy có thể gây thất thoát doanh thu. Bạn có chắc chắn muốn lưu?")) {
        return;
    }

    try {
        const res = await fetch('/websitethuongmaidientu/admin/khuyenmai-api?action=updatePolicy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                tienTich1Diem: tich, 
                motDiemQuyDoi: quyDoi,
                freeshipTu: freeship,
                quaTangTu: quaTang
            })
        });
        const data = await res.json();
        
        if(data.success) {
            alert("Cập nhật chính sách thành công!");
            closeModals();
            loadPolicy();
        }
    } catch (e) { 
        alert("Lỗi kết nối khi lưu cấu hình!"); 
    }
}

/* ==============================================
   NGHIỆP VỤ 2: QUẢN LÝ MÃ VOUCHER
============================================== */
let currentVouchers = [];

async function loadVouchers() {
    try {
        const res = await fetch('/websitethuongmaidientu/admin/khuyenmai-api?action=getVouchers');
        const list = await res.json();
        currentVouchers = list;
        
        let html = list.map(v => {
            let val = v.loai === 'percent' ? `${v.giaTriGiam}%` : `${Number(v.giaTriGiam).toLocaleString('vi-VN')}đ`;
            let time = `${formatDate(v.ngayBatDau)} - ${formatDate(v.ngayKetThuc)}`;
            let usage = v.soLuotToiDa ? `${v.soLuotDaDung}/${v.soLuotToiDa}` : `${v.soLuotDaDung}/∞`;
            
            let statusBadge = v.isActive === 1 
                ? '<span style="color:#27ae60; font-weight:600;">Đang chạy</span>' 
                : '<span style="color:#e8637a; font-weight:600;">Đã khóa</span>';
                
            let editBtn = `<button class="btn btn-sm btn-outline" style="margin-right: 4px;" onclick="editVoucher(${v.id})">Sửa</button>`;
            let actionBtn = v.isActive === 1 
                ? `<button class="btn btn-sm btn-outline" onclick="toggleVoucher(${v.id}, 0)">Khóa</button>`
                : `<button class="btn btn-sm btn-primary" onclick="toggleVoucher(${v.id}, 1)">Mở</button>`;

            return `<tr>
                <td style="font-weight:600;">${v.voucherCode}</td>
                <td>${v.ten || ''}</td>
                <td style="color:var(--pink); font-weight:600;">${val}</td>
                <td>${Number(v.donHangToiThieu).toLocaleString('vi-VN')}đ</td>
                <td>${time}</td>
                <td>${usage}</td>
                <td>${statusBadge}</td>
                <td>${editBtn}${actionBtn}</td>
            </tr>`;
        }).join('');
        
        document.getElementById('voucherTableBody').innerHTML = html;
    } catch (e) { 
        console.error('Lỗi lấy danh sách Voucher:', e); 
    }
}

function openVoucherModal() {
    document.getElementById('modalVoucherTitle').innerText = 'Tạo Mã Khuyến Mãi Mới';
    document.getElementById('vId').value = '';
    
    let codeInput = document.getElementById('vCode');
    codeInput.value = '';
    codeInput.removeAttribute('readonly');
    codeInput.style.backgroundColor = '#fff';
    
    document.getElementById('vName').value = '';
    document.getElementById('vType').value = 'fixed';
    document.getElementById('vValue').value = '';
    document.getElementById('vMinOrder').value = '0';
    document.getElementById('vMaxUse').value = '';
    document.getElementById('vStart').value = '';
    document.getElementById('vEnd').value = '';
    
    document.getElementById('voucherModal').classList.add('active');
}

function editVoucher(id) {
    let v = currentVouchers.find(item => item.id === id);
    if (!v) return;

    document.getElementById('modalVoucherTitle').innerText = 'Cập nhật Mã Khuyến Mãi';
    document.getElementById('vId').value = v.id;
    
    let codeInput = document.getElementById('vCode');
    codeInput.value = v.voucherCode;
    codeInput.setAttribute('readonly', 'true');
    codeInput.style.backgroundColor = '#f5f0ee';

    document.getElementById('vName').value = v.ten || '';
    document.getElementById('vType').value = v.loai;
    document.getElementById('vValue').value = v.giaTriGiam;
    document.getElementById('vMinOrder').value = v.donHangToiThieu;
    document.getElementById('vMaxUse').value = v.soLuotToiDa || '';
    document.getElementById('vStart').value = v.ngayBatDau;
    document.getElementById('vEnd').value = v.ngayKetThuc;

    document.getElementById('voucherModal').classList.add('active');
}

async function saveVoucher() {
    let isEdit = document.getElementById('vId').value !== '';
    let payload = {
        voucherCode: document.getElementById('vCode').value.trim().toUpperCase(),
        ten: document.getElementById('vName').value.trim(),
        loai: document.getElementById('vType').value,
        giaTriGiam: Number(document.getElementById('vValue').value),
        donHangToiThieu: Number(document.getElementById('vMinOrder').value),
        soLuotToiDa: document.getElementById('vMaxUse').value ? Number(document.getElementById('vMaxUse').value) : null,
        gioiHanMoiTk: 1, 
        ngayBatDau: document.getElementById('vStart').value,
        ngayKetThuc: document.getElementById('vEnd').value
    };

    if (isEdit) {
        payload.id = Number(document.getElementById('vId').value);
    }

    if(!payload.voucherCode || !payload.giaTriGiam || !payload.ngayBatDau || !payload.ngayKetThuc) {
        return alert('Vui lòng điền đầy đủ các thông tin bắt buộc có dấu sao');
    }
    
    if(new Date(payload.ngayKetThuc) <= new Date(payload.ngayBatDau)) {
        return alert('Lỗi ngày kết thúc không thể diễn ra trước ngày bắt đầu.');
    }

    let actionUrl = isEdit ? '/websitethuongmaidientu/admin/khuyenmai-api?action=updateVoucher' : '/websitethuongmaidientu/admin/khuyenmai-api?action=createVoucher';

    try {
        const res = await fetch(actionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if(!res.ok) {
            let error = await res.json();
            return alert(error.message || 'Đã xảy ra lỗi khi xử lý mã');
        }
        
        const data = await res.json();
        if(data.success) {
            alert('Lưu thông tin mã khuyến mãi thành công.');
            closeModals();
            loadVouchers();
        }
    } catch (e) { 
        alert('Lỗi kết nối máy chủ'); 
    }
}

async function toggleVoucher(id, status) {
    if(!confirm('Xác nhận thao tác thay đổi trạng thái mã khuyến mãi này chứ?')) return;
    
    try {
        const res = await fetch('/websitethuongmaidientu/admin/khuyenmai-api?action=toggleVoucher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, isActive: status })
        });
        
        const data = await res.json();
        if(data.success) {
            loadVouchers();
        }
    } catch (e) { 
        alert('Lỗi cập nhật trạng thái'); 
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    let d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    let day = String(d.getDate()).padStart(2, '0');
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let year = d.getFullYear();

    return `${day}/${month}/${year}`;
}