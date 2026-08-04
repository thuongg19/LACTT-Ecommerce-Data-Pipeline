package com.mycompany.websitethuongmaidientu.servlet;

import com.mycompany.websitethuongmaidientu.dao.SanPhamDAO;
import com.mycompany.websitethuongmaidientu.model.SanPham;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.util.List;

@WebServlet("/qlSanPhamServlet")
public class qlSanPhamServlet extends HttpServlet {

    private final SanPhamDAO sanPhamDAO = new SanPhamDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json; charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        String action = request.getParameter("action");
        if ("list".equals(action)) {
            List<SanPham> list = sanPhamDAO.getAllForAdmin();
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                SanPham sp = list.get(i);
                if (i > 0) sb.append(",");
                sb.append("{")
                  .append("\"id\":").append(sp.getId()).append(",")
                  .append("\"name\":\"").append(escJson(sp.getTenSp())).append("\",")
                  .append("\"brand\":\"").append(escJson(sp.getThuongHieu())).append("\",")
                  .append("\"price\":").append(sp.getGia() != null ? sp.getGia() : 0).append(",")
                  .append("\"stock\":").append(sp.getSoLuongTon()).append(",")
                  .append("\"cat\":\"").append(escJson(sp.getTenDanhMuc() != null ? sp.getTenDanhMuc() : "")).append("\",")
                  .append("\"maDanhMuc\":").append(sp.getMaDanhMuc()).append(",")
                  .append("\"desc\":\"").append(escJson(sp.getMoTa())).append("\",")
                  .append("\"status\":\"").append(sp.getIsActive() == 1 ? "active" : "inactive").append("\",")
                  .append("\"e\":\"").append(escJson(sp.getHinhAnh() != null && !sp.getHinhAnh().isEmpty() ? sp.getHinhAnh() : "📦")).append("\"")
                  .append("}");
            }
            sb.append("]");
            out.print(sb.toString());
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json; charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        String action = request.getParameter("action");

        try {
            if ("toggle".equals(action)) {
                int id = Integer.parseInt(request.getParameter("id"));
                String currentStatus = request.getParameter("status");
                boolean success;
                if ("active".equals(currentStatus)) {
                    success = sanPhamDAO.deactivate(id);
                } else {
                    success = sanPhamDAO.activate(id);
                }
                out.print("{\"success\":" + success + "}");
                
            } else if ("save".equals(action)) {
                SanPham sp = new SanPham();
                sp.setTenSp(request.getParameter("name").trim());
                sp.setThuongHieu(request.getParameter("brand").trim());
                sp.setGia(new BigDecimal(request.getParameter("price")));
                sp.setSoLuongTon(Integer.parseInt(request.getParameter("stock")));
                sp.setMoTa(request.getParameter("desc").trim());
                sp.setHinhAnh(request.getParameter("img")); 
                
                // ĐÃ SỬA: Map chuẩn phân loại để lưu vào DB thành công
                String cat = request.getParameter("cat");
                int maDanhMuc = 1; // Default
                if (cat != null) {
                    String c = cat.trim().toLowerCase();
                    if (c.equals("chăm sóc da")) maDanhMuc = 1;
                    else if (c.equals("trang điểm")) maDanhMuc = 2;
                    else if (c.equals("nước hoa")) maDanhMuc = 3;
                    else if (c.equals("chăm sóc tóc")) maDanhMuc = 4;
                    else if (c.equals("chống nắng")) maDanhMuc = 5;
                    else if (c.equals("chăm sóc cơ thể")) maDanhMuc = 6;
                }
                sp.setMaDanhMuc(maDanhMuc);

                String idStr = request.getParameter("id");
                boolean success;
                if (idStr == null || idStr.isEmpty() || idStr.equals("null")) {
                    success = sanPhamDAO.insert(sp);
                } else {
                    sp.setId(Integer.parseInt(idStr));
                    success = sanPhamDAO.update(sp);
                }
                out.print("{\"success\":" + success + "}");
            }
        } catch (Exception e) {
            out.print("{\"success\":false,\"message\":\"Dữ liệu không hợp lệ.\"}");
        }
    }

    private String escJson(String s) {
        if (s == null) return "";
        return s.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n").replace("\r","\\r");
    }
}