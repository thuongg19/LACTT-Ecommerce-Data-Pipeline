package com.mycompany.websitethuongmaidientu.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.mycompany.websitethuongmaidientu.model.DashboardDTO;
import com.mycompany.websitethuongmaidientu.model.GiaoDichDTO;
import com.mycompany.websitethuongmaidientu.service.DashboardService;
import com.mycompany.websitethuongmaidientu.service.DoiSoatGDService;
import com.mycompany.websitethuongmaidientu.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Date;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(urlPatterns = {"/admin/report-api"})
public class ReportServlet extends HttpServlet {

    private final DashboardService dashboardService = new DashboardService();
    private final DoiSoatGDService reconcileService = new DoiSoatGDService();
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String action = req.getParameter("action");

        try {
            Date fromDate = parseFromDate(req);
            Date toDate = parseToDate(req);

            // validate date
            if (fromDate.after(toDate)) {
                sendError(resp, "Ngay ket thuc khong duoc nho hon ngay bat dau");
                return;
            }

            switch (action) {

                // =========================
                // TAB 2: BAO CAO DOANH THU
                // =========================
                case "getRevenue":
                    DashboardDTO revenueData = dashboardService.getDashboardData(fromDate, toDate);
                    resp.getWriter().write(gson.toJson(revenueData));
                    break;

                // =========================
                // TAB 1: DOI SOAT GIAO DICH
                // =========================
                case "reconcile":
                    handleReconcile(req, resp, fromDate, toDate);
                    break;

                // =========================
                // GET CATEGORIES FOR DROPDOWN
                // =========================
                case "getCategories":
                    handleGetCategories(resp);
                    break;

                case "exportExcel":
                    String type = req.getParameter("type");
                    if ("reconcile".equals(type)) {
                        // Redirect to ReconcileExportServlet
                        String exportUrl = req.getContextPath() + "/admin/reconcile-export?from=" + req.getParameter("from")
                                + "&to=" + req.getParameter("to")
                                + "&categoryId=" + req.getParameter("categoryId")
                                + "&status=" + req.getParameter("status")
                                + "&bank=" + req.getParameter("bank");
                        resp.sendRedirect(exportUrl);
                    } else if ("revenue".equals(type)) {
                        // Redirect to ReportExportServlet
                        String exportUrl = req.getContextPath() + "/admin/report-export?from=" + req.getParameter("from")
                                + "&to=" + req.getParameter("to")
                                + "&categoryId=" + req.getParameter("categoryId");
                        resp.sendRedirect(exportUrl);
                    } else {
                        // Default: dashboard export
                        String exportUrl = req.getContextPath() + "/admin/dashboard-export?from=" + req.getParameter("from")
                                + "&to=" + req.getParameter("to");
                        resp.sendRedirect(exportUrl);
                    }
                    break;

                case "confirmMatch":
                    String maGD = req.getParameter("maGD");
                    boolean isUpdated = reconcileService.updateTrangThaiDoiSoat(maGD, "KHOP");
                    resp.getWriter().write("{\"success\": " + isUpdated + "}");
                    break;

                case "confirmAll":
                    boolean isAllUpdated = reconcileService.confirmAllMatched(fromDate, toDate);
                    resp.getWriter().write("{\"success\": " + isAllUpdated + "}");
                    break;

                case "uploadBankFile":
                    // This is handled by BankImportServlet via POST
                    resp.getWriter().write("{\"success\": true, \"message\": \"Vui long su dung POST method de tai file len\"}");
                    break;

                default:
                    sendError(resp, "Action khong hop le");
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\": \"Loi he thong\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String action = req.getParameter("action");
        if ("uploadBankFile".equals(action)) {
            // Forward to BankImportServlet
            req.getRequestDispatcher("/admin/bank-import").forward(req, resp);
        } else {
            doGet(req, resp);
        }
    }

    // =========================
    // HANDLE RECONCILE
    // =========================
    private void handleReconcile(HttpServletRequest req, HttpServletResponse resp,
                                 Date fromDate, Date toDate) throws IOException {

        List<GiaoDichDTO> list = reconcileService.getTransactions(fromDate, toDate);

        int matched = 0;
        int mismatch = 0;
        int pending = 0;

        for (GiaoDichDTO t : list) {
            switch (t.getTrangThai()) {
                case "KHOP":
                    matched++;
                    break;
                case "SAI_LECH":
                    mismatch++;
                    break;
                case "CHO_XU_LY":
                    pending++;
                    break;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total", list.size());
        result.put("matched", matched);
        result.put("mismatch", mismatch);
        result.put("pending", pending);
        result.put("list", list);

        resp.getWriter().write(gson.toJson(result));
    }

    // =========================
    // HANDLE GET CATEGORIES
    // =========================
    private void handleGetCategories(HttpServletResponse resp) throws IOException {
        JsonArray categories = new JsonArray();

        String sql = "SELECT id, ten_danh_muc as name FROM danh_muc ORDER BY ten_danh_muc ASC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                JsonObject cat = new JsonObject();
                cat.addProperty("id", rs.getInt("id"));
                cat.addProperty("name", rs.getString("name"));
                categories.add(cat);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        JsonObject result = new JsonObject();
        result.add("categories", categories);
        resp.getWriter().write(gson.toJson(result));
    }

    // =========================
    // PARSE DATE
    // =========================
    private Date parseFromDate(HttpServletRequest req) {
        String from = req.getParameter("from");
        if (from == null || from.isEmpty()) {
            LocalDate today = LocalDate.now();
            return Date.valueOf(today.withDayOfMonth(1));
        }
        return Date.valueOf(from);
    }

    private Date parseToDate(HttpServletRequest req) {
        String to = req.getParameter("to");
        if (to == null || to.isEmpty()) {
            return Date.valueOf(LocalDate.now());
        }
        return Date.valueOf(to);
    }

    // =========================
    // ERROR RESPONSE
    // =========================
    private void sendError(HttpServletResponse resp, String message) throws IOException {
        resp.setStatus(400);
        resp.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}