package com.mycompany.websitethuongmaidientu.servlet;

import com.mycompany.websitethuongmaidientu.dao.TonKhoDAO;
import com.mycompany.websitethuongmaidientu.model.TaiKhoan;
import com.mycompany.websitethuongmaidientu.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * NhanVienKhoServlet — Xử lý toàn bộ API cho trang nhanvienkho.jsp
 *
 * Tất cả response đều JSON (UTF-8).
 * URL: /NhanVienKhoServlet?action=...
 *
 * Danh sách action:
 *   getStats          — Thống kê tổng quan (4 con số trên đầu)
 *   getDonHang        — Danh sách đơn hàng kho cần xử lý
 *   xuatKho           — Xuất kho: confirmed → shipping  (POST)
 *   xacNhanDaGiao     — Giao xong: shipping → delivered (POST)
 *   nhapLaiKho        — Hoàn hàng: refunding → restocked (POST)
 *   searchSanPham     — Tìm sản phẩm để nhập hàng mới
 *   nhapHang          — Nhập hàng mới vào kho            (POST)
 *   getTonKho         — Tồn kho toàn bộ / theo filter
 *   getNhatKy         — Nhật ký kho
 *   checkTonKho       — API check nhanh tồn 1 sản phẩm (cho giỏ hàng)
 */
@WebServlet("/NhanVienKhoServlet")
public class NhanVienKhoServlet extends HttpServlet {

    private final TonKhoDAO tonKhoDAO = new TonKhoDAO();

    /* ════════════════════════════════════
       AUTH HELPER — lấy user từ Session
    ════════════════════════════════════ */
    private TaiKhoan getUser(HttpSession session) {
        return (TaiKhoan) session.getAttribute("taiKhoan");
    }

    private boolean isKhoOrAdmin(TaiKhoan user) {
        if (user == null) return false;
        String role = user.getVaiTro();
        return "nhan_vien_kho".equals(role) || "admin".equals(role);
    }

    /* ════════════════════════════════════
       GET
    ════════════════════════════════════ */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json; charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String action = req.getParameter("action");
        if (action == null) action = "";

        // checkTonKho được phép không cần đăng nhập (khách gọi từ giỏ hàng)
        if ("checkTonKho".equals(action)) {
            handleCheckTonKho(req, resp, out);
            return;
        }

