package com.mycompany.websitethuongmaidientu.servlet;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;

@WebServlet(name = "LogoutServlet", urlPatterns = {"/LogoutServlet"})
public class LogoutServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doPost(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // 1. Lấy session hiện tại (không tạo mới)
        HttpSession session = request.getSession(false);
        
        // 2. Invalidate session nếu tồn tại
        if (session != null) {
            session.invalidate();
        }
        
        // 3. Xóa cookie JSESSIONID (đảm bảo browser không gửi session cũ)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("JSESSIONID".equals(cookie.getName())) {
                    cookie.setValue("");
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    response.addCookie(cookie);
                }
            }
        }
        
        // Xóa cookie ghi nhớ đăng nhập
        Cookie userCookie = new Cookie("userEmail", "");
        userCookie.setPath("/");
        userCookie.setMaxAge(0);
        response.addCookie(userCookie);

        Cookie passCookie = new Cookie("userPass", "");
        passCookie.setPath("/");
        passCookie.setMaxAge(0);
        response.addCookie(passCookie);
        
        // 4. Redirect về trang đăng nhập với param logout=1
        response.sendRedirect(request.getContextPath() + "/dangnhap.jsp?logout=1");
    }
}