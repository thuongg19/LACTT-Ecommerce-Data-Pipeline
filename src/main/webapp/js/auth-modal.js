/* =============================================
   LACTT — auth-modal.js  (v4.2 — Fix logout endpoint + APP_CONTEXT)
   Sửa: logout gọi đúng /LogoutServlet; tách riêng _LOGOUT_URL
   ============================================= */

/* Lấy context path từ JSP — mọi trang cần inject: window.APP_CONTEXT = '<%=request.getContextPath()%>' */
const _CTX          = (typeof window.APP_CONTEXT !== 'undefined' ? window.APP_CONTEXT : '');
const _SERVLET_URL  = _CTX + '/DangNhapServlet';
const _LOGOUT_URL   = _CTX + '/LogoutServlet';


const AuthModal = (function () {

  /* ──────────────────────────────────────────
     CẤU HÌNH — khớp với ENUM trong DB:
       'khach_hang' | 'admin' | 'nhan_vien_kho'
  ────────────────────────────────────────── */
  const ROLE_REDIRECT = {
    admin:          'admin.jsp',
    nhan_vien_kho:  'nhanvienkho.jsp',
    khach_hang:     null,   // null = ở lại trang hiện tại
  };

  const ROLE_LABEL = {
    khach_hang:    'Khách hàng',
    admin:         'Quản trị viên',
    nhan_vien_kho: 'Nhân viên kho',
  };

  const ROLE_AVATAR = {
    admin:         '👨‍💼',
    nhan_vien_kho: '📦',
    khach_hang:    '👤',
  };

  const ROLE_PAGE = {
    khach_hang:    'TaiKhoanServlet',
    admin:         'admin.jsp',
    nhan_vien_kho: 'nhanvienkho.jsp',
  };

  /* ══════════════════════════════════════════
     STATE
  ══════════════════════════════════════════ */
  let isLoggedIn    = false;
  let currentUser   = null;
  let onSuccessCb   = null;
  let _checkoutMode = false;

  /* ══════════════════════════════════════════
     KHỞI TẠO — kiểm tra session server trước,
     rồi fallback về localStorage
  ══════════════════════════════════════════ */
  function _loadUser() {
    try {
      const raw = localStorage.getItem('lactt_user');
      if (raw) { currentUser = JSON.parse(raw); isLoggedIn = true; }
    } catch (e) {}
  }

  /* Kiểm tra session server còn sống không. Gọi 1 lần khi tải trang. */
  function _syncSession() {
    fetch(_SERVLET_URL, { method: 'GET', credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => {
        if (data.dangNhap) {
          /* Session server còn sống — đồng bộ lại localStorage */
          const user = _buildUserObj(data);
          localStorage.setItem('lactt_user', JSON.stringify(user));
          currentUser = user;
          isLoggedIn  = true;
          _updateHeaderUI(user);
        } else {
          /* Session hết hạn — xóa localStorage cũ */
          if (isLoggedIn) {
            localStorage.removeItem('lactt_user');
            isLoggedIn  = false;
            currentUser = null;
            _updateHeaderUI(null);
          }
        }
      })
      .catch(() => { /* Không có server (dev mode) — bỏ qua */ });
  }

  /* Tạo object user chuẩn từ response JSON của Servlet */
  function _buildUserObj(data) {
    const hoTen  = data.hoTen || '';
    const parts  = hoTen.trim().split(' ');
    const vaiTro = data.vaiTro || 'khach_hang';
    return {
      maNguoiDung: data.maNguoiDung,
      hoTen,
      email:     data.email || '',
      vaiTro,
      firstName: parts[0] || '',
      lastName:  parts.slice(1).join(' '),
      phone:       data.soDienThoai || '',
      avatar:    ROLE_AVATAR[vaiTro] || '👤',
      points:    data.diemThuong || 0,
    };
  }

  /* ══════════════════════════════════════════
     HTML MODAL
  ══════════════════════════════════════════ */
  function _buildHTML() {
    return `
    <div class="auth-overlay" id="authOverlay" role="dialog" aria-modal="true" aria-label="Đăng nhập / Đăng ký">
      <div class="auth-modal" id="authModalBox">

        <div class="auth-modal-top">
          <div class="auth-logo">LACTT</div>
          <h2 class="auth-modal-title" id="authModalTitle">Đăng nhập</h2>
          <p class="auth-modal-sub" id="authModalSub">Tiếp tục để hoàn tất đơn hàng của bạn</p>
          <button class="auth-close" id="authClose" aria-label="Đóng">✕</button>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab active" id="tabLogin" data-tab="login">Đăng nhập</button>
          <button class="auth-tab" id="tabSdt" data-tab="sdt">Số điện thoại</button>
          <button class="auth-tab" id="tabRegister" data-tab="register">Đăng ký mới</button>
        </div>

        <div class="auth-body">

          <div class="auth-alert" id="authAlert">
            <span id="authAlertIcon">ℹ</span>
            <span id="authAlertMsg"></span>
          </div>

          <div class="auth-panel active" id="panelLogin">
            <div class="auth-field">
              <label class="auth-label" for="loginEmail">Email</label>
              <div class="auth-input-wrap">
                <input type="email" class="auth-input" id="loginEmail" placeholder="email@gmail.com" autocomplete="email" />
                <span class="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
              </div>
              <div class="auth-field-error" id="err-loginEmail">Email không hợp lệ</div>
            </div>

            <div class="auth-field">
              <label class="auth-label" for="loginPw">Mật khẩu</label>
              <div class="auth-input-wrap">
                <input type="password" class="auth-input" id="loginPw" placeholder="Nhập mật khẩu..." autocomplete="current-password" />
                <button class="auth-toggle-pw" type="button" data-target="loginPw" aria-label="Hiện/ẩn mật khẩu">
                  <svg class="eye-show" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div class="auth-field-error" id="err-loginPw">Mật khẩu tối thiểu 6 ký tự</div>
            </div>

            <div class="auth-check-row">
              <input type="checkbox" id="rememberMe" />
              <label for="rememberMe">Ghi nhớ đăng nhập</label>
              <span class="spacer"></span>
              <a class="auth-forgot" id="forgotPwLink">Quên mật khẩu?</a>
            </div>

            <button class="auth-submit" id="btnLogin">
              <span class="btn-label">Đăng nhập</span>
              <div class="spinner"></div>
            </button>

            <div class="auth-switch">
              Chưa có tài khoản? <a id="switchToRegister">Đăng ký ngay — miễn phí</a>
            </div>
          </div>

          <div class="auth-panel" id="panelSdt">
            <div class="auth-field">
              <label class="auth-label" for="sdtInput">Số điện thoại</label>
              <div class="auth-input-wrap">
                <input type="tel" class="auth-input" id="sdtInput" placeholder="0901 234 567" />
              </div>
              <div class="auth-field-error" id="err-sdtInput">Số điện thoại không hợp lệ</div>
            </div>
            <button class="auth-submit" id="btnLoginSdt">
              <span class="btn-label">Đăng nhập</span>
              <div class="spinner"></div>
            </button>
          </div>

          <div class="auth-panel" id="panelRegister">
            <div class="auth-benefits">
              <span class="auth-benefit-tag">🎁 Ưu đãi thành viên</span>
              <span class="auth-benefit-tag">📦 Theo dõi đơn hàng</span>
              <span class="auth-benefit-tag">⚡ Thanh toán nhanh</span>
              <span class="auth-benefit-tag">💎 Tích điểm đổi quà</span>
            </div>

            <div class="auth-row">
              <div class="auth-field">
                <label class="auth-label" for="regFirstName">Họ <span style="color:#c4626e">*</span></label>
                <div class="auth-input-wrap">
                  <input type="text" class="auth-input" id="regFirstName" placeholder="Nguyễn" autocomplete="given-name" />
                </div>
                <div class="auth-field-error" id="err-regFirstName">Vui lòng nhập họ</div>
              </div>
              <div class="auth-field">
                <label class="auth-label" for="regLastName">Tên <span style="color:#c4626e">*</span></label>
                <div class="auth-input-wrap">
                  <input type="text" class="auth-input" id="regLastName" placeholder="Thị Lan" autocomplete="family-name" />
                </div>
                <div class="auth-field-error" id="err-regLastName">Vui lòng nhập tên</div>
              </div>
            </div>

            <div class="auth-field">
              <label class="auth-label" for="regPhone">Số điện thoại <span style="color:#c4626e">*</span></label>
              <div class="auth-input-wrap">
                <input type="tel" class="auth-input" id="regPhone" placeholder="0901 234 567" autocomplete="tel" />
                <span class="auth-input-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1-1a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
              </div>
              <div class="auth-field-error" id="err-regPhone">Số điện thoại không hợp lệ (VD: 0901234567)</div>
            </div>

            <div class="auth-field">
              <label class="auth-label" for="regEmail">Email <span style="color:#c4626e">*</span></label>
              <div class="auth-input-wrap">
                <input type="email" class="auth-input" id="regEmail" placeholder="email@gmail.com" autocomplete="email" />
                <span class="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
              </div>
              <div class="auth-field-error" id="err-regEmail">Email không hợp lệ</div>
            </div>

            <div class="auth-field">
              <label class="auth-label" for="regPw">Mật khẩu <span style="color:#c4626e">*</span></label>
              <div class="auth-input-wrap">
                <input type="password" class="auth-input" id="regPw" placeholder="Tối thiểu 8 ký tự" autocomplete="new-password" />
                <button class="auth-toggle-pw" type="button" data-target="regPw" aria-label="Hiện/ẩn mật khẩu">
                  <svg class="eye-show" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div class="pw-strength" id="pwStrength">
                <div class="pw-strength-bar"><div class="pw-strength-fill" id="pwStrengthFill"></div></div>
                <span class="pw-strength-label" id="pwStrengthLabel"></span>
              </div>
              <div class="auth-field-error" id="err-regPw">Mật khẩu tối thiểu 8 ký tự</div>
            </div>

            <div class="auth-field">
              <label class="auth-label" for="regPwConfirm">Xác nhận mật khẩu <span style="color:#c4626e">*</span></label>
              <div class="auth-input-wrap">
                <input type="password" class="auth-input" id="regPwConfirm" placeholder="Nhập lại mật khẩu..." autocomplete="new-password" />
                <button class="auth-toggle-pw" type="button" data-target="regPwConfirm" aria-label="Hiện/ẩn mật khẩu">
                  <svg class="eye-show" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div class="auth-field-error" id="err-regPwConfirm">Mật khẩu không khớp</div>
            </div>

            <div class="auth-check-row">
              <input type="checkbox" id="agreeTerms" />
              <label for="agreeTerms">
                Tôi đồng ý với <a href="#" onclick="return false;">Điều khoản dịch vụ</a>
                và <a href="#" onclick="return false;">Chính sách bảo mật</a> của LACTT
              </label>
            </div>

            <button class="auth-submit" id="btnRegister">
              <span class="btn-label">Tạo tài khoản</span>
              <div class="spinner"></div>
            </button>

            <div class="auth-switch">
              Đã có tài khoản? <a id="switchToLogin">Đăng nhập ngay</a>
            </div>
          </div>

        </div>
      </div>
    </div>`;
  }
  /* ══════════════════════════════════════════
     HELPERS UI
  ══════════════════════════════════════════ */
  function _alert(type, msg) {
    const el   = document.getElementById('authAlert');
    const icon = document.getElementById('authAlertIcon');
    const txt  = document.getElementById('authAlertMsg');
    if (!el) return;
    el.className     = 'auth-alert show ' + type;
    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    txt.textContent  = msg;
  }

  function _clearAlert() {
    const el = document.getElementById('authAlert');
    if (el) el.className = 'auth-alert';
  }

  function _setErr(id, customMsg, showIt) {
    const el = document.getElementById(id);
    if (!el) return !showIt;
    el.classList.toggle('show', !!showIt);
    if (customMsg && showIt) el.textContent = customMsg;
    const input = el.previousElementSibling?.querySelector('input') ||
                  document.getElementById(id.replace('err-', ''));
    if (input) input.classList.toggle('err', !!showIt);
    return !showIt;
  }

  function _setLoading(btn, on) {
    btn.classList.toggle('loading', on);
    btn.disabled = on;
  }

  function _checkPwStrength(val) {
    const bar   = document.getElementById('pwStrengthFill');
    const label = document.getElementById('pwStrengthLabel');
    const wrap  = document.getElementById('pwStrength');
    if (!bar || !label || !wrap) return;
    if (!val) { wrap.classList.remove('show'); return; }
    wrap.classList.add('show');
    let score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Z]/.test(val))        score++;
    if (/[0-9]/.test(val))        score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
      { w: '25%',  bg: '#e74c3c', lbl: 'Rất yếu' },
      { w: '50%',  bg: '#e67e22', lbl: 'Yếu' },
      { w: '75%',  bg: '#f1c40f', lbl: 'Trung bình' },
      { w: '100%', bg: '#27ae60', lbl: 'Mạnh' },
    ];
    const lvl = levels[score - 1] || levels[0];
    bar.style.width      = lvl.w;
    bar.style.background = lvl.bg;
    label.textContent    = lvl.lbl;
    label.style.color    = lvl.bg;
  }

  /* ══════════════════════════════════════════
     BIND EVENTS
  ══════════════════════════════════════════ */
  function _bindEvents() {
    /* Đóng modal */
    document.getElementById('authClose').addEventListener('click', close);
    document.getElementById('authOverlay').addEventListener('click', function (e) {
      if (e.target === this) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    /* Tabs */
    document.getElementById('tabLogin').addEventListener('click',      function () { switchTab('login'); });
    document.getElementById('tabRegister').addEventListener('click',   function () { switchTab('register'); });
    document.getElementById('tabSdt').addEventListener('click', function () { switchTab('sdt'); });
    document.getElementById('switchToRegister').addEventListener('click', function () { switchTab('register'); });
    document.getElementById('switchToLogin').addEventListener('click', function () { switchTab('login'); });

    /* Show/hide password */
    document.querySelectorAll('.auth-toggle-pw').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = document.getElementById(btn.dataset.target);
        if (target) target.type = target.type === 'password' ? 'text' : 'password';
      });
    });

    /* Password strength meter */
    const regPw = document.getElementById('regPw');
    if (regPw) regPw.addEventListener('input', function () { _checkPwStrength(this.value); });

    /* Quên mật khẩu */
    document.getElementById('forgotPwLink').addEventListener('click', function () {
      const email = (document.getElementById('loginEmail').value || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        _alert('error', 'Vui lòng nhập email trước khi khôi phục mật khẩu.');
        return;
      }
      _alert('success', 'Đã gửi link đặt lại mật khẩu đến ' + email + '. Kiểm tra hộp thư nhé!');
    });

    /* ─────────────────────────────────────────
       ĐĂNG NHẬP
    ───────────────────────────────────────── */
    document.getElementById('btnLogin').addEventListener('click', function () {
      _clearAlert();
      const email = (document.getElementById('loginEmail').value || '').trim().toLowerCase();
      const pw    = (document.getElementById('loginPw').value    || '');

      let ok = true;
      ok = _setErr('err-loginEmail', null, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      ok = _setErr('err-loginPw',    null, pw.length < 6) && ok;
      if (!ok) return;

      const btn = this;
      _setLoading(btn, true);

      fetch(_SERVLET_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=login'
            + '&email='    + encodeURIComponent(email)
            + '&matKhau='  + encodeURIComponent(pw),
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _setLoading(btn, false);
        if (data.success) {
          const user = _buildUserObj(data);
          localStorage.setItem('lactt_user', JSON.stringify(user));
          _loginSuccess(user);
        } else {
          _alert('error', data.message || 'Đăng nhập thất bại');
        }
      })
      .catch(function (err) {
        _setLoading(btn, false);
        _alert('error', 'Lỗi kết nối máy chủ, vui lòng thử lại');
        console.error('[AuthModal] login error:', err);
      });
    });

    /* Enter key trong form đăng nhập */
    ['loginEmail', 'loginPw'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('btnLogin').click();
      });
    });
    /* Enter key trong form đăng nhập bằng SĐT */
