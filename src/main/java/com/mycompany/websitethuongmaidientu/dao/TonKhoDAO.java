package com.mycompany.websitethuongmaidientu.dao;

import com.mycompany.websitethuongmaidientu.util.DBConnection;
import java.sql.*;
import java.util.*;

/**
 * TonKhoDAO — Quản lý tồn kho & nhật ký kho
 *
 * Giả định schema:
 *   san_pham(id, ten_sp, thuong_hieu, gia, so_luong_ton, is_active, ...)
 *   nhat_ky_kho(id, ma_san_pham, loai [IN/OUT], so_luong,
 *               ghi_chu, ma_don_hang, ma_nhan_vien, thoi_gian)
 */
public class TonKhoDAO {

    /* ══════════════════════════════════════════
       1. KIỂM TRA TỒN KHO
    ══════════════════════════════════════════ */

    /**
     * Lấy số lượng tồn kho của một sản phẩm.
     * @return số lượng tồn, hoặc -1 nếu không tìm thấy sản phẩm.
     */
    public int getTonKho(int maSanPham) {
        String sql = "SELECT so_luong_ton FROM san_pham WHERE id = ? AND is_active = 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maSanPham);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("so_luong_ton");
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }

    /**
     * Kiểm tra xem sản phẩm có đủ tồn để xuất hay không.
     */
    public boolean kiemTraDuTon(int maSanPham, int soLuongCan) {
        return getTonKho(maSanPham) >= soLuongCan;
    }

    /**
     * Kiểm tra đồng thời nhiều sản phẩm trong một đơn hàng.
     * @param chiTietDonHang Map<maSanPham, soLuongCan>
     * @return Map<maSanPham, thongBaoLoi> — rỗng nghĩa là đủ hàng
     */
    public Map<Integer, String> kiemTraDuTonDonHang(Map<Integer, Integer> chiTietDonHang) {
        Map<Integer, String> loi = new LinkedHashMap<>();
        if (chiTietDonHang == null || chiTietDonHang.isEmpty()) return loi;

        // Lấy tồn kho cho tất cả sản phẩm trong một query
        String inClause = String.join(",",
            Collections.nCopies(chiTietDonHang.size(), "?"));
        String sql = "SELECT id, ten_sp, so_luong_ton FROM san_pham WHERE id IN (" + inClause + ")";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            int i = 1;
            for (int maSp : chiTietDonHang.keySet()) ps.setInt(i++, maSp);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                int maSp   = rs.getInt("id");
                String ten = rs.getString("ten_sp");
                int ton    = rs.getInt("so_luong_ton");
                int can    = chiTietDonHang.get(maSp);
                if (ton < can) {
                    loi.put(maSp, String.format(
                        "\"%s\": cần %d, còn %d", ten, can, ton));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            loi.put(-1, "Lỗi kiểm tra tồn kho: " + e.getMessage());
        }
        return loi;
    }

    /* ══════════════════════════════════════════
       2. XUẤT KHO (trừ tồn)
    ══════════════════════════════════════════ */

