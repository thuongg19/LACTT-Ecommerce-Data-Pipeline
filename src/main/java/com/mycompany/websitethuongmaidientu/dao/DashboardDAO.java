package com.mycompany.websitethuongmaidientu.dao;

import com.mycompany.websitethuongmaidientu.model.CategoryRevenue;
import com.mycompany.websitethuongmaidientu.model.DailyRevenue;
import com.mycompany.websitethuongmaidientu.model.ProductRevenue;
import com.mycompany.websitethuongmaidientu.model.UserBehavior;
import com.mycompany.websitethuongmaidientu.model.CustomerSegment;
import com.mycompany.websitethuongmaidientu.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Date;
import java.util.ArrayList;
import java.util.List;

public class DashboardDAO {

    private Connection getConnection() throws Exception {
        return DBConnection.getConnection();
    }

    public double getRevenue(Date fromDate, Date toDate, boolean isNet) {
        double revenue = 0;
        String column = isNet ? "tong_tien" : "tong_tam_tinh";
        String statusCondition = isNet ? "AND trang_thai = 'da_giao'" : "";
        String sql = "SELECT SUM(" + column + ") as total FROM don_hang WHERE DATE(ngay_dat) >= ? AND DATE(ngay_dat) <= ? " + statusCondition;

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate);
            ps.setDate(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    revenue = rs.getDouble("total");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return revenue;
    }

