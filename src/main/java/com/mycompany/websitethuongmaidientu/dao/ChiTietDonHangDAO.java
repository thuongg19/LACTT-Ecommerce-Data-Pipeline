package com.mycompany.websitethuongmaidientu.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import com.mycompany.websitethuongmaidientu.model.ChiTietDonHang;
import com.mycompany.websitethuongmaidientu.util.DBConnection;

public class ChiTietDonHangDAO {

    /**
     * Lấy danh sách sản phẩm trong một đơn hàng theo ID đơn hàng (số nguyên).
     * Kết hợp JOIN với bảng san_pham để lấy thêm hình ảnh sản phẩm.
     */
    public List<ChiTietDonHang> getByDonHangId(int maDonHang) {
        List<ChiTietDonHang> list = new ArrayList<>();
        String sql = "SELECT ct.*, sp.hinh_anh " +
                     "FROM chi_tiet_don_hang ct " +
                     "LEFT JOIN san_pham sp ON ct.ma_san_pham = sp.id " +
                     "WHERE ct.ma_don_hang = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maDonHang);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                ChiTietDonHang ct = new ChiTietDonHang();
                ct.setId(rs.getInt("id"));
                ct.setMaDonHang(rs.getInt("ma_don_hang"));
                ct.setMaSanPham(rs.getInt("ma_san_pham"));
                ct.setTenSanPham(rs.getString("ten_san_pham"));
                ct.setThuongHieu(rs.getString("thuong_hieu"));
                ct.setTenVariant(rs.getString("ten_variant"));
                ct.setSoLuong(rs.getInt("so_luong"));
                ct.setGia(rs.getBigDecimal("gia"));
                ct.setThanhTien(rs.getBigDecimal("thanh_tien"));
                ct.setHinhAnh(rs.getString("hinh_anh"));
                list.add(ct);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public void insertListChiTiet(Connection conn, List<ChiTietDonHang> listChiTiet, int idDonHang) throws SQLException {
        String sql = "INSERT INTO chi_tiet_don_hang (ma_don_hang, ma_san_pham, ten_san_pham, thuong_hieu, ten_variant, so_luong, gia, thanh_tien) "
                   + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (ChiTietDonHang ct : listChiTiet) {
                ps.setInt(1, idDonHang);
                ps.setInt(2, ct.getMaSanPham());
                ps.setString(3, ct.getTenSanPham());
                ps.setString(4, ct.getThuongHieu());
                ps.setString(5, ct.getTenVariant());
                ps.setInt(6, ct.getSoLuong());
                ps.setBigDecimal(7, ct.getGia());
                ps.setBigDecimal(8, ct.getThanhTien());
                
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }
}