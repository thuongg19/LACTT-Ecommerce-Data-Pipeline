package com.mycompany.websitethuongmaidientu.dao;

import com.mycompany.websitethuongmaidientu.model.TaiKhoan;
import com.mycompany.websitethuongmaidientu.util.DBConnection;
import java.sql.*;

public class TaiKhoanDAO {
    // Cập nhật thông tin tài khoản
    public boolean update(TaiKhoan tk) {
        String sql = "UPDATE tai_khoan SET ho_ten=?, email=?, so_dien_thoai=?, ngay_sinh=?, gioi_tinh=?, loai_da=? WHERE id=?";
        try (Connection conn = DBConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, tk.getHoTen());
            ps.setString(2, tk.getEmail());
            ps.setString(3, tk.getSoDienThoai());
            // Xử lý null an toàn cho ngày sinh
            if (tk.getNgaySinh() != null) {
                ps.setDate(4, tk.getNgaySinh());
            } else {
                ps.setNull(4, java.sql.Types.DATE);
            }
            ps.setString(5, tk.getGioiTinh());
            ps.setString(6, tk.getLoaiDa());
            ps.setInt(7, tk.getId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // Tìm tài khoản theo email (KHÔNG lọc is_active — để Servlet xử lý thông báo lỗi đúng)
    public TaiKhoan findByEmail(String email) {
        String sql = "SELECT * FROM tai_khoan WHERE email = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
    // Kiểm tra đăng nhập (khớp email, mật khẩu và tài khoản đang hoạt động)
    public TaiKhoan checkLogin(String email, String matKhauHash) {
        String sql = "SELECT * FROM tai_khoan WHERE email = ? AND mat_khau = ? AND is_active = 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ps.setString(2, matKhauHash);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return mapRow(rs);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // Kiểm tra email đã tồn tại chưa (dùng khi đăng ký)
    public boolean emailTonTai(String email) {
        String sql = "SELECT id FROM tai_khoan WHERE email = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            return rs.next();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // Đăng ký tài khoản mới
    public boolean insert(TaiKhoan tk) {
        String sql = "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, vai_tro) "
                   + "VALUES (?, ?, ?, ?, ?, 'khach_hang')";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, tk.getEmail()); // dùng email làm tên đăng nhập
            ps.setString(2, tk.getMatKhau());
            ps.setString(3, tk.getHoTen());
            ps.setString(4, tk.getEmail());
            ps.setString(5, tk.getSoDienThoai());
            int rows = ps.executeUpdate();

            // Tạo ví điểm cho user mới
            if (rows > 0) {
                ResultSet keys = ps.getGeneratedKeys();
                if (keys.next()) {
                    int newId = keys.getInt(1);
                    taoViDiem(conn, newId);
                }
            }
            return rows > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // Tự động tạo ví điểm khi đăng ký
    private void taoViDiem(Connection conn, int maNguoiDung) {
        String sql = "INSERT INTO vi_diem (ma_nguoi_dung, tong_diem, gia_tri_quy_doi) VALUES (?, 0, 0)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, maNguoiDung);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // Map kết quả SQL → object TaiKhoan
    private TaiKhoan mapRow(ResultSet rs) throws SQLException {
        TaiKhoan tk = new TaiKhoan();
        tk.setId(rs.getInt("id"));
        tk.setTenDangNhap(rs.getString("ten_dang_nhap"));
        tk.setMatKhau(rs.getString("mat_khau"));   // ← cần để Servlet so sánh MD5
        tk.setHoTen(rs.getString("ho_ten"));
        tk.setEmail(rs.getString("email"));
        tk.setSoDienThoai(rs.getString("so_dien_thoai"));
        tk.setVaiTro(rs.getString("vai_tro"));
        tk.setIsActive(rs.getInt("is_active"));
        tk.setGioiTinh(rs.getString("gioi_tinh"));
        tk.setLoaiDa(rs.getString("loai_da"));
        tk.setNgaySinh(rs.getDate("ngay_sinh"));
        return tk;
    }
// =========================================================================
    // CÁC HÀM BỔ SUNG CHO TÍNH NĂNG ADMIN (QUẢN LÝ NGƯỜI DÙNG)
    // =========================================================================

    // 1. Lấy danh sách kèm số đơn hàng và tổng điểm
    public java.util.List<TaiKhoan> getAllUsers(String roleFilter) {
        java.util.List<TaiKhoan> list = new java.util.ArrayList<>();
        String sql = "SELECT t.*, "
                   + "(SELECT COUNT(*) FROM don_hang d WHERE d.ma_nguoi_dung = t.id) AS so_don_hang, "
                   + "COALESCE((SELECT tong_diem FROM vi_diem v WHERE v.ma_nguoi_dung = t.id), 0) AS tong_diem "
                   + "FROM tai_khoan t ";
        
        if (!"all".equals(roleFilter)) {
            sql += "WHERE t.vai_tro = ? ";
        }
        sql += "ORDER BY t.created_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            
            if (!"all".equals(roleFilter)) {
                ps.setString(1, roleFilter);
            }
            
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                TaiKhoan tk = mapRow(rs); // Tái sử dụng hàm mapRow cũ
                tk.setSoDonHang(rs.getInt("so_don_hang"));
                tk.setTongDiem(rs.getInt("tong_diem"));
                list.add(tk);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // 2. Lấy thông tin 1 user (Dùng cho Popup Sửa/Khóa)
    public TaiKhoan getById(int id) {
        String sql = "SELECT t.*, "
                   + "(SELECT COUNT(*) FROM don_hang d WHERE d.ma_nguoi_dung = t.id) AS so_don_hang, "
                   + "COALESCE((SELECT tong_diem FROM vi_diem v WHERE v.ma_nguoi_dung = t.id), 0) AS tong_diem "
                   + "FROM tai_khoan t WHERE t.id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                TaiKhoan tk = mapRow(rs);
                tk.setSoDonHang(rs.getInt("so_don_hang"));
                tk.setTongDiem(rs.getInt("tong_diem"));
                return tk;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // 3. Khóa tài khoản và ghi Log
    public boolean lockAccount(int userId, String reason, int adminId) {
        String sqlUpdate = "UPDATE tai_khoan SET is_active = 0, khoa_den_luc = NOW() WHERE id = ?";
        String sqlLog = "INSERT INTO log_he_thong (ma_nguoi_dung, hanh_dong, noi_dung) VALUES (?, 'Khóa tài khoản', ?)";
        
        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement psUpdate = conn.prepareStatement(sqlUpdate);
                 PreparedStatement psLog = conn.prepareStatement(sqlLog)) {
                
                psUpdate.setInt(1, userId);
                int updated = psUpdate.executeUpdate();

                psLog.setInt(1, adminId);
                psLog.setString(2, "Đã khóa user ID " + userId + ". Lý do: " + reason);
                psLog.executeUpdate();

                conn.commit();
                return updated > 0;
            } catch (SQLException ex) {
                conn.rollback();
                ex.printStackTrace();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 4. Mở khóa tài khoản
    public boolean unlockAccount(int userId, int adminId) {
        String sql = "UPDATE tai_khoan SET is_active = 1, khoa_den_luc = NULL, so_lan_sai = 0 WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            
            // Tùy chọn: Em có thể gọi thêm INSERT log_he_thong ở đây nếu muốn
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 5. Cập nhật phân quyền
    public boolean updateRole(int userId, String newRole, int adminId) {
        String sql = "UPDATE tai_khoan SET vai_tro = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newRole);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 6. Sửa profile từ phía Admin (Check trùng email)
    public boolean updateProfile(int userId, String hoTen, String email, String phone, String gioiTinh, String loaiDa, java.util.Date ngaySinh, int adminId) {
        String sql = "UPDATE tai_khoan SET ho_ten=?, email=?, so_dien_thoai=?, gioi_tinh=?, loai_da=?, ngay_sinh=? WHERE id=?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, hoTen);
            ps.setString(2, email);
            ps.setString(3, phone);
            ps.setString(4, gioiTinh);
            ps.setString(5, loaiDa);
            if (ngaySinh != null) {
                ps.setDate(6, new java.sql.Date(ngaySinh.getTime()));
            } else {
                ps.setNull(6, java.sql.Types.DATE);
            }
            ps.setInt(7, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 7. Check trùng email cho Admin Edit
    public boolean isEmailExists(String email, int excludeUserId) {
        String sql = "SELECT id FROM tai_khoan WHERE email = ? AND id != ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ps.setInt(2, excludeUserId);
            ResultSet rs = ps.executeQuery();
            return rs.next();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    // 8. Reset mật khẩu về mặc định (VD: '123456' -> dùng MD5)
    public boolean resetPassword(int userId, int adminId) {
        String sql = "UPDATE tai_khoan SET mat_khau = MD5('123456') WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
// Tìm tài khoản theo số điện thoại
public TaiKhoan findBySoDienThoai(String sdt) {
    String sql = "SELECT * FROM tai_khoan WHERE so_dien_thoai = ?";
    try (Connection conn = DBConnection.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, sdt);
        ResultSet rs = ps.executeQuery();
        if (rs.next()) return mapRow(rs);
    } catch (SQLException e) {
        e.printStackTrace();
    }
    return null;
}

public TaiKhoan insertBySdt(String sdt, String hoTen, String email) {
    String tenLuu = (hoTen != null && !hoTen.trim().isEmpty()) 
                    ? hoTen.trim() 
                    : "Khách " + sdt;

    // ✅ FIX: dùng NULL thay vì "" để không vi phạm UNIQUE constraint
    String emailLuu = (email != null && !email.trim().isEmpty()) 
                      ? email.trim().toLowerCase() 
                      : null;  // ← đổi "" thành null

    String sql = "INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, vai_tro) "
               + "VALUES (?, MD5(?), ?, ?, ?, 'khach_hang')";
    try (Connection conn = DBConnection.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
        ps.setString(1, sdt);
        ps.setString(2, sdt);
        ps.setString(3, tenLuu);
        // ✅ FIX: dùng setNull khi email không có, không dùng setString("")
        if (emailLuu != null) {
            ps.setString(4, emailLuu);
        } else {
            ps.setNull(4, java.sql.Types.VARCHAR);
        }
        ps.setString(5, sdt);
        int rows = ps.executeUpdate();
        if (rows > 0) {
            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) {
                int newId = keys.getInt(1);
                taoViDiem(conn, newId);
                return findBySoDienThoai(sdt);
            }
        }
    } catch (SQLException e) {
        e.printStackTrace();
    }
    return null;
}
}