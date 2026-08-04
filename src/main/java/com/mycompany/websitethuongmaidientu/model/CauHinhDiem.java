package com.mycompany.websitethuongmaidientu.model;

import java.sql.Timestamp;

public class CauHinhDiem {
    private int id;
    private double tienTich1Diem;
    private double motDiemQuyDoi;
    private double freeshipTu;
    private double quaTangTu;
    private int maAdmin;
    private Timestamp thoiGian;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public double getTienTich1Diem() { return tienTich1Diem; }
    public void setTienTich1Diem(double tienTich1Diem) { this.tienTich1Diem = tienTich1Diem; }
    public double getMotDiemQuyDoi() { return motDiemQuyDoi; }
    public void setMotDiemQuyDoi(double motDiemQuyDoi) { this.motDiemQuyDoi = motDiemQuyDoi; }
    public double getFreeshipTu() { return freeshipTu; }
    public void setFreeshipTu(double freeshipTu) { this.freeshipTu = freeshipTu; }
    public double getQuaTangTu() { return quaTangTu; }
    public void setQuaTangTu(double quaTangTu) { this.quaTangTu = quaTangTu; }
    public int getMaAdmin() { return maAdmin; }
    public void setMaAdmin(int maAdmin) { this.maAdmin = maAdmin; }
    public Timestamp getThoiGian() { return thoiGian; }
    public void setThoiGian(Timestamp thoiGian) { this.thoiGian = thoiGian; }
}