<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Đăng nhập — LACTT</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh;
      background: #0f0a05;
      display: flex;
      flex-direction: column;
    }
    a { text-decoration: none; }
    button { cursor: pointer; }

    /* ── Layout ── */
    .login-page {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 480px;
      min-height: 100vh;
    }

    /* ── LEFT: Brand panel ── */
    .login-brand {
      background: linear-gradient(145deg, #1a1208 0%, #2d1a0a 40%, #4a1a20 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 48px 56px;
      position: relative;
      overflow: hidden;
    }
    .login-brand::before {
      content: '';
      position: absolute;
      top: -100px; right: -100px;
      width: 500px; height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(196,98,110,0.15), transparent 70%);
    }
    .login-brand::after {
      content: '';
      position: absolute;
      bottom: -80px; left: -60px;
      width: 360px; height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(217,154,160,0.08), transparent 70%);
    }
    .brand-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.2rem;
      font-weight: 600;
      letter-spacing: 6px;
      color: #fff;
      position: relative; z-index: 1;
    }
    .brand-logo a { color: inherit; }
    .brand-middle { position: relative; z-index: 1; }
    .brand-tagline {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(2rem, 3.5vw, 3rem);
      font-weight: 300;
      color: #fff;
      line-height: 1.2;
      margin-bottom: 20px;
    }
    .brand-tagline em { font-style: italic; color: #d99aa0; }
    .brand-desc {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.5);
      line-height: 1.7;
      max-width: 340px;
    }
    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative; z-index: 1;
    }
    .brand-feat {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.84rem;
      color: rgba(255,255,255,0.6);
    }
    .brand-feat-icon {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.07);
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    /* ── RIGHT: Form panel ── */
    .login-form-panel {
      background: #fff;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .login-form-inner {
      flex: 1;
      padding: 48px 44px;
      display: flex;
      flex-direction: column;
    }

    /* Tabs */
    .lf-tabs {
      display: flex;
      border-bottom: 1px solid #f0eae8;
      margin-bottom: 28px;
    }
    .lf-tab {
      flex: 1;
      padding: 14px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.88rem;
      font-weight: 500;
      color: #9e8e82;
      border: none;
      background: none;
      border-bottom: 2.5px solid transparent;
      transition: all 0.2s;
      letter-spacing: 0.02em;
    }
    .lf-tab:hover { color: #1a1208; }
    .lf-tab.active { color: #c4626e; border-bottom-color: #c4626e; font-weight: 600; }

    /* Panel */
    .lf-panel { display: none; }
    .lf-panel.active { display: block; }

    /* Alert */
    .lf-alert {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      margin-bottom: 16px;
      display: none;
      align-items: center;
      gap: 8px;
      line-height: 1.4;
    }
    .lf-alert.show { display: flex; }
    .lf-alert.success { background:#edf7f3; color:#2d7a5f; border:1px solid #c4e8d8; }
    .lf-alert.error   { background:#fdf0f0; color:#c4626e; border:1px solid #f5d0d0; }
    .lf-alert.info    { background:#fff8ec; color:#9a6a20; border:1px solid #f0ddb0; }

    /* Demo accounts */
    .demo-box {
      background: linear-gradient(135deg, #fff8f0 0%, #fdf5f8 100%);
      border: 1px solid #f0ddd6;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
    }
    .demo-box-title {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #9e8e82;
      margin-bottom: 10px;
    }
    .demo-accounts { display: flex; flex-direction: column; gap: 8px; }
    .demo-acc {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #fff;
      border: 1px solid #f0eae8;
      border-radius: 8px;
      transition: border-color 0.2s;
    }
    .demo-acc:hover { border-color: #d99aa0; }
    .demo-icon { font-size: 1.5rem; flex-shrink: 0; }
    .demo-info { flex: 1; }
    .demo-role { font-size: 0.82rem; font-weight: 600; color: #1a1208; display: block; }
    .demo-cred { font-size: 0.7rem; color: #9e8e82; }
    .demo-fill {
      background: linear-gradient(135deg, #c4626e, #d99aa0);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 0.76rem;
      font-weight: 600;
      flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .demo-fill:hover { opacity: 0.85; }

    /* Social */
    .lf-social {
      display: flex;
      gap: 10px;
      margin-bottom: 18px;
    }
    .lf-social-btn {
      flex: 1;
      height: 44px;
      border: 1.5px solid #e8ddd9;
      border-radius: 10px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 0.84rem;
      font-weight: 500;
      color: #5c4c42;
      transition: all 0.2s;
    }
    .lf-social-btn:hover { border-color: #d99aa0; background: #fff8f9; }

    /* Divider */
    .lf-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }
    .lf-divider::before, .lf-divider::after { content:''; flex:1; height:1px; background:#f0eae8; }
    .lf-divider span { font-size: 0.72rem; color: #c0b0aa; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }

    /* Field */
    .lf-field { margin-bottom: 14px; }
    .lf-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 600;
      color: #9e8e82;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-bottom: 5px;
    }
    .lf-input-wrap { position: relative; }
    .lf-input {
      width: 100%;
      height: 48px;
      padding: 0 44px 0 14px;
      border: 1.5px solid #e8ddd9;
      border-radius: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      color: #1a1208;
      background: #faf8f7;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }
    .lf-input:focus { border-color: #d99aa0; background: #fff; box-shadow: 0 0 0 3px rgba(217,154,160,0.14); }
    .lf-input.err   { border-color: #c4626e; box-shadow: 0 0 0 3px rgba(196,98,110,0.12); }
    .lf-input::placeholder { color: #c0b0aa; }
    .lf-input-icon {
      position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
      color: #c0b0aa; pointer-events: none;
    }
    .lf-toggle-pw {
      position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: #c0b0aa; display: flex; align-items: center;
      transition: color 0.2s;
    }
    .lf-toggle-pw:hover { color: #c4626e; }
    .lf-field-err {
      font-size: 0.71rem; color: #c4626e; margin-top: 4px;
      display: none; font-family: 'DM Sans', sans-serif;
    }
    .lf-field-err.show { display: block; }

    /* 2 cols */
    .lf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    /* Check row */
    .lf-check-row {
      display: flex; align-items: flex-start; gap: 9px;
      margin-bottom: 18px; font-size: 0.78rem; color: #9e8e82; line-height: 1.5;
    }
    .lf-check-row input[type="checkbox"] { width:16px; height:16px; accent-color:#c4626e; margin-top:2px; }
    .lf-check-row a { color: #c4626e; text-decoration: underline; }
    .lf-spacer { flex: 1; }
    .lf-forgot { font-size: 0.78rem; color: #c4626e; cursor: pointer; }
    .lf-forgot:hover { text-decoration: underline; }

    /* Submit */
    .lf-submit {
      width: 100%;
      height: 50px;
      background: linear-gradient(135deg, #c4626e 0%, #d99aa0 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      transition: all 0.25s;
      box-shadow: 0 6px 20px rgba(196,98,110,0.32);
      position: relative; overflow: hidden;
    }
    .lf-submit:hover { background: linear-gradient(135deg, #b55562, #ca8891); transform: translateY(-1px); box-shadow: 0 10px 28px rgba(196,98,110,0.42); }
    .lf-submit:disabled { opacity: 0.65; transform: none; }
    .lf-submit .spinner {
      display: none; width:18px; height:18px;
      border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto;
    }
    .lf-submit.loading .btn-label { display: none; }
    .lf-submit.loading .spinner { display: block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Switch */
    .lf-switch {
      text-align: center; margin-top: 18px;
      font-size: 0.82rem; color: #9e8e82;
    }
    .lf-switch a { color: #c4626e; font-weight: 600; cursor: pointer; }
    .lf-switch a:hover { text-decoration: underline; }

    /* Benefits (register) */
    .lf-benefits { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
    .lf-benefit {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.72rem; color: #5c4c42;
      background: #faf8f7; border: 1px solid #f0eae8;
      border-radius: 20px; padding: 4px 10px;
    }

    /* PW strength */
    .pw-str { margin-top:6px; display:none; }
    .pw-str.show { display:block; }
    .pw-str-bar { height:3px; border-radius:2px; background:#f0eae8; overflow:hidden; margin-bottom:3px; }
    .pw-str-fill { height:100%; border-radius:2px; transition: width 0.3s, background 0.3s; width:0; }
    .pw-str-label { font-size:0.68rem; color:#9e8e82; }

    /* Footer link */
    .login-form-footer {
      padding: 20px 44px;
      border-top: 1px solid #f0eae8;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .login-form-footer a { font-size: 0.8rem; color: #9e8e82; transition: color 0.2s; }
    .login-form-footer a:hover { color: #c4626e; }

    /* Role badge (hiện sau login) */
    .role-redirect {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 0;
      gap: 16px;
    }
    .role-redirect.show { display: flex; }
    .role-avatar { font-size: 3.5rem; }
    .role-title { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; color: #1a1208; }
    .role-msg { font-size: 0.88rem; color: #9e8e82; }
    .role-redirect-btn {
      margin-top: 8px;
      padding: 12px 32px;
      background: linear-gradient(135deg, #c4626e, #d99aa0);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(196,98,110,0.3);
      transition: all 0.2s;
    }
    .role-redirect-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(196,98,110,0.4); }

    /* Responsive */
    @media (max-width: 860px) {
      .login-page { grid-template-columns: 1fr; }
      .login-brand { display: none; }
      .login-form-inner { padding: 32px 24px; }
      .login-form-footer { padding: 16px 24px; }
    }
  </style>
</head>
<body>

<div class="login-page">

  <div class="login-brand">
    <div class="brand-logo"><a href="index.jsp">LACTT</a></div>

    <div class="brand-middle">
      <h1 class="brand-tagline">Chào mừng<br/>trở lại<br/><em>LACTT</em></h1>
      <p class="brand-desc">Hệ thống mỹ phẩm chính hãng hàng đầu Việt Nam. Hơn 200 thương hiệu quốc tế, 3.500+ sản phẩm.</p>
    </div>

    <div class="brand-features">
      <div class="brand-feat"><div class="brand-feat-icon">🏆</div><span>Hàng chính hãng 100% có kiểm định</span></div>
      <div class="brand-feat"><div class="brand-feat-icon">🚚</div><span>Giao hàng nhanh 2H tại Hà Nội &amp; TP.HCM</span></div>
      <div class="brand-feat"><div class="brand-feat-icon">💎</div><span>Tích điểm thưởng, đổi quà hấp dẫn</span></div>
      <div class="brand-feat"><div class="brand-feat-icon">🔒</div><span>Thanh toán bảo mật 256-bit SSL</span></div>
    </div>
  </div>

  <div class="login-form-panel">
    <div class="login-form-inner">

      <div class="lf-tabs">
  <button class="lf-tab active" id="tabLogin">Đăng nhập</button>
  <button class="lf-tab" id="tabSdt">Số điện thoại</button>
  <button class="lf-tab" id="tabRegister">Đăng ký mới</button>
</div>

      <div class="lf-alert" id="lfAlert">
        <span id="lfAlertIcon">ℹ</span>
        <span id="lfAlertMsg"></span>
      </div>

      <div class="role-redirect" id="roleRedirect">
        <div class="role-avatar" id="rdAvatar">👤</div>
        <div class="role-title" id="rdTitle">Đăng nhập thành công!</div>
        <div class="role-msg" id="rdMsg">Đang chuyển hướng...</div>
        <button class="role-redirect-btn" id="rdBtn">Đi ngay →</button>
      </div>

      <div class="lf-panel active" id="panelLogin">

        <div class="demo-box">
          <div class="demo-box-title">🔑 Gợi ý tài khoản DB (cần INSERT trước)</div>
          <div class="demo-accounts">
            <div class="demo-acc" data-email="mai@gmail.com" data-pw="Khach@123">
              <span class="demo-icon">👩</span>
              <div class="demo-info">
                <span class="demo-role">Khách hàng</span>
                <span class="demo-cred">mai@gmail.com / Khach@123</span>
              </div>
              <button class="demo-fill">Điền</button>
            </div>
            <div class="demo-acc" data-email="admin@lactt.vn" data-pw="Admin@123">
              <span class="demo-icon">👨‍💼</span>
              <div class="demo-info">
                <span class="demo-role">Admin</span>
                <span class="demo-cred">admin@lactt.vn / Admin@123</span>
              </div>
              <button class="demo-fill">Điền</button>
            </div>
            <div class="demo-acc" data-email="kho01@lactt.vn" data-pw="Kho@123">
              <span class="demo-icon">📦</span>
              <div class="demo-info">
                <span class="demo-role">Nhân viên kho</span>
                <span class="demo-cred">kho01@lactt.vn / Kho@123</span>
              </div>
              <button class="demo-fill">Điền</button>
            </div>
          </div>
        </div>

        <div class="lf-field">
          <label class="lf-label" for="loginEmail">Email</label>
          <div class="lf-input-wrap">
            <input type="email" class="lf-input" id="loginEmail" placeholder="email@gmail.com" autocomplete="email"/>
            <span class="lf-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
          </div>
          <div class="lf-field-err" id="err-loginEmail">Email không hợp lệ</div>
        </div>

        <div class="lf-field">
          <label class="lf-label" for="loginPw">Mật khẩu</label>
          <div class="lf-input-wrap">
            <input type="password" class="lf-input" id="loginPw" placeholder="Nhập mật khẩu..." autocomplete="current-password"/>
            <button class="lf-toggle-pw" type="button" data-target="loginPw">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="lf-field-err" id="err-loginPw">Mật khẩu tối thiểu 6 ký tự</div>
        </div>

        <div class="lf-check-row">
          <input type="checkbox" id="rememberMe"/>
          <label for="rememberMe">Ghi nhớ đăng nhập</label>
          <span class="lf-spacer"></span>
          <a class="lf-forgot" id="forgotLink">Quên mật khẩu?</a>
        </div>

        <button class="lf-submit" id="btnLogin">
          <span class="btn-label">Đăng nhập</span>
          <div class="spinner"></div>
        </button>

        <div class="lf-switch">Chưa có tài khoản? <a id="sw2register">Đăng ký ngay — miễn phí</a></div>
      </div>
        <div class="lf-panel" id="panelSdt">
  <div class="lf-field">
    <label class="lf-label" for="sdtInput">Số điện thoại</label>
    <div class="lf-input-wrap">
      <input type="tel" class="lf-input" id="sdtInput" placeholder="0901 234 567" autocomplete="tel"/>
    </div>
    <div class="lf-field-err" id="err-sdtInput">Số điện thoại không hợp lệ</div>
  </div>

  <button class="lf-submit" id="btnLoginSdt">
    <span class="btn-label">Đăng nhập</span>
    <div class="spinner"></div>
  </button>

  <div class="lf-switch">
    Muốn đăng nhập bằng email? <a id="swSdt2login">Đăng nhập email</a>
  </div>
</div>
      <div class="lf-panel" id="panelRegister">
        <div class="lf-benefits">
          <span class="lf-benefit">🎁 Ưu đãi thành viên</span>
          <span class="lf-benefit">📦 Theo dõi đơn hàng</span>
          <span class="lf-benefit">⚡ Thanh toán nhanh</span>
          <span class="lf-benefit">💎 Tích điểm đổi quà</span>
        </div>

        <div class="lf-row">
          <div class="lf-field">
            <label class="lf-label" for="regFirst">Họ <span style="color:#c4626e">*</span></label>
            <div class="lf-input-wrap"><input type="text" class="lf-input" id="regFirst" placeholder="Nguyễn" autocomplete="given-name"/></div>
            <div class="lf-field-err" id="err-regFirst">Vui lòng nhập họ</div>
          </div>
          <div class="lf-field">
            <label class="lf-label" for="regLast">Tên <span style="color:#c4626e">*</span></label>
            <div class="lf-input-wrap"><input type="text" class="lf-input" id="regLast" placeholder="Thị Lan" autocomplete="family-name"/></div>
            <div class="lf-field-err" id="err-regLast">Vui lòng nhập tên</div>
          </div>
        </div>

        <div class="lf-field">
          <label class="lf-label" for="regPhone">Số điện thoại <span style="color:#c4626e">*</span></label>
          <div class="lf-input-wrap">
            <input type="tel" class="lf-input" id="regPhone" placeholder="0901 234 567" autocomplete="tel"/>
            <span class="lf-input-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l1-1a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
          </div>
          <div class="lf-field-err" id="err-regPhone">Số điện thoại không hợp lệ</div>
        </div>

        <div class="lf-field">
          <label class="lf-label" for="regEmail">Email <span style="color:#c4626e">*</span></label>
          <div class="lf-input-wrap">
            <input type="email" class="lf-input" id="regEmail" placeholder="email@gmail.com" autocomplete="email"/>
            <span class="lf-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
          </div>
          <div class="lf-field-err" id="err-regEmail">Email không hợp lệ</div>
        </div>

        <div class="lf-field">
          <label class="lf-label" for="regPw">Mật khẩu <span style="color:#c4626e">*</span></label>
          <div class="lf-input-wrap">
            <input type="password" class="lf-input" id="regPw" placeholder="Tối thiểu 8 ký tự" autocomplete="new-password"/>
            <button class="lf-toggle-pw" type="button" data-target="regPw">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="pw-str" id="pwStr">
            <div class="pw-str-bar"><div class="pw-str-fill" id="pwStrFill"></div></div>
            <span class="pw-str-label" id="pwStrLabel"></span>
          </div>
          <div class="lf-field-err" id="err-regPw">Mật khẩu tối thiểu 8 ký tự</div>
        </div>

        <div class="lf-field">
          <label class="lf-label" for="regPwC">Xác nhận mật khẩu <span style="color:#c4626e">*</span></label>
          <div class="lf-input-wrap">
            <input type="password" class="lf-input" id="regPwC" placeholder="Nhập lại mật khẩu..." autocomplete="new-password"/>
            <button class="lf-toggle-pw" type="button" data-target="regPwC">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="lf-field-err" id="err-regPwC">Mật khẩu không khớp</div>
        </div>

        <div class="lf-check-row">
          <input type="checkbox" id="agreeTerms"/>
          <label for="agreeTerms">Tôi đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a> của LACTT</label>
        </div>

        <button class="lf-submit" id="btnRegister">
          <span class="btn-label">Tạo tài khoản</span>
          <div class="spinner"></div>
        </button>

        <div class="lf-switch">Đã có tài khoản? <a id="sw2login">Đăng nhập ngay</a></div>
      </div>

    </div>

    <div class="login-form-footer">
      <a href="index.jsp">← Về trang chủ</a>
      <a href="#">Chính sách bảo mật</a>
    </div>
  </div>

</div>

<script>
/* Khai báo hàm MD5 TOÀN CỤC để đảm bảo nó luôn tồn tại */
function _md5(str) {
  function safeAdd(x, y) { const lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); }
  function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
  function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a,b,c,d,x,s,t){ return md5cmn((b&c)|((~b)&d),a,b,x,s,t); }
  function md5gg(a,b,c,d,x,s,t){ return md5cmn((b&d)|(c&(~d)),a,b,x,s,t); }
  function md5hh(a,b,c,d,x,s,t){ return md5cmn(b^c^d,a,b,x,s,t); }
  function md5ii(a,b,c,d,x,s,t){ return md5cmn(c^(b|(~d)),a,b,x,s,t); }
  const str8 = unescape(encodeURIComponent(str)); const x = [];
  for (let i = 0; i < str8.length; i++) x[i >> 2] |= str8.charCodeAt(i) << ((i % 4) * 8);
  x[str8.length >> 2] |= 0x80 << ((str8.length % 4) * 8); x[(((str8.length + 8) >> 6) << 4) + 14] = str8.length * 8;
  let [a, b, c, d] = [1732584193, -271733879, -1732584194, 271733878];
  for (let i = 0; i < x.length; i += 16) {
    const [oa, ob, oc, od] = [a, b, c, d];
    a=md5ff(a,b,c,d,x[i+ 0], 7,-680876936);  d=md5ff(d,a,b,c,x[i+ 1],12,-389564586); c=md5ff(c,d,a,b,x[i+ 2],17, 606105819);  b=md5ff(b,c,d,a,x[i+ 3],22,-1044525330);
    a=md5ff(a,b,c,d,x[i+ 4], 7,-176418897);  d=md5ff(d,a,b,c,x[i+ 5],12, 1200080426); c=md5ff(c,d,a,b,x[i+ 6],17,-1473231341); b=md5ff(b,c,d,a,x[i+ 7],22,-45705983);
    a=md5ff(a,b,c,d,x[i+ 8], 7, 1770035416); d=md5ff(d,a,b,c,x[i+ 9],12,-1958414417); c=md5ff(c,d,a,b,x[i+10],17,-42063);       b=md5ff(b,c,d,a,x[i+11],22,-1990404162);
    a=md5ff(a,b,c,d,x[i+12], 7, 1804603682); d=md5ff(d,a,b,c,x[i+13],12,-40341101);  c=md5ff(c,d,a,b,x[i+14],17,-1502002290); b=md5ff(b,c,d,a,x[i+15],22, 1236535329);
    a=md5gg(a,b,c,d,x[i+ 1], 5,-165796510);  d=md5gg(d,a,b,c,x[i+ 6], 9,-1069501632); c=md5gg(c,d,a,b,x[i+11],14, 643717713);  b=md5gg(b,c,d,a,x[i+ 0],20,-373897302);
    a=md5gg(a,b,c,d,x[i+ 5], 5,-701558691);  d=md5gg(d,a,b,c,x[i+10], 9, 38016083);   c=md5gg(c,d,a,b,x[i+15],14,-660478335);  b=md5gg(b,c,d,a,x[i+ 4],20,-405537848);
    a=md5gg(a,b,c,d,x[i+ 9], 5, 568446438);  d=md5gg(d,a,b,c,x[i+14], 9,-1019803690); c=md5gg(c,d,a,b,x[i+ 3],14,-187363961);  b=md5gg(b,c,d,a,x[i+ 8],20, 1163531501);
    a=md5gg(a,b,c,d,x[i+13], 5,-1444681467); d=md5gg(d,a,b,c,x[i+ 2], 9,-51403784);   c=md5gg(c,d,a,b,x[i+ 7],14, 1735328473); b=md5gg(b,c,d,a,x[i+12],20,-1926607734);
    a=md5hh(a,b,c,d,x[i+ 5], 4,-378558);     d=md5hh(d,a,b,c,x[i+ 8],11,-2022574463); c=md5hh(c,d,a,b,x[i+11],16, 1839030562); b=md5hh(b,c,d,a,x[i+14],23,-35309556);
    a=md5hh(a,b,c,d,x[i+ 1], 4,-1530992060); d=md5hh(d,a,b,c,x[i+ 4],11, 1272893353); c=md5hh(c,d,a,b,x[i+ 7],16,-155497632);  b=md5hh(b,c,d,a,x[i+10],23,-1094730640);
    a=md5hh(a,b,c,d,x[i+13], 4, 681279174);  d=md5hh(d,a,b,c,x[i+ 0],11,-358537222);  c=md5hh(c,d,a,b,x[i+ 3],16,-722521979);  b=md5hh(b,c,d,a,x[i+ 6],23, 76029189);
    a=md5hh(a,b,c,d,x[i+ 9], 4,-640364487);  d=md5hh(d,a,b,c,x[i+12],11,-421815835);  c=md5hh(c,d,a,b,x[i+15],16, 530742520);  b=md5hh(b,c,d,a,x[i+ 2],23,-995338651);
    a=md5ii(a,b,c,d,x[i+ 0], 6,-198630844);  d=md5ii(d,a,b,c,x[i+ 7],10, 1126891415);  c=md5ii(c,d,a,b,x[i+14],15,-1416354905); b=md5ii(b,c,d,a,x[i+ 5],21,-57434055);
    a=md5ii(a,b,c,d,x[i+12], 6, 1700485571); d=md5ii(d,a,b,c,x[i+ 3],10,-1894986606); c=md5ii(c,d,a,b,x[i+10],15,-1051523);    b=md5ii(b,c,d,a,x[i+ 1],21,-2054922799);
    a=md5ii(a,b,c,d,x[i+ 8], 6, 1873313359); d=md5ii(d,a,b,c,x[i+15],10,-30611744);   c=md5ii(c,d,a,b,x[i+ 6],15,-1560198380); b=md5ii(b,c,d,a,x[i+13],21, 1309151649);
    a=md5ii(a,b,c,d,x[i+ 4], 6,-145523070);  d=md5ii(d,a,b,c,x[i+11],10,-1120210379); c=md5ii(c,d,a,b,x[i+ 2],15, 718787259);   b=md5ii(b,c,d,a,x[i+ 9],21,-343485551);
    a=safeAdd(a,oa); b=safeAdd(b,ob); c=safeAdd(c,oc); d=safeAdd(d,od);
  }
  return [a, b, c, d].map(n => (n < 0 ? n + 0x100000000 : n).toString(16).padStart(8, '0').match(/../g).reverse().join('')).join('');
}

document.addEventListener('DOMContentLoaded', function() {
  var ROLE_NAME = { khach_hang: 'Khách hàng', admin: 'Quản trị viên', nhan_vien_kho: 'Nhân viên kho' };
  var ROLE_AVATAR = { khach_hang: '👤', admin: '👨‍💼', nhan_vien_kho: '📦' };

  var urlParams  = new URLSearchParams(window.location.search);
  var redirectTo = urlParams.get('redirect') || null;

  function $(id) { return document.getElementById(id); }

  function alert_(type, msg) {
    var el = $('lfAlert');
    if(!el) return;
    el.className = 'lf-alert show ' + type;
    $('lfAlertIcon').textContent = type==='success' ? '✓' : type==='error' ? '✕' : 'ℹ';
    $('lfAlertMsg').textContent  = msg;
  }
  function clearAlert() { var el = $('lfAlert'); if(el) el.className = 'lf-alert'; }

  function setErr(id, msg, show) {
    var el = $(id);
    if (!el) return !show;
    el.classList.toggle('show', !!show);
    if (msg && show) el.textContent = msg;
    return !show;
  }

  function switchTab(tab) {
  clearAlert();

  $('tabLogin').classList.toggle('active', tab === 'login');
  $('tabSdt').classList.toggle('active', tab === 'sdt');
  $('tabRegister').classList.toggle('active', tab === 'register');

  $('panelLogin').classList.toggle('active', tab === 'login');
  $('panelSdt').classList.toggle('active', tab === 'sdt');
  $('panelRegister').classList.toggle('active', tab === 'register');
}
  $('tabLogin')?.addEventListener('click', function() { switchTab('login'); });
  $('tabRegister')?.addEventListener('click', function() { switchTab('register'); });
  $('sw2register')?.addEventListener('click', function() { switchTab('register'); });
  $('sw2login')?.addEventListener('click', function() { switchTab('login'); });
  $('tabSdt')?.addEventListener('click', function() { switchTab('sdt'); });
$('swSdt2login')?.addEventListener('click', function() { switchTab('login'); });
  document.querySelectorAll('.lf-toggle-pw').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var inp = $(btn.dataset.target);
      if (inp) inp.type = inp.type==='password' ? 'text' : 'password';
    });
  });

  var regPwInput = $('regPw');
  if (regPwInput) {
    regPwInput.addEventListener('input', function() {
      var v = this.value;
      var fill = $('pwStrFill'), label = $('pwStrLabel'), wrap = $('pwStr');
      if (!v) { wrap.classList.remove('show'); return; }
      wrap.classList.add('show');
      var score = 0;
      if (v.length>=8) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      var levels = [
        {w:'25%',bg:'#e74c3c',l:'Rất yếu'},
        {w:'50%',bg:'#e67e22',l:'Yếu'},
        {w:'75%',bg:'#f1c40f',l:'Trung bình'},
        {w:'100%',bg:'#27ae60',l:'Mạnh'},
      ];
      var lv = levels[score-1]||levels[0];
      fill.style.width = lv.w; fill.style.background = lv.bg;
      label.textContent = lv.l; label.style.color = lv.bg;
    });
  }

  $('forgotLink')?.addEventListener('click', function() {
    var email = ($('loginEmail').value||'').trim();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert_('error', 'Vui lòng nhập đúng email vào ô trống phía trên trước khi chọn quên mật khẩu.');
      return;
    }

    // Gọi API xuống Servlet để thực hiện update DB thật
    fetch('DangNhapServlet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=resetPassword&email=' + encodeURIComponent(email)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert_('success', data.message); 
        // Hỗ trợ tự động điền luôn mật khẩu mới để test cho lẹ
        $('loginPw').value = '123456'; 
      } else {
        alert_('error', data.message);
      }
    })
    .catch(err => {
      alert_('error', 'Lỗi kết nối máy chủ.');
    });
  });

  document.querySelectorAll('.demo-acc').forEach(function(row) {
    row.querySelector('.demo-fill').addEventListener('click', function() {
      $('loginEmail').value = row.dataset.email;
      $('loginPw').value    = row.dataset.pw;
    });
  });

  /* ══ API: LOGIN ══ */
  function doLogin() {
    clearAlert();
    var email = ($('loginEmail').value||'').trim().toLowerCase();
    var pw    = ($('loginPw').value||'');
    var ok = true;
    ok = setErr('err-loginEmail', null, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
    ok = setErr('err-loginPw',    null, pw.length<6) && ok;
    if (!ok) return;

    var btn = $('btnLogin');
    btn.classList.add('loading'); btn.disabled = true;

    fetch('DangNhapServlet', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=login&email=' + encodeURIComponent(email) + '&matKhau=' + encodeURIComponent(pw)
    })
    .then(res => res.json())
    .then(data => {
      btn.classList.remove('loading'); btn.disabled = false;
      if (data.success) {
        var parts = (data.hoTen || '').trim().split(' ');
        var userObj = {
          email: data.email,
          vaiTro: data.vaiTro,
          hoTen: data.hoTen,
          firstName: parts[0] || 'Thành viên',
          avatar: ROLE_AVATAR[data.vaiTro] || '👤',
          maNguoiDung: data.maNguoiDung
        };
        loginSuccess(userObj, data.redirect);
      } else {
        alert_('error', data.message || 'Đăng nhập thất bại.');
      }
    })
    .catch(err => {
      btn.classList.remove('loading'); btn.disabled = false;
      alert_('error', 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
    });
  }

  $('btnLogin')?.addEventListener('click', doLogin);
  ['loginEmail','loginPw'].forEach(function(id) {
    $(id)?.addEventListener('keydown', function(e) { if (e.key==='Enter') doLogin(); });
  });
  
  
  /* ══ API: LOGIN BẰNG SỐ ĐIỆN THOẠI ══ */
function doLoginSdt() {
  clearAlert();

  var sdt = ($('sdtInput').value || '').replace(/\s/g, '');
  var ok = setErr('err-sdtInput', null, !/^0[3-9]\d{8}$/.test(sdt));
  if (!ok) return;

  var btn = $('btnLoginSdt');
  btn.classList.add('loading');
  btn.disabled = true;

  fetch('DangNhapServlet', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'action=loginSdt&soDienThoai=' + encodeURIComponent(sdt)
  })
  .then(res => res.json())
  .then(data => {
    btn.classList.remove('loading');
    btn.disabled = false;

    if (data.success) {
      var parts = (data.hoTen || '').trim().split(' ');

      var userObj = {
        email: data.email,
        vaiTro: data.vaiTro,
        hoTen: data.hoTen,
        firstName: parts[0] || 'Thành viên',
        avatar: ROLE_AVATAR[data.vaiTro] || '👤',
        maNguoiDung: data.maNguoiDung,
        phone: data.soDienThoai || sdt
      };

      loginSuccess(userObj, data.redirect);
    } else {
      alert_('error', data.message || 'Đăng nhập thất bại.');
    }
  })
  .catch(err => {
    btn.classList.remove('loading');
    btn.disabled = false;
    alert_('error', 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
  });
}

$('btnLoginSdt')?.addEventListener('click', doLoginSdt);

$('sdtInput')?.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    doLoginSdt();
  }
});

  /* ══ API: REGISTER ══ */
  $('btnRegister')?.addEventListener('click', function() {
    clearAlert();
    var first = ($('regFirst').value||'').trim();
    var last  = ($('regLast').value||'').trim();
    var phone = ($('regPhone').value||'').replace(/\s/g,'');
    var email = ($('regEmail').value||'').trim().toLowerCase();
    var pw    = ($('regPw').value||'');
    var pwc   = ($('regPwC').value||'');
    var terms = $('agreeTerms').checked;

    var ok = true;
    ok = setErr('err-regFirst', null, first.length===0) && ok;
    ok = setErr('err-regLast',  null, last.length===0)  && ok;
    ok = setErr('err-regPhone', null, !/^0[3-9]\d{8}$/.test(phone)) && ok;
    ok = setErr('err-regEmail', null, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
    ok = setErr('err-regPw',    null, pw.length<8) && ok;
    ok = setErr('err-regPwC',   'Mật khẩu không khớp', pw!==pwc) && ok;
    if (!terms) { alert_('error','Vui lòng đồng ý với Điều khoản dịch vụ.'); return; }
    if (!ok) return;

    var btn = $('btnRegister');
    btn.classList.add('loading'); btn.disabled = true;

    fetch('DangNhapServlet', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=register&hoTen=' + encodeURIComponent(first + ' ' + last) +
            '&email=' + encodeURIComponent(email) +
            '&soDienThoai=' + encodeURIComponent(phone) +
            '&matKhau=' + encodeURIComponent(pw)
    })
    .then(res => res.json())
    .then(data => {
      btn.classList.remove('loading'); btn.disabled = false;
      if (data.success) {
        alert_('success', 'Đăng ký thành công! Đang chuyển sang đăng nhập...');
        $('loginEmail').value = email;
        $('loginPw').value = pw;
        setTimeout(function() { switchTab('login'); }, 1500);
      } else {
        alert_('error', data.message || 'Đăng ký thất bại.');
      }
    })
    .catch(err => {
      btn.classList.remove('loading'); btn.disabled = false;
      alert_('error', 'Lỗi kết nối máy chủ.');
    });
  });

  /* ══ LOGIN SUCCESS — xử lý UI và chuyển hướng ══ */
  function loginSuccess(user, servletRedirect) {
    localStorage.setItem('lactt_user', JSON.stringify(user));
    var roleName = ROLE_NAME[user.vaiTro] || 'Thành viên';
    var dest = redirectTo || servletRedirect || 'index.jsp';

    $('panelLogin').classList.remove('active');
$('panelSdt').classList.remove('active');
$('panelRegister').classList.remove('active');
    var rd = $('roleRedirect');
    $('rdAvatar').textContent  = user.avatar || '👤';
    $('rdTitle').textContent   = 'Chào ' + user.firstName + '!';
    $('rdMsg').textContent     = 'Bạn đang đăng nhập với vai trò: ' + roleName + '. Đang chuyển hướng...';
    $('rdBtn').textContent     = 'Đi ngay →';
    $('rdBtn').onclick         = function() { window.location.href = dest; };
    rd.classList.add('show');

    setTimeout(function() { window.location.href = dest; }, 1800);
  }

  /* ── KẺ HỦY DIỆT VÒNG LẶP: ĐỒNG BỘ SESSION TỪ SERVER ── */
  fetch('DangNhapServlet', { method: 'GET', credentials: 'same-origin' })
    .then(res => res.json())
    .then(data => {
      if (data.dangNhap) {
        var destMap = { 'admin': 'admin.jsp', 'nhan_vien_kho': 'nhanvienkho.jsp' };
        var dest = redirectTo || destMap[data.vaiTro] || 'index.jsp';
        window.location.replace(dest);
      } else {
        localStorage.removeItem('lactt_user'); // Xóa localStorage để JS không chuyển hướng bậy
      }
    }).catch(() => {
        localStorage.removeItem('lactt_user');
    });
});
</script>
</body>
</html>