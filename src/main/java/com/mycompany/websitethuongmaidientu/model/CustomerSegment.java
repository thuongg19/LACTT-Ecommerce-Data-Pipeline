package com.mycompany.websitethuongmaidientu.model;

public class CustomerSegment {
    private String type;
    private int count;
    private double percentage;

    public CustomerSegment() {
    }

    public CustomerSegment(String type, int count) {
        this.type = type;
        this.count = count;
        this.percentage = 0.0;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }
}