    /**
     * Trừ tồn kho và ghi nhật ký XUẤT.
     * Chạy trong transaction: nếu bất kỳ sản phẩm nào lỗi → rollback toàn bộ.
     *
     * @param chiTietDonHang Map<maSanPham, soLuong>
     * @param maDonHang      mã đơn hàng (ghi vào nhật ký)
     * @param maNhanVien     id nhân viên kho thực hiện
     * @param ghiChu         ghi chú thêm
     * @return true nếu thành công
     */
    public boolean xuatKho(Map<Integer, Integer> chiTietDonHang,
                           int maDonHang, int maNhanVien, String ghiChu) {
        String sqlTru  = "UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE id = ? AND so_luong_ton >= ?";
        String sqlLog  = "INSERT INTO nhat_ky_kho (ma_san_pham, loai, so_luong, ghi_chu, ma_don_hang, ma_nhan_vien, thoi_gian) "
                       + "VALUES (?, 'OUT', ?, ?, ?, ?, NOW())";

        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement psTru = conn.prepareStatement(sqlTru);
                 PreparedStatement psLog = conn.prepareStatement(sqlLog)) {

                for (Map.Entry<Integer, Integer> e : chiTietDonHang.entrySet()) {
                    int maSp = e.getKey();
                    int sl   = e.getValue();

                    // Trừ tồn — WHERE so_luong_ton >= sl đảm bảo không âm
                    psTru.setInt(1, sl);
                    psTru.setInt(2, maSp);
                    psTru.setInt(3, sl);
                    int rows = psTru.executeUpdate();
                    if (rows == 0) {
                        conn.rollback();
                        return false; // không đủ tồn
                    }

                    // Ghi nhật ký
                    psLog.setInt(1, maSp);
                    psLog.setInt(2, sl);
                    psLog.setString(3, ghiChu != null ? ghiChu : "Xuất theo đơn #" + maDonHang);
                    psLog.setInt(4, maDonHang);
                    psLog.setInt(5, maNhanVien);
                    psLog.addBatch();
                }
                psLog.executeBatch();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            return false;
        } finally {
            if (conn != null) try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ex) { ex.printStackTrace(); }
        }
    }

    /**
     * Chỉ ghi nhật ký XUẤT kho — KHÔNG trừ tồn.
     * Dùng khi tồn đã bị trừ lúc khách đặt hàng (DonHangServlet).
     */
    public boolean ghiNhatKyXuatKho(Map<Integer, Integer> chiTietDonHang,
                                     int maDonHang, int maNhanVien, String ghiChu) {
        String sqlLog = "INSERT INTO nhat_ky_kho (ma_san_pham, loai, so_luong, ghi_chu, ma_don_hang, ma_nhan_vien, thoi_gian) "
                      + "VALUES (?, 'OUT', ?, ?, ?, ?, NOW())";
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);
            try (PreparedStatement psLog = conn.prepareStatement(sqlLog)) {
                for (Map.Entry<Integer, Integer> e : chiTietDonHang.entrySet()) {
                    psLog.setInt(1, e.getKey());
                    psLog.setInt(2, e.getValue());
                    psLog.setString(3, ghiChu != null ? ghiChu : "Xuất theo đơn #" + maDonHang);
                    psLog.setInt(4, maDonHang);
                    psLog.setInt(5, maNhanVien);
                    psLog.addBatch();
                }
                psLog.executeBatch();
            }
            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            return false;
        } finally {
            if (conn != null) try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ex) { ex.printStackTrace(); }
        }
    }

    /* ══════════════════════════════════════════
       3. NHẬP HÀNG (cộng tồn)
    ══════════════════════════════════════════ */

    /**
     * Nhập hàng mới: cộng tồn kho và ghi nhật ký NHẬP.
     *
     * @param maSanPham  id sản phẩm
     * @param soLuong    số lượng nhập
     * @param maNhanVien id nhân viên thực hiện
     * @param ghiChu     ghi chú lô hàng
     * @return true nếu thành công
     */
    public boolean nhapHang(int maSanPham, int soLuong, int maNhanVien, String ghiChu) {
        String sqlCong = "UPDATE san_pham SET so_luong_ton = so_luong_ton + ? WHERE id = ? AND is_active = 1";
        String sqlLog  = "INSERT INTO nhat_ky_kho (ma_san_pham, loai, so_luong, ghi_chu, ma_don_hang, ma_nhan_vien, thoi_gian) "
                       + "VALUES (?, 'IN', ?, ?, NULL, ?, NOW())";

        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement psCong = conn.prepareStatement(sqlCong);
                 PreparedStatement psLog  = conn.prepareStatement(sqlLog)) {

                psCong.setInt(1, soLuong);
                psCong.setInt(2, maSanPham);
                int rows = psCong.executeUpdate();
                if (rows == 0) { conn.rollback(); return false; }

                psLog.setInt(1, maSanPham);
                psLog.setInt(2, soLuong);
                psLog.setString(3, ghiChu != null ? ghiChu : "Nhập hàng");
                psLog.setInt(4, maNhanVien);
                psLog.executeUpdate();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            return false;
        } finally {
            if (conn != null) try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ex) { ex.printStackTrace(); }
        }
    }

    /**
     * Nhập hàng cho một VARIANT cụ thể (30ml / 50ml / 100ml).
     * Cộng tồn vào san_pham_variant và ghi nhật ký.
     *
     * @param maSanPham  ID sản phẩm cha
     * @param tenVariant Tên variant (ví dụ: "50ml")
     * @param soLuong    Số lượng nhập
     * @param maNhanVien ID nhân viên
     * @param ghiChu     Ghi chú lô hàng
     * @return true nếu thành công
     */
    public boolean nhapHangVariant(int maSanPham, String tenVariant,
                                   int soLuong, int maNhanVien, String ghiChu) {
        String sqlVariant = "UPDATE san_pham_variant SET so_luong = so_luong + ? "
                          + "WHERE ma_san_pham = ? AND ten_variant = ?";
        String sqlLog     = "INSERT INTO nhat_ky_kho (ma_san_pham, loai, so_luong, ghi_chu, ma_don_hang, ma_nhan_vien, thoi_gian) "
                          + "VALUES (?, 'IN', ?, ?, NULL, ?, NOW())";

        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement psV = conn.prepareStatement(sqlVariant);
                 PreparedStatement psLog = conn.prepareStatement(sqlLog)) {

                psV.setInt(1, soLuong);
                psV.setInt(2, maSanPham);
                psV.setString(3, tenVariant);
                int rows = psV.executeUpdate();
                if (rows == 0) { conn.rollback(); return false; } // Variant không tồn tại

                String note = (ghiChu != null && !ghiChu.isEmpty())
                    ? ghiChu : "Nhập hàng variant " + tenVariant;
                psLog.setInt(1, maSanPham);
                psLog.setInt(2, soLuong);
                psLog.setString(3, note + " [" + tenVariant + "]");
                psLog.setInt(4, maNhanVien);
                psLog.executeUpdate();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            return false;
        } finally {
            if (conn != null) try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ex) { ex.printStackTrace(); }
        }
    }

    /**
     * Lấy tồn kho của từng variant theo maSanPham.
     * Trả về List gồm [tenVariant, soLuong].
     */
    public List<Map<String, Object>> getVariantTonKho(int maSanPham) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT ten_variant, so_luong FROM san_pham_variant "
                   + "WHERE ma_san_pham = ? ORDER BY thu_tu ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maSanPham);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("tenVariant", rs.getString("ten_variant"));
                row.put("soLuong",    rs.getInt("so_luong"));
                list.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Trừ tồn kho theo ten_variant (dùng khi xuất kho đơn có variant).
     * Nếu ten_variant null/rỗng → fallback trừ so_luong_ton của sản phẩm cha.
     */
    public boolean xuatKhoVoiVariant(int maSanPham, String tenVariant,
                                     int soLuong, int maDonHang,
                                     int maNhanVien, String ghiChu) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            if (tenVariant != null && !tenVariant.trim().isEmpty()) {
                // Trừ tồn variant
                String sqlV = "UPDATE san_pham_variant SET so_luong = so_luong - ? "
                            + "WHERE ma_san_pham = ? AND ten_variant = ? AND so_luong >= ?";
                try (PreparedStatement ps = conn.prepareStatement(sqlV)) {
                    ps.setInt(1, soLuong);
                    ps.setInt(2, maSanPham);
                    ps.setString(3, tenVariant);
                    ps.setInt(4, soLuong);
                    if (ps.executeUpdate() == 0) { conn.rollback(); return false; }
                }
            } else {
                // Fallback: trừ tồn sản phẩm cha
                String sqlP = "UPDATE san_pham SET so_luong_ton = so_luong_ton - ? "
                            + "WHERE id = ? AND so_luong_ton >= ?";
                try (PreparedStatement ps = conn.prepareStatement(sqlP)) {
                    ps.setInt(1, soLuong);
                    ps.setInt(2, maSanPham);
                    ps.setInt(3, soLuong);
                    if (ps.executeUpdate() == 0) { conn.rollback(); return false; }
                }
            }

            // Ghi nhật ký
            String sqlLog = "INSERT INTO nhat_ky_kho (ma_san_pham, loai, so_luong, ghi_chu, ma_don_hang, ma_nhan_vien, thoi_gian) "
                          + "VALUES (?, 'OUT', ?, ?, ?, ?, NOW())";
            try (PreparedStatement ps = conn.prepareStatement(sqlLog)) {
                String note = (ghiChu != null ? ghiChu : "Xuất theo đơn #" + maDonHang)
                            + (tenVariant != null && !tenVariant.isEmpty() ? " [" + tenVariant + "]" : "");
                ps.setInt(1, maSanPham);
                ps.setInt(2, soLuong);
                ps.setString(3, note);
                ps.setInt(4, maDonHang);
                ps.setInt(5, maNhanVien);
                ps.executeUpdate();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            return false;
        } finally {
            if (conn != null) try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ex) { ex.printStackTrace(); }
        }
    }

    /**
     * Nhập lại kho sau khi khách hoàn hàng (refund).
     * Ghi chú tự động kèm mã đơn.
     */
    public boolean nhapLaiKhoHoanHang(Map<Integer, Integer> chiTietDonHang,
                                      int maDonHang, int maNhanVien) {
        String sqlCong = "UPDATE san_pham SET so_luong_ton = so_luong_ton + ? WHERE id = ?";
        String sqlLog  = "INSERT INTO nhat_ky_kho (ma_san_pham, loai, so_luong, ghi_chu, ma_don_hang, ma_nhan_vien, thoi_gian) "
                       + "VALUES (?, 'IN', ?, ?, ?, ?, NOW())";

        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement psCong = conn.prepareStatement(sqlCong);
                 PreparedStatement psLog  = conn.prepareStatement(sqlLog)) {

                for (Map.Entry<Integer, Integer> e : chiTietDonHang.entrySet()) {
                    int maSp = e.getKey();
                    int sl   = e.getValue();

                    psCong.setInt(1, sl);
                    psCong.setInt(2, maSp);
                    psCong.addBatch();

                    psLog.setInt(1, maSp);
                    psLog.setInt(2, sl);
                    psLog.setString(3, "Nhập lại do hoàn hàng đơn #" + maDonHang);
                    psLog.setInt(4, maDonHang);
                    psLog.setInt(5, maNhanVien);
                    psLog.addBatch();
                }
                psCong.executeBatch();
                psLog.executeBatch();
            }

            conn.commit();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            if (conn != null) try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            return false;
        } finally {
            if (conn != null) try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ex) { ex.printStackTrace(); }
        }
    }

    /* ══════════════════════════════════════════
       4. THỐNG KÊ & NHẬT KÝ
    ══════════════════════════════════════════ */

    /**
     * Lấy danh sách toàn bộ sản phẩm kèm tồn kho (cho trang Soi tồn kho).
     */
    public List<Map<String, Object>> getDanhSachTonKho() {
        List<Map<String, Object>> result = new ArrayList<>();
        String sql = "SELECT id, ten_sp, thuong_hieu, gia, so_luong_ton, is_active "
                   + "FROM san_pham WHERE is_active = 1 ORDER BY ten_sp";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id",          rs.getInt("id"));
                row.put("tenSp",       rs.getString("ten_sp"));
                row.put("thuongHieu",  rs.getString("thuong_hieu"));
                row.put("gia",         rs.getBigDecimal("gia"));
                row.put("tonKho",      rs.getInt("so_luong_ton"));
                result.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return result;
    }

    /**
     * Lấy nhật ký kho (tất cả hoặc theo loại IN/OUT).
     * @param loai "IN" | "OUT" | null (tất cả)
     * @param limit số dòng tối đa
     */
    public List<Map<String, Object>> getNhatKyKho(String loai, int limit) {
        List<Map<String, Object>> result = new ArrayList<>();
        String where = (loai != null && !loai.isEmpty()) ? "WHERE nk.loai = ? " : "";
        String sql = "SELECT nk.id, nk.loai, nk.so_luong, nk.ghi_chu, nk.thoi_gian, "
                   + "       nk.ma_don_hang, "
                   + "       sp.ten_sp, sp.thuong_hieu, "
                   + "       tk.ho_ten AS ten_nhan_vien "
                   + "FROM nhat_ky_kho nk "
                   + "JOIN san_pham sp ON sp.id = nk.ma_san_pham "
                   + "LEFT JOIN tai_khoan tk ON tk.id = nk.ma_nhan_vien "
                   + where
                   + "ORDER BY nk.thoi_gian DESC LIMIT ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            int idx = 1;
            if (loai != null && !loai.isEmpty()) ps.setString(idx++, loai);
            ps.setInt(idx, limit);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id",          rs.getInt("id"));
                row.put("loai",        rs.getString("loai"));
                row.put("soLuong",     rs.getInt("so_luong"));
                row.put("ghiChu",      rs.getString("ghi_chu"));
                row.put("thoiGian",    rs.getTimestamp("thoi_gian"));
                row.put("maDonHang",   rs.getObject("ma_don_hang")); // nullable
                row.put("tenSp",       rs.getString("ten_sp"));
                row.put("thuongHieu",  rs.getString("thuong_hieu"));
                row.put("tenNhanVien", rs.getString("ten_nhan_vien"));
                result.add(row);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return result;
    }

    /**
     * Đếm số lượng xuất/nhập trong ngày hôm nay (cho Stats).
     * @param loai "IN" hoặc "OUT"
     */
    public int tongSoLuongHomNay(String loai) {
        String sql = "SELECT COALESCE(SUM(so_luong), 0) FROM nhat_ky_kho "
                   + "WHERE loai = ? AND DATE(thoi_gian) = CURDATE()";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, loai);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    /**
     * Đếm sản phẩm sắp hết hàng (tồn < nguongCanhBao).
     */
    public int demSapHetHang(int nguongCanhBao) {
        String sql = "SELECT COUNT(*) FROM san_pham WHERE is_active = 1 AND so_luong_ton < ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, nguongCanhBao);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    /**
     * Lấy tồn kho theo tên sản phẩm (dùng cho check nhanh từ giỏ hàng).
     * Trả về Map<maSanPham, tonKho> cho list sản phẩm.
     */
    public Map<Integer, Integer> getTonKhoBatch(List<Integer> dsMaSanPham) {
        Map<Integer, Integer> result = new LinkedHashMap<>();
        if (dsMaSanPham == null || dsMaSanPham.isEmpty()) return result;

        String inClause = String.join(",", Collections.nCopies(dsMaSanPham.size(), "?"));
        String sql = "SELECT id, so_luong_ton FROM san_pham WHERE id IN (" + inClause + ") AND is_active = 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < dsMaSanPham.size(); i++) ps.setInt(i + 1, dsMaSanPham.get(i));
            ResultSet rs = ps.executeQuery();
            while (rs.next()) result.put(rs.getInt("id"), rs.getInt("so_luong_ton"));
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return result;
    }
}