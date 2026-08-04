package com.mycompany.websitethuongmaidientu.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.mycompany.websitethuongmaidientu.model.DonHang;
import com.mycompany.websitethuongmaidientu.util.DBConnection;

public class DonHangDAO {

    // =========================================================================
    // 1. HÀM THÊM ĐƠN HÀNG MỚI (Dùng cho lúc thanh toán, có dùng Transaction)
    // =========================================================================
    public int insertDonHang(Connection conn, DonHang donHang) throws SQLException {
        String sql = "INSERT INTO don_hang (ma_nguoi_dung, ma_dia_chi, ma_don_hang, ten_nguoi_nhan, so_dien_thoai, dia_chi_giao, ghi_chu, tong_tam_tinh, phi_van_chuyen, giam_gia, tong_tien, phuong_thuc_tt) "
                   + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, donHang.getMaNguoiDung());
            
            // Xử lý null an toàn cho mã địa chỉ
            if (donHang.getMaDiaChi() != null && donHang.getMaDiaChi() > 0) {
                ps.setInt(2, donHang.getMaDiaChi());
            } else {
                ps.setNull(2, java.sql.Types.INTEGER);
            }
            
            ps.setString(3, donHang.getMaDonHang());
            ps.setString(4, donHang.getTenNguoiNhan());
            ps.setString(5, donHang.getSoDienThoai());
            ps.setString(6, donHang.getDiaChiGiao());
            ps.setString(7, donHang.getGhiChu());
            
            ps.setBigDecimal(8, donHang.getTongTamTinh());
            ps.setBigDecimal(9, donHang.getPhiVanChuyen());
            ps.setBigDecimal(10, donHang.getGiamGia());
            ps.setBigDecimal(11, donHang.getTongTien());
            ps.setString(12, donHang.getPhuongThucTT());

            int affectedRows = ps.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Tạo đơn hàng thất bại, không có dòng nào được thêm.");
            }

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                } else {
                    throw new SQLException("Tạo đơn hàng thất bại, không lấy được ID.");
                }
            }
        }
    }

    // =========================================================================
    // 2. HÀM LẤY DANH SÁCH ĐƠN HÀNG (Dùng cho trang Tài khoản - TaiKhoanServlet)
    // =========================================================================
    public List<DonHang> getByUserId(int userId) {
        List<DonHang> list = new ArrayList<>();
        // Lấy danh sách đơn hàng, sắp xếp mới nhất lên đầu
        String sql = "SELECT * FROM don_hang WHERE ma_nguoi_dung = ? ORDER BY ngay_dat DESC";
        
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
             
            ps.setInt(1, userId);
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    DonHang dh = new DonHang();
                    dh.setId(rs.getInt("id"));
                    dh.setMaNguoiDung(rs.getInt("ma_nguoi_dung"));
                    
                    // Xử lý an toàn cho mã địa chỉ (có thể null trong database)
                    int maDiaChi = rs.getInt("ma_dia_chi");
                    if (!rs.wasNull()) {
                        dh.setMaDiaChi(maDiaChi);
                    }
                    
                    dh.setMaDonHang(rs.getString("ma_don_hang"));
                    dh.setTenNguoiNhan(rs.getString("ten_nguoi_nhan"));
                    dh.setSoDienThoai(rs.getString("so_dien_thoai"));
                    dh.setDiaChiGiao(rs.getString("dia_chi_giao"));
                    dh.setGhiChu(rs.getString("ghi_chu"));
                    
                    // Lấy kiểu BigDecimal cho tiền tệ
                    dh.setTongTamTinh(rs.getBigDecimal("tong_tam_tinh"));
                    dh.setPhiVanChuyen(rs.getBigDecimal("phi_van_chuyen"));
                    dh.setGiamGia(rs.getBigDecimal("giam_gia"));
                    dh.setTongTien(rs.getBigDecimal("tong_tien"));
                    
                    dh.setPhuongThucTT(rs.getString("phuong_thuc_tt"));
                    dh.setTrangThai(rs.getString("trang_thai"));
                    dh.setNgayDat(rs.getTimestamp("ngay_dat")); // Lấy cả ngày lẫn giờ
                    
                    list.add(dh);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return list;
    }
}