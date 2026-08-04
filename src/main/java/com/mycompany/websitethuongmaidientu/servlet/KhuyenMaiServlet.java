package com.mycompany.websitethuongmaidientu.servlet;

import com.google.gson.Gson;
import com.mycompany.websitethuongmaidientu.dao.KhuyenMaiDAO;
import com.mycompany.websitethuongmaidientu.model.CauHinhDiem;
import com.mycompany.websitethuongmaidientu.model.Voucher;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Date;
import java.util.Map;

@WebServlet(urlPatterns = {"/admin/khuyenmai-api"})
public class KhuyenMaiServlet extends HttpServlet {
    private final Gson gson = new Gson();
    private final KhuyenMaiDAO dao = new KhuyenMaiDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        String action = req.getParameter("action");

        if ("getPolicy".equals(action)) {
            CauHinhDiem policy = dao.getPolicy();
            resp.getWriter().write(gson.toJson(policy));
            
        } else if ("getVouchers".equals(action)) {
            resp.getWriter().write(gson.toJson(dao.getAllVouchers()));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        String action = req.getParameter("action");
        
        BufferedReader reader = req.getReader();
        Map<String, Object> payload = gson.fromJson(reader, Map.class);

        try {
            if ("updatePolicy".equals(action)) {
                double tienTich = ((Number) payload.get("tienTich1Diem")).doubleValue();
                double quyDoi = ((Number) payload.get("motDiemQuyDoi")).doubleValue();
                double freeship = ((Number) payload.get("freeshipTu")).doubleValue();
                double quaTang = ((Number) payload.get("quaTangTu")).doubleValue();
                int adminId = 1;

                boolean success = dao.updatePolicy(tienTich, quyDoi, freeship, quaTang, adminId);
                resp.getWriter().write("{\"success\": " + success + "}");

            } else if ("createVoucher".equals(action)) {
                Voucher v = new Voucher();
                v.setVoucherCode((String) payload.get("voucherCode"));
                v.setTen((String) payload.get("ten"));
                v.setLoai((String) payload.get("loai"));
                v.setGiaTriGiam(((Number) payload.get("giaTriGiam")).doubleValue());
                v.setDonHangToiThieu(((Number) payload.get("donHangToiThieu")).doubleValue());
                
                if(payload.get("soLuotToiDa") != null && !payload.get("soLuotToiDa").toString().isEmpty()) {
                    v.setSoLuotToiDa(((Number) payload.get("soLuotToiDa")).intValue());
                }
                
                v.setGioiHanMoiTk(((Number) payload.get("gioiHanMoiTk")).intValue());
                v.setNgayBatDau(Date.valueOf((String) payload.get("ngayBatDau")));
                v.setNgayKetThuc(Date.valueOf((String) payload.get("ngayKetThuc")));

                boolean success = dao.createVoucher(v);
                resp.getWriter().write("{\"success\": " + success + "}");

            } else if ("updateVoucher".equals(action)) {
                Voucher v = new Voucher();
                v.setId(((Number) payload.get("id")).intValue());
                v.setTen((String) payload.get("ten"));
                v.setLoai((String) payload.get("loai"));
                v.setGiaTriGiam(((Number) payload.get("giaTriGiam")).doubleValue());
                v.setDonHangToiThieu(((Number) payload.get("donHangToiThieu")).doubleValue());
                
                if(payload.get("soLuotToiDa") != null && !payload.get("soLuotToiDa").toString().isEmpty()) {
                    v.setSoLuotToiDa(((Number) payload.get("soLuotToiDa")).intValue());
                }
                
                v.setNgayBatDau(Date.valueOf((String) payload.get("ngayBatDau")));
                v.setNgayKetThuc(Date.valueOf((String) payload.get("ngayKetThuc")));

                boolean success = dao.updateVoucher(v);
                resp.getWriter().write("{\"success\": " + success + "}");

            } else if ("toggleVoucher".equals(action)) {
                int id = ((Number) payload.get("id")).intValue();
                int isActive = ((Number) payload.get("isActive")).intValue();
                boolean success = dao.toggleVoucherStatus(id, isActive);
                resp.getWriter().write("{\"success\": " + success + "}");
            }
            
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("Duplicate entry")) {
                resp.setStatus(400);
                resp.getWriter().write("{\"success\": false, \"message\": \"Mã Voucher đã tồn tại!\"}");
            } else {
                resp.setStatus(500);
                resp.getWriter().write("{\"success\": false, \"message\": \"Lỗi hệ thống!\"}");
            }
        }
    }
}