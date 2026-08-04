package com.mycompany.websitethuongmaidientu.servlet;

import com.mycompany.websitethuongmaidientu.model.TaiKhoan;
import com.mycompany.websitethuongmaidientu.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.security.MessageDigest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/DoiMatKhauServlet")
public class DoiMatKhauServlet extends HttpServlet {

    private String md5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] bytes = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo thuật toán MD5", e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        // Kiểm tra session
        HttpSession session = request.getSession(false);
        TaiKhoan taiKhoan = (session != null)
                ? (TaiKhoan) session.getAttribute("taiKhoan") : null;

        if (taiKhoan == null) {
            out.print("{\"success\":false,\"redirect\":\"dangnhap.jsp\"}");
            return;
        }

        String matKhauCu  = request.getParameter("matKhauCu");
        String matKhauMoi = request.getParameter("matKhauMoi");

        if (matKhauCu == null || matKhauCu.isBlank()
                || matKhauMoi == null || matKhauMoi.isBlank()) {
            out.print("{\"success\":false,\"message\":\"Vui lòng nhập đầy đủ thông tin\"}");
            return;
        }
        if (matKhauMoi.length() < 6) {
            out.print("{\"success\":false,\"message\":\"Mật khẩu mới phải có ít nhất 6 ký tự\"}");
            return;
        }

        // Hash MD5 — giống DangNhapServlet
        String matKhauCuHash  = md5(matKhauCu);
        String matKhauMoiHash = md5(matKhauMoi);

        try (Connection conn = DBConnection.getConnection()) {
            // 1. Xác minh mật khẩu cũ (so sánh hash)
            String sqlCheck = "SELECT id FROM tai_khoan WHERE id = ? AND mat_khau = ?";
            try (PreparedStatement ps = conn.prepareStatement(sqlCheck)) {
                ps.setInt(1, taiKhoan.getId());
                ps.setString(2, matKhauCuHash);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        out.print("{\"success\":false,\"message\":\"Mật khẩu hiện tại không đúng\"}");
                        return;
                    }
                }
            }

            // 2. Cập nhật mật khẩu mới (lưu hash)
            String sqlUpdate = "UPDATE tai_khoan SET mat_khau = ? WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sqlUpdate)) {
                ps.setString(1, matKhauMoiHash);
                ps.setInt(2, taiKhoan.getId());
                int rows = ps.executeUpdate();
                if (rows > 0) {
                    out.print("{\"success\":true,\"message\":\"Đổi mật khẩu thành công\"}");
                } else {
                    out.print("{\"success\":false,\"message\":\"Cập nhật thất bại, vui lòng thử lại\"}");
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            out.print("{\"success\":false,\"message\":\"Lỗi máy chủ\"}");
        }
    }
}