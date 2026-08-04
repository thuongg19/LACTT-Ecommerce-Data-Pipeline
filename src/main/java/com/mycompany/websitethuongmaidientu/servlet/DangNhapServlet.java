package com.mycompany.websitethuongmaidientu.servlet;

import com.mycompany.websitethuongmaidientu.dao.TaiKhoanDAO;
import com.mycompany.websitethuongmaidientu.model.TaiKhoan;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@WebServlet("/DangNhapServlet")
public class DangNhapServlet extends HttpServlet {

    private final TaiKhoanDAO taiKhoanDAO = new TaiKhoanDAO();

    // =========================================================
    // HASH MD5
    // =========================================================
    private String hashMD5(String input) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("MD5");
            byte[] bytes = messageDigest.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", Byte.valueOf(b)));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Không thể tạo thuật toán MD5", e);
        }
    }

    // =========================================================
    // ESCAPE JSON STRING
    // =========================================================
    private String escJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    // =========================================================
    // doPost — xử lý: login / register / logout / resetPassword
    // =========================================================
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");

        if ("login".equals(action)) {
    doLogin(request, response, out);
} else if ("loginSdt".equals(action)) {
    doLoginSdt(request, response, out);
        } else if ("register".equals(action)) {
            doRegister(request, response, out);
        } else if ("logout".equals(action)) {
            doLogout(request, response, out);
        } else if ("resetPassword".equals(action)) { // ---> MỚI THÊM: Nhánh xử lý quên mật khẩu
            doResetPassword(request, response, out);
        } else {
            out.print("{\"success\":false,\"message\":\"Action không hợp lệ\"}");
        }
    }

    // =========================================================
    // doGet — kiểm tra trạng thái session (dùng cho _syncSession)
    // =========================================================
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        TaiKhoan tk = (session != null) ? (TaiKhoan) session.getAttribute("taiKhoan") : null;

        if (tk != null) {
            // ---- FIX Lỗi 5: trả về đủ trường bao gồm soDienThoai ----
            out.print(
                "{\"dangNhap\":true"
                + ",\"hoTen\":\""       + escJson(tk.getHoTen())       + "\""
                + ",\"email\":\""       + escJson(tk.getEmail())       + "\""
                + ",\"vaiTro\":\""      + escJson(tk.getVaiTro())      + "\""
                + ",\"maNguoiDung\":"   + tk.getId()
                + ",\"soDienThoai\":\"" + escJson(tk.getSoDienThoai()) + "\""
                + ",\"diemThuong\":0"   // mở rộng sau nếu có ViDiemDAO
                + "}"
            );
        } else {
            out.print("{\"dangNhap\":false}");
        }
    }

    // =========================================================
    // ĐĂNG NHẬP
    // =========================================================
    private void doLogin(HttpServletRequest request, HttpServletResponse response, PrintWriter out)
            throws IOException {

        String email    = request.getParameter("email");
        String matKhau  = request.getParameter("matKhau");

        if (email == null || email.trim().isEmpty()
                || matKhau == null || matKhau.trim().isEmpty()) {
            out.print("{\"success\":false,\"message\":\"Vui lòng nhập đầy đủ thông tin\"}");
            return;
        }

        email = email.trim().toLowerCase();

        // Tìm tài khoản theo email
        TaiKhoan taiKhoan = taiKhoanDAO.findByEmail(email);

        if (taiKhoan == null) {
            out.print("{\"success\":false,\"message\":\"Tài khoản hoặc mật khẩu không chính xác\"}");
            return;
        }

        // So sánh mật khẩu (server tự hash MD5 rồi compare)
        String hashedMatKhau = hashMD5(matKhau);
        if (!hashedMatKhau.equalsIgnoreCase(taiKhoan.getMatKhau())) {
            out.print("{\"success\":false,\"message\":\"Tài khoản hoặc mật khẩu không chính xác\"}");
            return;
        }

        // Kiểm tra tài khoản có bị khoá không
        if (taiKhoan.getIsActive() != 1) {
            out.print("{\"success\":false,\"message\":\"Tài khoản đang bị khoá. Vui lòng liên hệ hỗ trợ\"}");
            return;
        }

        // Tạo session
        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(30 * 60); // 30 phút
        session.setAttribute("taiKhoan",     taiKhoan);
        session.setAttribute("maNguoiDung",  taiKhoan.getId());
        session.setAttribute("hoTen",        taiKhoan.getHoTen());
        session.setAttribute("email",        taiKhoan.getEmail());
        session.setAttribute("vaiTro",       taiKhoan.getVaiTro());

        // Xác định trang chuyển hướng theo vai trò
        String redirectUrl;
        switch (taiKhoan.getVaiTro().hashCode()) {
            case -1:  // phòng cho switch string Java < 7
            default:
                if ("admin".equals(taiKhoan.getVaiTro())) {
                    redirectUrl = "admin.jsp";
                } else if ("nhan_vien_kho".equals(taiKhoan.getVaiTro())) {
                    redirectUrl = "nhanvienkho.jsp";
                } else {
                    redirectUrl = "index.jsp";
                }
        }

        out.print(
            "{\"success\":true"
            + ",\"message\":\"Đăng nhập thành công\""
            + ",\"hoTen\":\""       + escJson(taiKhoan.getHoTen())       + "\""
            + ",\"email\":\""       + escJson(taiKhoan.getEmail())       + "\""
            + ",\"vaiTro\":\""      + escJson(taiKhoan.getVaiTro())      + "\""
            + ",\"maNguoiDung\":"   + taiKhoan.getId()
            + ",\"soDienThoai\":\"" + escJson(taiKhoan.getSoDienThoai()) + "\""
            + ",\"diemThuong\":0"
            + ",\"redirect\":\""   + escJson(redirectUrl)               + "\""
            + "}"
        );
    }

    // =========================================================
    // ĐĂNG KÝ
    // =========================================================
    private void doRegister(HttpServletRequest request, HttpServletResponse response, PrintWriter out)
            throws IOException {

        String hoTen       = request.getParameter("hoTen");
        String email       = request.getParameter("email");
        String soDienThoai = request.getParameter("soDienThoai");
        String matKhau     = request.getParameter("matKhau");

        if (hoTen == null || hoTen.trim().isEmpty()
                || email == null || email.trim().isEmpty()
                || soDienThoai == null || soDienThoai.trim().isEmpty()
                || matKhau == null || matKhau.length() < 8) {
            out.print("{\"success\":false,\"message\":\"Thông tin không hợp lệ\"}");
            return;
        }

        email = email.trim().toLowerCase();

        // Kiểm tra email đã tồn tại chưa
        if (taiKhoanDAO.emailTonTai(email)) {
            out.print("{\"success\":false,\"message\":\"Email này đã được đăng ký\"}");
            return;
        }

        // Tạo đối tượng TaiKhoan mới
        TaiKhoan taiKhoan = new TaiKhoan();
        taiKhoan.setHoTen(hoTen.trim());
        taiKhoan.setEmail(email);
        taiKhoan.setSoDienThoai(soDienThoai.trim());
        taiKhoan.setMatKhau(hashMD5(matKhau));  // hash trước khi lưu
        taiKhoan.setVaiTro("khach_hang");

        boolean ok = taiKhoanDAO.insert(taiKhoan);

        if (ok) {
            out.print("{\"success\":true,\"message\":\"Đăng ký thành công! Vui lòng đăng nhập\"}");
        } else {
            out.print("{\"success\":false,\"message\":\"Đăng ký thất bại, vui lòng thử lại\"}");
        }
    }

    // =========================================================
    // ĐĂNG XUẤT
    // =========================================================
    private void doLogout(HttpServletRequest request, HttpServletResponse response, PrintWriter out)
            throws IOException {

        // Huỷ session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.removeAttribute("cart");
            session.invalidate();
        }

        // Xoá cookie JSESSIONID
        Cookie jsessionCookie = new Cookie("JSESSIONID", "");
        jsessionCookie.setMaxAge(0);
        jsessionCookie.setPath(request.getContextPath() + "/");
        jsessionCookie.setHttpOnly(true);
        response.addCookie(jsessionCookie);

        // Header chống cache
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");

        out.print("{\"success\":true,\"message\":\"Đăng xuất thành công\"}");
    }

    // =========================================================
    // ---> MỚI THÊM: QUÊN MẬT KHẨU (RESET VỀ 123456)
    // =========================================================
    private void doResetPassword(HttpServletRequest request, HttpServletResponse response, PrintWriter out) {
        String email = request.getParameter("email");
        
        if (email == null || email.trim().isEmpty()) {
            out.print("{\"success\":false,\"message\":\"Vui lòng nhập email!\"}");
            return;
        }

        email = email.trim().toLowerCase();
        
        // Tìm tài khoản xem có tồn tại không
        TaiKhoan tk = taiKhoanDAO.findByEmail(email);
        if (tk == null) {
            out.print("{\"success\":false,\"message\":\"Email này chưa được đăng ký trong hệ thống!\"}");
            return;
        }

        // Gọi hàm resetPassword đã có sẵn trong DAO (đổi về MD5 của 123456)
        // Truyền adminId = 0 vì đây là user tự reset
        boolean ok = taiKhoanDAO.resetPassword(tk.getId(), 0);
        
        if (ok) {
            out.print("{\"success\":true,\"message\":\"Mật khẩu đã được reset về mặc định: 123456\"}");
        } else {
            out.print("{\"success\":false,\"message\":\"Có lỗi xảy ra khi cập nhật SQL, vui lòng thử lại!\"}");
        }
    }
