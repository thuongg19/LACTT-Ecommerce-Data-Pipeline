package com.mycompany.websitethuongmaidientu.model;

public class DailyRevenue {
    private String date;
    private double revenue;
    private int orderCount;
    private double aov;

    public DailyRevenue() {}

    public DailyRevenue(String date, double revenue, int orderCount) {
        this.date = date;
        this.revenue = revenue;
        this.orderCount = orderCount;
        this.aov = orderCount > 0 ? revenue / orderCount : 0;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public double getRevenue() { return revenue; }
    public void setRevenue(double revenue) { this.revenue = revenue; }

    public int getOrderCount() { return orderCount; }
    public void setOrderCount(int orderCount) { this.orderCount = orderCount; }

    public double getAov() { return aov; }
    public void setAov(double aov) { this.aov = aov; }
}