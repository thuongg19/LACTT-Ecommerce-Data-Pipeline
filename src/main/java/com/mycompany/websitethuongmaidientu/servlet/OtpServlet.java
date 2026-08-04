package com.mycompany.websitethuongmaidientu.servlet;

import com.mycompany.websitethuongmaidientu.dao.TaiKhoanDAO;
import com.mycompany.websitethuongmaidientu.model.TaiKhoan;
import com.mycompany.websitethuongmaidientu.util.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.Random;

@WebServlet("/OtpServlet")
public class OtpServlet extends HttpServlet {

    private final TaiKhoanDAO taiKhoanDAO = new TaiKhoanDAO();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json; charset=UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");

        if ("guiOtp".equals(action)) {
            xuLyGuiOtp(request, out);
        } else if ("xacThucOtp".equals(action)) {
            xuLyXacThuc(request, response, out);
        } else if ("checkSdt".equals(action)) {
            xuLyCheckSdt(request, response, out);
        } else {
            out.print("{\"success\":false,\"message\":\"Action không hợp lệ\"}");
        }
    }

    // =========================================================
    // CHECK SĐT — đã có tài khoản chưa?
    // Nếu có → đăng nhập luôn, không cần OTP
    // Nếu chưa → báo FE hiện bước nhập OTP
    // =========================================================
    private void xuLyCheckSdt(HttpServletRequest request,
                               HttpServletResponse response, PrintWriter out) {
        String sdt = request.getParameter("soDienThoai");
        if (sdt == null || sdt.trim().isEmpty()) {
            out.print("{\"success\":false,\"message\":\"Vui lòng nhập số điện thoại\"}");
            return;
        }
        sdt = sdt.trim();

        TaiKhoan tk = taiKhoanDAO.findBySoDienThoai(sdt);

        if (tk != null) {
            // Đã có tài khoản → đăng nhập luôn không cần OTP
            HttpSession session = request.getSession(true);
            session.setMaxInactiveInterval(30 * 60);
            session.setAttribute("taiKhoan",    tk);
            session.setAttribute("maNguoiDung", tk.getId());
            session.setAttribute("hoTen",       tk.getHoTen());
            session.setAttribute("vaiTro",      tk.getVaiTro());

            out.print("{\"success\":true"
                + ",\"daCoTaiKhoan\":true"
                + ",\"message\":\"Đăng nhập thành công\""
                + ",\"hoTen\":\"" + esc(tk.getHoTen()) + "\""
                + ",\"maNguoiDung\":" + tk.getId()
                + "}");
        } else {
            // Chưa có → báo FE hiện bước OTP
            out.print("{\"success\":true,\"daCoTaiKhoan\":false"
                + ",\"message\":\"Số điện thoại chưa đăng ký, cần xác thực OTP\"}");
        }
    }

    // =========================================================
    // GỬI OTP — sinh 6 số random, lưu DB, hiện lên màn hình
    // =========================================================
    private void xuLyGuiOtp(HttpServletRequest request, PrintWriter out) {
        String sdt = request.getParameter("soDienThoai");
        if (sdt == null || sdt.trim().isEmpty()) {
            out.print("{\"success\":false,\"message\":\"Vui lòng nhập số điện thoại\"}");
            return;
        }
        sdt = sdt.trim();

        // Sinh OTP 6 số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Lưu vào DB, hết hạn sau 5 phút
        String sql = "INSERT INTO otp_xac_thuc (so_dien_thoai, ma_otp, het_han) "
                   + "VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, sdt);
            ps.setString(2, otp);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"success\":false,\"message\":\"Lỗi server\"}");
            return;
        }

        // Trả OTP về FE luôn (môi trường demo)
        out.print("{\"success\":true"
            + ",\"message\":\"Mã OTP của bạn là: " + otp + " (demo)\""
            + ",\"otpDemo\":\"" + otp + "\""
            + "}");
    }

    // =========================================================
    // XÁC THỰC OTP — kiểm tra đúng không, tạo tài khoản nếu cần
    // =========================================================
    private void xuLyXacThuc(HttpServletRequest request,
                              HttpServletResponse response, PrintWriter out) {
        String sdt   = request.getParameter("soDienThoai");
        String otp   = request.getParameter("maOtp");
        String hoTen = request.getParameter("hoTen");
        String email = request.getParameter("email");

        if (sdt == null || otp == null
                || sdt.trim().isEmpty() || otp.trim().isEmpty()) {
            out.print("{\"success\":false,\"message\":\"Thiếu thông tin\"}");
            return;
        }
        sdt   = sdt.trim();
        otp   = otp.trim();
        hoTen = (hoTen != null && !hoTen.trim().isEmpty()) ? hoTen.trim() : null;
        email = (email != null && !email.trim().isEmpty()) ? email.trim() : null;

        // Kiểm tra OTP trong DB
        String sql = "SELECT id FROM otp_xac_thuc "
                   + "WHERE so_dien_thoai = ? AND ma_otp = ? "
                   + "AND da_dung = 0 AND het_han > NOW() "
                   + "ORDER BY created_at DESC LIMIT 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, sdt);
            ps.setString(2, otp);
            ResultSet rs = ps.executeQuery();

            if (!rs.next()) {
                out.print("{\"success\":false,\"message\":\"Mã OTP không đúng hoặc đã hết hạn\"}");
                return;
            }

            // Đánh dấu OTP đã dùng
            int otpId = rs.getInt("id");
            String sqlDung = "UPDATE otp_xac_thuc SET da_dung = 1 WHERE id = ?";
            try (PreparedStatement ps2 = conn.prepareStatement(sqlDung)) {
                ps2.setInt(1, otpId);
                ps2.executeUpdate();
            }

        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"success\":false,\"message\":\"Lỗi server\"}");
            return;
        }

        // OTP đúng → tạo tài khoản mới (vì đến đây thì chắc chắn chưa có TK)
        TaiKhoan tk = taiKhoanDAO.insertBySdt(sdt, hoTen, email);
        if (tk == null) {
            out.print("{\"success\":false,\"message\":\"Không thể tạo tài khoản\"}");
            return;
        }

        // Tạo session đăng nhập luôn
        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(30 * 60);
        session.setAttribute("taiKhoan",    tk);
        session.setAttribute("maNguoiDung", tk.getId());
        session.setAttribute("hoTen",       tk.getHoTen());
        session.setAttribute("vaiTro",      tk.getVaiTro());

        out.print("{\"success\":true"
            + ",\"message\":\"Xác thực thành công!\""
            + ",\"hoTen\":\"" + esc(tk.getHoTen()) + "\""
            + ",\"maNguoiDung\":" + tk.getId()
            + "}");
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}