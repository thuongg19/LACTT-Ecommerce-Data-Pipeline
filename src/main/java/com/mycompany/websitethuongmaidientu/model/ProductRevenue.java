package com.mycompany.websitethuongmaidientu.model;

public class ProductRevenue {
    private String productName;
    private int totalSold;
    private double revenue;
    private int stockQuantity;

    public ProductRevenue() {
    }

    public ProductRevenue(String productName, int totalSold) {
        this.productName = productName;
        this.totalSold = totalSold;
        this.revenue = 0.0;
    }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public int getTotalSold() { return totalSold; }
    public void setTotalSold(int totalSold) { this.totalSold = totalSold; }

    public double getRevenue() { return revenue; }
    public void setRevenue(double revenue) { this.revenue = revenue; }

    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) { this.stockQuantity = stockQuantity; }

    public String getName() {
        return this.productName;
    }
}