package com.mycompany.websitethuongmaidientu.model;

import java.sql.Timestamp;

public class LichSuDiem {
    private int id;
    private int maNguoiDung;
    private String loai;
    private int soDiem;
    private String ghiChu;
    private Timestamp thoiGian;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getMaNguoiDung() { return maNguoiDung; }
    public void setMaNguoiDung(int maNguoiDung) { this.maNguoiDung = maNguoiDung; }
    public String getLoai() { return loai; }
    public void setLoai(String loai) { this.loai = loai; }
    public int getSoDiem() { return soDiem; }
    public void setSoDiem(int soDiem) { this.soDiem = soDiem; }
    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
    public Timestamp getThoiGian() { return thoiGian; }
    public void setThoiGian(Timestamp thoiGian) { this.thoiGian = thoiGian; }
}