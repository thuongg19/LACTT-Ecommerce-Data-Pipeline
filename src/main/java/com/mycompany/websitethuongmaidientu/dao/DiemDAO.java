package com.mycompany.websitethuongmaidientu.dao;

import com.mycompany.websitethuongmaidientu.util.DBConnection;
import java.sql.*;

public class DiemDAO {

    /**
     * Cộng điểm cho user sau khi đặt hàng thành công.
     * Tự động đọc cấu hình từ bảng cau_hinh_diem.
     * @param maNguoiDung  ID user
     * @param tongTien     Tổng tiền đơn hàng (sau giảm giá)
     * @param maDonHang    Mã đơn hàng để ghi vào lịch sử
     */
    public static void congDiem(int maNguoiDung, double tongTien, String maDonHang) {
        try (Connection conn = DBConnection.getConnection()) {

            // 1. Đọc cấu hình tỉ lệ điểm
            double tienTich1Diem = 10000; // mặc định
            String sqlCfg = "SELECT tien_tich_1_diem FROM cau_hinh_diem ORDER BY id DESC LIMIT 1";
            try (PreparedStatement ps = conn.prepareStatement(sqlCfg);
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) tienTich1Diem = rs.getDouble(1);
            }

            // 2. Tính số điểm được cộng
            int soDiem = (int)(tongTien / tienTich1Diem);
            if (soDiem <= 0) return; // Đơn quá nhỏ, không đủ 1 điểm

            // 3. Cộng điểm vào vi_diem (tạo mới nếu chưa có)
            String sqlUpsert =
                "INSERT INTO vi_diem (ma_nguoi_dung, tong_diem, gia_tri_quy_doi) " +
                "VALUES (?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE " +
                "tong_diem = tong_diem + VALUES(tong_diem), " +
                "gia_tri_quy_doi = (tong_diem + VALUES(tong_diem)) * (SELECT mot_diem_quy_doi FROM cau_hinh_diem ORDER BY id DESC LIMIT 1)";
            try (PreparedStatement ps = conn.prepareStatement(sqlUpsert)) {
                ps.setInt(1, maNguoiDung);
                ps.setInt(2, soDiem);
                ps.setDouble(3, soDiem * 100); // tạm tính, trigger update sẽ đồng bộ
                ps.executeUpdate();
            }

            // 4. Ghi lịch sử điểm
            String sqlLog =
                "INSERT INTO lich_su_diem (ma_nguoi_dung, ma_don_hang, loai, so_diem, ghi_chu) " +
                "SELECT ?, id, 'cong', ?, CONCAT('Mua hàng đơn ', ?) " +
                "FROM don_hang WHERE ma_don_hang = ? LIMIT 1";
            try (PreparedStatement ps = conn.prepareStatement(sqlLog)) {
                ps.setInt(1, maNguoiDung);
                ps.setInt(2, soDiem);
                ps.setString(3, maDonHang);
                ps.setString(4, maDonHang);
                ps.executeUpdate();
            }

        } catch (Exception e) {
            // Lỗi điểm không ảnh hưởng đơn hàng
            System.err.println("[DiemDAO] Lỗi cộng điểm: " + e.getMessage());
        }
    }

    /**
     * Trừ điểm khi user dùng điểm để giảm giá.
     * @param maNguoiDung  ID user
     * @param soDiem       Số điểm muốn dùng
     * @param maDonHang    Mã đơn hàng
     * @return true nếu trừ thành công, false nếu không đủ điểm
     */
    public static boolean truDiem(int maNguoiDung, int soDiem, String maDonHang) {
        try (Connection conn = DBConnection.getConnection()) {

            // Kiểm tra đủ điểm không
            String sqlCheck = "SELECT tong_diem FROM vi_diem WHERE ma_nguoi_dung = ?";
            int hienCo = 0;
            try (PreparedStatement ps = conn.prepareStatement(sqlCheck)) {
                ps.setInt(1, maNguoiDung);
                ResultSet rs = ps.executeQuery();
                if (rs.next()) hienCo = rs.getInt(1);
            }
            if (hienCo < soDiem) return false; // Không đủ điểm

            // Trừ điểm
            String sqlTru =
    "UPDATE vi_diem SET " +
    "tong_diem = GREATEST(0, tong_diem - ?), " +
    "da_su_dung = da_su_dung + ?, " +
    "gia_tri_quy_doi = GREATEST(0, tong_diem - ?) * " +
    "(SELECT mot_diem_quy_doi FROM cau_hinh_diem ORDER BY id DESC LIMIT 1) " +
    "WHERE ma_nguoi_dung = ? AND tong_diem >= ?";
try (PreparedStatement ps = conn.prepareStatement(sqlTru)) {
    ps.setInt(1, soDiem);
    ps.setInt(2, soDiem);
    ps.setInt(3, soDiem);
    ps.setInt(4, maNguoiDung);
    ps.setInt(5, soDiem);
    int rows = ps.executeUpdate();
    if (rows == 0) return false;
}
            // Ghi lịch sử
            String sqlLog =
                "INSERT INTO lich_su_diem (ma_nguoi_dung, ma_don_hang, loai, so_diem, ghi_chu) " +
                "SELECT ?, id, 'tru', ?, CONCAT('Dùng điểm giảm giá đơn ', ?) " +
                "FROM don_hang WHERE ma_don_hang = ? LIMIT 1";
            try (PreparedStatement ps = conn.prepareStatement(sqlLog)) {
                ps.setInt(1, maNguoiDung);
                ps.setInt(2, soDiem);
                ps.setString(3, maDonHang);
                ps.setString(4, maDonHang);
                ps.executeUpdate();
            }

            return true;

        } catch (Exception e) {
            System.err.println("[DiemDAO] Lỗi trừ điểm: " + e.getMessage());
            return false;
        }
    }

    /**
     * Lấy số điểm hiện tại của user.
     */
    public static int getTongDiem(int maNguoiDung) {
        String sql = "SELECT tong_diem FROM vi_diem WHERE ma_nguoi_dung = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maNguoiDung);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt(1);
        } catch (Exception e) {
            System.err.println("[DiemDAO] Lỗi lấy điểm: " + e.getMessage());
        }
        return 0;
    }
}