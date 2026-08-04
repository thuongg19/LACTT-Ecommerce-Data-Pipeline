'use strict';

let products = [];
let nextId = 100;
let currentFilter = 'all';
let editId = null;

const formatPrice = (n) => {
    return Number(n || 0).toLocaleString('vi-VN') + 'đ';
};

async function fetchProducts() {
    try {
        // ĐÃ SỬA: Gọi đúng đường dẫn qlSanPhamServlet
        const response = await fetch((window.APP_CONTEXT || '') + '/qlSanPhamServlet?action=list');
        if (response.ok) {
            products = await response.json();
        } else {
            throw new Error("Không kết nối được Backend");
        }
    } catch (error) {
        console.warn("Lỗi kết nối hoặc đang chạy dữ liệu giả lập...");
    }
    renderTable();
}

function renderTable() {
    const searchInput = document.getElementById('searchInput');
    const brandSelect = document.getElementById('filterBrand');
    const catSelect = document.getElementById('filterCat');
    const tbody = document.getElementById('productTable');
    const countLabel = document.getElementById('productCount');

    if (!tbody || !countLabel) return;

    const q = (searchInput ? searchInput.value : '').toLowerCase();
    const brd = brandSelect ? brandSelect.value.trim().toLowerCase() : '';
    const cat = catSelect ? catSelect.value.trim().toLowerCase() : '';

    const list = products.filter(p => {
        if (currentFilter === 'active' && p.status !== 'active') return false;
        if (currentFilter === 'inactive' && p.status !== 'inactive') return false;
        if (q && !(p.name || '').toLowerCase().includes(q)) return false;
        
        // Fix lọc: so sánh chữ thường chính xác
        if (brd && (p.brand || '').trim().toLowerCase() !== brd) return false;
        if (cat && (p.cat || '').trim().toLowerCase() !== cat) return false;
        
        return true;
    });

    countLabel.textContent = list.length + ' sản phẩm';

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--light);">Không tìm thấy sản phẩm phù hợp</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(p => {
        let thumbContent = '📦';
        if (p.e) {
            if (p.e.startsWith('http')) {
                thumbContent = `<img src="${p.e}" style="width:100%; height:100%; object-fit:cover; border-radius:5px;">`;
            } else {
                thumbContent = p.e;
            }
        }

        return `
        <tr>
            <td><div class="product-thumb" style="padding:0; overflow:hidden;">${thumbContent}</div></td>
            <td>
                <div class="product-name">${p.name}</div>
                <div class="product-desc">${(p.desc || '').substring(0, 40)}${(p.desc || '').length > 40 ? '…' : ''}</div>
            </td>
            <td style="font-size:12px; color:var(--light);">${p.brand || '-'}</td>
            <td style="font-weight:600; color:var(--charcoal);">${formatPrice(p.price)}</td>
            <td class="${p.stock <= 5 ? 'stock-low' : 'stock-ok'}">${p.stock || 0}</td>
            <td>${p.cat ? `<span class="cat-badge">${p.cat}</span>` : '-'}</td>
            <td>
                ${p.status === 'active' 
                    ? '<span class="badge bOk">Đang bán</span>' 
                    : '<span class="badge bErr">Ngừng KD</span>'}
            </td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-outline btn-sm" onclick="openModal(${p.id})">Sửa</button>
                    ${p.status === 'active' 
                        ? `<button class="btn btn-outline btn-sm" style="color:#e8637a; border-color:#F7C1C1;" onclick="toggleStatus(${p.id})">Ngừng</button>` 
                        : `<button class="btn btn-outline btn-sm" style="color:#27ae60; border-color:#C0DD97;" onclick="toggleStatus(${p.id})">Mở bán</button>`}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function setFilter(el, v) {
    document.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    currentFilter = v;
    renderTable();
}

function updateStatusLabel() {
    const toggle = document.getElementById('statusToggle');
    const label = document.getElementById('statusLabel');
    if (toggle && label) {
        label.innerHTML = 'Trạng thái: <strong>' + (toggle.checked ? 'Mở bán' : 'Ngừng kinh doanh') + '</strong>';
    }
}

function handleFile(e) {
    const f = e.target.files[0];
    const err = document.getElementById('err-img');
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { err.textContent = 'Sai định dạng. Chỉ chấp nhận JPG, PNG, WEBP.'; return; }
    if (f.size > 5 * 1024 * 1024) { err.textContent = 'Ảnh vượt quá 5MB.'; return; }
    
    err.textContent = '';
    const r = new FileReader();
    r.onload = ev => {
        const i = document.getElementById('imgPreview');
        i.src = ev.target.result;
        i.style.display = 'block';
    };
    r.readAsDataURL(f);
}

function clearForm() {
    ['f-name', 'f-price', 'f-stock', 'f-desc', 'f-brand', 'f-cat'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    ['err-name', 'err-price', 'err-brand', 'err-img'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });

    ['f-name', 'f-price', 'f-brand'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('err');
    });

    const globalErr = document.getElementById('globalErr');
    if (globalErr) globalErr.classList.remove('show');

    const statusToggle = document.getElementById('statusToggle');
    if (statusToggle) statusToggle.checked = true;
    updateStatusLabel();
}

function openModal(id) {
    editId = id;
    clearForm();
    const modal = document.getElementById('modalOverlay');
    if (!modal) return;

    if (id) {
        const p = products.find(x => x.id === id);
        if (p) {
            document.getElementById('modalTitle').textContent = 'Chỉnh sửa sản phẩm';
            document.getElementById('modalSub').textContent = 'Cập nhật thông tin mỹ phẩm';
            document.getElementById('f-name').value = p.name || '';
            document.getElementById('f-brand').value = p.brand || '';
            document.getElementById('f-price').value = p.price || '';
            document.getElementById('f-stock').value = p.stock || 0;
            document.getElementById('f-cat').value = p.cat || '';
            document.getElementById('f-desc').value = p.desc || '';
            document.getElementById('statusToggle').checked = (p.status === 'active');
            updateStatusLabel();
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Thêm sản phẩm mới';
        document.getElementById('modalSub').textContent = 'Điền đầy đủ thông tin mỹ phẩm bên dưới';
    }
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) modal.classList.remove('active');
    editId = null;
}

async function saveProduct() {
    const name = document.getElementById('f-name').value.trim();
    const brand = document.getElementById('f-brand').value;
    const priceVal = document.getElementById('f-price').value;
    const price = parseFloat(priceVal);
    const stock = parseInt(document.getElementById('f-stock').value) || 0;
    const cat = document.getElementById('f-cat').value;
    const desc = document.getElementById('f-desc').value.trim();
    const active = document.getElementById('statusToggle').checked;
    
    let err = false;
    ['err-name', 'err-price', 'err-brand'].forEach(id => document.getElementById(id).textContent = '');
    ['f-name', 'f-price', 'f-brand'].forEach(id => document.getElementById(id).classList.remove('err'));
    
    if (!name) { document.getElementById('err-name').textContent = 'Vui lòng nhập tên.'; document.getElementById('f-name').classList.add('err'); err = true; }
    if (!brand) { document.getElementById('err-brand').textContent = 'Vui lòng chọn thương hiệu.'; document.getElementById('f-brand').classList.add('err'); err = true; }
    if (!priceVal || isNaN(price) || price < 0) { document.getElementById('err-price').textContent = 'Giá không hợp lệ.'; document.getElementById('f-price').classList.add('err'); err = true; }
    
    const globalErr = document.getElementById('globalErr');
    if (err) { if (globalErr) globalErr.classList.add('show'); return; }
    if (globalErr) globalErr.classList.remove('show');
    
    const formData = new URLSearchParams();
    formData.append("action", "save");
    formData.append("id", editId);
    formData.append("name", name);
    formData.append("brand", brand);
    formData.append("price", priceVal);
    formData.append("stock", stock);
    formData.append("cat", cat);
    formData.append("desc", desc);
    formData.append("status", active ? "active" : "inactive");
    formData.append("img", ""); 

    try {
        // ĐÃ SỬA: Gọi đúng đường dẫn qlSanPhamServlet
        const response = await fetch((window.APP_CONTEXT || '') + '/qlSanPhamServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        const result = await response.json();
        
        if(result.success) {
            showSpToast(editId ? 'Cập nhật thành công' : 'Thêm sản phẩm thành công');
            closeModal();
            fetchProducts(); 
        } else {
            globalErr.textContent = result.message || 'Lỗi hệ thống';
            globalErr.classList.add('show');
        }
    } catch (e) {
        showSpToast("Lỗi kết nối máy chủ");
    }
}

async function toggleStatus(id) {
    const p = products.find(x => x.id === id);
    if(!p) return;
    
    const formData = new URLSearchParams();
    formData.append("action", "toggle");
    formData.append("id", id);
    formData.append("status", p.status);

    try {
        // ĐÃ SỬA: Gọi đúng đường dẫn qlSanPhamServlet
        const response = await fetch((window.APP_CONTEXT || '') + '/qlSanPhamServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        const result = await response.json();
        if(result.success) {
            showSpToast(p.status === 'active' ? 'Đã ngừng kinh doanh sản phẩm' : 'Đã mở bán sản phẩm');
            fetchProducts();
        }
    } catch (e) {
        showSpToast("Lỗi thay đổi trạng thái");
    }
}

function showSpToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});