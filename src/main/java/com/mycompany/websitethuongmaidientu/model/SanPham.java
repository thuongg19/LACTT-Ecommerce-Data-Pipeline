package com.mycompany.websitethuongmaidientu.model;

import java.math.BigDecimal;
import java.util.Date;

public class SanPham {
    private int id;
    private int maDanhMuc;
    private String tenSp;
    private String thuongHieu;
    private String moTa;
    private String thanhPhan;
    private String huongDanSuDung;
    private BigDecimal gia;
    private BigDecimal giaGoc;
    private int soLuongBan;
    private int soLuongTon;
    private double diemDanhGia;
    private int soDanhGia;
    private String hinhAnh;
    private int isActive;
    private int isFeatured;
    private int isNew;
    private Date createdAt;
    private String tenDanhMuc;

    public SanPham() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getMaDanhMuc() { return maDanhMuc; }
    public void setMaDanhMuc(int maDanhMuc) { this.maDanhMuc = maDanhMuc; }

    public String getTenSp() { return tenSp; }
    public void setTenSp(String tenSp) { this.tenSp = tenSp; }
    
    public String getTenDanhMuc() { return tenDanhMuc; }
    public void setTenDanhMuc(String tenDanhMuc) { this.tenDanhMuc = tenDanhMuc; }

    public String getThuongHieu() { return thuongHieu; }
    public void setThuongHieu(String thuongHieu) { this.thuongHieu = thuongHieu; }

    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }

    public String getThanhPhan() { return thanhPhan; }
    public void setThanhPhan(String thanhPhan) { this.thanhPhan = thanhPhan; }

    public String getHuongDanSuDung() { return huongDanSuDung; }
    public void setHuongDanSuDung(String huongDanSuDung) { this.huongDanSuDung = huongDanSuDung; }

    public BigDecimal getGia() { return gia; }
    public void setGia(BigDecimal gia) { this.gia = gia; }

    public BigDecimal getGiaGoc() { return giaGoc; }
    public void setGiaGoc(BigDecimal giaGoc) { this.giaGoc = giaGoc; }

    public int getSoLuongBan() { return soLuongBan; }
    public void setSoLuongBan(int soLuongBan) { this.soLuongBan = soLuongBan; }
    
    public int getSoLuongTon() { return soLuongTon; }
    public void setSoLuongTon(int soLuongTon) { this.soLuongTon = soLuongTon; }

    public double getDiemDanhGia() { return diemDanhGia; }
    public void setDiemDanhGia(double diemDanhGia) { this.diemDanhGia = diemDanhGia; }

    public int getSoDanhGia() { return soDanhGia; }
    public void setSoDanhGia(int soDanhGia) { this.soDanhGia = soDanhGia; }

    public String getHinhAnh() { return hinhAnh; }
    public void setHinhAnh(String hinhAnh) { this.hinhAnh = hinhAnh; }

    public int getIsActive() { return isActive; }
    public void setIsActive(int isActive) { this.isActive = isActive; }

    public int getIsFeatured() { return isFeatured; }
    public void setIsFeatured(int isFeatured) { this.isFeatured = isFeatured; }

    public int getIsNew() { return isNew; }
    public void setIsNew(int isNew) { this.isNew = isNew; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}