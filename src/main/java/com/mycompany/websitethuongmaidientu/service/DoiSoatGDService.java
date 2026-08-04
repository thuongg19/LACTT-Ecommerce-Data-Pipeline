package com.mycompany.websitethuongmaidientu.service;

import com.mycompany.websitethuongmaidientu.model.GiaoDichDTO;
import com.mycompany.websitethuongmaidientu.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Date;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

public class DoiSoatGDService {

    public List<GiaoDichDTO> getTransactions(Date fromDate, Date toDate) {
        List<GiaoDichDTO> result = new ArrayList<>();

        String sql = "SELECT " +
            "COALESCE(gd.ma_tham_chieu, bt.ma_giao_dich) as ma_gd, " +
            "COALESCE(gd.so_tien, 0) as so_tien_he_thong, " +
            "COALESCE(bt.so_tien, 0) as so_tien_ngan_hang, " +
            "COALESCE(bt.thoi_gian, gd.thoi_gian) as ngay_gd, " +
            "dh.ten_nguoi_nhan as khach_hang, " +
            "COALESCE(bt.ngan_hang, gd.phuong_thuc) as ngan_hang, " +
            "CASE " +
                "WHEN gd.trang_thai_doi_soat = 'KHOP' THEN 'KHOP' " + // Đã fix: Luôn ưu tiên trạng thái do User bấm xác nhận tay
                "WHEN gd.ma_tham_chieu IS NULL THEN 'THIEU_HT' " +
                "WHEN bt.ma_giao_dich IS NULL THEN 'THIEU_NH' " +
                "WHEN ABS(COALESCE(gd.so_tien, 0) - COALESCE(bt.so_tien, 0)) > 0 THEN 'SAI_LECH' " +
                "ELSE 'KHOP' " +
            "END as trang_thai, " +
            "COALESCE(bt.so_tien, 0) - COALESCE(gd.so_tien, 0) as chenh_lech " +
            "FROM bank_transactions bt " +
            "LEFT JOIN giao_dich gd ON bt.ma_giao_dich = gd.ma_giao_dich_ngan_hang " +
            "LEFT JOIN don_hang dh ON gd.ma_don_hang = dh.id " +
            "WHERE DATE(bt.thoi_gian) >= ? " +
            "AND DATE(bt.thoi_gian) <= ? " +
            "UNION " +
            "SELECT " +
            "gd.ma_tham_chieu as ma_gd, " +
            "gd.so_tien as so_tien_he_thong, " +
            "0 as so_tien_ngan_hang, " +
            "gd.thoi_gian as ngay_gd, " +
            "dh.ten_nguoi_nhan as khach_hang, " +
            "gd.phuong_thuc as ngan_hang, " +
            "CASE " +
                "WHEN gd.trang_thai_doi_soat = 'KHOP' THEN 'KHOP' " + // Đã fix: Ưu tiên trạng thái thủ công
                "ELSE 'THIEU_NH' " +
            "END as trang_thai, " +
            "0 - gd.so_tien as chenh_lech " +
            "FROM giao_dich gd " +
            "LEFT JOIN don_hang dh ON gd.ma_don_hang = dh.id " +
            "WHERE DATE(gd.thoi_gian) >= ? " +
            "AND DATE(gd.thoi_gian) <= ? " +
            "AND NOT EXISTS ( " +
                "SELECT 1 FROM bank_transactions bt2 " +
                "WHERE bt2.ma_giao_dich = gd.ma_giao_dich_ngan_hang " +
            ") " +
            "ORDER BY ngay_gd DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setDate(1, fromDate);
            ps.setDate(2, toDate);
            ps.setDate(3, fromDate);
            ps.setDate(4, toDate);

            try (ResultSet rs = ps.executeQuery()) {
                SimpleDateFormat sdfDate = new SimpleDateFormat("dd/MM/yyyy HH:mm");
                while (rs.next()) {
                    GiaoDichDTO dto = new GiaoDichDTO();
                    dto.setMaGD(rs.getString("ma_gd"));
                    
                    if (rs.getTimestamp("ngay_gd") != null) {
                        dto.setNgayGD(sdfDate.format(rs.getTimestamp("ngay_gd")));
                    } else {
                        dto.setNgayGD("N/A");
                    }
                    
                    dto.setKhachHang(rs.getString("khach_hang"));
                    dto.setSoTienHeThong(rs.getDouble("so_tien_he_thong"));
                    dto.setSoTienNganHang(rs.getDouble("so_tien_ngan_hang"));
                    dto.setNganHang(rs.getString("ngan_hang"));
                    dto.setTrangThai(rs.getString("trang_thai"));
                    dto.setChenhLech(rs.getDouble("chenh_lech"));
                    
                    result.add(dto);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }

    public boolean updateTrangThaiDoiSoat(String maGD, String trangThai) {
        // Đã fix: Bắt cả ma_tham_chieu HOẶC ma_giao_dich_ngan_hang để update chính xác
        String sql = "UPDATE giao_dich SET trang_thai_doi_soat = ? WHERE ma_tham_chieu = ? OR ma_giao_dich_ngan_hang = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, trangThai);
            ps.setString(2, maGD);
            ps.setString(3, maGD);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean confirmAllMatched(Date fromDate, Date toDate) {
        String sql = "UPDATE giao_dich SET trang_thai_doi_soat = 'KHOP' WHERE DATE(thoi_gian) BETWEEN ? AND ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate);
            ps.setDate(2, toDate);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}