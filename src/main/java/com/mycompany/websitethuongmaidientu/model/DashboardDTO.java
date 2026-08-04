package com.mycompany.websitethuongmaidientu.model;

import java.util.List;

public class DashboardDTO {
    private double netRevenue;
    private double grossRevenue;
    private int totalOrders;
    private double vsLastPeriod;
    private double vsLastYear;
    private double aov;
    private double conversionRate;
    private double cancelRate;
    
    private int deliveredOrders;
    private int totalInventory;
    private double inventoryValue;
    private int outOfStockCount;
    private int lowStockCount;
    private int highStockCount;

    private List<CategoryRevenue> categoryList;
    private List<ProductRevenue> topProducts;
    private List<DailyRevenue> dailyRevenueList;
    private List<UserBehavior> userBehaviorList;
    private List<CustomerSegment> customerSegmentList;
    private List<CategoryRevenue> ordersByStatus;
    private List<CategoryRevenue> inventoryByCategory;
    private List<ProductRevenue> slowSellingProducts;

    public double getNetRevenue() { return netRevenue; }
    public void setNetRevenue(double netRevenue) { this.netRevenue = netRevenue; }

    public double getGrossRevenue() { return grossRevenue; }
    public void setGrossRevenue(double grossRevenue) { this.grossRevenue = grossRevenue; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public double getVsLastPeriod() { return vsLastPeriod; }
    public void setVsLastPeriod(double vsLastPeriod) { this.vsLastPeriod = vsLastPeriod; }

    public double getVsLastYear() { return vsLastYear; }
    public void setVsLastYear(double vsLastYear) { this.vsLastYear = vsLastYear; }

    public double getAov() { return aov; }
    public void setAov(double aov) { this.aov = aov; }

    public double getConversionRate() { return conversionRate; }
    public void setConversionRate(double conversionRate) { this.conversionRate = conversionRate; }

    public double getCancelRate() { return cancelRate; }
    public void setCancelRate(double cancelRate) { this.cancelRate = cancelRate; }

    public int getDeliveredOrders() { return deliveredOrders; }
    public void setDeliveredOrders(int deliveredOrders) { this.deliveredOrders = deliveredOrders; }

    public int getTotalInventory() { return totalInventory; }
    public void setTotalInventory(int totalInventory) { this.totalInventory = totalInventory; }

    public double getInventoryValue() { return inventoryValue; }
    public void setInventoryValue(double inventoryValue) { this.inventoryValue = inventoryValue; }

    public int getOutOfStockCount() { return outOfStockCount; }
    public void setOutOfStockCount(int outOfStockCount) { this.outOfStockCount = outOfStockCount; }

    public int getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(int lowStockCount) { this.lowStockCount = lowStockCount; }

    public int getHighStockCount() { return highStockCount; }
    public void setHighStockCount(int highStockCount) { this.highStockCount = highStockCount; }

    public List<CategoryRevenue> getCategoryList() { return categoryList; }
    public void setCategoryList(List<CategoryRevenue> categoryList) { this.categoryList = categoryList; }

    public List<ProductRevenue> getTopProducts() { return topProducts; }
    public void setTopProducts(List<ProductRevenue> topProducts) { this.topProducts = topProducts; }

    public List<DailyRevenue> getDailyRevenueList() { return dailyRevenueList; }
    public void setDailyRevenueList(List<DailyRevenue> dailyRevenueList) { this.dailyRevenueList = dailyRevenueList; }

    public List<UserBehavior> getUserBehaviorList() { return userBehaviorList; }
    public void setUserBehaviorList(List<UserBehavior> userBehaviorList) { this.userBehaviorList = userBehaviorList; }

    public List<CustomerSegment> getCustomerSegmentList() { return customerSegmentList; }
    public void setCustomerSegmentList(List<CustomerSegment> customerSegmentList) { this.customerSegmentList = customerSegmentList; }

    public List<CategoryRevenue> getOrdersByStatus() { return ordersByStatus; }
    public void setOrdersByStatus(List<CategoryRevenue> ordersByStatus) { this.ordersByStatus = ordersByStatus; }

    public List<CategoryRevenue> getInventoryByCategory() { return inventoryByCategory; }
    public void setInventoryByCategory(List<CategoryRevenue> inventoryByCategory) { this.inventoryByCategory = inventoryByCategory; }

    public List<ProductRevenue> getSlowSellingProducts() { return slowSellingProducts; }
    public void setSlowSellingProducts(List<ProductRevenue> slowSellingProducts) { this.slowSellingProducts = slowSellingProducts; }
}