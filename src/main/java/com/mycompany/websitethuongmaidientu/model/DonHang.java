package com.mycompany.websitethuongmaidientu.model;

import java.math.BigDecimal;
import java.util.Date;

public class DonHang {
    private int id;
    private int maNguoiDung;
    private Integer maDiaChi; // Dùng Integer để nhận giá trị null an toàn
    private String maDonHang;
    private String tenNguoiNhan;
    private String soDienThoai;
    private String diaChiGiao;
    private String ghiChu;
    private BigDecimal tongTamTinh;
    private BigDecimal phiVanChuyen;
    private BigDecimal giamGia;
    private BigDecimal tongTien;
    private String phuongThucTT;
    private String trangThai;
    private Date ngayDat;

    public DonHang() {}

    // --- GETTER & SETTER ---
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getMaNguoiDung() { return maNguoiDung; }
    public void setMaNguoiDung(int maNguoiDung) { this.maNguoiDung = maNguoiDung; }

    public Integer getMaDiaChi() { return maDiaChi; }
    public void setMaDiaChi(Integer maDiaChi) { this.maDiaChi = maDiaChi; }

    public String getMaDonHang() { return maDonHang; }
    public void setMaDonHang(String maDonHang) { this.maDonHang = maDonHang; }

    public String getTenNguoiNhan() { return tenNguoiNhan; }
    public void setTenNguoiNhan(String tenNguoiNhan) { this.tenNguoiNhan = tenNguoiNhan; }

    public String getSoDienThoai() { return soDienThoai; }
    public void setSoDienThoai(String soDienThoai) { this.soDienThoai = soDienThoai; }

    public String getDiaChiGiao() { return diaChiGiao; }
    public void setDiaChiGiao(String diaChiGiao) { this.diaChiGiao = diaChiGiao; }

    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }

    public BigDecimal getTongTamTinh() { return tongTamTinh; }
    public void setTongTamTinh(BigDecimal tongTamTinh) { this.tongTamTinh = tongTamTinh; }

    public BigDecimal getPhiVanChuyen() { return phiVanChuyen; }
    public void setPhiVanChuyen(BigDecimal phiVanChuyen) { this.phiVanChuyen = phiVanChuyen; }

    public BigDecimal getGiamGia() { return giamGia; }
    public void setGiamGia(BigDecimal giamGia) { this.giamGia = giamGia; }

    public BigDecimal getTongTien() { return tongTien; }
    public void setTongTien(BigDecimal tongTien) { this.tongTien = tongTien; }

    public String getPhuongThucTT() { return phuongThucTT; }
    public void setPhuongThucTT(String phuongThucTT) { this.phuongThucTT = phuongThucTT; }

    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }

    public Date getNgayDat() { return ngayDat; }
    public void setNgayDat(Date ngayDat) { this.ngayDat = ngayDat; }
}