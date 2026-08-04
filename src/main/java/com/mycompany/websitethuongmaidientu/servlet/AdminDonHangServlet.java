package com.mycompany.websitethuongmaidientu.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.mycompany.websitethuongmaidientu.util.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.*;

/**
 * DonHangServlet — API đơn hàng dùng chung cho Admin + NV Kho
 *
 * URL mapping:
 *   /admin/don-hang-api  → Admin (donhang.jsp)
 *   /kho/don-hang-api    → NV Kho (nhanvienkho.jsp)
 *
 * GET actions:
 *   list          — danh sách đơn có phân trang + lọc
 *   detail        — chi tiết 1 đơn kèm sản phẩm
 *   countStatus   — đếm đơn theo từng trạng thái
 *
 * POST actions (Admin):
 *   confirmOrder  — xác nhận đơn → dang_chuan_bi
 *   cancelOrder   — huỷ đơn → da_huy (cộng lại tồn kho)
 *   markCompleted — đánh dấu hoàn thành → hoan_thanh
 *   updateStatus  — override bất kỳ trạng thái (Admin only)
 *   approveReturn — duyệt hoàn hàng → cho_hoan_kho
 *   rejectReturn  — từ chối hoàn hàng → da_giao
 *
 * POST actions (NV Kho):
 *   daDongGoi       — đã đóng gói → dang_giao (giữ nguyên vì chưa tích hợp VC)
 *   daBanGiaoShipper— bàn giao shipper (ghi log)
 *   dangGiao        — đang giao hàng
 *   daGiao          — đã giao hàng
 */
@WebServlet(urlPatterns = {"/admin/don-hang-api", "/kho/don-hang-api"})
public class AdminDonHangServlet extends HttpServlet {

    private final Gson gson = new Gson();

    /* ══════════════════════════════════════════
       PHÂN QUYỀN
    ══════════════════════════════════════════ */
    private boolean isAdmin(HttpSession s) {
        if (s == null) return false;
        Object role = s.getAttribute("vaiTro");
        return "admin".equals(role);
    }

    private boolean isKho(HttpSession s) {
        if (s == null) return false;
        Object role = s.getAttribute("vaiTro");
        return "nhan_vien_kho".equals(role) || "admin".equals(role);
    }

    /* ══════════════════════════════════════════
       TIỆN ÍCH RESPONSE
    ══════════════════════════════════════════ */
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

    /* ══════════════════════════════════════════
       GET — ĐỌC DỮ LIỆU
    ══════════════════════════════════════════ */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws IOException {

        HttpSession session = req.getSession(false);
        String uri = req.getRequestURI();
        boolean isAdminEndpoint = uri.contains("/admin/");

        // Kiểm tra quyền
        if (isAdminEndpoint && !isAdmin(session)) {
            res.setStatus(403);
            json(res, err("Không có quyền truy cập"));
            return;
        }
        if (!isAdminEndpoint && !isKho(session)) {
            res.setStatus(403);
            json(res, err("Không có quyền truy cập"));
            return;
        }

        String action = req.getParameter("action");
        if (action == null) action = "list";

        switch (action) {
            case "list":        handleList(req, res, isAdminEndpoint); break;
            case "detail":      handleDetail(req, res); break;
            case "countStatus": handleCountStatus(req, res, isAdminEndpoint); break;
            default:            json(res, err("Action không hợp lệ"));
        }
    }

