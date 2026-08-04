package com.mycompany.websitethuongmaidientu.model;

public class GiaoDichDTO {
    private String maGD;
    private String ngayGD; // Đổi sang String để format ngày hiển thị đẹp hơn
    private String khachHang;
    private double soTienHeThong;
    private Double soTienNganHang;
    private double chenhLech;
    private String nganHang;
    private String trangThai;

    public GiaoDichDTO() {}

    public GiaoDichDTO(String maGD, String ngayGD, String khachHang, double soTienHeThong, 
                       Double soTienNganHang, double chenhLech, String nganHang, String trangThai) {
        this.maGD = maGD;
        this.ngayGD = ngayGD;
        this.khachHang = khachHang;
        this.soTienHeThong = soTienHeThong;
        this.soTienNganHang = soTienNganHang;
        this.chenhLech = chenhLech;
        this.nganHang = nganHang;
        this.trangThai = trangThai;
    }

    public String getMaGD() { return maGD; }
    public void setMaGD(String maGD) { this.maGD = maGD; }

    public String getNgayGD() { return ngayGD; }
    public void setNgayGD(String ngayGD) { this.ngayGD = ngayGD; }

    public String getKhachHang() { return khachHang; }
    public void setKhachHang(String khachHang) { this.khachHang = khachHang; }

    public double getSoTienHeThong() { return soTienHeThong; }
    public void setSoTienHeThong(double soTienHeThong) { this.soTienHeThong = soTienHeThong; }

    public Double getSoTienNganHang() { return soTienNganHang; }
    public void setSoTienNganHang(Double soTienNganHang) { this.soTienNganHang = soTienNganHang; }

    public double getChenhLech() { return chenhLech; }
    public void setChenhLech(double chenhLech) { this.chenhLech = chenhLech; }

    public String getNganHang() { return nganHang; }
    public void setNganHang(String nganHang) { this.nganHang = nganHang; }

    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
}