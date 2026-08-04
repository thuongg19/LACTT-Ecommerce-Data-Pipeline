package com.mycompany.websitethuongmaidientu.model;

import java.sql.Date;
import java.sql.Timestamp;

public class Voucher {
    private int id;
    private String voucherCode;
    private String ten;
    private String loai;
    private double giaTriGiam;
    private double donHangToiThieu;
    private Integer soLuotToiDa;
    private int soLuotDaDung;
    private int gioiHanMoiTk;
    private Date ngayBatDau;
    private Date ngayKetThuc;
    private int isActive;
    private Timestamp createdAt;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getVoucherCode() { return voucherCode; }
    public void setVoucherCode(String voucherCode) { this.voucherCode = voucherCode; }
    public String getTen() { return ten; }
    public void setTen(String ten) { this.ten = ten; }
    public String getLoai() { return loai; }
    public void setLoai(String loai) { this.loai = loai; }
    public double getGiaTriGiam() { return giaTriGiam; }
    public void setGiaTriGiam(double giaTriGiam) { this.giaTriGiam = giaTriGiam; }
    public double getDonHangToiThieu() { return donHangToiThieu; }
    public void setDonHangToiThieu(double donHangToiThieu) { this.donHangToiThieu = donHangToiThieu; }
    public Integer getSoLuotToiDa() { return soLuotToiDa; }
    public void setSoLuotToiDa(Integer soLuotToiDa) { this.soLuotToiDa = soLuotToiDa; }
    public int getSoLuotDaDung() { return soLuotDaDung; }
    public void setSoLuotDaDung(int soLuotDaDung) { this.soLuotDaDung = soLuotDaDung; }
    public int getGioiHanMoiTk() { return gioiHanMoiTk; }
    public void setGioiHanMoiTk(int gioiHanMoiTk) { this.gioiHanMoiTk = gioiHanMoiTk; }
    public Date getNgayBatDau() { return ngayBatDau; }
    public void setNgayBatDau(Date ngayBatDau) { this.ngayBatDau = ngayBatDau; }
    public Date getNgayKetThuc() { return ngayKetThuc; }
    public void setNgayKetThuc(Date ngayKetThuc) { this.ngayKetThuc = ngayKetThuc; }
    public int getIsActive() { return isActive; }
    public void setIsActive(int isActive) { this.isActive = isActive; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}