    /* ─── GET: Danh sách đơn ─── */
    private void handleList(HttpServletRequest req, HttpServletResponse res,
                            boolean isAdmin) throws IOException {
        String trangThai = req.getParameter("trangThai");
        String keyword   = req.getParameter("keyword");
        int page         = parseIntDef(req.getParameter("page"), 1);
        int pageSize     = parseIntDef(req.getParameter("pageSize"), 15);
        int offset       = (page - 1) * pageSize;

        // NV Kho chỉ thấy đơn đang trong luồng kho
        // Admin thấy tất cả
        List<String> khoStatuses = Arrays.asList(
            "dang_chuan_bi", "dang_giao", "da_giao"
        );

        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (!isAdmin) {
            // NV Kho: chỉ thấy đơn thuộc phạm vi kho
            if (trangThai != null && !trangThai.isEmpty() && !trangThai.equals("all")) {
                if (khoStatuses.contains(trangThai)) {
                    where.append(" AND dh.trang_thai = ?");
                    params.add(trangThai);
                } else {
                    // Trạng thái không thuộc kho → trả về rỗng
                    where.append(" AND 1=0");
                }
            } else {
                where.append(" AND dh.trang_thai IN ('dang_chuan_bi','dang_giao','da_giao')");
            }
        } else {
            if (trangThai != null && !trangThai.isEmpty() && !trangThai.equals("all")) {
                where.append(" AND dh.trang_thai = ?");
                params.add(trangThai);
            }
        }

        if (keyword != null && !keyword.trim().isEmpty()) {
            where.append(" AND (dh.ma_don_hang LIKE ? OR dh.ten_nguoi_nhan LIKE ? OR dh.so_dien_thoai LIKE ?)");
            String kw = "%" + keyword.trim() + "%";
            params.add(kw); params.add(kw); params.add(kw);
        }

        String sql = "SELECT dh.id, dh.ma_don_hang, dh.ten_nguoi_nhan, dh.so_dien_thoai,"
                   + " dh.tong_tien, dh.trang_thai, dh.phuong_thuc_tt,"
                   + " DATE_FORMAT(dh.ngay_dat,'%d/%m/%Y %H:%i') AS ngay_dat,"
                   + " tk.ho_ten AS ho_ten_kh"
                   + " FROM don_hang dh"
                   + " LEFT JOIN tai_khoan tk ON dh.ma_nguoi_dung = tk.id"
                   + where
                   + " ORDER BY dh.ngay_dat DESC"
                   + " LIMIT ? OFFSET ?";

        String countSql = "SELECT COUNT(*) FROM don_hang dh" + where;

        try (Connection conn = DBConnection.getConnection()) {
            // Đếm tổng
            int total = 0;
            try (PreparedStatement ps = conn.prepareStatement(countSql)) {
                for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
                ResultSet rs = ps.executeQuery();
                if (rs.next()) total = rs.getInt(1);
            }

            // Lấy data
            List<Map<String, Object>> list = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                int idx = 1;
                for (Object p : params) ps.setObject(idx++, p);
                ps.setInt(idx++, pageSize);
                ps.setInt(idx, offset);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id",           rs.getInt("id"));
                    row.put("maDonHang",    rs.getString("ma_don_hang"));
                    row.put("tenNguoiNhan", rs.getString("ten_nguoi_nhan"));
                    row.put("hoTenKH",      rs.getString("ho_ten_kh"));
                    row.put("soDienThoai",  rs.getString("so_dien_thoai"));
                    row.put("tongTien",     rs.getBigDecimal("tong_tien"));
                    row.put("trangThai",    rs.getString("trang_thai"));
                    row.put("phuongThucTT", rs.getString("phuong_thuc_tt"));
                    row.put("ngayDat",      rs.getString("ngay_dat"));
                    list.add(row);
                }
            }

