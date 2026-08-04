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

@WebServlet("/SanPhamServlet")
public class SanPhamServlet extends HttpServlet {

    private final SanPhamDAO sanPhamDAO = new SanPhamDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String action = request.getParameter("action");
        if (action == null) action = "list";

        switch (action) {

            case "index": {
                List<SanPham> featured = sanPhamDAO.getFeatured(8);
                List<SanPham> newArr   = sanPhamDAO.getNewArrivals(8);
                out.print("{\"featured\":"  + toJsonArray(featured)
                        + ",\"newArrivals\":" + toJsonArray(newArr) + "}");
                break;
            }

            case "list": {
                int maDanhMuc = parseIntParam(request, "maDanhMuc", 0);
                String[] thuongHieuArr = request.getParameterValues("thuongHieu");
                String thuongHieu = null;
                if (thuongHieuArr != null && thuongHieuArr.length > 0)
                    thuongHieu = String.join(",", thuongHieuArr);

                String giaMinStr = request.getParameter("giaMin");
                String giaMaxStr = request.getParameter("giaMax");
                String sapXep    = request.getParameter("sapXep");
                int page         = parseIntParam(request, "page", 1);
                int pageSize     = parseIntParam(request, "pageSize", 12);

                BigDecimal giaMin = giaMinStr != null && !giaMinStr.isEmpty() ? new BigDecimal(giaMinStr) : null;
                BigDecimal giaMax = giaMaxStr != null && !giaMaxStr.isEmpty() ? new BigDecimal(giaMaxStr) : null;

                List<SanPham> list = sanPhamDAO.getFiltered(maDanhMuc, thuongHieu, giaMin, giaMax, sapXep, page, pageSize);
                int total          = sanPhamDAO.countFiltered(maDanhMuc, thuongHieu, giaMin, giaMax);
                int totalPages     = (int) Math.ceil((double) total / pageSize);

                out.print("{\"data\":"       + toJsonArray(list)
                        + ",\"total\":"      + total
                        + ",\"page\":"       + page
                        + ",\"totalPages\":" + totalPages + "}");
                break;
            }

            case "detail": {
                int id = parseIntParam(request, "id", 0);
                if (id <= 0) { out.print("{\"success\":false,\"message\":\"ID không hợp lệ\"}"); break; }
                SanPham sp = sanPhamDAO.getById(id);
                if (sp == null) out.print("{\"success\":false,\"message\":\"Không tìm thấy sản phẩm\"}");
                else            out.print("{\"success\":true,\"data\":" + toJson(sp) + "}");
                break;
            }

            // ── MỚI: Lấy danh sách variant theo id sản phẩm ──
            case "variants": {
                int id = parseIntParam(request, "id", 0);
                if (id <= 0) { out.print("[]"); break; }
                List<String[]> variants = sanPhamDAO.getVariants(id);
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < variants.size(); i++) {
                    if (i > 0) sb.append(",");
                    String[] v = variants.get(i);
                    sb.append("{")
                      .append("\"id\":").append(v[0]).append(",")
                      .append("\"tenVariant\":\"").append(escJson(v[1])).append("\",")
                      .append("\"gia\":").append(v[2]).append(",")
                      .append("\"giaGoc\":").append(v[3]).append(",")
                      .append("\"soLuong\":").append(v[4])
                      .append("}");
                }
                sb.append("]");
                out.print(sb.toString());
                break;
            }

            case "lienQuan": {
                int maDanhMuc = parseIntParam(request, "maDanhMuc", 0);
                int excludeId = parseIntParam(request, "excludeId", 0);
                int limit     = parseIntParam(request, "limit", 4);
                out.print(toJsonArray(sanPhamDAO.getLienQuan(maDanhMuc, excludeId, limit)));
                break;
            }

            case "search": {
                String keyword = request.getParameter("keyword");
                if (keyword == null || keyword.trim().isEmpty()) {
                    out.print("{\"data\":[],\"total\":0,\"page\":1,\"totalPages\":1}");
                    break;
                }
                List<SanPham> list = sanPhamDAO.search(keyword.trim());
                out.print("{\"data\":" + toJsonArray(list)
                        + ",\"total\":" + list.size()
                        + ",\"page\":1,\"totalPages\":1}");
                break;
            }

