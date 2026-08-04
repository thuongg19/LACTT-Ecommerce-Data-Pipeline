package com.mycompany.websitethuongmaidientu.dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import com.mycompany.websitethuongmaidientu.model.CauHinhDiem;
import com.mycompany.websitethuongmaidientu.model.Voucher;
import com.mycompany.websitethuongmaidientu.util.DBConnection;

public class KhuyenMaiDAO {
    
    private Connection getConnection() throws Exception {
        return DBConnection.getConnection();
    }

    // 1. NGHIỆP VỤ: CẤU HÌNH ĐIỂM THƯỞNG
    
    // Lấy cấu hình điểm hiện tại
    public CauHinhDiem getPolicy() {
        CauHinhDiem policy = new CauHinhDiem();
        String sql = "SELECT * FROM cau_hinh_diem ORDER BY id DESC LIMIT 1";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                policy.setId(rs.getInt("id"));
                policy.setTienTich1Diem(rs.getDouble("tien_tich_1_diem"));
                policy.setMotDiemQuyDoi(rs.getDouble("mot_diem_quy_doi"));
                policy.setFreeshipTu(rs.getDouble("freeship_tu"));
                policy.setQuaTangTu(rs.getDouble("qua_tang_tu"));
                policy.setMaAdmin(rs.getInt("ma_admin"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return policy;
    }

    // Cập nhật cấu hình điểm
    public boolean updatePolicy(double tienTich, double quyDoi, double freeship, double quaTang, int adminId) {
        String sql = "INSERT INTO cau_hinh_diem (tien_tich_1_diem, mot_diem_quy_doi, freeship_tu, qua_tang_tu, ma_admin) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, tienTich);
            ps.setDouble(2, quyDoi);
            ps.setDouble(3, freeship);
            ps.setDouble(4, quaTang);
            ps.setInt(5, adminId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    // 2. NGHIỆP VỤ: QUẢN LÝ VOUCHER
    
    public List<Voucher> getAllVouchers() {
        List<Voucher> list = new ArrayList<>();
        String sql = "SELECT * FROM khuyen_mai ORDER BY created_at DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Voucher v = new Voucher();
                v.setId(rs.getInt("id"));
                v.setVoucherCode(rs.getString("voucher_code"));
                v.setTen(rs.getString("ten"));
                v.setLoai(rs.getString("loai"));
                v.setGiaTriGiam(rs.getDouble("gia_tri_giam"));
                v.setDonHangToiThieu(rs.getDouble("don_hang_toi_thieu"));
                v.setSoLuotToiDa(rs.getObject("so_luot_toi_da") != null ? rs.getInt("so_luot_toi_da") : null);
                v.setSoLuotDaDung(rs.getInt("so_luot_da_dung"));
                v.setGioiHanMoiTk(rs.getInt("gioi_han_moi_tk"));
                v.setNgayBatDau(rs.getDate("ngay_bat_dau"));
                v.setNgayKetThuc(rs.getDate("ngay_ket_thuc"));
                v.setIsActive(rs.getInt("is_active"));
                list.add(v);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public boolean createVoucher(Voucher v) throws SQLException {
        String sql = "INSERT INTO khuyen_mai (voucher_code, ten, loai, gia_tri_giam, don_hang_toi_thieu, so_luot_toi_da, gioi_han_moi_tk, ngay_bat_dau, ngay_ket_thuc, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, v.getVoucherCode());
            ps.setString(2, v.getTen());
            ps.setString(3, v.getLoai());
            ps.setDouble(4, v.getGiaTriGiam());
            ps.setDouble(5, v.getDonHangToiThieu());
            if (v.getSoLuotToiDa() != null) ps.setInt(6, v.getSoLuotToiDa());
            else ps.setNull(6, java.sql.Types.INTEGER);
            ps.setInt(7, v.getGioiHanMoiTk());
            ps.setDate(8, v.getNgayBatDau());
            ps.setDate(9, v.getNgayKetThuc());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw e; 
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    public boolean updateVoucher(Voucher v) {
        String sql = "UPDATE khuyen_mai SET ten = ?, loai = ?, gia_tri_giam = ?, don_hang_toi_thieu = ?, so_luot_toi_da = ?, ngay_bat_dau = ?, ngay_ket_thuc = ? WHERE id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, v.getTen());
            ps.setString(2, v.getLoai());
            ps.setDouble(3, v.getGiaTriGiam());
            ps.setDouble(4, v.getDonHangToiThieu());
            if (v.getSoLuotToiDa() != null) {
                ps.setInt(5, v.getSoLuotToiDa());
            } else {
                ps.setNull(5, java.sql.Types.INTEGER);
            }
            ps.setDate(6, v.getNgayBatDau());
            ps.setDate(7, v.getNgayKetThuc());
            ps.setInt(8, v.getId());
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean toggleVoucherStatus(int id, int isActive) {
        String sql = "UPDATE khuyen_mai SET is_active = ? WHERE id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, isActive);
            ps.setInt(2, id);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    // 3. NGHIỆP VỤ: ĐIỂM KHÁCH HÀNG
    
    public void earnPointAfterOrder(int userId, double totalAmount) {
        CauHinhDiem policy = getPolicy();
        if(policy.getTienTich1Diem() <= 0) return;

        int earnedPoints = (int) (totalAmount / policy.getTienTich1Diem());
        if(earnedPoints <= 0) return;

        String checkWalletSql = "SELECT tong_diem FROM vi_diem WHERE ma_nguoi_dung = ?";
        String insertWalletSql = "INSERT INTO vi_diem (ma_nguoi_dung, tong_diem, gia_tri_quy_doi) VALUES (?, ?, ?)";
        String updateWalletSql = "UPDATE vi_diem SET tong_diem = tong_diem + ?, gia_tri_quy_doi = (tong_diem + ?) * ? WHERE ma_nguoi_dung = ?";
        String logSql = "INSERT INTO lich_su_diem (ma_nguoi_dung, loai, so_diem, ghi_chu) VALUES (?, 'cong', ?, 'Tích điểm mua hàng')";

        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false); 

            try (PreparedStatement checkPs = conn.prepareStatement(checkWalletSql)) {
                checkPs.setInt(1, userId);
                ResultSet rs = checkPs.executeQuery();
                if (rs.next()) {
                    try(PreparedStatement upPs = conn.prepareStatement(updateWalletSql)) {
                        upPs.setInt(1, earnedPoints);
                        upPs.setInt(2, earnedPoints);
                        upPs.setDouble(3, policy.getMotDiemQuyDoi());
                        upPs.setInt(4, userId);
                        upPs.executeUpdate();
                    }
                } else {
                    try(PreparedStatement inPs = conn.prepareStatement(insertWalletSql)) {
                        inPs.setInt(1, userId);
                        inPs.setInt(2, earnedPoints);
                        inPs.setDouble(3, earnedPoints * policy.getMotDiemQuyDoi());
                        inPs.executeUpdate();
                    }
                }
            }

            try(PreparedStatement logPs = conn.prepareStatement(logSql)) {
                logPs.setInt(1, userId);
                logPs.setInt(2, earnedPoints);
                logPs.executeUpdate();
            }

            conn.commit(); 
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}