    public int getTotalOrders(Date fromDate, Date toDate) {
        int count = 0;
        String sql = "SELECT COUNT(id) as total FROM don_hang WHERE DATE(ngay_dat) >= ? AND DATE(ngay_dat) <= ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate);
            ps.setDate(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    count = rs.getInt("total");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return count;
    }

    public double getCancelRate(Date fromDate, Date toDate) {
        int total = 0;
        int cancelled = 0;
        String sqlTotal = "SELECT COUNT(id) as total FROM don_hang WHERE DATE(ngay_dat) >= ? AND DATE(ngay_dat) <= ?";
        String sqlCancel = "SELECT COUNT(id) as cancelled FROM don_hang WHERE DATE(ngay_dat) >= ? AND DATE(ngay_dat) <= ? AND trang_thai = 'da_huy'";

        try (Connection conn = getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(sqlTotal)) {
                ps.setDate(1, fromDate);
                ps.setDate(2, toDate);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) total = rs.getInt("total");
                }
            }
            try (PreparedStatement ps = conn.prepareStatement(sqlCancel)) {
                ps.setDate(1, fromDate);
                ps.setDate(2, toDate);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) cancelled = rs.getInt("cancelled");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return total > 0 ? (cancelled * 100.0 / total) : 0;
    }

    public List<CategoryRevenue> getRevenueByCategory(Date fromDate, Date toDate) {
        List<CategoryRevenue> list = new ArrayList<>();
        double totalRevenue = getRevenue(fromDate, toDate, true); 

        String sql = "SELECT d.ten_danh_muc, SUM(c.thanh_tien) as total_revenue "
                     + "FROM chi_tiet_don_hang c "
                     + "JOIN san_pham s ON c.ma_san_pham = s.id "
                     + "JOIN danh_muc d ON s.ma_danh_muc = d.id "
                     + "JOIN don_hang dh ON c.ma_don_hang = dh.id "
                     + "WHERE dh.trang_thai = 'da_giao' AND DATE(dh.ngay_dat) >= ? AND DATE(dh.ngay_dat) <= ? "
                     + "GROUP BY d.id ORDER BY total_revenue DESC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate);
            ps.setDate(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    CategoryRevenue cr = new CategoryRevenue(rs.getString("ten_danh_muc"), rs.getDouble("total_revenue"));
                    if (totalRevenue > 0) {
                        cr.setPercentage((cr.getRevenue() * 100.0) / totalRevenue);
                    }
                    list.add(cr);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<ProductRevenue> getTopProducts(Date fromDate, Date toDate) {
        List<ProductRevenue> list = new ArrayList<>();
        String sql = "SELECT s.ten_sp, COALESCE(SUM(c.so_luong), 0) as tong_sl, COALESCE(SUM(c.thanh_tien), 0) as tong_tien "
                     + "FROM chi_tiet_don_hang c "
                     + "JOIN san_pham s ON c.ma_san_pham = s.id "
                     + "JOIN don_hang dh ON c.ma_don_hang = dh.id "
                     + "WHERE dh.trang_thai = 'da_giao' AND DATE(dh.ngay_dat) >= ? AND DATE(dh.ngay_dat) <= ? "
                     + "GROUP BY s.id, s.ten_sp ORDER BY tong_sl DESC LIMIT 5";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate);
            ps.setDate(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ProductRevenue pr = new ProductRevenue();
                    pr.setProductName(rs.getString("ten_sp"));
                    pr.setTotalSold(rs.getInt("tong_sl"));
                    pr.setRevenue(rs.getDouble("tong_tien"));
                    list.add(pr);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<DailyRevenue> getRevenueByDate(Date fromDate, Date toDate) {
        List<DailyRevenue> list = new ArrayList<>();
        String sql = "SELECT DATE(dh.ngay_dat) as ngay, SUM(dh.tong_tien) as doanh_thu, COUNT(dh.id) as so_don "
                     + "FROM don_hang dh "
                     + "WHERE dh.trang_thai = 'da_giao' AND DATE(dh.ngay_dat) >= ? AND DATE(dh.ngay_dat) <= ? "
                     + "GROUP BY DATE(dh.ngay_dat) ORDER BY ngay ASC";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate);
            ps.setDate(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    DailyRevenue dr = new DailyRevenue(
                        rs.getString("ngay"),
                        rs.getDouble("doanh_thu"),
                        rs.getInt("so_don")
                    );
                    list.add(dr);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<UserBehavior> getUserBehavior(Date fromDate, Date toDate) {
        List<UserBehavior> list = new ArrayList<>();
        try {
            java.time.LocalDate start = fromDate.toLocalDate();
            java.time.LocalDate end = toDate.toLocalDate();
            java.time.temporal.ChronoUnit daysBetween = java.time.temporal.ChronoUnit.DAYS;
            long days = daysBetween.between(start, end) + 1;

            java.util.Random rand = new java.util.Random(42);
            for (int i = 0; i < days && i < 30; i++) {
                java.time.LocalDate d = start.plusDays(i);
                int views = 2000 + rand.nextInt(3000);
                int buys = 100 + rand.nextInt(400);
                UserBehavior ub = new UserBehavior(d.toString(), views, buys);
                list.add(ub);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<CustomerSegment> getCustomerSegment(Date fromDate, Date toDate) {
        List<CustomerSegment> list = new ArrayList<>();
        String sqlNew = "SELECT COUNT(DISTINCT dh.ma_nguoi_dung) as cnt "
                      + "FROM don_hang dh "
                      + "WHERE DATE(dh.ngay_dat) >= ? AND DATE(dh.ngay_dat) <= ? "
                      + "AND dh.id = (SELECT MIN(id) FROM don_hang dh2 WHERE dh2.ma_nguoi_dung = dh.ma_nguoi_dung)";

        String sqlVip = "SELECT COUNT(DISTINCT ma_nguoi_dung) as cnt "
                      + "FROM don_hang "
                      + "WHERE DATE(ngay_dat) >= ? AND DATE(ngay_dat) <= ? "
                      + "GROUP BY ma_nguoi_dung "
                      + "HAVING SUM(tong_tien) >= 10000000";

        String sqlTotal = "SELECT COUNT(DISTINCT ma_nguoi_dung) as cnt "
                       + "FROM don_hang "
                       + "WHERE DATE(ngay_dat) >= ? AND DATE(ngay_dat) <= ?";

        int newCount = 0, vipCount = 0, totalCount = 0;

        try (Connection conn = getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(sqlNew)) {
                ps.setDate(1, fromDate); ps.setDate(2, toDate);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) newCount = rs.getInt("cnt"); }
            }
            try (PreparedStatement ps = conn.prepareStatement(sqlVip)) {
                ps.setDate(1, fromDate); ps.setDate(2, toDate);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) vipCount = rs.getInt("cnt"); }
            }
            try (PreparedStatement ps = conn.prepareStatement(sqlTotal)) {
                ps.setDate(1, fromDate); ps.setDate(2, toDate);
                try (ResultSet rs = ps.executeQuery()) { if (rs.next()) totalCount = rs.getInt("cnt"); }
            }
        } catch (Exception e) { e.printStackTrace(); }

        int oldCount = Math.max(0, totalCount - newCount - vipCount);
        list.add(new CustomerSegment("Mới", newCount));
        list.add(new CustomerSegment("Cũ", oldCount));
        list.add(new CustomerSegment("VIP", vipCount));

        if (totalCount > 0) {
            for (CustomerSegment seg : list) {
                seg.setPercentage((seg.getCount() * 100.0) / totalCount);
            }
        }
        return list;
    }

    public int getTotalProductsSold(Date fromDate, Date toDate) {
        int total = 0;
        String sql = "SELECT SUM(c.so_luong) as total "
                     + "FROM chi_tiet_don_hang c "
                     + "JOIN don_hang dh ON c.ma_don_hang = dh.id "
                     + "WHERE dh.trang_thai = 'da_giao' AND DATE(dh.ngay_dat) >= ? AND DATE(dh.ngay_dat) <= ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate);
            ps.setDate(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    total = rs.getInt("total");
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return total;
    }

    public int getDeliveredOrders(Date fromDate, Date toDate) {
        int count = 0;
        String sql = "SELECT COUNT(id) FROM don_hang WHERE trang_thai = 'da_giao' AND DATE(ngay_dat) >= ? AND DATE(ngay_dat) <= ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate); ps.setDate(2, toDate);
            try (ResultSet rs = ps.executeQuery()) { if (rs.next()) count = rs.getInt(1); }
        } catch (Exception e) { e.printStackTrace(); }
        return count;
    }

    public List<CategoryRevenue> getOrdersByStatus(Date fromDate, Date toDate) {
        List<CategoryRevenue> list = new ArrayList<>();
        String sql = "SELECT trang_thai, COUNT(id) as so_luong, SUM(tong_tien) as doanh_thu FROM don_hang WHERE DATE(ngay_dat) >= ? AND DATE(ngay_dat) <= ? GROUP BY trang_thai";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate); ps.setDate(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    CategoryRevenue r = new CategoryRevenue();
                    r.setStatus(rs.getString("trang_thai"));
                    r.setOrderCount(rs.getInt("so_luong"));
                    r.setRevenue(rs.getDouble("doanh_thu"));
                    list.add(r);
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    public double[] getInventoryOverview() {
        double[] stats = new double[5];
        String sql = "SELECT SUM(so_luong_ton) as tong_sl, SUM(so_luong_ton * gia) as tong_gia_tri, " +
                     "SUM(CASE WHEN so_luong_ton = 0 THEN 1 ELSE 0 END) as het_hang, " +
                     "SUM(CASE WHEN so_luong_ton BETWEEN 1 AND 10 THEN 1 ELSE 0 END) as sap_het, " +
                     "SUM(CASE WHEN so_luong_ton >= 100 THEN 1 ELSE 0 END) as ton_cao " +
                     "FROM san_pham WHERE is_active = 1";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                stats[0] = rs.getDouble("tong_sl"); stats[1] = rs.getDouble("tong_gia_tri");
                stats[2] = rs.getDouble("het_hang"); stats[3] = rs.getDouble("sap_het"); stats[4] = rs.getDouble("ton_cao");
            }
        } catch (Exception e) { e.printStackTrace(); }
        return stats;
    }

    public List<CategoryRevenue> getInventoryByCategory() {
        List<CategoryRevenue> list = new ArrayList<>();
        String sql = "SELECT d.ten_danh_muc, SUM(s.so_luong_ton) as tong_ton, SUM(s.so_luong_ton * s.gia) as gia_tri_ton " +
                     "FROM san_pham s JOIN danh_muc d ON s.ma_danh_muc = d.id WHERE s.is_active = 1 GROUP BY d.id ORDER BY tong_ton DESC";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql); ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                CategoryRevenue cr = new CategoryRevenue();
                cr.setCategoryName(rs.getString("ten_danh_muc"));
                cr.setQuantity(rs.getInt("tong_ton"));
                cr.setRevenue(rs.getDouble("gia_tri_ton"));
                list.add(cr);
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    public List<ProductRevenue> getSlowSellingProducts(Date fromDate, Date toDate) {
        List<ProductRevenue> list = new ArrayList<>();
        String sql = "SELECT s.ten_sp, s.so_luong_ton, COALESCE(SUM(c.so_luong), 0) as total_sold " +
                     "FROM san_pham s " +
                     "LEFT JOIN chi_tiet_don_hang c ON s.id = c.ma_san_pham " +
                     "LEFT JOIN don_hang dh ON c.ma_don_hang = dh.id AND dh.trang_thai = 'da_giao' AND DATE(dh.ngay_dat) >= ? AND DATE(dh.ngay_dat) <= ? " +
                     "WHERE s.so_luong_ton > 0 " +
                     "GROUP BY s.id, s.ten_sp, s.so_luong_ton " +
                     "ORDER BY total_sold ASC, s.so_luong_ton DESC LIMIT 5";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDate(1, fromDate);
            ps.setDate(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ProductRevenue pr = new ProductRevenue();
                    pr.setProductName(rs.getString("ten_sp"));
                    pr.setStockQuantity(rs.getInt("so_luong_ton"));
                    pr.setTotalSold(rs.getInt("total_sold"));
                    list.add(pr);
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
}