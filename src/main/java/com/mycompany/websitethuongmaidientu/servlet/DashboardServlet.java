package com.mycompany.websitethuongmaidientu.servlet;

import com.google.gson.Gson;
import com.mycompany.websitethuongmaidientu.model.DashboardDTO;
import com.mycompany.websitethuongmaidientu.service.DashboardService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Date;
import java.time.LocalDate;

@WebServlet(urlPatterns = {"/admin/dashboard-api"})
public class DashboardServlet extends HttpServlet {
    private final DashboardService dashboardService = new DashboardService();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        String action = req.getParameter("action");

        try {
            String fromParam = req.getParameter("from");
            String toParam = req.getParameter("to");

            Date fromDate;
            Date toDate;

            // Mặc định lấy dữ liệu tháng hiện tại nếu không chọn ngày
            if (fromParam == null || fromParam.isEmpty() || toParam == null || toParam.isEmpty()) {
                LocalDate today = LocalDate.now();
                fromDate = Date.valueOf(today.withDayOfMonth(1));
                toDate = Date.valueOf(today);
            } else {
                fromDate = Date.valueOf(fromParam);
                toDate = Date.valueOf(toParam);
            }

            // Kiểm tra điều kiện ngày
            if (fromDate.after(toDate)) {
                resp.setStatus(400);
                resp.getWriter().write("{\"error\": \"Ngày kết thúc không được nhỏ hơn ngày bắt đầu.\"}");
                return;
            }

            if ("getDashboard".equals(action)) {
                DashboardDTO data = dashboardService.getDashboardData(fromDate, toDate);
                resp.getWriter().write(gson.toJson(data));
            } else if ("exportExcel".equals(action)) {
                // Lưu ý: Cần thư viện Apache POI để chạy phần này
                // Đây là khung logic để em phát triển thêm
                resp.setContentType("application/vnd.ms-excel");
                resp.setHeader("Content-Disposition", "attachment; filename=baocao.xls");
                resp.getWriter().write("Chức năng xuất Excel đang được tích hợp.");
            } else if ("exportPDF".equals(action)) {
                // Lưu ý: Cần thư viện iText để chạy phần này
                resp.setContentType("application/pdf");
                resp.setHeader("Content-Disposition", "attachment; filename=baocao.pdf");
                resp.getWriter().write("Chức năng xuất PDF đang được tích hợp.");
            }

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().write("{\"error\": \"Lỗi hệ thống khi tải báo cáo.\"}");
            e.printStackTrace();
        }
    }
}