            case "thuongHieu": {
                List<String> brands = sanPhamDAO.getAllThuongHieu();
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < brands.size(); i++) {
                    if (i > 0) sb.append(",");
                    sb.append("\"").append(escJson(brands.get(i))).append("\"");
                }
                out.print(sb.append("]").toString());
                break;
            }

            case "tonKho": {
                int id = parseIntParam(request, "id", 0);
                if (id <= 0) { out.print("{\"success\":false,\"message\":\"ID không hợp lệ\"}"); break; }
                out.print("{\"success\":true,\"id\":" + id + ",\"tonKho\":" + sanPhamDAO.getTonKho(id) + "}");
                break;
            }

            case "flashSale": {
                out.print(toJsonArray(sanPhamDAO.getFlashSaleProducts()));
                break;
            }

            case "featured": {
                int limit = parseIntParam(request, "limit", 8);
                out.print(toJsonArray(sanPhamDAO.getFeatured(limit)));
                break;
            }

            default:
                out.print("{\"success\":false,\"message\":\"Action không tồn tại\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        if (session == null || !"admin".equals(session.getAttribute("vaiTro"))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            out.print("{\"success\":false,\"message\":\"Bạn không có quyền thực hiện thao tác này\"}");
            return;
        }

        String action = request.getParameter("action");
        if (action == null) action = "";

        switch (action) {
            case "them": {
                boolean ok = sanPhamDAO.insert(buildFromRequest(request));
                out.print(ok ? "{\"success\":true,\"message\":\"Thêm sản phẩm thành công\"}"
                             : "{\"success\":false,\"message\":\"Thêm sản phẩm thất bại\"}");
                break;
            }
            case "sua": {
                int id = parseIntParam(request, "id", 0);
                if (id <= 0) { out.print("{\"success\":false,\"message\":\"ID không hợp lệ\"}"); break; }
                SanPham sp = buildFromRequest(request); sp.setId(id);
                boolean ok = sanPhamDAO.update(sp);
                out.print(ok ? "{\"success\":true,\"message\":\"Cập nhật sản phẩm thành công\"}"
                             : "{\"success\":false,\"message\":\"Cập nhật sản phẩm thất bại\"}");
                break;
            }
            case "an": {
                int id = parseIntParam(request, "id", 0);
                if (id <= 0) { out.print("{\"success\":false,\"message\":\"ID không hợp lệ\"}"); break; }
                boolean ok = sanPhamDAO.deactivate(id);
                out.print(ok ? "{\"success\":true,\"message\":\"Đã ẩn sản phẩm\"}"
                             : "{\"success\":false,\"message\":\"Ẩn sản phẩm thất bại\"}");
                break;
            }
            case "hienThi": {
                int id = parseIntParam(request, "id", 0);
                if (id <= 0) { out.print("{\"success\":false,\"message\":\"ID không hợp lệ\"}"); break; }
                boolean ok = sanPhamDAO.activate(id);
                out.print(ok ? "{\"success\":true,\"message\":\"Đã hiển thị lại sản phẩm\"}"
                             : "{\"success\":false,\"message\":\"Thao tác thất bại\"}");
                break;
            }
            case "nhapKho": {
                String vaiTro = (String) session.getAttribute("vaiTro");
                if (!"admin".equals(vaiTro) && !"nhan_vien_kho".equals(vaiTro)) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    out.print("{\"success\":false,\"message\":\"Không có quyền nhập kho\"}");
                    break;
                }
                int id = parseIntParam(request, "id", 0);
                int soLuongNhap = parseIntParam(request, "soLuong", 0);
                if (id <= 0 || soLuongNhap <= 0) {
                    out.print("{\"success\":false,\"message\":\"Dữ liệu nhập kho không hợp lệ\"}");
                    break;
                }
                boolean ok = sanPhamDAO.nhapKho(id, soLuongNhap);
                out.print(ok ? "{\"success\":true,\"message\":\"Nhập kho thành công\",\"soLuongNhap\":" + soLuongNhap + "}"
                             : "{\"success\":false,\"message\":\"Nhập kho thất bại\"}");
                break;
            }
            default:
                out.print("{\"success\":false,\"message\":\"Action không tồn tại\"}");
        }
    }

    private SanPham buildFromRequest(HttpServletRequest req) {
        SanPham sp = new SanPham();
        sp.setMaDanhMuc(parseIntParam(req, "maDanhMuc", 0));
        sp.setTenSp(req.getParameter("tenSp") != null ? req.getParameter("tenSp").trim() : "");
        sp.setThuongHieu(req.getParameter("thuongHieu") != null ? req.getParameter("thuongHieu").trim() : "");
        sp.setMoTa(req.getParameter("moTa") != null ? req.getParameter("moTa").trim() : "");
        sp.setThanhPhan(req.getParameter("thanhPhan") != null ? req.getParameter("thanhPhan").trim() : "");
        sp.setHuongDanSuDung(req.getParameter("huongDanSuDung") != null ? req.getParameter("huongDanSuDung").trim() : "");
        sp.setHinhAnh(req.getParameter("hinhAnh") != null ? req.getParameter("hinhAnh").trim() : "");
        sp.setIsFeatured(parseIntParam(req, "isFeatured", 0));
        sp.setIsNew(parseIntParam(req, "isNew", 0));
        String giaStr = req.getParameter("gia"), giaGocStr = req.getParameter("giaGoc");
        if (giaStr != null && !giaStr.isEmpty())    try { sp.setGia(new BigDecimal(giaStr)); }    catch (NumberFormatException ignored) {}
        if (giaGocStr != null && !giaGocStr.isEmpty()) try { sp.setGiaGoc(new BigDecimal(giaGocStr)); } catch (NumberFormatException ignored) {}
        return sp;
    }

    private int parseIntParam(HttpServletRequest req, String name, int def) {
        String val = req.getParameter(name);
        if (val == null || val.isEmpty()) return def;
        try { return Integer.parseInt(val.trim()); } catch (NumberFormatException e) { return def; }
    }

    private String escJson(String s) {
        if (s == null) return "";
        return s.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n").replace("\r","\\r").replace("\t","\\t");
    }

    private String toJson(SanPham sp) {
        return "{"
            + "\"id\":"           + sp.getId()                                              + ","
            + "\"maDanhMuc\":"    + sp.getMaDanhMuc()                                       + ","
            + "\"tenSp\":\""      + escJson(sp.getTenSp())                                  + "\","
            + "\"thuongHieu\":\"" + escJson(sp.getThuongHieu())                             + "\","
            + "\"moTa\":\""       + escJson(sp.getMoTa())                                   + "\","
            + "\"thanhPhan\":\""  + escJson(sp.getThanhPhan())                              + "\","
            + "\"huongDan\":\""   + escJson(sp.getHuongDanSuDung())                         + "\","
            + "\"gia\":"          + (sp.getGia()    != null ? sp.getGia()    : 0)           + ","
            + "\"giaGoc\":"       + (sp.getGiaGoc() != null ? sp.getGiaGoc() : 0)           + ","
            + "\"soLuongBan\":"   + sp.getSoLuongBan()                                      + ","
            + "\"soLuongTon\":"   + sp.getSoLuongTon()                                      + ","
            + "\"diemDanhGia\":"  + sp.getDiemDanhGia()                                     + ","
            + "\"soDanhGia\":"    + sp.getSoDanhGia()                                       + ","
            + "\"hinhAnh\":\""    + escJson(sp.getHinhAnh())                                + "\","
            + "\"isActive\":"     + sp.getIsActive()                                        + ","
            + "\"isFeatured\":"   + sp.getIsFeatured()                                      + ","
            + "\"isNew\":"        + sp.getIsNew()
            + "}";
    }

    private String toJsonArray(List<SanPham> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) { if (i > 0) sb.append(","); sb.append(toJson(list.get(i))); }
        return sb.append("]").toString();
    }
}