package com.mycompany.websitethuongmaidientu.service;

import com.mycompany.websitethuongmaidientu.dao.DashboardDAO;
import com.mycompany.websitethuongmaidientu.model.DashboardDTO;
import com.mycompany.websitethuongmaidientu.model.DailyRevenue;
import com.mycompany.websitethuongmaidientu.model.UserBehavior;
import com.mycompany.websitethuongmaidientu.model.CustomerSegment;

import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

public class DashboardService {
    private final DashboardDAO dashboardDAO = new DashboardDAO();

    public DashboardDTO getDashboardData(Date fromDate, Date toDate) {
        DashboardDTO dto = new DashboardDTO();

        double netRevenue = dashboardDAO.getRevenue(fromDate, toDate, true);
        double grossRevenue = dashboardDAO.getRevenue(fromDate, toDate, false);
        int totalOrders = dashboardDAO.getTotalOrders(fromDate, toDate);

        dto.setNetRevenue(netRevenue);
        dto.setGrossRevenue(grossRevenue);
        dto.setTotalOrders(totalOrders);

        if (totalOrders > 0) {
            dto.setAov(netRevenue / totalOrders);
        } else {
            dto.setAov(0);
        }

        // Tinh ty le hoan don
        dto.setCancelRate(dashboardDAO.getCancelRate(fromDate, toDate));

        // Tinh toan ty le chuyen doi gia lap
        dto.setConversionRate((double) totalOrders / 1000 * 100);

        // Tinh toan ky truoc
        LocalDate start = fromDate.toLocalDate();
        LocalDate end = toDate.toLocalDate();
        long daysBetween = ChronoUnit.DAYS.between(start, end) + 1;

        LocalDate lastPeriodEnd = start.minusDays(1);
        LocalDate lastPeriodStart = lastPeriodEnd.minusDays(daysBetween - 1);
        double lastPeriodRevenue = dashboardDAO.getRevenue(Date.valueOf(lastPeriodStart), Date.valueOf(lastPeriodEnd), true);
        dto.setVsLastPeriod(calculateGrowth(netRevenue, lastPeriodRevenue));

        // Tinh toan nam truoc
        LocalDate lastYearStart = start.minusYears(1);
        LocalDate lastYearEnd = end.minusYears(1);
        double lastYearRevenue = dashboardDAO.getRevenue(Date.valueOf(lastYearStart), Date.valueOf(lastYearEnd), true);
        dto.setVsLastYear(calculateGrowth(netRevenue, lastYearRevenue));

        dto.setCategoryList(dashboardDAO.getRevenueByCategory(fromDate, toDate));
        dto.setTopProducts(dashboardDAO.getTopProducts(fromDate, toDate));
        dto.setDailyRevenueList(dashboardDAO.getRevenueByDate(fromDate, toDate));
        dto.setUserBehaviorList(dashboardDAO.getUserBehavior(fromDate, toDate));
        dto.setCustomerSegmentList(dashboardDAO.getCustomerSegment(fromDate, toDate));
        dto.setInventoryByCategory(dashboardDAO.getInventoryByCategory());
        dto.setSlowSellingProducts(dashboardDAO.getSlowSellingProducts(fromDate, toDate));
        dto.setDeliveredOrders(dashboardDAO.getDeliveredOrders(fromDate, toDate));
        dto.setOrdersByStatus(dashboardDAO.getOrdersByStatus(fromDate, toDate));

        double[] inv = dashboardDAO.getInventoryOverview();
        dto.setTotalInventory((int) inv[0]);
        dto.setInventoryValue(inv[1]);
        dto.setOutOfStockCount((int) inv[2]);
        dto.setLowStockCount((int) inv[3]);
        dto.setHighStockCount((int) inv[4]);

        dto.setInventoryByCategory(dashboardDAO.getInventoryByCategory());
        dto.setSlowSellingProducts(dashboardDAO.getSlowSellingProducts(fromDate, toDate));

        return dto;
    }

    private double calculateGrowth(double current, double previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : 0.0;
        }
        return ((current - previous) / previous) * 100;
    }
}