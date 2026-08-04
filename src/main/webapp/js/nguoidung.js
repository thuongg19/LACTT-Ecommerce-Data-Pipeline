'use strict';

const CURRENT_ADMIN_ID = 1; 
let users = [];
let currentFilter = 'all';
let lockTargetId = null;

// Biến phục vụ phân trang
let currentPage = 1;
const itemsPerPage = 10; 

const API_BASE = window.APP_CONTEXT + '/NguoiDungServlet';

// ==================== API CALLS ====================

async function apiCall(params) {
    const formData = new URLSearchParams();
    for (const key in params) {
        formData.append(key, params[key]);
    }

    try {
        const resp = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: formData.toString()
        });
        return await resp.json();
    } catch (err) {
        console.error('API Error:', err);
        return { success: false, message: 'Lỗi kết nối server' };
    }
}

async function loadUsers() {
    const roleParam = currentFilter === 'all' ? 'all' : convertRoleToDb(currentFilter);
    const result = await apiCall({ action: 'list', role: roleParam });

    if (result.success) {
        users = result.data || [];
        currentPage = 1; // Reset về trang 1 khi tải lại dữ liệu
        renderTable();
    } else {
        showNdToast('Lỗi tải dữ liệu: ' + (result.message || 'Unknown error'));
    }
}

// ==================== RENDER TABLE & PAGINATION ====================

function getRoleLabel(r) {
    if (r === 'admin') return '<span class="role-badge role-admin">Admin</span>';
    if (r === 'nv') return '<span class="role-badge role-nv">NV Kho</span>';
    return '<span class="role-badge role-kh">Khách hàng</span>';
}

function getStatusBadge(s) {
    if (s === 'active') return '<span class="status-badge status-active"><span class="status-dot dot-active"></span>Hoạt động</span>';
    return '<span class="status-badge status-locked"><span class="status-dot dot-locked"></span>Đã khóa</span>';
}

function renderTable() {
    const tbody = document.getElementById('userTable');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:30px; color:var(--light);">Không có người dùng nào.</td></tr>';
        renderPagination(0);
        return;
    }

    // Xử lý dữ liệu phân trang
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = users.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedUsers.map(u => {
        const isMe = u.id === CURRENT_ADMIN_ID;
        const lockBtn = u.status === 'active'
            ? `<button class="action-btn btn-lock" onclick="openLockModal(${u.id})">Khóa</button>`
            : `<button class="action-btn btn-unlock" onclick="unlockUser(${u.id})">Mở khóa</button>`;

        const roleChangeBtn = !isMe
            ? `<button class="action-btn btn-edit" onclick="openRoleModal(${u.id})">Phân quyền</button>`
            : '';

        return `
            <tr>
                <td>
                    <span class="user-name-td" style="font-weight: 600; color: var(--charcoal);">${u.name}${isMe ? ' <span style="font-size:11px;color:var(--pink);font-weight:normal;">(Bạn)</span>' : ''}</span>
                </td>
                <td>
                    <span class="user-email-td" style="color: var(--light); font-size: 12px;">${u.email}</span>
                </td>
                <td>${u.phone || '-'}</td>
                <td>${u.gioiTinh || '-'}</td>
            
                <td>${u.ngaySinh || '-'}</td>
                <td>${getRoleLabel(u.role)}</td>
                <td style="text-align: center; font-weight: 500;">${u.orders || 0}</td>
                <td style="text-align: center; font-weight: 500; color: var(--pink);">${u.points || '-'}</td>
                <td>${getStatusBadge(u.status)}</td>
                <td>
                    <div class="actions">
                        ${roleChangeBtn}
                        ${lockBtn}
                        <button class="action-btn btn-reset" onclick="resetPassword(${u.id})">Reset MK</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination(users.length);
}

function renderPagination(totalItems) {
    const paginationContainer = document.getElementById('paginationControls');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';
    
    // Nút lùi
    html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">‹</button>`;

    // Render các số trang có logic rút gọn
    for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== totalPages) {
            if (i === 2 || i === totalPages - 1) {
                html += '<span style="padding:0 4px;color:var(--light);">…</span>';
            }
            continue;
        }
        const activeClass = i === currentPage ? 'active' : '';
        html += `<button class="page-btn ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
    }

    // Nút tiến
    html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">›</button>`;
    
    // Hiển thị tổng số lượng
    html += `<span style="font-size:0.78rem;color:var(--light);margin-left:8px">Tổng ${totalItems} tài khoản</span>`;

    paginationContainer.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderTable();
}

// ==================== FILTER TABS ====================

