package com.mycompany.websitethuongmaidientu.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import com.mycompany.websitethuongmaidientu.dao.ChiTietDonHangDAO;
import com.mycompany.websitethuongmaidientu.dao.DonHangDAO;
import com.mycompany.websitethuongmaidientu.dao.SanPhamDAO;
import com.mycompany.websitethuongmaidientu.dao.DiemDAO;
import com.mycompany.websitethuongmaidientu.model.ChiTietDonHang;
import com.mycompany.websitethuongmaidientu.model.DonHang;
import com.mycompany.websitethuongmaidientu.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.sql.Connection;
import java.util.List;

@WebServlet("/DonHangServlet")
public class DonHangServlet extends HttpServlet {

    private final DonHangDAO donHangDAO = new DonHangDAO();
    private final SanPhamDAO sanPhamDAO = new SanPhamDAO();
    private final ChiTietDonHangDAO chiTietDAO = new ChiTietDonHangDAO();
    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json; charset=UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        Integer maNguoiDung = (session != null) ? (Integer) session.getAttribute("maNguoiDung") : null;
        if (maNguoiDung == null) {
            out.print("{\"status\": \"error\", \"message\": \"Vui lòng đăng nhập\"}");
            return;
        }

        Connection conn = null;
        try {
            BufferedReader reader = request.getReader();
            JsonObject jsonObject = gson.fromJson(reader, JsonObject.class);

            if (jsonObject == null || !jsonObject.has("donHang") || !jsonObject.has("listChiTiet")) {
                out.print("{\"status\": \"error\", \"message\": \"Dữ liệu rỗng\"}");
                return;
            }

            JsonObject dhJson = jsonObject.getAsJsonObject("donHang");
            DonHang donHang = new DonHang();
            
            donHang.setMaNguoiDung(maNguoiDung);
            donHang.setMaDonHang("LACTT-" + System.currentTimeMillis());
            donHang.setTenNguoiNhan(getStringFromJson(dhJson, "tenNguoiNhan"));
            donHang.setSoDienThoai(getStringFromJson(dhJson, "soDienThoai"));
            donHang.setDiaChiGiao(getStringFromJson(dhJson, "diaChiGiao"));
            donHang.setGhiChu(getStringFromJson(dhJson, "ghiChu"));
            donHang.setPhuongThucTT(getStringFromJson(dhJson, "phuongThucTT"));

            donHang.setTongTamTinh(getBigDecimalFromJson(dhJson, "tongTamTinh"));
            donHang.setPhiVanChuyen(getBigDecimalFromJson(dhJson, "phiVanChuyen"));
            donHang.setGiamGia(getBigDecimalFromJson(dhJson, "giamGia"));
            donHang.setTongTien(getBigDecimalFromJson(dhJson, "tongTien"));
            int diemSuDung = 0;
            if (dhJson.has("diemSuDung") && !dhJson.get("diemSuDung").isJsonNull()) {
                diemSuDung = dhJson.get("diemSuDung").getAsInt();
                // Dùng giamGiaDiem (số tiền thực sự giảm bằng điểm) để tính số điểm cần trừ
                // KHÔNG dùng tongTien vì tongTien đã bị trừ điểm rồi — sẽ bị tính sai
                double giamGiaDiem = 0;
                if (dhJson.has("giamGiaDiem") && !dhJson.get("giamGiaDiem").isJsonNull()) {
                    try { giamGiaDiem = Double.parseDouble(dhJson.get("giamGiaDiem").getAsString()); } catch (Exception ignored) {}
                }
                // 1 điểm = 100đ
                int diemCanDung = (int) Math.ceil(giamGiaDiem / 100);
                diemSuDung = Math.min(diemSuDung, diemCanDung);
            }

            if (dhJson.has("maDiaChi") && !dhJson.get("maDiaChi").isJsonNull()) {
                donHang.setMaDiaChi(dhJson.get("maDiaChi").getAsInt());
            }

            java.lang.reflect.Type listType = new TypeToken<List<ChiTietDonHang>>(){}.getType();
            List<ChiTietDonHang> listChiTiet = gson.fromJson(jsonObject.get("listChiTiet"), listType);

            conn = DBConnection.getConnection();
            DBConnection.beginTransaction(conn);

            // =================================================================
            // ✅ FIX LỖI 4: Kiểm tra tồn kho TRƯỚC khi tạo đơn hàng
            // =================================================================
            for (ChiTietDonHang ct : listChiTiet) {
                if (ct.getMaSanPham() <= 0 || ct.getSoLuong() <= 0) continue;
                
                String tenVariant = ct.getTenVariant();
                boolean coVariant = tenVariant != null && !tenVariant.trim().isEmpty();
                
                if (coVariant) {
                    // Kiểm tra tồn kho variant
                    try (java.sql.PreparedStatement psCheck = conn.prepareStatement(
                            "SELECT so_luong FROM san_pham_variant " +
                            "WHERE ma_san_pham = ? AND ten_variant = ? FOR UPDATE")) {
                        psCheck.setInt(1, ct.getMaSanPham());
                        psCheck.setString(2, tenVariant.trim());
                        java.sql.ResultSet rsCheck = psCheck.executeQuery();
                        if (!rsCheck.next()) {
                            throw new Exception("Không tìm thấy phân loại \"" + tenVariant + "\".");
                        }
                        int tonKho = rsCheck.getInt("so_luong");
                        if (tonKho < ct.getSoLuong()) {
                            throw new Exception("Mỹ phẩm \"" + ct.getTenSanPham() + " - " + tenVariant
                                + "\" chỉ còn " + tonKho + " sản phẩm, không đủ số lượng yêu cầu (" + ct.getSoLuong() + ").");
                        }
                    }
                } else {
                    // Kiểm tra tồn kho sản phẩm không variant
                    try (java.sql.PreparedStatement psCheck = conn.prepareStatement(
                            "SELECT so_luong_ton FROM san_pham WHERE id = ? FOR UPDATE")) {
                        psCheck.setInt(1, ct.getMaSanPham());
                        java.sql.ResultSet rsCheck = psCheck.executeQuery();
                        if (!rsCheck.next()) {
                            throw new Exception("Không tìm thấy sản phẩm ID " + ct.getMaSanPham() + ".");
                        }
                        int tonKho = rsCheck.getInt("so_luong_ton");
                        if (tonKho < ct.getSoLuong()) {
                            throw new Exception("Mỹ phẩm \"" + ct.getTenSanPham()
                                + "\" chỉ còn " + tonKho + " sản phẩm, không đủ số lượng yêu cầu (" + ct.getSoLuong() + ").");
                        }
                    }
                }
            }

            // =================================================================
            // ✅ Tất cả hàng đủ tồn kho → Tiến hành tạo đơn và trừ kho
            // =================================================================
            int idDonHangMoi = donHangDAO.insertDonHang(conn, donHang);
            chiTietDAO.insertListChiTiet(conn, listChiTiet, idDonHangMoi);

            // Trừ tồn kho cho từng sản phẩm trong cùng transaction
            for (ChiTietDonHang ct : listChiTiet) {
                if (ct.getMaSanPham() <= 0 || ct.getSoLuong() <= 0) continue;

                String tenVariant = ct.getTenVariant();
                boolean coVariant = tenVariant != null && !tenVariant.trim().isEmpty();

                if (coVariant) {
                    // Sản phẩm CÓ variant → trừ san_pham_variant.so_luong theo ten_variant
                    try (java.sql.PreparedStatement ps = conn.prepareStatement(
                            "UPDATE san_pham_variant SET so_luong = so_luong - ? " +
                            "WHERE ma_san_pham = ? AND ten_variant = ? AND so_luong >= ?")) {
                        ps.setInt(1, ct.getSoLuong());
                        ps.setInt(2, ct.getMaSanPham());
                        ps.setString(3, tenVariant.trim());
                        ps.setInt(4, ct.getSoLuong());
                        int rows = ps.executeUpdate();
                        if (rows == 0) {
                            throw new Exception("Phân loại \"" + tenVariant + "\" của sản phẩm ID "
                                + ct.getMaSanPham() + " không đủ tồn kho.");
                        }
                    }
                } else {
                    // Sản phẩm KHÔNG có variant → trừ trực tiếp san_pham.so_luong_ton như cũ
                    boolean ok = sanPhamDAO.truTonKho(conn, ct.getMaSanPham(), ct.getSoLuong());
                    if (!ok) {
                        throw new Exception("Sản phẩm ID " + ct.getMaSanPham() + " không đủ tồn kho.");
                    }
                }
            }

            // Cập nhật ho_ten vào tai_khoan nếu chưa có
            try (java.sql.PreparedStatement psUpdate = conn.prepareStatement(
                    "UPDATE tai_khoan SET ho_ten = ? WHERE id = ? AND (ho_ten IS NULL OR ho_ten = '' OR ho_ten LIKE 'Khách %')")) {
                psUpdate.setString(1, donHang.getTenNguoiNhan());
                psUpdate.setInt(2, maNguoiDung);
                psUpdate.executeUpdate();
            } catch (Exception ignored) {}
            
            // Refresh session với tên mới
            HttpSession sess = request.getSession(false);
            if (sess != null) {
                sess.setAttribute("hoTen", donHang.getTenNguoiNhan());
            }
            
            // Lưu địa chỉ vào dia_chi nếu chưa có địa chỉ nào
            try (java.sql.PreparedStatement psCheck = conn.prepareStatement(
                    "SELECT COUNT(*) FROM dia_chi WHERE ma_nguoi_dung = ?")) {
                psCheck.setInt(1, maNguoiDung);
                java.sql.ResultSet rsCheck = psCheck.executeQuery();
                rsCheck.next();
                int count = rsCheck.getInt(1);

                // Chỉ lưu nếu chưa có địa chỉ nào
                if (count == 0 && !donHang.getDiaChiGiao().isEmpty()) {
                    try (java.sql.PreparedStatement psAddr = conn.prepareStatement(
                            "INSERT INTO dia_chi (ma_nguoi_dung, ten_nguoi_nhan, so_dien_thoai, dia_chi_cu_the, is_default) "
                          + "VALUES (?, ?, ?, ?, 1)")) {
                        psAddr.setInt(1, maNguoiDung);
                        psAddr.setString(2, donHang.getTenNguoiNhan());
                        psAddr.setString(3, donHang.getSoDienThoai());
                        psAddr.setString(4, donHang.getDiaChiGiao());
                        psAddr.executeUpdate();
                    }
                }
            } catch (Exception ignored) {}
            
            DBConnection.commit(conn);

            // ── Cộng điểm thưởng sau khi đặt hàng thành công ──
            try {
                double tongTien = donHang.getTongTien().doubleValue();
                // Trừ điểm nếu khách chọn dùng điểm
if (diemSuDung > 0) {
    DiemDAO.truDiem(maNguoiDung, diemSuDung, donHang.getMaDonHang());
}
                DiemDAO.congDiem(maNguoiDung, tongTien, donHang.getMaDonHang());
            } catch (Exception ignored) {}

            out.print("{\"status\": \"success\", \"maDonHang\": \"" + donHang.getMaDonHang() + "\"}");
        } catch (Exception e) {
            DBConnection.rollback(conn);
            e.printStackTrace();
            out.print("{\"status\": \"error\", \"message\": \"Lỗi: " + e.getMessage().replace("\"", "\\\"") + "\"}");
        } finally {
            DBConnection.close(conn);
        }
    }

    private String getStringFromJson(JsonObject json, String key) {
        return (json.has(key) && !json.get(key).isJsonNull()) ? json.get(key).getAsString().trim() : "";
    }

    private BigDecimal getBigDecimalFromJson(JsonObject json, String key) {
        if (json.has(key) && !json.get(key).isJsonNull()) {
            try { return new BigDecimal(json.get(key).getAsString()); } 
            catch (NumberFormatException e) { return BigDecimal.ZERO; }
        }
        return BigDecimal.ZERO;
    }
}