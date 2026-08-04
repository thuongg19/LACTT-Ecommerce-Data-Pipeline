package com.mycompany.websitethuongmaidientu.model;

public class UserBehavior {
    private String date;
    private int views;
    private int buys;
    private double conversionRate;

    public UserBehavior() {}

    public UserBehavior(String date, int views, int buys) {
        this.date = date;
        this.views = views;
        this.buys = buys;
        this.conversionRate = views > 0 ? (buys * 100.0 / views) : 0;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public int getViews() { return views; }
    public void setViews(int views) { this.views = views; }

    public int getBuys() { return buys; }
    public void setBuys(int buys) { this.buys = buys; }

    public double getConversionRate() { return conversionRate; }
    public void setConversionRate(double conversionRate) { this.conversionRate = conversionRate; }
}