        // Các action còn lại yêu cầu auth
        HttpSession session = req.getSession(false);
        TaiKhoan user = (session != null) ? getUser(session) : null;
        if (!isKhoOrAdmin(user)) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"ok\":false,\"msg\":\"Chưa đăng nhập hoặc không có quyền\"}");
            return;
        }

        switch (action) {
            case "getStats":       handleGetStats(req, resp, out); break;
            case "getDonHang":     handleGetDonHang(req, resp, out); break;
            case "searchSanPham":  handleSearchSanPham(req, resp, out); break;
            case "getTonKho":      handleGetTonKho(req, resp, out); break;
            case "getNhatKy":      handleGetNhatKy(req, resp, out); break;
            default:
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"ok\":false,\"msg\":\"Action không hợp lệ\"}");
        }
    }

    /* ════════════════════════════════════
       POST
    ════════════════════════════════════ */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json; charset=UTF-8");
        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        TaiKhoan user = (session != null) ? getUser(session) : null;
        if (!isKhoOrAdmin(user)) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"ok\":false,\"msg\":\"Chưa đăng nhập hoặc không có quyền\"}");
            return;
        }

        String action = req.getParameter("action");
        if (action == null) action = "";

        switch (action) {
            case "xuatKho":       handleXuatKho(req, resp, out, user); break;
            case "xacNhanDaGiao": handleXacNhanDaGiao(req, resp, out, user); break;
            case "nhapLaiKho":    handleNhapLaiKho(req, resp, out, user); break;
            case "nhapHang":      handleNhapHang(req, resp, out, user); break;
            default:
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"ok\":false,\"msg\":\"Action không hợp lệ\"}");
        }
    }

    /* ════════════════════════════════════
       HANDLER: getStats
    ════════════════════════════════════ */
    private void handleGetStats(HttpServletRequest req, HttpServletResponse resp, PrintWriter out) {
        try {
            int pending  = demDonTheoTrangThai("dang_chuan_bi");
            int lowStock = tonKhoDAO.demSapHetHang(10);
            int todayIn  = tonKhoDAO.tongSoLuongHomNay("IN");
            int todayOut = tonKhoDAO.tongSoLuongHomNay("OUT");
            int badge    = demDonTheoTrangThai("dang_chuan_bi") + demDonTheoTrangThai("cho_hoan_kho");

            out.printf("{\"ok\":true,\"pending\":%d,\"lowStock\":%d,\"todayIn\":%d,\"todayOut\":%d,\"badge\":%d}",
                pending, lowStock, todayIn, todayOut, badge);
        } catch (Exception e) {
            e.printStackTrace();
            out.print("{\"ok\":false,\"msg\":\"Lỗi server\"}");
        }
    }

    /* ════════════════════════════════════
       HANDLER: getDonHang
       ?tab=active|delivered|refunding
    ════════════════════════════════════ */
    private void handleGetDonHang(HttpServletRequest req, HttpServletResponse resp, PrintWriter out) {
        String tab = req.getParameter("tab");
        if (tab == null) tab = "all"; 

        String whereStatus;
        switch (tab) {
            case "delivered":  whereStatus = "dh.trang_thai IN ('da_giao','hoan_thanh')"; break;
            case "refunding":  whereStatus = "dh.trang_thai IN ('cho_hoan_kho','cho_hoan_tien')"; break;
            case "active":     whereStatus = "dh.trang_thai IN ('dang_chuan_bi','dang_giao')"; break;
            default:           whereStatus = "1=1"; break; 
        }

        String sql = "SELECT dh.id, dh.ma_don_hang, dh.trang_thai, dh.tong_tien, "
                   + "       dh.ten_nguoi_nhan, dh.so_dien_thoai, dh.dia_chi_giao, "
                   + "       dh.ghi_chu, dh.ngay_dat, "
                   + "       dh.shipped_at, dh.shipped_by, dh.delivered_at, "
                   + "       dh.refund_approved, dh.refund_reason, dh.refund_approved_at, "
                   + "       tk.ho_ten AS ten_khach "
                   + "FROM don_hang dh "
                   + "JOIN tai_khoan tk ON tk.id = dh.ma_nguoi_dung "
                   + "WHERE " + whereStatus
                   + " ORDER BY dh.ngay_dat DESC";

        StringBuilder sb = new StringBuilder("[");
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            boolean first = true;
            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;
                int donHangId = rs.getInt("id");

                sb.append("{");
                sb.append("\"id\":").append(donHangId).append(",");
                appendJsonStr(sb, "maDonHang",    rs.getString("ma_don_hang"));   sb.append(",");
                appendJsonStr(sb, "trangThai",    rs.getString("trang_thai"));     sb.append(",");
                sb.append("\"tongTien\":").append(rs.getBigDecimal("tong_tien")).append(",");
                appendJsonStr(sb, "tenNguoiNhan", rs.getString("ten_nguoi_nhan")); sb.append(",");
                appendJsonStr(sb, "soDienThoai",  rs.getString("so_dien_thoai"));  sb.append(",");
                appendJsonStr(sb, "diaChiGiao",   rs.getString("dia_chi_giao"));   sb.append(",");
                appendJsonStr(sb, "ghiChu",       rs.getString("ghi_chu"));        sb.append(",");
                appendJsonStr(sb, "tenKhach",     rs.getString("ten_khach"));      sb.append(",");
                appendJsonStr(sb, "ngayDat",      rs.getTimestamp("ngay_dat") != null
                                                  ? rs.getTimestamp("ngay_dat").toString() : ""); sb.append(",");
                appendJsonStr(sb, "shippedAt",    rs.getString("shipped_at"));     sb.append(",");
                appendJsonStr(sb, "shippedBy",    rs.getString("shipped_by"));     sb.append(",");
                appendJsonStr(sb, "deliveredAt",  rs.getString("delivered_at"));   sb.append(",");
                sb.append("\"refundApproved\":").append(rs.getBoolean("refund_approved")).append(",");
                appendJsonStr(sb, "refundReason",     rs.getString("refund_reason"));     sb.append(",");
                appendJsonStr(sb, "refundApprovedAt", rs.getString("refund_approved_at")); sb.append(",");

                // Chi tiết sản phẩm của đơn
                sb.append("\"items\":").append(getChiTietDonHangJson(donHangId));
                sb.append("}");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"ok\":false,\"msg\":\"Lỗi truy vấn đơn hàng\"}");
            return;
        }
        sb.append("]");
        out.print("{\"ok\":true,\"data\":" + sb + "}");
    }

    /* ════════════════════════════════════
       HANDLER: xuatKho — confirmed → shipping
       POST: donHangId
    ════════════════════════════════════ */
    private void handleXuatKho(HttpServletRequest req, HttpServletResponse resp,
                                PrintWriter out, TaiKhoan user) {
        try {
            int donHangId = Integer.parseInt(req.getParameter("donHangId"));

            // Lấy chi tiết đơn hàng (maSanPham → soLuong)
            Map<Integer, Integer> chiTiet = getChiTietMap(donHangId);
            if (chiTiet.isEmpty()) {
                out.print("{\"ok\":false,\"msg\":\"Đơn hàng không có sản phẩm hoặc không tồn tại\"}");
                return;
            }

            // Tồn kho đã bị trừ lúc khách đặt hàng (DonHangServlet) — chỉ ghi nhật ký xuất kho
            boolean logOk = tonKhoDAO.ghiNhatKyXuatKho(chiTiet, donHangId, user.getId(),
                                                        "Xuất theo đơn #" + donHangId);
            if (!logOk) {
                out.print("{\"ok\":false,\"msg\":\"Ghi nhật ký xuất kho thất bại\"}");
                return;
            }

            // Cập nhật trạng thái đơn → shipping
            String sql = "UPDATE don_hang SET trang_thai='dang_giao', shipped_at=NOW(), shipped_by=? WHERE id=?";
            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, user.getHoTen());
                ps.setInt(2, donHangId);
                ps.executeUpdate();
            }

            out.print("{\"ok\":true,\"msg\":\"Xuất kho thành công — đơn đang giao\"}");
        } catch (NumberFormatException e) {
            out.print("{\"ok\":false,\"msg\":\"donHangId không hợp lệ\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"ok\":false,\"msg\":\"Lỗi server khi xuất kho\"}");
        }
    }

    /* ════════════════════════════════════
       HANDLER: xacNhanDaGiao — shipping → delivered
       POST: donHangId
    ════════════════════════════════════ */
    private void handleXacNhanDaGiao(HttpServletRequest req, HttpServletResponse resp,
                                      PrintWriter out, TaiKhoan user) {
        try {
            int donHangId = Integer.parseInt(req.getParameter("donHangId"));
            String sql = "UPDATE don_hang SET trang_thai='da_giao', delivered_at=NOW(), delivered_by=? "
                       + "WHERE id=? AND trang_thai='dang_giao'";
            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, user.getHoTen());
                ps.setInt(2, donHangId);
                int rows = ps.executeUpdate();
                if (rows == 0) {
                    out.print("{\"ok\":false,\"msg\":\"Đơn không ở trạng thái 'shipping' hoặc không tồn tại\"}");
                    return;
                }
            }
            out.print("{\"ok\":true,\"msg\":\"Đã xác nhận giao hàng thành công\"}");
        } catch (NumberFormatException e) {
            out.print("{\"ok\":false,\"msg\":\"donHangId không hợp lệ\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"ok\":false,\"msg\":\"Lỗi server\"}");
        }
    }

    /* ════════════════════════════════════
       HANDLER: nhapLaiKho — refunding → restocked
       POST: donHangId
    ════════════════════════════════════ */
    private void handleNhapLaiKho(HttpServletRequest req, HttpServletResponse resp,
                                   PrintWriter out, TaiKhoan user) {
        try {
            int donHangId = Integer.parseInt(req.getParameter("donHangId"));

            // Kiểm tra đơn đã được Admin duyệt hoàn chưa
            boolean approved = kiemTraRefundApproved(donHangId);
            if (!approved) {
                out.print("{\"ok\":false,\"msg\":\"Admin chưa duyệt yêu cầu hoàn hàng này\"}");
                return;
            }

            Map<Integer, Integer> chiTiet = getChiTietMap(donHangId);
            boolean nhapOk = tonKhoDAO.nhapLaiKhoHoanHang(chiTiet, donHangId, user.getId());
            if (!nhapOk) {
                out.print("{\"ok\":false,\"msg\":\"Nhập lại kho thất bại\"}");
                return;
            }

            // Cập nhật trạng thái đơn → restocked
            String sql = "UPDATE don_hang SET trang_thai='cho_hoan_tien', restocked_at=NOW(), restocked_by=? "
                       + "WHERE id=? AND trang_thai='cho_hoan_kho'";
            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, user.getHoTen());
                ps.setInt(2, donHangId);
                ps.executeUpdate();
            }

            out.print("{\"ok\":true,\"msg\":\"Nhập lại kho thành công — Admin sẽ xử lý hoàn tiền\"}");
        } catch (NumberFormatException e) {
            out.print("{\"ok\":false,\"msg\":\"donHangId không hợp lệ\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"ok\":false,\"msg\":\"Lỗi server\"}");
        }
    }

    /* ════════════════════════════════════
       HANDLER: searchSanPham
       ?q=keyword
    ════════════════════════════════════ */
    private void handleSearchSanPham(HttpServletRequest req, HttpServletResponse resp, PrintWriter out) {
        String q = req.getParameter("q");
        if (q == null) q = "";
        q = "%" + q.trim() + "%";

        // Query sản phẩm cha
        String sqlSp = "SELECT id, ten_sp, thuong_hieu, gia, so_luong_ton "
                     + "FROM san_pham WHERE is_active=1 AND (ten_sp LIKE ? OR thuong_hieu LIKE ?) "
                     + "ORDER BY ten_sp LIMIT 10";
        // Query variant theo danh sách ID
        String sqlV  = "SELECT ma_san_pham, ten_variant, so_luong "
                     + "FROM san_pham_variant WHERE ma_san_pham IN (%s) ORDER BY ma_san_pham, thu_tu";

        StringBuilder sb = new StringBuilder("[");
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sqlSp)) {
            ps.setString(1, q); ps.setString(2, q);
            ResultSet rs = ps.executeQuery();

            // Bước 1: Đọc sản phẩm cha vào list tạm
            List<int[]>           ids     = new ArrayList<>();  // [id, tonKho]
            List<String[]>        infos   = new ArrayList<>();  // [tenSp, thuongHieu, gia]
            while (rs.next()) {
                ids.add(new int[]{ rs.getInt("id"), rs.getInt("so_luong_ton") });
                infos.add(new String[]{
                    rs.getString("ten_sp"),
                    rs.getString("thuong_hieu"),
                    rs.getBigDecimal("gia") != null ? rs.getBigDecimal("gia").toPlainString() : "0"
                });
            }

            // Bước 2: Load variant cho toàn bộ sản phẩm tìm được (1 query)
            Map<Integer, List<String[]>> varMap = new LinkedHashMap<>();
            if (!ids.isEmpty()) {
                String inClause = ids.stream().map(a -> String.valueOf(a[0]))
                                    .collect(java.util.stream.Collectors.joining(","));
                try (PreparedStatement psV = conn.prepareStatement(
                        String.format(sqlV, inClause));
                     ResultSet rsV = psV.executeQuery()) {
                    while (rsV.next()) {
                        int maSp = rsV.getInt("ma_san_pham");
                        varMap.computeIfAbsent(maSp, k -> new ArrayList<>())
                              .add(new String[]{
                                  rsV.getString("ten_variant"),
                                  String.valueOf(rsV.getInt("so_luong"))
                              });
                    }
                }
            }

            // Bước 3: Build JSON
            for (int i = 0; i < ids.size(); i++) {
                if (i > 0) sb.append(",");
                int id     = ids.get(i)[0];
                int tonKho = ids.get(i)[1];
                String[] inf = infos.get(i);

                // Build mảng variant JSON
                List<String[]> varList = varMap.getOrDefault(id, Collections.emptyList());
                StringBuilder vSb = new StringBuilder("[");
                for (int vi = 0; vi < varList.size(); vi++) {
                    if (vi > 0) vSb.append(",");
                    vSb.append("{\"ten\":\"").append(escapeJson(varList.get(vi)[0]))
                       .append("\",\"soLuong\":").append(varList.get(vi)[1]).append("}");
                }
                vSb.append("]");

                sb.append("{");
                sb.append("\"id\":").append(id).append(",");
                appendJsonStr(sb, "tenSp",      inf[0]); sb.append(",");
                appendJsonStr(sb, "thuongHieu", inf[1]); sb.append(",");
                sb.append("\"gia\":").append(inf[2]).append(",");
                sb.append("\"tonKho\":").append(tonKho).append(",");
                sb.append("\"coVariant\":").append(!varList.isEmpty()).append(",");
                sb.append("\"variants\":").append(vSb);
                sb.append("}");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        sb.append("]");
        out.print("{\"ok\":true,\"data\":" + sb + "}");
    }

    /* ════════════════════════════════════
       HANDLER: nhapHang (POST)
       POST: maSanPham, soLuong, ghiChu
    ════════════════════════════════════ */
    private void handleNhapHang(HttpServletRequest req, HttpServletResponse resp,
                                 PrintWriter out, TaiKhoan user) {
        try {
            int maSanPham     = Integer.parseInt(req.getParameter("maSanPham"));
            int soLuong       = Integer.parseInt(req.getParameter("soLuong"));
            String ghiChu     = req.getParameter("ghiChu");
            String tenVariant = req.getParameter("tenVariant"); // null nếu SP không có variant

            if (soLuong <= 0) {
                out.print("{\"ok\":false,\"msg\":\"Số lượng phải > 0\"}");
                return;
            }

            boolean ok;
            if (tenVariant != null && !tenVariant.trim().isEmpty()) {
                // ── SẢN PHẨM CÓ VARIANT: nhập vào san_pham_variant ──
                ok = tonKhoDAO.nhapHangVariant(maSanPham, tenVariant.trim(),
                                               soLuong, user.getId(), ghiChu);
                if (!ok) {
                    out.print("{\"ok\":false,\"msg\":\"Variant '" + escapeJson(tenVariant) + "' không tồn tại hoặc nhập thất bại\"}");
                    return;
                }
                // Lấy tồn mới của variant vừa nhập để trả về UI
                List<Map<String, Object>> variants = tonKhoDAO.getVariantTonKho(maSanPham);
                StringBuilder vSb = new StringBuilder("[");
                for (int i = 0; i < variants.size(); i++) {
                    if (i > 0) vSb.append(",");
                    Map<String, Object> v = variants.get(i);
                    vSb.append("{\"ten\":\"").append(escapeJson(String.valueOf(v.get("tenVariant"))))
                       .append("\",\"soLuong\":").append(v.get("soLuong")).append("}");
                }
                vSb.append("]");
                out.printf("{\"ok\":true,\"msg\":\"Nhập %d %s thành công\",\"coVariant\":true,\"variants\":%s}",
                    soLuong, escapeJson(tenVariant), vSb);

            } else {
                // ── SẢN PHẨM KHÔNG CÓ VARIANT: nhập vào so_luong_ton ──
                int tonCu = tonKhoDAO.getTonKho(maSanPham);
                ok = tonKhoDAO.nhapHang(maSanPham, soLuong, user.getId(), ghiChu);
                if (!ok) {
                    out.print("{\"ok\":false,\"msg\":\"Nhập hàng thất bại — sản phẩm không tồn tại\"}");
                    return;
                }
                int tonMoi = tonKhoDAO.getTonKho(maSanPham);
                out.printf("{\"ok\":true,\"msg\":\"Nhập %d hộp thành công\",\"coVariant\":false,\"tonCu\":%d,\"tonMoi\":%d}",
                    soLuong, tonCu, tonMoi);
            }
        } catch (NumberFormatException e) {
            out.print("{\"ok\":false,\"msg\":\"Tham số không hợp lệ\"}");
        }
    }

    /* ════════════════════════════════════
       HANDLER: getTonKho
       ?filter=all|low|out|ok&q=keyword
    ════════════════════════════════════ */
    private void handleGetTonKho(HttpServletRequest req, HttpServletResponse resp, PrintWriter out) {
        String filter = req.getParameter("filter");
        String q      = req.getParameter("q");
        if (filter == null) filter = "all";
        if (q == null) q = "";

        String whereFilter = "";
        switch (filter) {
            case "low": whereFilter = " AND sp.so_luong_ton > 0 AND sp.so_luong_ton < 5"; break;
            case "out": whereFilter = " AND sp.so_luong_ton = 0"; break;
            case "ok":  whereFilter = " AND sp.so_luong_ton >= 5"; break;
        }
        String whereQ = q.isEmpty() ? "" : " AND (sp.ten_sp LIKE ? OR sp.thuong_hieu LIKE ?)";

        String sqlSp = "SELECT sp.id, sp.ten_sp, sp.thuong_hieu, sp.gia, sp.so_luong_ton "
                     + "FROM san_pham sp WHERE sp.is_active = 1" + whereFilter + whereQ
                     + " ORDER BY sp.ten_sp";

        String sqlVariant = "SELECT spv.ma_san_pham, spv.ten_variant, spv.so_luong "
                          + "FROM san_pham_variant spv "
                          + "JOIN san_pham sp ON sp.id = spv.ma_san_pham "
                          + "WHERE sp.is_active = 1 "
                          + "ORDER BY spv.ma_san_pham, spv.thu_tu";

        StringBuilder sb = new StringBuilder("[");
        try (Connection conn = DBConnection.getConnection()) {

            // Bước 1: Load toàn bộ variant vào Map<maSanPham, List<"tenVariant|soLuong">>
            Map<Integer, List<String>> variantMap = new LinkedHashMap<>();
            try (PreparedStatement psV = conn.prepareStatement(sqlVariant);
                 ResultSet rsV = psV.executeQuery()) {
                while (rsV.next()) {
                    int maSp  = rsV.getInt("ma_san_pham");
                    String tv = escapeJson(rsV.getString("ten_variant"));
                    int slV   = rsV.getInt("so_luong");
                    variantMap.computeIfAbsent(maSp, k -> new ArrayList<>())
                              .add(tv + "|" + slV);
                }
            }

            // Bước 2: Query sản phẩm, gắn variants vào JSON
            PreparedStatement ps = conn.prepareStatement(sqlSp);
            if (!q.isEmpty()) { String lq = "%" + q + "%"; ps.setString(1, lq); ps.setString(2, lq); }
            ResultSet rs = ps.executeQuery();
            boolean first = true;
            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;
                int id  = rs.getInt("id");
                int ton = rs.getInt("so_luong_ton");

                // Build mảng variants JSON
                List<String> variants = variantMap.getOrDefault(id, Collections.emptyList());
                StringBuilder varSb = new StringBuilder("[");
                for (int vi = 0; vi < variants.size(); vi++) {
                    if (vi > 0) varSb.append(",");
                    String[] parts = variants.get(vi).split("\\|", 2);
                    varSb.append("{\"ten\":\"").append(parts[0])
                         .append("\",\"soLuong\":").append(parts[1]).append("}");
                }
                varSb.append("]");

                sb.append("{");
                sb.append("\"id\":").append(id).append(",");
                appendJsonStr(sb, "tenSp",      rs.getString("ten_sp"));      sb.append(",");
                appendJsonStr(sb, "thuongHieu", rs.getString("thuong_hieu")); sb.append(",");
                sb.append("\"gia\":").append(rs.getBigDecimal("gia")).append(",");
                sb.append("\"tonKho\":").append(ton).append(",");
                appendJsonStr(sb, "tinhTrang", ton == 0 ? "out" : ton < 5 ? "low" : "ok"); sb.append(",");
                sb.append("\"variants\":").append(varSb);
                sb.append("}");
            }
            ps.close();

        } catch (SQLException e) {
            e.printStackTrace();
            out.print("{\"ok\":false,\"msg\":\"Lỗi truy vấn tồn kho\"}");
            return;
        }
        sb.append("]");

        // Thống kê nhanh
        int lowCount = tonKhoDAO.demSapHetHang(10);
        out.print("{\"ok\":true,\"lowCount\":" + lowCount + ",\"data\":" + sb + "}");
    }

    /* ════════════════════════════════════
       HANDLER: getNhatKy
       ?loai=IN|OUT|all&limit=50
    ════════════════════════════════════ */
    private void handleGetNhatKy(HttpServletRequest req, HttpServletResponse resp, PrintWriter out) {
        String loai = req.getParameter("loai");
        String q    = req.getParameter("q");
        int limit   = 100;
        try { limit = Integer.parseInt(req.getParameter("limit")); } catch (Exception ignored) {}

        if ("all".equals(loai) || loai == null) loai = null;

        List<Map<String, Object>> logs = tonKhoDAO.getNhatKyKho(loai, limit);

        // Lọc theo từ khóa nếu có (lọc phía server đơn giản)
        if (q != null && !q.isEmpty()) {
            String qLow = q.toLowerCase();
            logs.removeIf(row ->
                !String.valueOf(row.getOrDefault("tenSp", "")).toLowerCase().contains(qLow) &&
                !String.valueOf(row.getOrDefault("tenNhanVien", "")).toLowerCase().contains(qLow) &&
                !String.valueOf(row.getOrDefault("maDonHang", "")).toLowerCase().contains(qLow) &&
                !String.valueOf(row.getOrDefault("ghiChu", "")).toLowerCase().contains(qLow));
        }

        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Map<String, Object> row : logs) {
            if (!first) sb.append(",");
            first = false;
            sb.append("{");
            sb.append("\"id\":").append(row.get("id")).append(",");
            appendJsonStr(sb, "loai",        String.valueOf(row.getOrDefault("loai", ""))); sb.append(",");
            sb.append("\"soLuong\":").append(row.get("soLuong")).append(",");
            appendJsonStr(sb, "ghiChu",       String.valueOf(row.getOrDefault("ghiChu", ""))); sb.append(",");
            appendJsonStr(sb, "thoiGian",     String.valueOf(row.getOrDefault("thoiGian", ""))); sb.append(",");
            sb.append("\"maDonHang\":").append(row.get("maDonHang") != null
                ? row.get("maDonHang").toString() : "null").append(",");
            appendJsonStr(sb, "tenSp",        String.valueOf(row.getOrDefault("tenSp", ""))); sb.append(",");
            appendJsonStr(sb, "thuongHieu",   String.valueOf(row.getOrDefault("thuongHieu", ""))); sb.append(",");
            appendJsonStr(sb, "tenNhanVien",  String.valueOf(row.getOrDefault("tenNhanVien", "")));
            sb.append("}");
        }
        sb.append("]");
        out.print("{\"ok\":true,\"data\":" + sb + "}");
    }

    /* ════════════════════════════════════
       HANDLER: checkTonKho (public — giỏ hàng gọi)
       ?maSanPham=X hoặc ?ids=1,2,3
    ════════════════════════════════════ */
    private void handleCheckTonKho(HttpServletRequest req, HttpServletResponse resp, PrintWriter out) {
        String ids = req.getParameter("ids");
        if (ids != null && !ids.isEmpty()) {
            // Batch check
            List<Integer> maSps = new ArrayList<>();
            for (String s : ids.split(",")) {
                try { maSps.add(Integer.parseInt(s.trim())); } catch (NumberFormatException ignored) {}
            }
            Map<Integer, Integer> result = tonKhoDAO.getTonKhoBatch(maSps);
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"data\":{");
            boolean first = true;
            for (Map.Entry<Integer, Integer> e : result.entrySet()) {
                if (!first) sb.append(",");
                first = false;
                sb.append("\"").append(e.getKey()).append("\":").append(e.getValue());
            }
            sb.append("}}");
            out.print(sb);
        } else {
            // Single check
            try {
                int maSp = Integer.parseInt(req.getParameter("maSanPham"));
                int ton  = tonKhoDAO.getTonKho(maSp);
                out.printf("{\"ok\":true,\"maSanPham\":%d,\"tonKho\":%d}", maSp, ton);
            } catch (NumberFormatException e) {
                out.print("{\"ok\":false,\"msg\":\"maSanPham không hợp lệ\"}");
            }
        }
    }

    /* ════════════════════════════════════
       PRIVATE HELPERS
    ════════════════════════════════════ */

    /** Đếm đơn theo trạng thái */
    private int demDonTheoTrangThai(String trangThai) throws SQLException {
        String sql = "SELECT COUNT(*) FROM don_hang WHERE trang_thai = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, trangThai);
            ResultSet rs = ps.executeQuery();
            return rs.next() ? rs.getInt(1) : 0;
        }
    }

    /** Lấy chi tiết sản phẩm của đơn hàng dưới dạng JSON string */
    private String getChiTietDonHangJson(int donHangId) throws SQLException {
        String sql = "SELECT ct.ma_san_pham, ct.so_luong, ct.gia, ct.thanh_tien, "
                   + "       ct.ten_san_pham, ct.thuong_hieu, ct.ten_variant "
                   + "FROM chi_tiet_don_hang ct "
                   + "WHERE ct.ma_don_hang = ?";
        StringBuilder sb = new StringBuilder("[");
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, donHangId);
            ResultSet rs = ps.executeQuery();
            boolean first = true;
            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;
                sb.append("{");
                sb.append("\"maSanPham\":").append(rs.getInt("ma_san_pham")).append(",");
                sb.append("\"soLuong\":").append(rs.getInt("so_luong")).append(",");
                sb.append("\"gia\":").append(rs.getBigDecimal("gia")).append(",");
                sb.append("\"thanhTien\":").append(rs.getBigDecimal("thanh_tien")).append(",");
                appendJsonStr(sb, "tenSp",      rs.getString("ten_san_pham")); sb.append(",");
                appendJsonStr(sb, "thuongHieu", rs.getString("thuong_hieu")); sb.append(",");
                appendJsonStr(sb, "tenVariant", rs.getString("ten_variant") != null ? rs.getString("ten_variant") : "");
                sb.append("}");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    /** Lấy chi tiết đơn hàng dưới dạng Map<maSanPham, soLuong> */
    private Map<Integer, Integer> getChiTietMap(int donHangId) throws SQLException {
        Map<Integer, Integer> result = new LinkedHashMap<>();
        String sql = "SELECT ma_san_pham, so_luong FROM chi_tiet_don_hang WHERE ma_don_hang = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, donHangId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) result.put(rs.getInt("ma_san_pham"), rs.getInt("so_luong"));
        }
        return result;
    }

    /** Kiểm tra Admin đã duyệt hoàn hàng chưa */
    private boolean kiemTraRefundApproved(int donHangId) throws SQLException {
        String sql = "SELECT trang_thai FROM don_hang WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, donHangId);
            ResultSet rs = ps.executeQuery();
            return rs.next() && "cho_hoan_kho".equals(rs.getString("trang_thai"));
        }
    }

    /** Ghi key:value JSON string vào StringBuilder */
    private void appendJsonStr(StringBuilder sb, String key, String value) {
        sb.append("\"").append(key).append("\":\"")
          .append(escapeJson(value == null ? "" : value))
          .append("\"");
    }

    /** Escape các ký tự đặc biệt trong JSON string */
    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}