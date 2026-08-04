package com.mycompany.websitethuongmaidientu.model;

public class CategoryRevenue {
    private String categoryName;
    private double revenue;
    private double percentage;
    private int quantity;
    private String status;
    private int orderCount;

    public CategoryRevenue() {
    }

    public CategoryRevenue(String categoryName, double revenue) {
        this.categoryName = categoryName;
        this.revenue = revenue;
        this.percentage = 0.0;
    }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public double getRevenue() { return revenue; }
    public void setRevenue(double revenue) { this.revenue = revenue; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getOrderCount() { return orderCount; }
    public void setOrderCount(int orderCount) { this.orderCount = orderCount; }
}