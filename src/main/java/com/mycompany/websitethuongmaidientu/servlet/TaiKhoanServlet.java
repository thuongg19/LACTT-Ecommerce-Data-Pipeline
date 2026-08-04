package com.mycompany.websitethuongmaidientu.servlet;

import com.google.gson.Gson;
import com.mycompany.websitethuongmaidientu.dao.ChiTietDonHangDAO;
import com.mycompany.websitethuongmaidientu.dao.DiaChiDAO;
import com.mycompany.websitethuongmaidientu.dao.DiemDAO;
import com.mycompany.websitethuongmaidientu.dao.DonHangDAO;
import com.mycompany.websitethuongmaidientu.dao.TaiKhoanDAO;
import com.mycompany.websitethuongmaidientu.model.ChiTietDonHang;
import com.mycompany.websitethuongmaidientu.model.DiaChi;
import com.mycompany.websitethuongmaidientu.model.DonHang;
import com.mycompany.websitethuongmaidientu.model.TaiKhoan;
import com.mycompany.websitethuongmaidientu.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/TaiKhoanServlet")
public class TaiKhoanServlet extends HttpServlet {

    private TaiKhoanDAO taiKhoanDAO;
    private DonHangDAO donHangDAO;
    private DiaChiDAO diaChiDAO;
    private ChiTietDonHangDAO chiTietDAO;
    private Gson gson;

    public TaiKhoanServlet() {
        taiKhoanDAO = new TaiKhoanDAO();
        donHangDAO  = new DonHangDAO();
        diaChiDAO   = new DiaChiDAO();
        chiTietDAO  = new ChiTietDonHangDAO();
        gson        = new Gson();
    }

    // ══════════════════════════════════════════════════════════════
    //  doGet
    // ══════════════════════════════════════════════════════════════
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession();
        TaiKhoan taiKhoan  = (TaiKhoan) session.getAttribute("taiKhoan");

        // Chưa đăng nhập
        if (taiKhoan == null) {
            if ("1".equals(request.getParameter("ajax"))) {
                response.setContentType("application/json; charset=UTF-8");
                Map<String, Object> r = new HashMap<>();
                r.put("success", false);
                r.put("message", "Vui lòng đăng nhập");
                r.put("redirect", "dangnhap.jsp");
                response.getWriter().print(gson.toJson(r));
            } else {
                response.sendRedirect("dangnhap.jsp");
            }
            return;
        }

        // ajax=1 → trả JSON
        if ("1".equals(request.getParameter("ajax"))) {
            response.setContentType("application/json; charset=UTF-8");
            PrintWriter out    = response.getWriter();
            String dataAction  = request.getParameter("dataAction");
            Map<String, Object> result = new HashMap<>();

            try {
                // ── overview ──────────────────────────────────────────────
                if ("overview".equals(dataAction)) {
                    List<DonHang> danhSachDon = donHangDAO.getByUserId(taiKhoan.getId());
                    int tongDon  = danhSachDon.size();
                    int dangGiao = 0;
                    for (DonHang dh : danhSachDon) {
                        if ("dang_giao".equals(dh.getTrangThai())) dangGiao++;
                    }

                    int    tongDiem      = 0;
                    double giaTriQuyDoi  = 0;
                    int    daSuDung      = 0;
                    try (Connection conn = DBConnection.getConnection();
     PreparedStatement ps = conn.prepareStatement(
         "SELECT tong_diem, gia_tri_quy_doi, da_su_dung FROM vi_diem WHERE ma_nguoi_dung = ?")) {
    ps.setInt(1, taiKhoan.getId());
    try (ResultSet rs = ps.executeQuery()) {
        if (rs.next()) {
            tongDiem     = rs.getInt("tong_diem");
            giaTriQuyDoi = rs.getDouble("gia_tri_quy_doi");
            daSuDung     = rs.getInt("da_su_dung");
        }
    }
}

                    int soVoucher = 0;
                    try (Connection conn = DBConnection.getConnection();
                         PreparedStatement ps = conn.prepareStatement(
                             "SELECT COUNT(*) FROM khuyen_mai WHERE is_active = 1 " +
                             "AND ngay_bat_dau <= CURDATE() AND ngay_ket_thuc >= CURDATE() " +
                             "AND (so_luot_toi_da IS NULL OR so_luot_da_dung < so_luot_toi_da)");
                         ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) soVoucher = rs.getInt(1);
                    }

                    result.put("success",      true);
                    result.put("tongDon",       tongDon);
                    result.put("dangGiao",      dangGiao);
                    result.put("tongDiem",      tongDiem);
                    result.put("giaTriQuyDoi",  giaTriQuyDoi);
                    result.put("soVoucher",     soVoucher);
                    result.put("daSuDung",      daSuDung);

                // ── points ────────────────────────────────────────────────
                } else if ("points".equals(dataAction)) {
                    int    tongDiem     = DiemDAO.getTongDiem(taiKhoan.getId());
                    double giaTriQuyDoi = 0;
                    try (Connection conn = DBConnection.getConnection();
                         PreparedStatement ps = conn.prepareStatement(
                             "SELECT gia_tri_quy_doi FROM vi_diem WHERE ma_nguoi_dung = ?")) {
                        ps.setInt(1, taiKhoan.getId());
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) giaTriQuyDoi = rs.getDouble(1);
                        }
                    }
                    result.put("success",      true);
                    result.put("tongDiem",      tongDiem);
                    result.put("giaTriQuyDoi",  (long) giaTriQuyDoi);

