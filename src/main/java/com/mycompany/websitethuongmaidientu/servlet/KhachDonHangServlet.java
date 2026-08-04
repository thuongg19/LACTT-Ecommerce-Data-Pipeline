package com.mycompany.websitethuongmaidientu.servlet;

import com.google.gson.Gson;
import com.mycompany.websitethuongmaidientu.util.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.*;

/**
 * KhachDonHangServlet — API đơn hàng phía khách hàng
 *
 * URL: /khach/don-hang-api
 *
 * GET:
 *   list   — lịch sử đơn của khách đang đăng nhập
 *   detail — chi tiết 1 đơn (chỉ xem được đơn của mình)
 *
 * POST:
 *   hoanThanh  — khách xác nhận đã nhận hàng → hoan_thanh
 *   yeuCauHoan — khách yêu cầu hoàn hàng → yeu_cau_hoan
 */
@WebServlet("/khach/don-hang-api")
public class KhachDonHangServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void json(HttpServletResponse res, Object obj) throws IOException {
        res.setContentType("application/json;charset=UTF-8");
        res.setCharacterEncoding("UTF-8");
        PrintWriter out = res.getWriter();
        out.print(gson.toJson(obj));
        out.flush();
    }

    private Map<String, Object> ok(String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", true);
        m.put("message", msg);
        return m;
    }

    private Map<String, Object> err(String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", false);
        m.put("message", msg);
        return m;
    }

    private Integer getMaNguoiDung(HttpSession s) {
        if (s == null) return null;
        Object id = s.getAttribute("maNguoiDung");
        if (id == null) return null;
        try { return Integer.parseInt(id.toString()); } catch (Exception e) { return null; }
    }

    /* ══════════════════════════════════════════
       GET
    ══════════════════════════════════════════ */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws IOException {

        HttpSession session = req.getSession(false);
        Integer maNguoiDung = getMaNguoiDung(session);
        if (maNguoiDung == null) {
            res.setStatus(403); json(res, err("Vui lòng đăng nhập")); return;
        }

        String action = req.getParameter("action");
        if (action == null) action = "list";

        switch (action) {
            case "list":   handleList(req, res, maNguoiDung);   break;
            case "detail": handleDetail(req, res, maNguoiDung); break;
            default:       json(res, err("Action không hợp lệ"));
        }
    }

    private void handleList(HttpServletRequest req, HttpServletResponse res,
                             int maNguoiDung) throws IOException {
        String sql = "SELECT dh.id, dh.ma_don_hang, dh.tong_tien, dh.trang_thai,"
                   + " dh.phuong_thuc_tt,"
                   + " DATE_FORMAT(dh.ngay_dat,'%d/%m/%Y %H:%i') AS ngay_dat,"
                   + " (SELECT COUNT(*) FROM chi_tiet_don_hang WHERE ma_don_hang = dh.id) AS so_san_pham"
                   + " FROM don_hang dh"
                   + " WHERE dh.ma_nguoi_dung = ?"
                   + " ORDER BY dh.ngay_dat DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maNguoiDung);
            ResultSet rs = ps.executeQuery();
            List<Map<String, Object>> list = new ArrayList<>();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id",          rs.getInt("id"));
                row.put("maDonHang",   rs.getString("ma_don_hang"));
                row.put("tongTien",    rs.getBigDecimal("tong_tien"));
                row.put("trangThai",   rs.getString("trang_thai"));
                row.put("phuongThucTT",rs.getString("phuong_thuc_tt"));
                row.put("ngayDat",     rs.getString("ngay_dat"));
                row.put("soSanPham",   rs.getInt("so_san_pham"));
                list.add(row);
            }
            Map<String, Object> result = ok("OK");
            result.put("data", list);
            json(res, result);
        } catch (SQLException e) {
            e.printStackTrace();
            json(res, err("Lỗi truy vấn: " + e.getMessage()));
        }
    }

    private void handleDetail(HttpServletRequest req, HttpServletResponse res,
                               int maNguoiDung) throws IOException {
        int id = parseIntDef(req.getParameter("id"), 0);
        if (id <= 0) { json(res, err("ID không hợp lệ")); return; }

        String sqlDon = "SELECT dh.*,"
                      + " DATE_FORMAT(dh.ngay_dat,'%d/%m/%Y %H:%i') AS ngay_dat_fmt"
                      + " FROM don_hang dh"
                      + " WHERE dh.id = ? AND dh.ma_nguoi_dung = ?";

        String sqlCT = "SELECT ct.*, sp.hinh_anh FROM chi_tiet_don_hang ct"
                     + " LEFT JOIN san_pham sp ON ct.ma_san_pham = sp.id"
                     + " WHERE ct.ma_don_hang = ?";

        try (Connection conn = DBConnection.getConnection()) {
            Map<String, Object> donHang = null;
            try (PreparedStatement ps = conn.prepareStatement(sqlDon)) {
                ps.setInt(1, id);
                ps.setInt(2, maNguoiDung);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    donHang = new LinkedHashMap<>();
                    donHang.put("id",           rs.getInt("id"));
                    donHang.put("maDonHang",    rs.getString("ma_don_hang"));
                    donHang.put("tenNguoiNhan", rs.getString("ten_nguoi_nhan"));
                    donHang.put("soDienThoai",  rs.getString("so_dien_thoai"));
                    donHang.put("diaChiGiao",   rs.getString("dia_chi_giao"));
                    donHang.put("ghiChu",       rs.getString("ghi_chu"));
                    donHang.put("tongTamTinh",  rs.getBigDecimal("tong_tam_tinh"));
                    donHang.put("phiVanChuyen", rs.getBigDecimal("phi_van_chuyen"));
                    donHang.put("giamGia",      rs.getBigDecimal("giam_gia"));
                    donHang.put("tongTien",     rs.getBigDecimal("tong_tien"));
                    donHang.put("phuongThucTT", rs.getString("phuong_thuc_tt"));
                    donHang.put("trangThai",    rs.getString("trang_thai"));
                    donHang.put("ngayDat",      rs.getString("ngay_dat_fmt"));
                }
            }
            if (donHang == null) { json(res, err("Không tìm thấy đơn hàng")); return; }

            List<Map<String, Object>> chiTiet = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(sqlCT)) {
                ps.setInt(1, id);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Map<String, Object> ct = new LinkedHashMap<>();
                    ct.put("tenSanPham", rs.getString("ten_san_pham"));
                    ct.put("thuongHieu", rs.getString("thuong_hieu"));
                    ct.put("tenVariant", rs.getString("ten_variant"));
                    ct.put("soLuong",    rs.getInt("so_luong"));
                    ct.put("gia",        rs.getBigDecimal("gia"));
                    ct.put("thanhTien",  rs.getBigDecimal("thanh_tien"));
                    ct.put("hinhAnh",    rs.getString("hinh_anh"));
                    chiTiet.add(ct);
                }
            }

            Map<String, Object> result = ok("OK");
            result.put("donHang", donHang);
            result.put("chiTiet", chiTiet);
            json(res, result);

        } catch (SQLException e) {
            e.printStackTrace();
            json(res, err("Lỗi truy vấn: " + e.getMessage()));
        }
    }

    /* ══════════════════════════════════════════
       POST
    ══════════════════════════════════════════ */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws IOException {
        req.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        Integer maNguoiDung = getMaNguoiDung(session);
        if (maNguoiDung == null) {
            res.setStatus(403); json(res, err("Vui lòng đăng nhập")); return;
        }

        String action = req.getParameter("action");
        int id = parseIntDef(req.getParameter("id"), 0);
        if (id <= 0) { json(res, err("ID không hợp lệ")); return; }

        switch (action != null ? action : "") {
            case "hoanThanh":
                // Khách xác nhận đã nhận → hoan_thanh
                json(res, khachCapNhatTrangThai(id, maNguoiDung, "da_giao", "hoan_thanh",
                        "Khách xác nhận đã nhận hàng"));
                break;

            case "yeuCauHoan":
    String lyDo = req.getParameter("lyDo");
    if (lyDo == null || lyDo.trim().isEmpty()) {
        json(res, err("Vui lòng nhập lý do hoàn hàng")); return;
    }
    Map<String, Object> ketQua = khachCapNhatTrangThai(id, maNguoiDung, "da_giao", "yeu_cau_hoan",
            "Khách yêu cầu hoàn hàng: " + lyDo.trim());
    if (!(Boolean) ketQua.get("success")) {
        ketQua = khachCapNhatTrangThai(id, maNguoiDung, "hoan_thanh", "yeu_cau_hoan",
                "Khách yêu cầu hoàn hàng: " + lyDo.trim());
    }
    json(res, ketQua);
    break;

            default:
                json(res, err("Action không hợp lệ"));
        }
    }

    /**
     * Khách cập nhật trạng thái — chỉ được cập nhật đơn của chính mình
     * và đúng trạng thái hiện tại.
     */
    private Map<String, Object> khachCapNhatTrangThai(int id, int maNguoiDung,
        String fromStatus, String toStatus, String ghiChu) {
    String sql = "UPDATE don_hang SET trang_thai = ?"
               + " WHERE id = ? AND ma_nguoi_dung = ? AND trang_thai = ?";
    try (Connection conn = DBConnection.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, toStatus);
        ps.setInt(2, id);
        ps.setInt(3, maNguoiDung);
        ps.setString(4, fromStatus);
        int rows = ps.executeUpdate();
        if (rows == 0) return err("Không thể cập nhật — đơn không hợp lệ hoặc sai trạng thái");

        // Ghi log — tách riêng, lỗi log không ảnh hưởng kết quả chính
        try {
            String logSql = "INSERT INTO log_he_thong (ma_nguoi_dung, hanh_dong, noi_dung) VALUES (?, ?, ?)";
            try (PreparedStatement lps = conn.prepareStatement(logSql)) {
                lps.setInt(1, maNguoiDung);
                lps.setString(2, "KHACH_DON_HANG_#" + id);
                lps.setString(3, ghiChu);
                lps.executeUpdate();
            }
        } catch (SQLException logEx) {
            logEx.printStackTrace(); // chỉ in log, không throw
        }

        return ok(ghiChu);
    } catch (SQLException e) {
        e.printStackTrace();
        return err("Lỗi cơ sở dữ liệu: " + e.getMessage());
    }
}

    private int parseIntDef(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }
}