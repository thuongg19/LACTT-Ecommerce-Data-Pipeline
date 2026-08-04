package com.mycompany.websitethuongmaidientu.model;

import java.math.BigDecimal;

public class ChiTietDonHang {
    private int id;
    private int maDonHang;
    private int maSanPham;
    private String tenSanPham;
    private String thuongHieu;
    private String tenVariant;
    private int soLuong;
    private BigDecimal gia;
    private BigDecimal thanhTien;
    private String hinhAnh; // lấy từ JOIN với bảng san_pham

    public ChiTietDonHang() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getMaDonHang() { return maDonHang; }
    public void setMaDonHang(int maDonHang) { this.maDonHang = maDonHang; }

    public int getMaSanPham() { return maSanPham; }
    public void setMaSanPham(int maSanPham) { this.maSanPham = maSanPham; }

    public String getTenSanPham() { return tenSanPham; }
    public void setTenSanPham(String tenSanPham) { this.tenSanPham = tenSanPham; }

    public String getThuongHieu() { return thuongHieu; }
    public void setThuongHieu(String thuongHieu) { this.thuongHieu = thuongHieu; }

    public String getTenVariant() { return tenVariant; }
    public void setTenVariant(String tenVariant) { this.tenVariant = tenVariant; }

    public int getSoLuong() { return soLuong; }
    public void setSoLuong(int soLuong) { this.soLuong = soLuong; }

    public BigDecimal getGia() { return gia; }
    public void setGia(BigDecimal gia) { this.gia = gia; }

    public BigDecimal getThanhTien() { return thanhTien; }
    public void setThanhTien(BigDecimal thanhTien) { this.thanhTien = thanhTien; }

    public String getHinhAnh() { return hinhAnh; }
    public void setHinhAnh(String hinhAnh) { this.hinhAnh = hinhAnh; }
}