const sdtInputEl = document.getElementById('sdtInput');
if (sdtInputEl) {
  sdtInputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('btnLoginSdt').click();
    }
  });
}
/* ── ĐĂNG NHẬP BẰNG SĐT ── */
    document.getElementById('btnLoginSdt').addEventListener('click', function () {
      _clearAlert();
      var sdt = (document.getElementById('sdtInput').value || '').replace(/\s/g, '');
      var ok = _setErr('err-sdtInput', null, !/^0[3-9]\d{8}$/.test(sdt));
      if (!ok) return;

      var btn = this;
      _setLoading(btn, true);

      fetch(_SERVLET_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=loginSdt&soDienThoai=' + encodeURIComponent(sdt)
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        _setLoading(btn, false);
        if (data.success) {
          var user = _buildUserObj(data);
          localStorage.setItem('lactt_user', JSON.stringify(user));
          _loginSuccess(user);
        } else {
          _alert('error', data.message || 'Đăng nhập thất bại');
        }
      })
      .catch(function() {
        _setLoading(btn, false);
        _alert('error', 'Lỗi kết nối, thử lại');
      });
    });
    /* ─────────────────────────────────────────
       ĐĂNG KÝ
    ───────────────────────────────────────── */
    document.getElementById('btnRegister').addEventListener('click', function () {
      _clearAlert();
      const firstName = (document.getElementById('regFirstName').value || '').trim();
      const lastName  = (document.getElementById('regLastName').value  || '').trim();
      const phone     = (document.getElementById('regPhone').value     || '').replace(/\s/g, '');
      const email     = (document.getElementById('regEmail').value     || '').trim().toLowerCase();
      const pw        = (document.getElementById('regPw').value        || '');
      const pwc       = (document.getElementById('regPwConfirm').value || '');
      const terms     = document.getElementById('agreeTerms').checked;

      let ok = true;
      ok = _setErr('err-regFirstName', null, firstName.length === 0) && ok;
      ok = _setErr('err-regLastName',  null, lastName.length === 0)  && ok;
      ok = _setErr('err-regPhone',     null, !/^0[3-9]\d{8}$/.test(phone)) && ok;
      ok = _setErr('err-regEmail',     null, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      ok = _setErr('err-regPw',        null, pw.length < 8) && ok;
      ok = _setErr('err-regPwConfirm', 'Mật khẩu không khớp', pw !== pwc) && ok;

      if (!terms) {
        _alert('error', 'Vui lòng đồng ý với Điều khoản dịch vụ để tiếp tục.');
        return;
      }
      if (!ok) return;

      const btn = this;
      _setLoading(btn, true);

      fetch(_SERVLET_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=register'
            + '&hoTen='        + encodeURIComponent(firstName + ' ' + lastName)
            + '&email='        + encodeURIComponent(email)
            + '&matKhau='      + encodeURIComponent(pw)   // plain-text — Servlet tự hash MD5
            + '&soDienThoai='  + encodeURIComponent(phone),
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        _setLoading(btn, false);
        if (data.success) {
          _alert('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
          setTimeout(function () { switchTab('login'); }, 1500);
        } else {
          _alert('error', data.message || 'Đăng ký thất bại');
        }
      })
      .catch(function (err) {
        _setLoading(btn, false);
        _alert('error', 'Lỗi kết nối máy chủ, vui lòng thử lại');
        console.error('[AuthModal] register error:', err);
      });
    });
  }

  /* ══════════════════════════════════════════
     LOGIN SUCCESS
  ══════════════════════════════════════════ */
  function _loginSuccess(user) {
    currentUser = user;
    isLoggedIn  = true;

    /* ── Migrate giỏ hàng guest → user (tránh badge thừa sau đăng nhập) ── */
    try {
      if (user.maNguoiDung) {
        const guestKey = 'lactt_cart_guest';
        const userKey  = 'lactt_cart_' + user.maNguoiDung;
        const guestRaw = localStorage.getItem(guestKey);
        if (guestRaw) {
          const guestItems = JSON.parse(guestRaw) || [];
          if (guestItems.length > 0) {
            const userItems = JSON.parse(localStorage.getItem(userKey) || '[]');
            guestItems.forEach(function(gi) {
              const exist = userItems.find(function(ui) { return ui.key === gi.key; });
              if (exist) { exist.qty = Math.min(99, exist.qty + gi.qty); }
              else { userItems.push(gi); }
            });
            localStorage.setItem(userKey, JSON.stringify(userItems));
          }
          localStorage.removeItem(guestKey);
        }
      }
    } catch(e) {}

    _updateHeaderUI(user);

    const roleName = ROLE_LABEL[user.vaiTro] || 'Thành viên';
    _alert('success', 'Chào mừng ' + (user.firstName || user.hoTen) + '! (' + roleName + ')');

    setTimeout(function () {
      close();

      if (typeof onSuccessCb === 'function') {
        onSuccessCb(user);
        onSuccessCb = null;
        return;
      }

      /* Redirect theo role */
      const redirect = ROLE_REDIRECT[user.vaiTro];
      if (redirect) window.location.href = redirect;
      /* khach_hang → ở lại trang hiện tại */
    }, 900);
  }

  function _updateHeaderUI(user) {
    const btns = document.querySelectorAll('.account-btn, .user-btn, [data-auth-btn]');
    if (user) {
      btns.forEach(function (btn) {
        btn.setAttribute('title', user.hoTen + ' (' + (ROLE_LABEL[user.vaiTro] || user.vaiTro) + ')');
        btn.setAttribute('aria-label', 'Tài khoản: ' + user.firstName);
        btn.classList.add('logged-in');
      });
    } else {
      btns.forEach(function (btn) {
        btn.classList.remove('logged-in');
        btn.removeAttribute('title');
        btn.removeAttribute('aria-label');
      });
    }
  }

  /* ══════════════════════════════════════════
     SWITCH TAB
  ══════════════════════════════════════════ */
  function switchTab(tab) {
    _clearAlert();
    document.getElementById('tabLogin').classList.toggle('active',    tab === 'login');
    document.getElementById('tabSdt').classList.toggle('active',      tab === 'sdt');
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
    document.getElementById('panelLogin').classList.toggle('active',    tab === 'login');
    document.getElementById('panelSdt').classList.toggle('active',      tab === 'sdt');
    document.getElementById('panelRegister').classList.toggle('active', tab === 'register');
    
    const meta = {
  login:    { title: 'Đăng nhập',     sub: 'Tiếp tục để hoàn tất đơn hàng của bạn' },
  sdt:      { title: 'Đăng nhập bằng SĐT', sub: 'Nhập số điện thoại để tiếp tục' },
  register: { title: 'Tạo tài khoản', sub: 'Đăng ký miễn phí — nhận ngay ưu đãi thành viên' },
};
    document.getElementById('authModalTitle').textContent = meta[tab].title;
    document.getElementById('authModalSub').textContent   = meta[tab].sub;
  }

  /* ══════════════════════════════════════════
     PUBLIC: open(options)
  ══════════════════════════════════════════ */
  function open(options) {
    options       = options || {};
    onSuccessCb   = options.onSuccess || null;
    _checkoutMode = options.reason === 'checkout';

    if (!document.getElementById('authOverlay')) {
      const div = document.createElement('div');
      div.innerHTML = _buildHTML();
      document.body.appendChild(div.firstElementChild);
      _bindEvents();
    }

    switchTab(options.tab || 'login');
    _clearAlert();

    if (_checkoutMode) {
      setTimeout(function () {
        _alert('info', '🔒 Vui lòng đăng nhập để tiếp tục thanh toán.');
      }, 100);
      document.getElementById('authModalSub').textContent = 'Đăng nhập để hoàn tất đơn hàng của bạn';
    }

    document.getElementById('authOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';

    setTimeout(function () {
      const focusEl = document.getElementById(
        options.tab === 'register' ? 'regFirstName' : 'loginEmail'
      );
      if (focusEl) focusEl.focus();
    }, 350);
  }

  /* ══════════════════════════════════════════
     PUBLIC: close
  ══════════════════════════════════════════ */
  function close() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    _checkoutMode = false;
  }

  /* ══════════════════════════════════════════
     PUBLIC: logout — invalidate session server + xóa localStorage
  ══════════════════════════════════════════ */
  function logout() {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất không?')) return;

    /* Dọn client state TRƯỚC */
    
    localStorage.removeItem('lactt_user');
    
    isLoggedIn  = false;
    currentUser = null;

    /* Gọi server invalidate session, ĐỢI xong RỒI mới redirect
       — tránh trang mới load khi session chưa kịp bị huỷ
       — FIX: gọi đúng /LogoutServlet (không phải DangNhapServlet) */
    fetch(_LOGOUT_URL, {
      method: 'POST',
      credentials: 'same-origin',
    })
    .then(function () {
      window.location.replace('dangnhap.jsp');
    })
    .catch(function () {
      /* Mạng lỗi — vẫn redirect vì client đã sạch */
      window.location.replace('dangnhap.jsp');
    });
  }

  /* ══════════════════════════════════════════
     GETTERS
  ══════════════════════════════════════════ */
  function check()   { return isLoggedIn; }
  function getUser() { return currentUser; }

  /* ══════════════════════════════════════════
     INIT — gắn sự kiện nút tài khoản trong header
  ══════════════════════════════════════════ */
  function _initAccountBtn() {
    _loadUser();                       // Tải từ localStorage
    if (isLoggedIn) _updateHeaderUI(currentUser);
    _syncSession();                    // Kiểm tra session server (async, không block UI)

    document.querySelectorAll('.account-btn, .user-btn, [data-auth-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (isLoggedIn && currentUser) {
          window.location.href = ROLE_PAGE[currentUser.vaiTro] || 'taikhoan.jsp';
        } else {
          open({ tab: 'login' });
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initAccountBtn);
  } else {
    _initAccountBtn();
  }

  return { open, close, check, getUser, logout, switchTab };
})();