            Map<String, Object> result = ok("OK");
            result.put("data",       list);
            result.put("total",      total);
            result.put("totalPages", (int) Math.ceil((double) total / pageSize));
            result.put("page",       page);
            json(res, result);

        } catch (SQLException e) {
            e.printStackTrace();
            json(res, err("Lỗi truy vấn dữ liệu: " + e.getMessage()));
        }
    }

    /* ─── GET: Chi tiết 1 đơn ─── */
    private void handleDetail(HttpServletRequest req, HttpServletResponse res)
            throws IOException {
        int id = parseIntDef(req.getParameter("id"), 0);
        if (id <= 0) { json(res, err("ID không hợp lệ")); return; }

        String sqlDon = "SELECT dh.*, tk.ho_ten AS ho_ten_kh, tk.email AS email_kh,"
                      + " DATE_FORMAT(dh.ngay_dat,'%d/%m/%Y %H:%i') AS ngay_dat_fmt"
                      + " FROM don_hang dh"
                      + " LEFT JOIN tai_khoan tk ON dh.ma_nguoi_dung = tk.id"
                      + " WHERE dh.id = ?";

        String sqlCT = "SELECT ct.*, sp.hinh_anh"
                     + " FROM chi_tiet_don_hang ct"
                     + " LEFT JOIN san_pham sp ON ct.ma_san_pham = sp.id"
                     + " WHERE ct.ma_don_hang = ?";

        try (Connection conn = DBConnection.getConnection()) {
            Map<String, Object> donHang = null;
            try (PreparedStatement ps = conn.prepareStatement(sqlDon)) {
                ps.setInt(1, id);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) {
                    donHang = new LinkedHashMap<>();
                    donHang.put("id",            rs.getInt("id"));
                    donHang.put("maDonHang",     rs.getString("ma_don_hang"));
                    donHang.put("tenNguoiNhan",  rs.getString("ten_nguoi_nhan"));
                    donHang.put("soDienThoai",   rs.getString("so_dien_thoai"));
                    donHang.put("diaChiGiao",    rs.getString("dia_chi_giao"));
                    donHang.put("ghiChu",        rs.getString("ghi_chu"));
                    donHang.put("tongTamTinh",   rs.getBigDecimal("tong_tam_tinh"));
                    donHang.put("phiVanChuyen",  rs.getBigDecimal("phi_van_chuyen"));
                    donHang.put("giamGia",       rs.getBigDecimal("giam_gia"));
                    donHang.put("tongTien",      rs.getBigDecimal("tong_tien"));
                    donHang.put("phuongThucTT",  rs.getString("phuong_thuc_tt"));
                    donHang.put("trangThai",     rs.getString("trang_thai"));
                    donHang.put("ngayDat",       rs.getString("ngay_dat_fmt"));
                    donHang.put("hoTenKH",       rs.getString("ho_ten_kh"));
                    donHang.put("emailKH",       rs.getString("email_kh"));
                    donHang.put("ghiChuAdmin",   rs.getString("ghi_chu")); // tạm dùng ghi_chu
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

    /* ─── GET: Đếm theo trạng thái ─── */
    private void handleCountStatus(HttpServletRequest req, HttpServletResponse res,
                                   boolean isAdmin) throws IOException {
        String whereClause = isAdmin
            ? ""
            : " WHERE trang_thai IN ('dang_chuan_bi','dang_giao','da_giao')";

        String sql = "SELECT trang_thai, COUNT(*) AS so_luong"
                   + " FROM don_hang"
                   + whereClause
                   + " GROUP BY trang_thai";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            Map<String, Integer> counts = new LinkedHashMap<>();
            int total = 0;
            while (rs.next()) {
                String tt  = rs.getString("trang_thai");
                int    num = rs.getInt("so_luong");
                counts.put(tt, num);
                total += num;
            }
            Map<String, Object> result = ok("OK");
            result.put("counts", counts);
            result.put("total",  total);
            json(res, result);

        } catch (SQLException e) {
            e.printStackTrace();
            json(res, err("Lỗi đếm trạng thái: " + e.getMessage()));
        }
    }

    /* ══════════════════════════════════════════
       POST — CẬP NHẬT
    ══════════════════════════════════════════ */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws IOException {
        req.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        String uri = req.getRequestURI();
        boolean isAdminEndpoint = uri.contains("/admin/");

        if (isAdminEndpoint && !isAdmin(session)) {
            res.setStatus(403); json(res, err("Không có quyền")); return;
        }
        if (!isAdminEndpoint && !isKho(session)) {
            res.setStatus(403); json(res, err("Không có quyền")); return;
        }

        String action = req.getParameter("action");
        int id = parseIntDef(req.getParameter("id"), 0);
        if (id <= 0) { json(res, err("ID đơn hàng không hợp lệ")); return; }

        String ghiChu = nullToEmpty(req.getParameter("ghiChu"));
        String lyDo   = nullToEmpty(req.getParameter("lyDo"));

        switch (action != null ? action : "") {

            // ── ADMIN ──
            case "confirmOrder":
                // Xác nhận → dang_chuan_bi
                json(res, updateStatus(id, "cho_xac_nhan", "dang_chuan_bi", ghiChu));
                break;

            case "cancelOrder":
                // Huỷ đơn → cộng lại tồn kho
                json(res, cancelOrder(id, lyDo.isEmpty() ? ghiChu : lyDo));
                break;

            case "markCompleted":
                // Đánh dấu hoàn thành (Admin bấm khi khách chưa bấm)
                json(res, updateStatus(id, "da_giao", "hoan_thanh", ghiChu));
                break;

            case "approveReturn":
                json(res, updateStatus(id, "yeu_cau_hoan", "cho_hoan_kho", ghiChu));
                break;

            case "rejectReturn":
                json(res, updateStatus(id, "yeu_cau_hoan", "da_giao", ghiChu));
                break;

            case "markRestocked":
                // NV Kho đã nhập lại kho → chuyển sang chờ hoàn tiền
                json(res, updateStatus(id, "cho_hoan_kho", "cho_hoan_tien", ghiChu));
                break;

            case "updateStatus":
                // Admin override bất kỳ trạng thái
                String newStatus = req.getParameter("trangThai");
                if (newStatus == null || newStatus.isEmpty()) {
                    json(res, err("Thiếu trangThai")); return;
                }
                json(res, forceUpdateStatus(id, newStatus, ghiChu));
                break;

            // ── NV KHO ──
            case "daDongGoi":
                json(res, updateStatus(id, "dang_chuan_bi", "dang_giao", ghiChu));
                break;

            case "daBanGiaoShipper":
                // Chưa tích hợp VC → chỉ ghi log, không đổi trạng thái
                // (trạng thái vẫn là dang_giao, NV Kho ghi nhận bàn giao)
                json(res, ghiLog(id, "da_ban_giao_shipper", ghiChu.isEmpty() ? "NV Kho đã bàn giao cho shipper" : ghiChu));
                break;

            case "dangGiao":
                json(res, updateStatus(id, "dang_chuan_bi", "dang_giao", ghiChu));
                break;

            case "daGiao":
                json(res, updateStatus(id, "dang_giao", "da_giao", ghiChu));
                break;

            // ── KHÁCH HÀNG ──
            case "hoanThanh":
                // Khách xác nhận đã nhận hàng
                json(res, updateStatus(id, "da_giao", "hoan_thanh", "Khách xác nhận đã nhận hàng"));
                break;

            default:
                json(res, err("Action không hợp lệ: " + action));
        }
    }

    /* ══════════════════════════════════════════
       CÁC HÀM XỬ LÝ NGHIỆP VỤ
    ══════════════════════════════════════════ */

    /**
     * Cập nhật trạng thái đơn, có kiểm tra trạng thái hiện tại hợp lệ.
     * Ví dụ: confirmOrder chỉ chạy được khi đơn đang là cho_xac_nhan.
     */
    private Map<String, Object> updateStatus(int id, String fromStatus,
                                              String toStatus, String ghiChu) {
        String sql = "UPDATE don_hang SET trang_thai = ? WHERE id = ? AND trang_thai = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, toStatus);
            ps.setInt(2, id);
            ps.setString(3, fromStatus);
            int rows = ps.executeUpdate();
            if (rows == 0) {
                // Kiểm tra đơn có tồn tại không
                String checkSql = "SELECT trang_thai FROM don_hang WHERE id = ?";
                try (PreparedStatement cp = conn.prepareStatement(checkSql)) {
                    cp.setInt(1, id);
                    ResultSet rs = cp.executeQuery();
                    if (!rs.next()) return err("Không tìm thấy đơn hàng #" + id);
                    String current = rs.getString("trang_thai");
                    return err("Không thể chuyển trạng thái: đơn đang ở '" + current + "'");
                }
            }
            ghi_log_he_thong(conn, id, "Cập nhật trạng thái: " + fromStatus + " → " + toStatus
                             + (ghiChu.isEmpty() ? "" : " | " + ghiChu));
            return ok("Cập nhật thành công");
        } catch (SQLException e) {
            e.printStackTrace();
            return err("Lỗi cơ sở dữ liệu: " + e.getMessage());
        }
    }

    /**
     * Admin override — không kiểm tra trạng thái cũ.
     */
    private Map<String, Object> forceUpdateStatus(int id, String toStatus, String ghiChu) {
        String sql = "UPDATE don_hang SET trang_thai = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, toStatus);
            ps.setInt(2, id);
            int rows = ps.executeUpdate();
            if (rows == 0) return err("Không tìm thấy đơn hàng #" + id);
            ghi_log_he_thong(conn, id, "Admin override → " + toStatus
                             + (ghiChu.isEmpty() ? "" : " | " + ghiChu));
            return ok("Đã cập nhật trạng thái → " + toStatus);
        } catch (SQLException e) {
            e.printStackTrace();
            return err("Lỗi cơ sở dữ liệu: " + e.getMessage());
        }
    }

    /**
     * Huỷ đơn: cập nhật trang_thai = da_huy và cộng lại tồn kho.
     */
    private Map<String, Object> cancelOrder(int id, String lyDo) {
        String sqlCheck = "SELECT trang_thai FROM don_hang WHERE id = ?";
        String sqlUpdate = "UPDATE don_hang SET trang_thai = 'da_huy' WHERE id = ?";
        // Cộng lại tồn kho và trừ số lượng bán trong bảng san_pham
        String sqlRestoreKho = "UPDATE san_pham sp"
                             + " JOIN chi_tiet_don_hang ct ON sp.id = ct.ma_san_pham"
                             + " SET sp.so_luong_ton = sp.so_luong_ton + ct.so_luong,"
                             + "     sp.so_luong_ban = GREATEST(0, sp.so_luong_ban - ct.so_luong)"
                             + " WHERE ct.ma_don_hang = ?";
        String sqlRestoreTonKho = "UPDATE ton_kho tk"
                                + " JOIN chi_tiet_don_hang ct ON tk.ma_san_pham = ct.ma_san_pham"
                                + " SET tk.so_luong = tk.so_luong + ct.so_luong"
                                + " WHERE ct.ma_don_hang = ?";

        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // Kiểm tra trạng thái cho phép huỷ
                try (PreparedStatement ps = conn.prepareStatement(sqlCheck)) {
                    ps.setInt(1, id);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) { conn.rollback(); return err("Không tìm thấy đơn hàng"); }
                    String tt = rs.getString("trang_thai");
                    if ("da_giao".equals(tt) || "hoan_thanh".equals(tt) || "da_huy".equals(tt)) {
                        conn.rollback();
                        return err("Không thể huỷ đơn ở trạng thái: " + tt);
                    }
                }

                // Cập nhật trạng thái
                try (PreparedStatement ps = conn.prepareStatement(sqlUpdate)) {
                    ps.setInt(1, id); ps.executeUpdate();
                }

                // Cộng lại tồn kho trong bảng san_pham
                try (PreparedStatement ps = conn.prepareStatement(sqlRestoreKho)) {
                    ps.setInt(1, id); ps.executeUpdate();
                }

                // Cộng lại tồn kho trong bảng ton_kho
                try (PreparedStatement ps = conn.prepareStatement(sqlRestoreTonKho)) {
                    ps.setInt(1, id); ps.executeUpdate();
                }

                ghi_log_he_thong(conn, id, "Huỷ đơn hàng | Lý do: " + (lyDo.isEmpty() ? "Không rõ" : lyDo));
                conn.commit();
                return ok("Đã huỷ đơn hàng và hoàn lại tồn kho");

            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return err("Lỗi khi huỷ đơn: " + e.getMessage());
        }
    }

    /**
     * Ghi log không đổi trạng thái (dùng cho bàn giao shipper).
     */
    private Map<String, Object> ghiLog(int id, String hanhDong, String ghiChu) {
        try (Connection conn = DBConnection.getConnection()) {
            ghi_log_he_thong(conn, id, hanhDong + (ghiChu.isEmpty() ? "" : " | " + ghiChu));
            return ok("Đã ghi nhận: " + ghiChu);
        } catch (SQLException e) {
            return err("Lỗi ghi log: " + e.getMessage());
        }
    }

    /**
     * Ghi vào bảng log_he_thong.
     */
    private void ghi_log_he_thong(Connection conn, int maDonHang, String noiDung)
            throws SQLException {
        String sql = "INSERT INTO log_he_thong (hanh_dong, noi_dung) VALUES (?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, "DON_HANG_#" + maDonHang);
            ps.setString(2, noiDung);
            ps.executeUpdate();
        }
    }

    /* ══════════════════════════════════════════
       TIỆN ÍCH
    ══════════════════════════════════════════ */
    private int parseIntDef(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s.trim();
    }
}