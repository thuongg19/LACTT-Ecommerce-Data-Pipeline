package com.mycompany.websitethuongmaidientu.dao;

import com.mycompany.websitethuongmaidientu.model.SanPham;
import com.mycompany.websitethuongmaidientu.util.DBConnection;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SanPhamDAO {

    // ─────────────────────────────────────────────────────────────
    //  MAP SLUG → TÊN THẬT TRONG DB
    // ─────────────────────────────────────────────────────────────
    private String mapSlugToThuongHieu(String slug) {
        if (slug == null) return "";
        switch (slug.trim().toLowerCase()) {
            case "lancome":      return "LANCÔME";
            case "loreal":       return "L'ORÉAL";
            case "esteelauder":  return "ESTÉE LAUDER";
            case "innisfree":    return "INNISFREE";
            case "skii":         return "SK-II";
            case "laneige":      return "LANEIGE";
            case "theordinary":  return "THE ORDINARY";
            case "fentybeauty":  return "FENTY BEAUTY";
            case "chanel":       return "CHANEL";
            case "kiehls":       return "KIEHL'S";
            case "shiseido":     return "SHISEIDO";
            case "anessa":       return "ANESSA";
            case "dior":         return "DIOR BEAUTY";
            case "clinique":     return "CLINIQUE";
            default:             return slug.trim();
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  1. LẤY DANH SÁCH SẢN PHẨM
    // ─────────────────────────────────────────────────────────────

    public List<SanPham> getAllActive() {
        String sql = "SELECT * FROM san_pham WHERE is_active = 1 ORDER BY created_at DESC";
        return queryList(sql);
    }

    public List<SanPham> getFeatured(int limit) {
        String sql = "SELECT * FROM san_pham WHERE is_active = 1 AND is_featured = 1 "
                   + "ORDER BY so_luong_ban DESC LIMIT ?";
        List<SanPham> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<SanPham> getNewArrivals(int limit) {
        String sql = "SELECT * FROM san_pham WHERE is_active = 1 AND is_new = 1 "
                   + "ORDER BY created_at DESC LIMIT ?";
        List<SanPham> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<SanPham> getByDanhMuc(int maDanhMuc) {
        String sql = "SELECT * FROM san_pham WHERE is_active = 1 AND ma_danh_muc = ? "
                   + "ORDER BY created_at DESC";
        List<SanPham> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maDanhMuc);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }
    
    public List<SanPham> getAllForAdmin() {
        // Lấy tất cả sản phẩm (is_active = 1 hoặc 0) và JOIN để lấy tên danh mục
        String sql = "SELECT sp.*, dm.ten_danh_muc FROM san_pham sp "
                   + "LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.id "
                   + "ORDER BY sp.id DESC";
        List<SanPham> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                SanPham sp = mapRow(rs);
                sp.setTenDanhMuc(rs.getString("ten_danh_muc")); // Lấy tên danh mục
                list.add(sp);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }
    // ─────────────────────────────────────────────────────────────
    //  2. PHÂN TRANG + LỌC
    // ─────────────────────────────────────────────────────────────

    public List<SanPham> getFiltered(int maDanhMuc, String thuongHieu,
                                     BigDecimal giaMin, BigDecimal giaMax,
                                     String sapXep, int page, int pageSize) {

        StringBuilder sql = new StringBuilder("SELECT * FROM san_pham WHERE is_active = 1 ");
        List<Object> params = new ArrayList<>();

        if (maDanhMuc > 0) { sql.append("AND ma_danh_muc = ? "); params.add(maDanhMuc); }

        if (thuongHieu != null && !thuongHieu.isEmpty()) {
            String[] slugs = thuongHieu.split(",");
            sql.append("AND (");
            for (int i = 0; i < slugs.length; i++) {
                if (i > 0) sql.append(" OR ");
                sql.append("thuong_hieu = ?");
                params.add(mapSlugToThuongHieu(slugs[i]));
            }
            sql.append(") ");
        }

        if (giaMin != null) { sql.append("AND gia >= ? "); params.add(giaMin); }
        if (giaMax != null) { sql.append("AND gia <= ? "); params.add(giaMax); }

        switch (sapXep == null ? "" : sapXep) {
            case "ban_chay": sql.append("ORDER BY so_luong_ban DESC ");  break;
            case "gia_tang": sql.append("ORDER BY gia ASC ");            break;
            case "gia_giam": sql.append("ORDER BY gia DESC ");           break;
            case "danh_gia": sql.append("ORDER BY diem_danh_gia DESC "); break;
            default:         sql.append("ORDER BY created_at DESC ");    break;
        }

        sql.append("LIMIT ? OFFSET ?");
        params.add(pageSize);
        params.add((page - 1) * pageSize);

        List<SanPham> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public int countFiltered(int maDanhMuc, String thuongHieu,
                             BigDecimal giaMin, BigDecimal giaMax) {

        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM san_pham WHERE is_active = 1 ");
        List<Object> params = new ArrayList<>();

        if (maDanhMuc > 0) { sql.append("AND ma_danh_muc = ? "); params.add(maDanhMuc); }

        if (thuongHieu != null && !thuongHieu.isEmpty()) {
            String[] slugs = thuongHieu.split(",");
            sql.append("AND (");
            for (int i = 0; i < slugs.length; i++) {
                if (i > 0) sql.append(" OR ");
                sql.append("thuong_hieu = ?");
                params.add(mapSlugToThuongHieu(slugs[i]));
            }
            sql.append(") ");
        }

        if (giaMin != null) { sql.append("AND gia >= ? "); params.add(giaMin); }
        if (giaMax != null) { sql.append("AND gia <= ? "); params.add(giaMax); }

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt(1);
        } catch (SQLException e) { e.printStackTrace(); }
        return 0;
    }

    // ─────────────────────────────────────────────────────────────
    //  3. CHI TIẾT SẢN PHẨM
    // ─────────────────────────────────────────────────────────────

    public SanPham getById(int id) {
        String sql = "SELECT * FROM san_pham WHERE id = ? AND is_active = 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapRow(rs);
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public List<SanPham> getLienQuan(int maDanhMuc, int excludeId, int limit) {
        String sql = "SELECT * FROM san_pham WHERE is_active = 1 "
                   + "AND ma_danh_muc = ? AND id != ? ORDER BY RAND() LIMIT ?";
        List<SanPham> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maDanhMuc);
            ps.setInt(2, excludeId);
            ps.setInt(3, limit);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    // ─────────────────────────────────────────────────────────────
    //  4. VARIANTS — MỚI THÊM
    //  Trả về danh sách variant dạng JSON-ready string list
    //  Mỗi variant: { id, tenVariant, gia, giaGoc, soLuong }
    // ─────────────────────────────────────────────────────────────

    public List<String[]> getVariants(int maSanPham) {
        String sql = "SELECT id, ten_variant, gia, gia_goc, so_luong "
                   + "FROM san_pham_variant "
                   + "WHERE ma_san_pham = ? "
                   + "ORDER BY thu_tu ASC";
        List<String[]> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maSanPham);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                // [id, tenVariant, gia, giaGoc, soLuong]
                list.add(new String[]{
                    String.valueOf(rs.getInt("id")),
                    rs.getString("ten_variant"),
                    String.valueOf(rs.getBigDecimal("gia")),
                    rs.getBigDecimal("gia_goc") != null
                        ? String.valueOf(rs.getBigDecimal("gia_goc")) : "0",
                    String.valueOf(rs.getInt("so_luong"))
                });
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    // ─────────────────────────────────────────────────────────────
    //  5. TÌM KIẾM
    // ─────────────────────────────────────────────────────────────

    public List<SanPham> search(String keyword) {
        String sql = "SELECT sp.* FROM san_pham sp "
                   + "LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.id "
                   + "WHERE sp.is_active = 1 "
                   + "AND (sp.ten_sp LIKE ? OR sp.thuong_hieu LIKE ? "
                   + "  OR sp.mo_ta LIKE ? OR dm.ten_danh_muc LIKE ?) "
                   + "ORDER BY sp.so_luong_ban DESC";
        List<SanPham> list = new ArrayList<>();
        String kw = "%" + keyword + "%";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, kw); ps.setString(2, kw);
            ps.setString(3, kw); ps.setString(4, kw);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    // ─────────────────────────────────────────────────────────────
    //  6. THÊM / SỬA / XÓA
    // ─────────────────────────────────────────────────────────────

    public boolean insert(SanPham sp) {
        String sql = "INSERT INTO san_pham "
                   + "(ma_danh_muc, ten_sp, thuong_hieu, mo_ta, thanh_phan, "
                   + " huong_dan_su_dung, gia, gia_goc, hinh_anh, is_featured, is_new, is_active) "
                   + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, sp.getMaDanhMuc());
            ps.setString(2, sp.getTenSp());
            ps.setString(3, sp.getThuongHieu());
            ps.setString(4, sp.getMoTa());
            ps.setString(5, sp.getThanhPhan());
            ps.setString(6, sp.getHuongDanSuDung());
            ps.setBigDecimal(7, sp.getGia());
            ps.setBigDecimal(8, sp.getGiaGoc());
            ps.setString(9, sp.getHinhAnh());
            ps.setInt(10, sp.getIsFeatured());
            ps.setInt(11, sp.getIsNew());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) { e.printStackTrace(); }
        return false;
    }

    public boolean update(SanPham sp) {
        String sql = "UPDATE san_pham SET "
                   + "ma_danh_muc=?, ten_sp=?, thuong_hieu=?, mo_ta=?, "
                   + "thanh_phan=?, huong_dan_su_dung=?, gia=?, gia_goc=?, "
                   + "hinh_anh=?, is_featured=?, is_new=? WHERE id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, sp.getMaDanhMuc());
            ps.setString(2, sp.getTenSp());
            ps.setString(3, sp.getThuongHieu());
            ps.setString(4, sp.getMoTa());
            ps.setString(5, sp.getThanhPhan());
            ps.setString(6, sp.getHuongDanSuDung());
            ps.setBigDecimal(7, sp.getGia());
            ps.setBigDecimal(8, sp.getGiaGoc());
            ps.setString(9, sp.getHinhAnh());
            ps.setInt(10, sp.getIsFeatured());
            ps.setInt(11, sp.getIsNew());
            ps.setInt(12, sp.getId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) { e.printStackTrace(); }
        return false;
    }

    public boolean deactivate(int id) {
        String sql = "UPDATE san_pham SET is_active = 0 WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id); return ps.executeUpdate() > 0;
        } catch (SQLException e) { e.printStackTrace(); }
        return false;
    }

    public boolean activate(int id) {
        String sql = "UPDATE san_pham SET is_active = 1 WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id); return ps.executeUpdate() > 0;
        } catch (SQLException e) { e.printStackTrace(); }
        return false;
    }

    // ─────────────────────────────────────────────────────────────
    //  7. TỒN KHO
    // ─────────────────────────────────────────────────────────────

    public boolean truTonKho(Connection conn, int maSanPham, int soLuong) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT so_luong_ton FROM san_pham WHERE id = ? FOR UPDATE")) {
            ps.setInt(1, maSanPham);
            ResultSet rs = ps.executeQuery();
            if (!rs.next() || rs.getInt("so_luong_ton") < soLuong) return false;
        }
        try (PreparedStatement ps = conn.prepareStatement(
                "UPDATE san_pham SET so_luong_ton=so_luong_ton-?, so_luong_ban=so_luong_ban+? "
                + "WHERE id=? AND so_luong_ton>=?")) {
            ps.setInt(1, soLuong); ps.setInt(2, soLuong);
            ps.setInt(3, maSanPham); ps.setInt(4, soLuong);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean nhapKho(int maSanPham, int soLuongNhap) {
        String sql = "UPDATE san_pham SET so_luong_ton = so_luong_ton + ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, soLuongNhap); ps.setInt(2, maSanPham);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) { e.printStackTrace(); }
        return false;
    }

    public int getTonKho(int maSanPham) {
        String sql = "SELECT so_luong_ton FROM san_pham WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maSanPham);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("so_luong_ton");
        } catch (SQLException e) { e.printStackTrace(); }
        return 0;
    }

    // ─────────────────────────────────────────────────────────────
    //  8. THƯƠNG HIỆU
    // ─────────────────────────────────────────────────────────────

    public List<String> getAllThuongHieu() {
        String sql = "SELECT DISTINCT thuong_hieu FROM san_pham WHERE is_active=1 ORDER BY thuong_hieu ASC";
        List<String> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(rs.getString("thuong_hieu"));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    // ─────────────────────────────────────────────────────────────
    //  9. FLASH SALE
    // ─────────────────────────────────────────────────────────────

    public List<SanPham> getFlashSaleProducts() {
        String sql = "SELECT sp.* FROM san_pham sp "
                   + "JOIN flash_sale fs ON sp.id = fs.ma_san_pham "
                   + "WHERE sp.is_active=1 AND fs.is_active=1 "
                   + "AND fs.ngay_bat_dau<=NOW() AND fs.ngay_ket_thuc>=NOW() "
                   + "ORDER BY fs.phan_tram_giam DESC LIMIT 6";
        return queryList(sql);
    }

    public List<SanPham> getFlashSaleProducts(int limit) {
        String sql = "SELECT sp.* FROM san_pham sp "
                   + "JOIN flash_sale fs ON sp.id = fs.ma_san_pham "
                   + "WHERE sp.is_active=1 AND fs.is_active=1 "
                   + "AND fs.ngay_bat_dau<=NOW() AND fs.ngay_ket_thuc>=NOW() "
                   + "ORDER BY fs.phan_tram_giam DESC LIMIT ?";
        List<SanPham> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    // ─────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    private List<SanPham> queryList(String sql) {
        List<SanPham> list = new ArrayList<>();
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    private SanPham mapRow(ResultSet rs) throws SQLException {
        SanPham sp = new SanPham();
        sp.setId(rs.getInt("id"));
        sp.setMaDanhMuc(rs.getInt("ma_danh_muc"));
        sp.setTenSp(rs.getString("ten_sp"));
        sp.setThuongHieu(rs.getString("thuong_hieu"));
        sp.setMoTa(rs.getString("mo_ta"));
        sp.setThanhPhan(rs.getString("thanh_phan"));
        sp.setHuongDanSuDung(rs.getString("huong_dan_su_dung"));
        sp.setGia(rs.getBigDecimal("gia"));
        sp.setGiaGoc(rs.getBigDecimal("gia_goc"));
        sp.setSoLuongBan(rs.getInt("so_luong_ban"));
        sp.setDiemDanhGia(rs.getDouble("diem_danh_gia"));
        sp.setSoDanhGia(rs.getInt("so_danh_gia"));
        sp.setHinhAnh(rs.getString("hinh_anh"));
        sp.setSoLuongTon(rs.getInt("so_luong_ton")); // FIX: thiếu dòng này khiến soLuongTon=0 → disable nút
        sp.setIsActive(rs.getInt("is_active"));
        sp.setIsFeatured(rs.getInt("is_featured"));
        sp.setIsNew(rs.getInt("is_new"));
        sp.setCreatedAt(rs.getTimestamp("created_at"));
        return sp;
    }
}