private void doLoginSdt(HttpServletRequest request, HttpServletResponse response, PrintWriter out)
        throws IOException {
    String sdt = request.getParameter("soDienThoai");
    if (sdt == null || sdt.trim().isEmpty()) {
        out.print("{\"success\":false,\"message\":\"Vui lòng nhập số điện thoại\"}");
        return;
    }
    sdt = sdt.trim();

    TaiKhoan tk = taiKhoanDAO.findBySoDienThoai(sdt);
    if (tk == null) {
        out.print("{\"success\":false,\"message\":\"Số điện thoại chưa được đăng ký\"}");
        return;
    }
    if (tk.getIsActive() != 1) {
        out.print("{\"success\":false,\"message\":\"Tài khoản đang bị khóa\"}");
        return;
    }

    HttpSession session = request.getSession(true);
    session.setMaxInactiveInterval(30 * 60);
    session.setAttribute("taiKhoan",    tk);
    session.setAttribute("maNguoiDung", tk.getId());
    session.setAttribute("hoTen",       tk.getHoTen());
    session.setAttribute("email",       tk.getEmail());
    session.setAttribute("vaiTro",      tk.getVaiTro());

    out.print("{\"success\":true"
        + ",\"message\":\"Đăng nhập thành công\""
        + ",\"hoTen\":\"" + escJson(tk.getHoTen()) + "\""
        + ",\"maNguoiDung\":" + tk.getId()
        + ",\"vaiTro\":\"" + escJson(tk.getVaiTro()) + "\""
        + ",\"redirect\":\"index.jsp\""
        + "}");
}
}