                // ── addresses ─────────────────────────────────────────────
                } else if ("addresses".equals(dataAction)) {
                    List<DiaChi> dsDiaChi = diaChiDAO.getByUserId(taiKhoan.getId());
                    result.put("success",   true);
                    result.put("addresses", dsDiaChi);

                // ── orders ────────────────────────────────────────────────
                } else if ("orders".equals(dataAction)) {
                    List<DonHang> danhSachDon = donHangDAO.getByUserId(taiKhoan.getId());
                    List<Map<String, Object>> orderList = new ArrayList<>();
                    SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");

                    for (DonHang dh : danhSachDon) {
                        Map<String, Object> o = new HashMap<>();

                        o.put("id",        dh.getMaDonHang());
                        o.put("numericId", dh.getId());

                        String trangThai = dh.getTrangThai() != null
                                ? dh.getTrangThai() : "cho_xac_nhan";
                        String status;
                        switch (trangThai) {
                            case "cho_xac_nhan"  -> status = "pending";
                            case "dang_chuan_bi" -> status = "packing";
                            case "dang_giao"     -> status = "shipping";
                            case "da_giao"       -> status = "delivered";
                            case "da_huy"        -> status = "cancelled";
                            case "hoan_thanh"    -> status = "hoan_thanh";
                            case "yeu_cau_hoan"  -> status = "yeu_cau_hoan";
                            case "cho_hoan_kho"  -> status = "cho_hoan_kho";
                            case "cho_hoan_tien" -> status = "cho_hoan_tien";
                            case "da_hoan_tien"  -> status = "da_hoan_tien";
                            default              -> status = "pending";
                        }
                        o.put("status",      status);
                        o.put("rawStatus",   trangThai);

                        o.put("total",       dh.getTongTien());
                        o.put("date",        dh.getNgayDat() != null
                                             ? sdf.format(dh.getNgayDat()) : "");
                        o.put("discount",    dh.getGiamGia());
                        o.put("shipFee",     dh.getPhiVanChuyen());
                        o.put("approvedAt",  null);
                        o.put("deliveredAt", null);
                        o.put("tracking",    null);

                        List<ChiTietDonHang> chiTietList = chiTietDAO.getByDonHangId(dh.getId());
                        List<Map<String, Object>> items  = new ArrayList<>();
                        for (ChiTietDonHang ct : chiTietList) {
                            Map<String, Object> item = new HashMap<>();
                            item.put("name",    ct.getTenSanPham());
                            item.put("brand",   ct.getThuongHieu());
                            item.put("variant", ct.getTenVariant());
                            item.put("qty",     ct.getSoLuong());
                            item.put("price",   ct.getGia());
                            item.put("image",   ct.getHinhAnh());
                            items.add(item);
                        }
                        o.put("items", items);
                        orderList.add(o);
                    }

                    result.put("success", true);
                    result.put("orders",  orderList);

                } else {
                    result.put("success", false);
                    result.put("message", "dataAction không hợp lệ");
                }

            } catch (Exception e) {
                e.printStackTrace();
                result.put("success", false);
                result.put("message", e.getMessage());
            }

            out.print(gson.toJson(result));
            return;
        }

        // Không phải ajax → forward sang JSP để render trang
        List<DiaChi>   diaChiList  = diaChiDAO.getByUserId(taiKhoan.getId());
        List<DonHang>  donHangList = donHangDAO.getByUserId(taiKhoan.getId());
        request.setAttribute("diaChiList",  diaChiList);
        request.setAttribute("donHangList", donHangList);
        request.getRequestDispatcher("taikhoan.jsp").forward(request, response);
    }

    // ══════════════════════════════════════════════════════════════
    //  doPost
    // ══════════════════════════════════════════════════════════════
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession();
        TaiKhoan taiKhoan  = (TaiKhoan) session.getAttribute("taiKhoan");

        // Chưa đăng nhập
        if (taiKhoan == null) {
            if ("1".equals(request.getParameter("ajax"))) {
                response.setContentType("application/json; charset=UTF-8");
                Map<String, Object> r = new HashMap<>();
                r.put("success", false);
                r.put("message", "Vui lòng đăng nhập");
                r.put("redirect", "dangnhap.jsp");
                response.getWriter().print(gson.toJson(r));
            } else {
                response.sendRedirect("dangnhap.jsp");
            }
            return;
        }

        String action = request.getParameter("action");
        boolean isAjax = "1".equals(request.getParameter("ajax"));

        PrintWriter out = null;
        if (isAjax) {
            response.setContentType("application/json; charset=UTF-8");
            out = response.getWriter();
        }

        boolean success = false;

        // ── updateProfile ──────────────────────────────────────────
        if ("updateProfile".equals(action)) {
            taiKhoan.setHoTen(request.getParameter("hoTen"));
            taiKhoan.setEmail(request.getParameter("email"));
            taiKhoan.setSoDienThoai(request.getParameter("soDienThoai"));

            String ngaySinh = request.getParameter("ngaySinh");
            if (ngaySinh != null && !ngaySinh.isEmpty()) {
                try {
                    taiKhoan.setNgaySinh(Date.valueOf(ngaySinh));
                } catch (Exception ignored) {}
            }

            taiKhoan.setGioiTinh(request.getParameter("gioiTinh"));
            taiKhoan.setLoaiDa(request.getParameter("loaiDa"));

            success = taiKhoanDAO.update(taiKhoan);
            if (success) session.setAttribute("taiKhoan", taiKhoan);

        // ── addAddress ─────────────────────────────────────────────
        } else if ("addAddress".equals(action)) {
            DiaChi diaChi = new DiaChi();
            diaChi.setMaNguoiDung(taiKhoan.getId());
            diaChi.setTenNguoiNhan(request.getParameter("tenNguoiNhan"));
            diaChi.setSoDienThoai(request.getParameter("soDienThoai"));
            diaChi.setDiaChiCuThe(request.getParameter("diaChiCuThe"));
            diaChi.setMacDinh("on".equals(request.getParameter("macDinh")));
            success = diaChiDAO.insert(diaChi);

        // ── editAddress ────────────────────────────────────────────
        } else if ("editAddress".equals(action)) {
            DiaChi diaChi = new DiaChi();
            diaChi.setId(Integer.parseInt(request.getParameter("id")));
            diaChi.setMaNguoiDung(taiKhoan.getId());
            diaChi.setTenNguoiNhan(request.getParameter("tenNguoiNhan"));
            diaChi.setSoDienThoai(request.getParameter("soDienThoai"));
            diaChi.setDiaChiCuThe(request.getParameter("diaChiCuThe"));
            String macDinh = request.getParameter("macDinh");
            diaChi.setMacDinh("on".equals(macDinh));
            success = diaChiDAO.update(diaChi);

                // ── deleteAddress ──────────────────────────────────────────
        } else if ("deleteAddress".equals(action)) {
            int id = Integer.parseInt(request.getParameter("id"));
            success = diaChiDAO.delete(id);

                // ── cancelOrder ────────────────────────────────────────────
        } else if ("cancelOrder".equals(action)) {
            Connection conn = null;

            try {
                int orderId = Integer.parseInt(request.getParameter("orderId"));

                conn = DBConnection.getConnection();
                DBConnection.beginTransaction(conn);

                // 1. Chỉ hủy đơn đang chờ xác nhận
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE don_hang " +
                        "SET trang_thai = 'da_huy' " +
                        "WHERE id = ? " +
                        "AND ma_nguoi_dung = ? " +
                        "AND trang_thai = 'cho_xac_nhan'"
                )) {
                    ps.setInt(1, orderId);
                    ps.setInt(2, taiKhoan.getId());

                    success = ps.executeUpdate() > 0;
                }

                // Nếu không hủy được thì rollback, không cộng kho
                if (!success) {
                    DBConnection.rollback(conn);
                } else {

                    // 2. Lấy các sản phẩm trong đơn hàng
                    try (PreparedStatement psCt = conn.prepareStatement(
                            "SELECT ma_san_pham, ten_variant, so_luong " +
                            "FROM chi_tiet_don_hang " +
                            "WHERE ma_don_hang = ?"
                    )) {
                        psCt.setInt(1, orderId);

                        try (ResultSet rs = psCt.executeQuery()) {
                            while (rs.next()) {
                                int maSanPham = rs.getInt("ma_san_pham");
                                String tenVariant = rs.getString("ten_variant");
                                int soLuong = rs.getInt("so_luong");

                                boolean coVariant = tenVariant != null && !tenVariant.trim().isEmpty();

                                if (coVariant) {
                                    // Sản phẩm có phân loại: cộng lại vào bảng san_pham_variant
                                    try (PreparedStatement psRestore = conn.prepareStatement(
                                            "UPDATE san_pham_variant " +
                                            "SET so_luong = so_luong + ? " +
                                            "WHERE ma_san_pham = ? AND ten_variant = ?"
                                    )) {
                                        psRestore.setInt(1, soLuong);
                                        psRestore.setInt(2, maSanPham);
                                        psRestore.setString(3, tenVariant.trim());
                                        psRestore.executeUpdate();
                                    }
                                } else {
                                    // Sản phẩm không có phân loại: cộng lại vào bảng san_pham
                                    try (PreparedStatement psRestore = conn.prepareStatement(
                                            "UPDATE san_pham " +
                                            "SET so_luong_ton = so_luong_ton + ? " +
                                            "WHERE id = ?"
                                    )) {
                                        psRestore.setInt(1, soLuong);
                                        psRestore.setInt(2, maSanPham);
                                        psRestore.executeUpdate();
                                    }
                                }
                            }
                        }
                    }

                    DBConnection.commit(conn);
                }

            } catch (Exception e) {
                DBConnection.rollback(conn);
                e.printStackTrace();
                success = false;
            } finally {
                DBConnection.close(conn);
            }
        }

        // Trả về response
        if (isAjax) {
            Map<String, Object> r = new HashMap<>();
            r.put("success", success);

            if ("cancelOrder".equals(action) && !success) {
                r.put("message", "Đơn hàng này không thể hủy vì đã được xử lý hoặc không thuộc tài khoản của bạn.");
            }

            out.print(gson.toJson(r));
        } else {
            response.sendRedirect("TaiKhoanServlet");
        }
    }
}

