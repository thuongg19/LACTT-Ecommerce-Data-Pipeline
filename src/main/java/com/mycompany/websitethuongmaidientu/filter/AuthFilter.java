package com.mycompany.websitethuongmaidientu.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.*;
import java.io.IOException;

// BẮT CHÍNH XÁC ĐUÔI .JSP
@WebFilter(urlPatterns = {"/taikhoan.jsp", "/admin.jsp", "/nhanvienkho.jsp", "/donhang.jsp", "/dashboard.jsp", "/khuyenmai.jsp"})
public class AuthFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  req  = (HttpServletRequest)  request;
        HttpServletResponse resp = (HttpServletResponse) response;
        HttpSession         session = req.getSession(false);

        boolean dangNhap = session != null && session.getAttribute("taiKhoan") != null;

        if (!dangNhap) {
            resp.sendRedirect(req.getContextPath() + "/dangnhap.jsp");
            return;
        }

        String uri = req.getRequestURI();

        // Kiểm tra quyền admin — các trang admin
        if (uri.contains("admin.jsp") || uri.contains("donhang.jsp") || uri.contains("dashboard.jsp") || uri.contains("khuyenmai.jsp")) {
            String vaiTro = (String) session.getAttribute("vaiTro");
            if (!"admin".equals(vaiTro)) {
                resp.sendRedirect(req.getContextPath() + "/index.jsp");
                return;
            }
        }

        // Kiểm tra quyền nhân viên kho
        if (uri.contains("nhanvienkho.jsp")) {
            String vaiTro = (String) session.getAttribute("vaiTro");
            if (!"nhan_vien_kho".equals(vaiTro) && !"admin".equals(vaiTro)) {
                resp.sendRedirect(req.getContextPath() + "/index.jsp");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}