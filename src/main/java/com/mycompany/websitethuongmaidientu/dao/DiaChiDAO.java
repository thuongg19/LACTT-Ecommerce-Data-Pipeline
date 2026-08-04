package com.mycompany.websitethuongmaidientu.dao;

import com.mycompany.websitethuongmaidientu.model.DiaChi;
import com.mycompany.websitethuongmaidientu.util.DBConnection;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class DiaChiDAO {
    public List<DiaChi> getByUserId(int userId) {
        List<DiaChi> list = new ArrayList<>();
        String sql = "SELECT * FROM dia_chi WHERE ma_nguoi_dung = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public DiaChi getById(int id) {
        String sql = "SELECT * FROM dia_chi WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public boolean insert(DiaChi diaChi) {
        String sql = "INSERT INTO dia_chi (ma_nguoi_dung, ten_nguoi_nhan, so_dien_thoai, dia_chi_cu_the, is_default) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection()) {
            if (diaChi.isMacDinh()) {
                resetMacDinh(diaChi.getMaNguoiDung(), conn);
            }
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, diaChi.getMaNguoiDung());
                ps.setString(2, diaChi.getTenNguoiNhan());
                ps.setString(3, diaChi.getSoDienThoai());
                ps.setString(4, diaChi.getDiaChiCuThe());
                ps.setBoolean(5, diaChi.isMacDinh());
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return false;
    }


    public boolean update(DiaChi diaChi) {
        String sql = "UPDATE dia_chi SET ten_nguoi_nhan=?, so_dien_thoai=?, dia_chi_cu_the=?, is_default=? WHERE id=?";
        try (Connection conn = DBConnection.getConnection()) {
            if (diaChi.isMacDinh()) {
                // Lấy userId từ DB vì model diaChi không chứa maNguoiDung trong update
                DiaChi existing = getById(diaChi.getId());
                if (existing != null) resetMacDinh(existing.getMaNguoiDung(), conn);
            }
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, diaChi.getTenNguoiNhan());
                ps.setString(2, diaChi.getSoDienThoai());
                ps.setString(3, diaChi.getDiaChiCuThe());
                ps.setBoolean(4, diaChi.isMacDinh());
                ps.setInt(5, diaChi.getId());
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return false;
    }

    public boolean delete(int id) {
        String sql = "DELETE FROM dia_chi WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    private void resetMacDinh(int userId, Connection conn) throws SQLException {
        String sql = "UPDATE dia_chi SET is_default = 0 WHERE ma_nguoi_dung = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        }
    }

    private DiaChi mapRow(ResultSet rs) throws SQLException {
        DiaChi d = new DiaChi();
        d.setId(rs.getInt("id"));
        d.setMaNguoiDung(rs.getInt("ma_nguoi_dung"));
        d.setTenNguoiNhan(rs.getString("ten_nguoi_nhan"));
        d.setSoDienThoai(rs.getString("so_dien_thoai"));
        d.setDiaChiCuThe(rs.getString("dia_chi_cu_the"));
        d.setMacDinh(rs.getBoolean("is_default"));
        return d;
    }
}