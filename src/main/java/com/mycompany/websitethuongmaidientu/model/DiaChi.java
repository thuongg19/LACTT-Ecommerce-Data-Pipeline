package com.mycompany.websitethuongmaidientu.model;

public class DiaChi {
    private int id;
    private int maNguoiDung;
    private String tenNguoiNhan;
    private String soDienThoai;
    private String diaChiCuThe;
    private boolean macDinh;

    public DiaChi() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getMaNguoiDung() { return maNguoiDung; }
    public void setMaNguoiDung(int maNguoiDung) { this.maNguoiDung = maNguoiDung; }

    public String getTenNguoiNhan() { return tenNguoiNhan; }
    public void setTenNguoiNhan(String tenNguoiNhan) { this.tenNguoiNhan = tenNguoiNhan; }

    public String getSoDienThoai() { return soDienThoai; }
    public void setSoDienThoai(String soDienThoai) { this.soDienThoai = soDienThoai; }

    public String getDiaChiCuThe() { return diaChiCuThe; }
    public void setDiaChiCuThe(String diaChiCuThe) { this.diaChiCuThe = diaChiCuThe; }

    public boolean isMacDinh() { return macDinh; }
    public void setMacDinh(boolean macDinh) { this.macDinh = macDinh; }
}