function filterTab(el, val) {
    document.querySelectorAll('.nd-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    currentFilter = val;
    loadUsers();
}

// ==================== LOCK/UNLOCK ====================
// (Giữ nguyên các hàm openLockModal, closeLockModal, confirmLock, unlockUser của em)
function openLockModal(id) {
    const u = users.find(x => x.id === id);
    if (!u) return;

    const errBanner = document.getElementById('lockErrorBanner');
    const confirmBtn = document.querySelector('.btn-confirm-lock');
    const lockInput = document.getElementById('lockReason');

    lockTargetId = id;
    document.getElementById('lockTargetName').textContent = u.name;
    document.getElementById('lockTargetEmail').textContent = u.email;
    lockInput.value = '';
    lockInput.style.borderColor = '';

    if (u.id === CURRENT_ADMIN_ID) {
        errBanner.textContent = 'Thao tác không hợp lệ. Bạn không thể tự khóa tài khoản đang đăng nhập.';
        errBanner.classList.add('show');
        confirmBtn.disabled = true;
    } else {
        errBanner.classList.remove('show');
        confirmBtn.disabled = false;
    }

    document.getElementById('lockModal').classList.add('active');
}

function closeLockModal() {
    document.getElementById('lockModal').classList.remove('active');
    lockTargetId = null;
}

async function confirmLock() {
    const reasonInput = document.getElementById('lockReason');
    const reason = reasonInput.value.trim();

    if (!reason) {
        reasonInput.style.borderColor = '#c0392b';
        reasonInput.focus();
        return;
    }

    const result = await apiCall({
        action: 'lock',
        id: lockTargetId,
        reason: reason
    });

    if (result.success) {
        showNdToast('Đã khóa tài khoản');
        closeLockModal();
        loadUsers();
    } else {
        showNdToast('Lỗi: ' + result.message);
    }
}

async function unlockUser(id) {
    if (!confirm('Bạn có chắc muốn mở khóa tài khoản này?')) return;

    const result = await apiCall({
        action: 'unlock',
        id: id
    });

    if (result.success) {
        showNdToast('Đã mở khóa tài khoản');
        loadUsers();
    } else {
        showNdToast('Lỗi: ' + result.message);
    }
}

// ==================== CHANGE ROLE ====================
// (Giữ nguyên các hàm openRoleModal, selectRole, closeRoleModal, confirmRole của em)

function openRoleModal(id) {
    const u = users.find(x => x.id === id);
    if (!u) return;

    if (u.id === CURRENT_ADMIN_ID) {
        showNdToast('Thao tác không hợp lệ.');
        return;
    }

    let modal = document.getElementById('roleModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'roleModal';
        modal.className = 'nd-modal';
        modal.innerHTML = `
            <div class="nd-modal-content">
                <h3 class="modal-title">Phân quyền người dùng</h3>
                <div id="roleErrorBanner" class="error-banner"></div>
                <div class="modal-user-info">
                    <div class="modal-user-name" id="roleTargetName"></div>
                    <div class="modal-user-email" id="roleTargetEmail"></div>
                </div>
                <div class="modal-label">Chọn vai trò mới</div>
                <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                    <button class="nd-tab role-option" data-role="khach_hang" onclick="selectRole(this)">Khách hàng</button>
                    <button class="nd-tab role-option" data-role="nhan_vien_kho" onclick="selectRole(this)">NV Kho</button>
                    <button class="nd-tab role-option" data-role="admin" onclick="selectRole(this)">Admin</button>
                </div>
                <div class="nd-modal-actions">
                    <button class="btn btn-outline" onclick="closeRoleModal()">Hủy</button>
                    <button class="btn btn-primary" id="confirmRoleBtn" onclick="confirmRole()">Xác nhận</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', function(e) {
            if (e.target === this) closeRoleModal();
        });
    }

    document.getElementById('roleTargetName').textContent = u.name;
    document.getElementById('roleTargetEmail').textContent = u.email;

    document.querySelectorAll('.role-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.role === convertRoleToDb(u.role)) {
            btn.classList.add('active');
        }
    });

    // Tận dụng biến lockTargetId hoặc tạo biến editTargetId riêng nếu cần
    window.editTargetId = id; 
    modal.classList.add('active');
}

function selectRole(el) {
    document.querySelectorAll('.role-option').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
}

function closeRoleModal() {
    document.getElementById('roleModal')?.classList.remove('active');
    window.editTargetId = null;
}

async function confirmRole() {
    const selected = document.querySelector('.role-option.active');
    if (!selected) {
        showNdToast('Vui lòng chọn vai trò');
        return;
    }

    const newRole = selected.dataset.role;
    const result = await apiCall({
        action: 'changeRole',
        id: window.editTargetId,
        newRole: newRole
    });

    if (result.success) {
        showNdToast('Cập nhật phân quyền thành công');
        closeRoleModal();
        loadUsers();
    } else {
        const errBanner = document.getElementById('roleErrorBanner');
        errBanner.textContent = result.message;
        errBanner.classList.add('show');
    }
}

// ==================== RESET PASSWORD ====================

async function resetPassword(id) {
    if (!confirm('Gửi link reset mật khẩu cho người dùng này?')) return;

    const result = await apiCall({
        action: 'resetPassword',
        id: id
    });

    if (result.success) {
        showNdToast('Đã gửi link reset mật khẩu');
    } else {
        showNdToast('Lỗi: ' + result.message);
    }
}

// ==================== UTILITIES ====================

function setReason(el) {
    const reasonInput = document.getElementById('lockReason');
    reasonInput.value = el.textContent;
    reasonInput.style.borderColor = '';
}

function showNdToast(msg) {
    const t = document.getElementById('ndToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function convertRoleToDb(uiRole) {
    switch(uiRole) {
        case 'kh': return 'khach_hang';
        case 'nv': return 'nhan_vien_kho';
        case 'admin': return 'admin';
        default: return uiRole;
    }
}

// ==================== INITIALIZE ====================

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

document.getElementById('lockModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeLockModal();
});