package com.mycompany.websitethuongmaidientu.servlet;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.mycompany.websitethuongmaidientu.dao.TaiKhoanDAO;
import com.mycompany.websitethuongmaidientu.model.TaiKhoan;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@WebServlet("/NguoiDungServlet")
public class NguoiDungServlet extends HttpServlet {

    private TaiKhoanDAO taiKhoanDAO;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        super.init();
        taiKhoanDAO = new TaiKhoanDAO();
        gson = new GsonBuilder()
                .setDateFormat("dd/MM/yyyy")
                .create();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doPost(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json; charset=UTF-8");

        String action = req.getParameter("action");
        if (action == null) action = "list";

        Integer currentAdminId = 1;

        JsonObject jsonResponse = new JsonObject();
        PrintWriter out = resp.getWriter();

        try {
            switch (action) {
                case "list":
                    handleListUsers(req, jsonResponse);
                    break;
                case "get":
                    handleGetUser(req, jsonResponse);
                    break;
                case "lock":
                    handleLockAccount(req, jsonResponse, currentAdminId);
                    break;
                case "unlock":
                    handleUnlockAccount(req, jsonResponse, currentAdminId);
                    break;
                case "changeRole":
                    handleChangeRole(req, jsonResponse, currentAdminId);
                    break;
                case "updateProfile":
                    handleUpdateProfile(req, jsonResponse, currentAdminId);
                    break;
                case "resetPassword":
                    handleResetPassword(req, jsonResponse, currentAdminId);
                    break;
                default:
                    jsonResponse.addProperty("success", false);
                    jsonResponse.addProperty("message", "Hành động không hợp lệ");
            }
        } catch (Exception e) {
            e.printStackTrace();
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Lỗi hệ thống: " + e.getMessage());
        }

        out.print(gson.toJson(jsonResponse));
        out.flush();
    }

    private void handleListUsers(HttpServletRequest req, JsonObject jsonResponse) {
        String roleFilter = req.getParameter("role");
        if (roleFilter == null) roleFilter = "all";

        List<TaiKhoan> users = taiKhoanDAO.getAllUsers(roleFilter);
        java.util.List<java.util.Map<String, Object>> userList = new java.util.ArrayList<>();
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");

        for (TaiKhoan tk : users) {
            java.util.Map<String, Object> u = new java.util.HashMap<>();
            u.put("id", tk.getId());
            u.put("name", tk.getHoTen());
            u.put("email", tk.getEmail());
            u.put("gioiTinh", tk.getGioiTinh() != null ? tk.getGioiTinh() : "");
            u.put("ngaySinh", tk.getNgaySinh() != null ? sdf.format(tk.getNgaySinh()) : "");
            u.put("phone", tk.getSoDienThoai() != null ? tk.getSoDienThoai() : "");
            u.put("role", convertRoleToUI(tk.getVaiTro()));
            u.put("status", tk.getIsActive() == 1 ? "active" : "locked");
            u.put("orders", tk.getSoDonHang());
            u.put("points", tk.getTongDiem() > 0 ? String.format("%,d", tk.getTongDiem()) : "-");
            u.put("joined", tk.getCreatedAt() != null ? sdf.format(tk.getCreatedAt()) : "");
            userList.add(u);
        }

        jsonResponse.addProperty("success", true);
        jsonResponse.add("data", gson.toJsonTree(userList));
    }

    private void handleGetUser(HttpServletRequest req, JsonObject jsonResponse) {
        String idStr = req.getParameter("id");
        if (idStr == null) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Thiếu ID người dùng");
            return;
        }

        int id = Integer.parseInt(idStr);
        TaiKhoan tk = taiKhoanDAO.getById(id);

        if (tk == null) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Không tìm thấy người dùng");
            return;
        }

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        java.util.Map<String, Object> userData = new java.util.HashMap<>();
        userData.put("hoTen", tk.getHoTen());
        userData.put("email", tk.getEmail());
        userData.put("soDienThoai", tk.getSoDienThoai());
        userData.put("gioiTinh", tk.getGioiTinh());
        userData.put("loaiDa", tk.getLoaiDa());
        userData.put("ngaySinh", tk.getNgaySinh() != null ? sdf.format(tk.getNgaySinh()) : "");

        jsonResponse.addProperty("success", true);
        jsonResponse.add("data", gson.toJsonTree(userData));
    }

    private void handleLockAccount(HttpServletRequest req, JsonObject jsonResponse, int currentAdminId) {
        String idStr = req.getParameter("id");
        String reason = req.getParameter("reason");

        if (idStr == null || reason == null || reason.trim().isEmpty()) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Thiếu thông tin khóa tài khoản");
            return;
        }

        int userId = Integer.parseInt(idStr);
        if (userId == currentAdminId) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Không thể tự khóa phiên đăng nhập hiện tại.");
            return;
        }

        if (taiKhoanDAO.lockAccount(userId, reason, currentAdminId)) {
            jsonResponse.addProperty("success", true);
        } else {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Lỗi DB: Không thể khóa tài khoản");
        }
    }

    private void handleUnlockAccount(HttpServletRequest req, JsonObject jsonResponse, int currentAdminId) {
        int userId = Integer.parseInt(req.getParameter("id"));
        if (taiKhoanDAO.unlockAccount(userId, currentAdminId)) {
            jsonResponse.addProperty("success", true);
        } else {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Lỗi DB: Không thể mở khóa");
        }
    }

    private void handleChangeRole(HttpServletRequest req, JsonObject jsonResponse, int currentAdminId) {
        int userId = Integer.parseInt(req.getParameter("id"));
        String newRole = req.getParameter("newRole");

        if (userId == currentAdminId) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Không thể tự hạ quyền chính mình.");
            return;
        }

        if (taiKhoanDAO.updateRole(userId, newRole, currentAdminId)) {
            jsonResponse.addProperty("success", true);
        } else {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Không thể cập nhật phân quyền");
        }
    }

    private void handleUpdateProfile(HttpServletRequest req, JsonObject jsonResponse, int currentAdminId) {
        int userId = Integer.parseInt(req.getParameter("id"));
        String hoTen = req.getParameter("hoTen");
        String email = req.getParameter("email");
        String soDienThoai = req.getParameter("soDienThoai");
        String gioiTinh = req.getParameter("gioiTinh");
        String loaiDa = req.getParameter("loaiDa");
        String ngaySinhStr = req.getParameter("ngaySinh");

        if (taiKhoanDAO.isEmailExists(email, userId)) {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Email đã tồn tại trong hệ thống");
            return;
        }

        Date ngaySinh = null;
        if (ngaySinhStr != null && !ngaySinhStr.isEmpty()) {
            try { ngaySinh = new SimpleDateFormat("yyyy-MM-dd").parse(ngaySinhStr); } catch (Exception ignored) {}
        }

        if (taiKhoanDAO.updateProfile(userId, hoTen, email, soDienThoai, gioiTinh, loaiDa, ngaySinh, currentAdminId)) {
            jsonResponse.addProperty("success", true);
        } else {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Lỗi lưu DB");
        }
    }

    private void handleResetPassword(HttpServletRequest req, JsonObject jsonResponse, int currentAdminId) {
        int userId = Integer.parseInt(req.getParameter("id"));
        if (taiKhoanDAO.resetPassword(userId, currentAdminId)) {
            jsonResponse.addProperty("success", true);
        } else {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Không thể reset mật khẩu");
        }
    }

    private String convertRoleToUI(String dbRole) {
        if (dbRole == null) return "kh";
        switch(dbRole) {
            case "admin": return "admin";
            case "nhan_vien_kho": return "nv";
            default: return "kh";
        }
    }
}