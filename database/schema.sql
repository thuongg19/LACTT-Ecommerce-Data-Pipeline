-- ============================================================
--  LACTT — schema.sql (v5 — HOÀN CHỈNH)
--  Sửa lỗi phân loại + Thêm 44 sản phẩm + Bảng flash_sale
--  Tổng: 72 sản phẩm — khớp với filter/search frontend
-- ============================================================

DROP DATABASE IF EXISTS lactt_db;
CREATE DATABASE lactt_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lactt_db;

-- ============================================================
-- 1. TÀI KHOẢN
-- ============================================================
CREATE TABLE tai_khoan (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(255) NOT NULL UNIQUE,
    mat_khau      VARCHAR(255) NOT NULL,
    ho_ten        VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    so_dien_thoai VARCHAR(20)  UNIQUE,
    vai_tro       ENUM('khach_hang','admin','nhan_vien_kho') NOT NULL DEFAULT 'khach_hang',
    is_active     TINYINT      DEFAULT 1,
    so_lan_sai    INT          DEFAULT 0,
    khoa_den_luc  DATETIME     DEFAULT NULL,
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. ĐỊA CHỈ
-- ============================================================
CREATE TABLE dia_chi (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung  INT UNSIGNED NOT NULL,
    ten_nguoi_nhan VARCHAR(255) NOT NULL,
    so_dien_thoai  VARCHAR(20)  NOT NULL,
    dia_chi        TEXT         NOT NULL,
    is_default     TINYINT      DEFAULT 0,
    FOREIGN KEY (ma_nguoi_dung) REFERENCES tai_khoan(id)
);

-- ============================================================
-- 3. VÍ ĐIỂM
-- ============================================================
CREATE TABLE vi_diem (
    id              INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung   INT UNSIGNED  NOT NULL UNIQUE,
    tong_diem       INT           DEFAULT 0 CHECK (tong_diem >= 0),
    gia_tri_quy_doi DECIMAL(12,2) DEFAULT 0,
    cap_nhat_luc    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_nguoi_dung) REFERENCES tai_khoan(id)
);

-- ============================================================
-- 4. LỊCH SỬ GIAO DỊCH ĐIỂM
-- ============================================================
CREATE TABLE lich_su_diem (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung INT UNSIGNED NOT NULL,
    ma_don_hang   INT UNSIGNED DEFAULT NULL,
    loai          ENUM('cong','tru') NOT NULL,
    so_diem       INT          NOT NULL,
    ghi_chu       VARCHAR(255),
    ngay_het_han  DATE         DEFAULT NULL,
    thoi_gian     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_nguoi_dung) REFERENCES tai_khoan(id)
);

-- ============================================================
-- 5. CẤU HÌNH ĐIỂM THƯỞNG
-- ============================================================
CREATE TABLE cau_hinh_diem (
    id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    tien_tich_1_diem DECIMAL(12,2) NOT NULL DEFAULT 10000,
    mot_diem_quy_doi DECIMAL(12,2) NOT NULL DEFAULT 100,
    ma_admin         INT UNSIGNED,
    thoi_gian        DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_admin) REFERENCES tai_khoan(id)
);

-- ============================================================
-- 6. DANH MỤC
-- ============================================================
CREATE TABLE danh_muc (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(255) NOT NULL UNIQUE
);

-- ============================================================
-- 7. SẢN PHẨM
-- ============================================================
CREATE TABLE san_pham (
    id                INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    ma_danh_muc       INT UNSIGNED,
    ten_sp            VARCHAR(255)  NOT NULL,
    thuong_hieu       VARCHAR(100),
    mo_ta             TEXT          NOT NULL,
    thanh_phan        TEXT,
    huong_dan_su_dung TEXT,
    gia               DECIMAL(12,2) NOT NULL CHECK (gia >= 0),
    gia_goc           DECIMAL(12,2),
    so_luong_ban      INT           DEFAULT 0,
    so_luong_ton      INT           DEFAULT 0,
    diem_danh_gia     DECIMAL(2,1)  DEFAULT 0,
    so_danh_gia       INT           DEFAULT 0,
    hinh_anh          VARCHAR(500),
    is_active         TINYINT       DEFAULT 1,
    is_featured       TINYINT       DEFAULT 0,
    is_new            TINYINT       DEFAULT 0,
    deleted_at        DATETIME      NULL DEFAULT NULL,
    created_at        DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_danh_muc) REFERENCES danh_muc(id)
);

-- ============================================================
-- 8. VARIANT SẢN PHẨM
-- ============================================================
CREATE TABLE san_pham_variant (
    id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT UNSIGNED  NOT NULL,
    ten_variant VARCHAR(100)  NOT NULL,
    gia         DECIMAL(12,2) NOT NULL,
    gia_goc     DECIMAL(12,2) DEFAULT NULL,
    so_luong    INT           DEFAULT 0,
    thu_tu      INT           DEFAULT 0,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(id) ON DELETE CASCADE
);

-- ============================================================
-- 9. ẢNH PHỤ SẢN PHẨM
-- ============================================================
CREATE TABLE san_pham_anh (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT UNSIGNED NOT NULL,
    url_anh     VARCHAR(500) NOT NULL,
    thu_tu      INT          DEFAULT 0,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. LỊCH SỬ GIÁ
-- ============================================================
CREATE TABLE lich_su_gia (
    id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT UNSIGNED  NOT NULL,
    gia_cu      DECIMAL(12,2) NOT NULL,
    gia_moi     DECIMAL(12,2) NOT NULL,
    ma_admin    INT UNSIGNED,
    thoi_gian   DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(id),
    FOREIGN KEY (ma_admin)    REFERENCES tai_khoan(id)
);

-- ============================================================
-- 11. TỒN KHO
-- ============================================================
CREATE TABLE ton_kho (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham  INT UNSIGNED NOT NULL UNIQUE,
    so_luong     INT          DEFAULT 0,
    cap_nhat_luc DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(id)
);

-- ============================================================
-- 12. NHẬP KHO
-- ============================================================
CREATE TABLE nhap_kho (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham  INT UNSIGNED NOT NULL,
    ma_nhan_vien INT UNSIGNED,
    so_luong     INT          NOT NULL,
    ghi_chu      TEXT,
    thoi_gian    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_san_pham)  REFERENCES san_pham(id),
    FOREIGN KEY (ma_nhan_vien) REFERENCES tai_khoan(id)
);

-- ============================================================
-- 13. GIỎ HÀNG SERVER-SIDE
-- ============================================================
CREATE TABLE gio_hang (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung INT UNSIGNED NOT NULL UNIQUE,
    FOREIGN KEY (ma_nguoi_dung) REFERENCES tai_khoan(id)
);

CREATE TABLE chi_tiet_gio_hang (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_gio_hang  INT UNSIGNED NOT NULL,
    ma_san_pham  INT UNSIGNED NOT NULL,
    ma_variant   INT UNSIGNED DEFAULT NULL,
    so_luong     INT          NOT NULL CHECK (so_luong > 0),
    FOREIGN KEY (ma_gio_hang) REFERENCES gio_hang(id),
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(id),
    FOREIGN KEY (ma_variant)  REFERENCES san_pham_variant(id)
);

-- ============================================================
-- 14. FLASH SALE ← THÊM MỚI
-- ============================================================
CREATE TABLE flash_sale (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham     INT UNSIGNED NOT NULL,
    gia_flash_sale  DECIMAL(12,2) NOT NULL,
    phan_tram_giam  INT          DEFAULT 0,
    so_luong_gioi_han INT        DEFAULT 100,
    so_luong_da_ban INT          DEFAULT 0,
    ngay_bat_dau    DATETIME     NOT NULL,
    ngay_ket_thuc   DATETIME     NOT NULL,
    is_active       TINYINT      DEFAULT 1,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(id)
);

-- ============================================================
-- 15. KHUYẾN MÃI
-- ============================================================
CREATE TABLE khuyen_mai (
    id                 INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    voucher_code       VARCHAR(50)   NOT NULL UNIQUE,
    ten                VARCHAR(255),
    loai               ENUM('percent','fixed') DEFAULT 'fixed',
    gia_tri_giam       DECIMAL(12,2) NOT NULL,
    don_hang_toi_thieu DECIMAL(12,2) DEFAULT 0,
    so_luot_toi_da     INT           DEFAULT NULL,
    so_luot_da_dung    INT           DEFAULT 0,
    gioi_han_moi_tk    INT           DEFAULT 1,
    ngay_bat_dau       DATE          NOT NULL,
    ngay_ket_thuc      DATE          NOT NULL,
    is_active          TINYINT       DEFAULT 1,
    created_at         DATETIME      DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 16. ĐƠN HÀNG
-- ============================================================
CREATE TABLE don_hang (
    id             INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung  INT UNSIGNED  NOT NULL,
    ma_dia_chi     INT UNSIGNED,
    ma_don_hang    VARCHAR(20)   NOT NULL UNIQUE,
    ten_nguoi_nhan VARCHAR(100),
    so_dien_thoai  VARCHAR(15),
    dia_chi_giao   TEXT,
    ghi_chu        TEXT,
    tong_tam_tinh  DECIMAL(12,2) DEFAULT 0,
    phi_van_chuyen DECIMAL(12,2) DEFAULT 0,
    giam_gia       DECIMAL(12,2) DEFAULT 0,
    tong_tien      DECIMAL(12,2) DEFAULT 0,
    phuong_thuc_tt ENUM('cod','banking','momo') DEFAULT 'cod',
    ma_khuyen_mai  INT UNSIGNED  DEFAULT NULL,
    trang_thai     ENUM('cho_xac_nhan','dang_chuan_bi','dang_giao','da_giao','da_huy')
                   DEFAULT 'cho_xac_nhan',
    ngay_dat       DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_nguoi_dung)  REFERENCES tai_khoan(id),
    FOREIGN KEY (ma_dia_chi)     REFERENCES dia_chi(id),
    FOREIGN KEY (ma_khuyen_mai)  REFERENCES khuyen_mai(id)
);

-- ============================================================
-- 17. CHI TIẾT ĐƠN HÀNG
-- ============================================================
CREATE TABLE chi_tiet_don_hang (
    id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    ma_don_hang  INT UNSIGNED  NOT NULL,
    ma_san_pham  INT UNSIGNED  NOT NULL,
    ten_san_pham VARCHAR(255),
    thuong_hieu  VARCHAR(100),
    ten_variant  VARCHAR(100),
    so_luong     INT           NOT NULL,
    gia          DECIMAL(12,2) NOT NULL,
    thanh_tien   DECIMAL(12,2),
    FOREIGN KEY (ma_don_hang) REFERENCES don_hang(id),
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(id)
);

-- ============================================================
-- 18. ĐƠN HÀNG KHUYẾN MÃI
-- ============================================================
CREATE TABLE don_hang_km (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_don_hang   INT UNSIGNED NOT NULL,
    ma_khuyen_mai INT UNSIGNED NOT NULL,
    FOREIGN KEY (ma_don_hang)   REFERENCES don_hang(id),
    FOREIGN KEY (ma_khuyen_mai) REFERENCES khuyen_mai(id)
);

-- ============================================================
-- 19. GIAO DỊCH THANH TOÁN
-- ============================================================
CREATE TABLE giao_dich (
    id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    ma_don_hang   INT UNSIGNED  NOT NULL,
    ma_tham_chieu VARCHAR(255)  UNIQUE,
    so_tien       DECIMAL(12,2) NOT NULL,
    phuong_thuc   ENUM('cod','banking','momo') NOT NULL,
    trang_thai    ENUM('chua_thanh_toan','da_thanh_toan','that_bai','hoan_tien')
                  DEFAULT 'chua_thanh_toan',
    thoi_gian     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_don_hang) REFERENCES don_hang(id)
);

-- ============================================================
-- 20. HOÀN TIỀN
-- ============================================================
CREATE TABLE hoan_tien (
    id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    ma_giao_dich INT UNSIGNED  NOT NULL,
    so_tien      DECIMAL(12,2) NOT NULL,
    ly_do        TEXT          NOT NULL,
    thoi_gian    DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_giao_dich) REFERENCES giao_dich(id)
);

-- ============================================================
-- 21. ĐÁNH GIÁ SẢN PHẨM
-- ============================================================
CREATE TABLE danh_gia (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham   INT UNSIGNED NOT NULL,
    ma_nguoi_dung INT UNSIGNED NOT NULL,
    diem          INT          NOT NULL CHECK (diem BETWEEN 1 AND 5),
    noi_dung      TEXT,
    thoi_gian     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_san_pham)   REFERENCES san_pham(id),
    FOREIGN KEY (ma_nguoi_dung) REFERENCES tai_khoan(id)
);

-- ============================================================
-- 22. NHẬT KÝ HỆ THỐNG
-- ============================================================
CREATE TABLE log_he_thong (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung INT UNSIGNED,
    hanh_dong     VARCHAR(255) NOT NULL,
    noi_dung      TEXT,
    thoi_gian     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_nguoi_dung) REFERENCES tai_khoan(id)
);

CREATE TABLE otp_xac_thuc (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  so_dien_thoai VARCHAR(15)  NOT NULL,
  ma_otp        CHAR(6)      NOT NULL,
  het_han       DATETIME     NOT NULL,
  da_dung       TINYINT      DEFAULT 0,
  created_at    DATETIME     DEFAULT NOW()
);


-- ============================================================
--  DỮ LIỆU MẪU
-- ============================================================

-- ------------------------------------------------------------
-- TÀI KHOẢN
-- ------------------------------------------------------------
INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, vai_tro) VALUES
('admin',   MD5('Admin@123'), 'Quản Trị Viên',  'admin@lactt.vn',  '0900000001', 'admin'),
('kho01',   MD5('Kho@123'),   'Nhân viên kho', 'kho01@lactt.vn',  '0900000002', 'nhan_vien_kho'),
('khach01', MD5('Khach@123'), 'Trần Thị Mai',   'mai@gmail.com',   '0912345678', 'khach_hang'),
('khach02', MD5('Khach@123'), 'Lê Quốc Bảo',   'bao@gmail.com',   '0987654321', 'khach_hang');

INSERT INTO vi_diem (ma_nguoi_dung, tong_diem, gia_tri_quy_doi) VALUES
(3, 1250, 125000.00),
(4, 320,  32000.00);

INSERT INTO cau_hinh_diem (tien_tich_1_diem, mot_diem_quy_doi, ma_admin) VALUES
(10000, 100, 1);

INSERT INTO dia_chi (ma_nguoi_dung, ten_nguoi_nhan, so_dien_thoai, dia_chi, is_default) VALUES
(3, 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 1),
(4, 'Lê Quốc Bảo',  '0987654321', '45 Hoàn Kiếm, Phường Hàng Trống, Quận Hoàn Kiếm, Hà Nội',  1);

-- ------------------------------------------------------------
-- DANH MỤC
-- ------------------------------------------------------------
INSERT INTO danh_muc (ten_danh_muc) VALUES
('Chăm Sóc Da'),
('Trang Điểm'),
('Nước Hoa'),
('Chăm Sóc Tóc'),
('Chống Nắng'),
('Chăm Sóc Cơ Thể');

-- ============================================================
--  SẢN PHẨM — 72 sản phẩm (12 mỗi danh mục)
--  Tên rút gọn để khớp với data-name trong index.jsp filter
-- ============================================================
INSERT INTO san_pham
    (ma_danh_muc, ten_sp, thuong_hieu, mo_ta, thanh_phan, huong_dan_su_dung,
     gia, gia_goc, so_luong_ban, diem_danh_gia, so_danh_gia,
     hinh_anh, is_active, is_featured, is_new)
VALUES

-- ═══════════════════════════════════════════════════════════
--  CHĂM SÓC DA (ma_danh_muc = 1) — 12 sản phẩm
-- ═══════════════════════════════════════════════════════════
(1,'Génifique Advanced Youth Activating Serum','LANCÔME',
 'Serum kích hoạt tuổi trẻ với Bifidus độc quyền, giúp da sáng mịn sau 7 ngày.',
 'Bifidus Extract, Hyaluronic Acid, Niacinamide, Vitamins CG & E',
 'Thoa 5-7 giọt lên mặt và cổ sáng tối sau làm sạch.',
 1250000,1560000,2400,5.0,2400,
 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
 1,1,0),

(1,'Facial Treatment Essence 230ml','SK-II',
 'Tinh chất PITERA™ huyền thoại giúp da tái tạo và sáng bóng tự nhiên.',
 'PITERA™ 90%+, Butylene Glycol, Water',
 'Thấm bông cotton vỗ nhẹ lên mặt sau toner.',
 2890000,NULL,5100,5.0,5100,
 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80',
 1,1,0),

(1,'Advanced Night Repair Synchronized Recovery','ESTÉE LAUDER',
 'Serum phục hồi ban đêm với ChronoluxCB™ đồng bộ nhịp sinh học da.',
 'ChronoluxCB™, Hyaluronic Acid, Bifida Ferment Lysate',
 'Thoa 2-3 giọt lên mặt trước kem dưỡng buổi tối.',
 1890000,2700000,3700,4.5,3700,
 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80',
 1,1,0),

(1,'Green Tea Hyaluronic Acid Hydration Toner','INNISFREE',
 'Toner trà xanh Jeju cấp ẩm 24 giờ, da mềm mịn tức thì.',
 'Green Tea Extract, Hyaluronic Acid, Glycerin, Niacinamide',
 'Thấm bông cotton lau nhẹ hoặc vỗ tay trực tiếp.',
 385000,NULL,8900,5.0,8900,
 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
 1,1,0),

(1,'Revitalift 1.5% Pure Hyaluronic Acid Serum','L\'ORÉAL',
 'Serum HA 1.5% thẩm thấu đa tầng, làm đầy nếp nhăn sau 7 ngày.',
 'Hyaluronic Acid 1.5%, Glycerin, Panthenol',
 'Thoa vài giọt lên mặt ẩm sáng tối.',
 480000,720000,6200,4.0,6200,
 'https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=400&q=80',
 1,0,0),

(1,'Vital Perfection Uplifting Firming Cream','SHISEIDO',
 'Kem nâng cơ săn chắc với HADASOME™ và hoa anh đào Nhật.',
 'HADASOME™, Sakura Extract, Retinol, Vitamin C',
 'Thoa lượng vừa đủ theo chuyển động nâng hướng lên.',
 1100000,NULL,2800,4.0,2800,
 'https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=400&q=80',
 1,0,1),

(1,'Ultra Facial Cream SPF 30 — 125ml','KIEHL\'S',
 'Kem dưỡng 24h huyền thoại với SPF 30, mọi loại da.',
 'Squalane, Antarcticine, Imperata Cylindrica Root Extract',
 'Thoa lên mặt và cổ buổi sáng sau toner serum.',
 890000,1250000,7100,5.0,7100,
 'https://images.unsplash.com/photo-1611080541599-8c6dbde6ed28?w=400&q=80',
 1,1,0),

(1,'Moisture Surge 100H Hydrator 75ml','CLINIQUE',
 'Gel kem cấp ẩm 100 giờ, không dầu, không gây mụn.',
 'Aloe Vera, Hyaluronic Acid, Activated Aloe Water',
 'Thoa sáng tối, dùng được làm mặt nạ ngủ.',
 750000,950000,4100,4.5,4100,
 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80',
 1,0,0),

(1,'Sulwhasoo First Care Activating Serum','SULWHASOO',
 'Tinh chất thảo dược quý: nhân sâm, linh chi, kỳ tử.',
 'AMORE Complex, Panax Ginseng Root Extract, Reishi Mushroom',
 'Thoa bước đầu tiên sau làm sạch.',
 1680000,1980000,1900,5.0,1900,
 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400&q=80',
 1,0,0),

(1,'The Water Cream 50ml','TATCHA',
 'Kem gel nước Hadasei-3™: trà xanh, gạo, tảo biển đỏ.',
 'Hadasei-3™, Okinawa Algae Blend, Japanese Pink Rose',
 'Thoa sau serum sáng tối.',
 1450000,NULL,2200,5.0,2200,
 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
 1,0,1),

(1,'Niacinamide 10% + Zinc 1% Serum 30ml','THE ORDINARY',
 'Serum kiểm soát dầu, thu nhỏ lỗ chân lông hiệu quả.',
 'Niacinamide 10%, Zinc PCA 1%, Hyaluronic Acid',
 'Thoa vài giọt sáng tối sau toner.',
 230000,310000,15600,5.0,15600,
 'https://images.unsplash.com/photo-1618354691229-88d47f285158?w=400&q=80',
 1,1,0),  -- ← ĐÃ SỬA: ma_danh_muc = 1 (Chăm Sóc Da)

(1,'Lip Sleeping Mask Berry 20g','LANEIGE',
 'Mặt nạ ngủ môi số 1 thế giới, cấp ẩm phục hồi qua đêm.',
 'Berry Mix Complex, Hyaluronic Acid, Murumuru Butter',
 'Thoa lớp dày lên môi trước khi ngủ.',
 340000,400000,12300,5.0,12300,
 'https://images.unsplash.com/photo-1631214524020-3c69d13f8e53?w=400&q=80',
 1,1,0),  -- ← ĐÃ SỬA: ma_danh_muc = 1 (Chăm Sóc Da)

-- ═══════════════════════════════════════════════════════════
--  CHĂM SÓC DA (bổ sung thêm — vẫn ma_danh_muc = 1)
-- ═══════════════════════════════════════════════════════════
(1,'Cicaplast Baume B5+ 100ml','LA ROCHE-POSAY',
 'Kem phục hồi da đa năng với B5 và Madecassoside.',
 'Panthenol 5%, Madecassoside, Shea Butter',
 'Thoa lớp mỏng lên vùng da kích ứng.',
 420000,520000,3200,4.5,3200,
 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400&q=80',
 1,0,0),

(1,'Hyaluronic Acid 2% + B5 Serum','THE ORDINARY',
 'Serum HA đa phân tử cấp ẩm sâu mọi tầng da.',
 'Hyaluronic Acid 2%, Vitamin B5, Trehalose',
 'Thoa vài giọt lên mặt ẩm sáng tối.',
 180000,NULL,5600,4.0,5600,
 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
 1,0,1),

(1,'Retinol 0.5% Serum 30ml','COSRX',
 'Serum retinol nồng độ thấp cho người mới bắt đầu.',
 'Retinol 0.5%, Niacinamide, Squalane',
 'Thoa buổi tối, bắt đầu 2 lần/tuần.',
 320000,420000,2800,4.5,2800,
 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80',
 1,0,0),

(1,'Vitamin C 23% Suspension','THE ORDINARY',
 'Serum Vitamin C đậm đặc làm sáng da, chống oxy hóa.',
 'Ascorbic Acid 23%, Squalane, Hyaluronic Acid',
 'Thoa buổi tối, massage nhẹ đến khi thẩm thấu.',
 210000,290000,3400,4.0,3400,
 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
 1,0,0),

(1,'Ceramide Moisturizing Cream 50ml','DR.JART+',
 'Kem dưỡng ceramide phục hồi hàng rào bảo vệ da.',
 '5-Cera Complex, Shea Butter, Niacinamide',
 'Thoa sau serum buổi sáng và tối.',
 680000,850000,1900,5.0,1900,
 'https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=400&q=80',
 1,0,1),

(1,'Advanced Snail 96 Mucin Power Essence','COSRX',
 'Tinh chất ốc sên 96% phục hồi và tái tạo da vượt trội.',
 'Snail Secretion Filtrate 96%, Sodium Hyaluronate',
 'Thoa 2-3 pump lên mặt sau toner.',
 350000,450000,7800,4.5,7800,
 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80',
 1,0,0),

-- ═══════════════════════════════════════════════════════════
--  TRANG ĐIỂM (ma_danh_muc = 2) — 12 sản phẩm
-- ═══════════════════════════════════════════════════════════
(2,'Rouge Dior Forever Lipstick 999','DIOR BEAUTY',
 'Son lì đỏ 999 biểu tượng, 73% thành phần thiên nhiên.',
 'Floral Wax Complex, Vitamin E, Rosehip Extract',
 'Kẻ viền môi rồi tô đều.',
 1350000,NULL,3200,5.0,3200,
 'https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Sites-master_dior/default/dw98703630/Y0356009/Y0356009_C035600999_E01_RHC.jpg?sw=1024',
 1,1,1),

(2,'Pro Filt\'r Soft Matte Longwear Foundation','FENTY BEAUTY',
 'Nền lì mờ lâu trôi, 50 tông màu đa dạng.',
 'Silica, Talc, Zinc Stearate, Titanium Dioxide',
 'Dùng cọ hoặc mút tán từ trung tâm mặt ra.',
 890000,NULL,4200,4.0,4200,
 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80',
 1,1,0),

(2,'Pillow Talk Lipstick','CHARLOTTE TILBURY',
 'Son nude hồng bình chọn đẹp nhất thế giới.',
 'Vitamin E, Hyaluronic Acid, Moringa Oil',
 'Thoa trực tiếp hoặc dùng cọ môi.',
 780000,NULL,6500,5.0,6500,
 'https://images.unsplash.com/photo-1599733594230-6b823276b98d?w=400&q=80',
 1,0,1),

(2,'Radiant Creamy Concealer','NARS',
 'Kem che khuyết điểm che phủ cao, thoáng nhẹ.',
 'Hyaluronic Acid, Glycerin, Titanium Dioxide',
 'Chấm nhẹ lên vùng cần che rồi tán đều.',
 620000,780000,3800,4.5,3800,
 'https://images.unsplash.com/photo-1583241800698-e8ab01830a0e?w=400&q=80',
 1,0,0),

(2,'Studio Fix Fluid Foundation SPF 15','MAC COSMETICS',
 'Nền lỏng che phủ hoàn hảo, lâu trôi 12 giờ.',
 'Titanium Dioxide, Silica, Glycerin',
 'Tán đều với cọ hoặc mút ẩm.',
 780000,NULL,3100,4.0,3100,
 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80',
 1,0,0),

(2,'Lip Glow Oil 001 Pink','DIOR BEAUTY',
 'Son dưỡng màu tự nhiên, bóng mịn đôi môi.',
 'Cherry Oil, Hyaluronic Acid, Vitamin E',
 'Thoa trực tiếp hoặc lót trước son màu.',
 950000,NULL,2100,4.5,2100,
 'https://images.unsplash.com/photo-1586495777744-4e6b65d1d995?w=400&q=80',
 1,0,1),

(2,'Double Wear Stay-in-Place Foundation','ESTÉE LAUDER',
 'Nền lâu trôi 24h, che phủ hoàn hảo.',
 'SPF 10, Silica, Iron Oxides',
 'Tán nhanh từng vùng nhỏ trước khi khô.',
 1100000,NULL,5200,5.0,5200,
 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80',
 1,0,0),

(2,'Airbrush Flawless Setting Spray','CHARLOTTE TILBURY',
 'Xịt khóa nền giữ makeup 16h, lì mịn không cát.',
 'Aloe Vera, Green Tea Extract, Aromatic Resin',
 'Xịt đều lên mặt sau khi makeup xong.',
 850000,NULL,1800,4.0,1800,
 'https://images.unsplash.com/photo-1599733594230-6b823276b98d?w=400&q=80',
 1,0,0),

(2,'Stay Vulnerable Glossy Lip Balm','RARE BEAUTY',
 'Son bóng dưỡng môi với bơ hạt mỡ và vitamin E.',
 'Shea Butter, Vitamin E, Jojoba Oil',
 'Thoa đều lên môi, có thể chồng lớp.',
 620000,NULL,2900,4.5,2900,
 'https://images.unsplash.com/photo-1583241800698-e8ab01830a0e?w=400&q=80',
 1,0,0),

(2,'Better Than Sex Mascara','TOO FACED',
 'Mascara làm dày và cong mi gấp 3 lần.',
 'Acacia Senegal Tree Extract, Peptides',
 'Chải từ chân mi đến ngọn theo zigzag.',
 720000,NULL,4600,4.5,4600,
 'https://images.unsplash.com/photo-1586495777744-4e6b65d1d995?w=400&q=80',
 1,0,1),

(2,'Translucent Loose Setting Powder','LAURA MERCIER',
 'Phấn phủ dạng bột trong suốt, mịn màng không cát.',
 'Silica, Talc, Vitamin E',
 'Dùng cọ hoặc bông phủ nhẹ lên vùng chữ T.',
 890000,1050000,3700,5.0,3700,
 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80',
 1,0,0),

(2,'Shape Tape Concealer 10ml','TARTE',
 'Kem che khuyết điểm full coverage, không crease.',
 'Shea Butter, Mango Seed Butter, Licorice Root Extract',
 'Chấm 3 điểm dưới mắt rồi tán đều.',
 780000,950000,5500,4.5,5500,
 'https://images.unsplash.com/photo-1583241800698-e8ab01830a0e?w=400&q=80',
 1,0,0),

-- ═══════════════════════════════════════════════════════════
--  NƯỚC HOA (ma_danh_muc = 3) — 12 sản phẩm
-- ═══════════════════════════════════════════════════════════
(3,'N°5 Eau de Parfum 50ml — Đặc Biệt','CHANEL',
 'Huyền thoại 1921, hương hoa hồng và nhài trên nền gỗ ấm.',
 'Aldehyde, Ylang Ylang, Rose, Jasmine, Sandalwood',
 'Xịt lên cổ tay, cổ và sau tai.',
 4200000,NULL,1800,5.0,1800,
 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80',
 1,1,0),

(3,'Miss Dior Blooming Bouquet EDT 100ml','DIOR',
 'Nước hoa nữ lãng mạn với mẫu đơn và hoa hồng.',
 'Peony, White Rose, Mandarin, Musk',
 'Xịt 2-3 lần lên cổ tay và cổ.',
 3200000,NULL,2100,4.5,2100,
 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80',
 1,0,0),

(3,'Light Blue Eau de Toilette 100ml','DOLCE & GABBANA',
 'Hương Địa Trung Hải: chanh Sicily, táo Granny Smith.',
 'Sicilian Lemon, Apple, Cedar, Amber',
 'Xịt lên cổ tay và sau tai.',
 2450000,NULL,1500,4.5,1500,
 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&q=80',
 1,0,1),

(3,'Chloé Eau de Parfum 50ml','CHLOÉ',
 'Hương hoa hồng, mẫu đơn, gỗ tuyết tùng thanh lịch.',
 'Rose, Peony, Cedar, Musk, Freesia',
 'Xịt lên các điểm mạch: cổ tay, cổ.',
 2800000,NULL,1100,4.5,1100,
 'https://images.unsplash.com/photo-1598300056393-4aac492f4344?w=400&q=80',
 1,0,0),

(3,'Black Opium EDP 90ml','YVES SAINT LAURENT',
 'Hương cà phê đen, hoa nhài và vanilla quyến rũ.',
 'Black Coffee, Jasmine, Vanilla, Patchouli',
 'Xịt 2-3 lần lên cổ tay và cổ.',
 2800000,NULL,3100,5.0,3100,
 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80',
 1,0,1),

(3,'La Vie Est Belle Eau de Parfum 50ml','LANCÔME',
 'Hương hạnh phúc với iris, hoa cam và vanilla.',
 'Iris, Orange Blossom, Vanilla, Patchouli',
 'Xịt lên cổ tay và sau tai.',
 2100000,NULL,2500,5.0,2500,
 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80',
 1,0,0),

(3,'Flowerbomb EDP 100ml','VIKTOR & ROLF',
 'Bùng nổ hương hoa với hoa nhài, hoa hồng và phong lan.',
 'Jasmine, Rose, Orchid, Vanilla, Patchouli',
 'Xịt lên cổ tay và cổ.',
 3100000,NULL,1400,4.5,1400,
 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&q=80',
 1,0,0),

(3,'Olympea EDP 80ml','PACO RABANNE',
 'Hương nữ thần Hy Lạp: quýt, hoa nhài, vanilla mặn.',
 'Mandarin, Jasmine, Salted Vanilla, Sandalwood',
 'Xịt lên cổ tay và sau tai.',
 2300000,NULL,1200,4.0,1200,
 'https://images.unsplash.com/photo-1598300056393-4aac492f4344?w=400&q=80',
 1,0,0),

(3,'Gucci Bloom EDP 100ml','GUCCI',
 'Hương vườn hoa: hoa nhài, tuberose và Rangoon creeper.',
 'Jasmine, Tuberose, Rangoon Creeper',
 'Xịt 2-3 lần lên cổ tay.',
 2900000,NULL,1900,4.5,1900,
 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80',
 1,0,0),

(3,'Idôle EDP 75ml','LANCÔME',
 'Nước hoa nữ hiện đại: hoa hồng, bergamot và vanilla.',
 'Rose, Bergamot, Vanilla, Jasmine',
 'Xịt lên các điểm mạch.',
 2500000,NULL,1800,5.0,1800,
 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80',
 1,0,1),

(3,'J\'adore EDP 100ml','DIOR',
 'Hương hoa quyến rũ: hoa hồng, hoa nhài, ylang-ylang.',
 'Rose, Jasmine, Ylang-Ylang, Bergamot',
 'Xịt lên cổ tay và cổ.',
 3400000,NULL,2200,5.0,2200,
 'https://images.unsplash.com/photo-1598300056393-4aac492f4344?w=400&q=80',
 1,0,0),

(3,'Terre d\'Hermès EDT 100ml','HERMÈS',
 'Hương nam tính: cam, gỗ tuyết tùng, hoắc hương và tiêu.',
 'Orange, Cedar, Patchouli, Pepper',
 'Xịt lên cổ tay và cổ.',
 2600000,NULL,1300,4.5,1300,
 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&q=80',
 1,0,0),

-- ═══════════════════════════════════════════════════════════
--  CHĂM SÓC TÓC (ma_danh_muc = 4) — 12 sản phẩm
-- ═══════════════════════════════════════════════════════════
(4,'Elseve Extraordinary Oil Serum','L\'ORÉAL',
 'Serum tóc từ 6 loại tinh dầu quý hiếm.',
 'Marula Oil, Argan Oil, Flaxseed Oil, Camellia Oil',
 'Thoa lượng nhỏ lên tóc ẩm hoặc khô.',
 290000,365000,4500,4.0,4500,
 'https://images.unsplash.com/photo-1585232350744-9d51d64d04a3?w=400&q=80',
 1,0,0),

(4,'Damage Remedy Restructuring Conditioner','AVEDA',
 'Dầu xả phục hồi với quinoa protein và dầu bơ.',
 'Quinoa Protein, Avocado Oil, Panthenol',
 'Thoa sau gội, để 3-5 phút rồi xả.',
 520000,NULL,1900,4.5,1900,
 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&q=80',
 1,0,1),

(4,'Résistance Bain Force Architecte Shampoo','KÉRASTASE',
 'Dầu gội phục hồi tóc hư tổn nặng với Ceramide.',
 'Ceramide, Pro-Keratin Complex, Citric Acid',
 'Massage nhẹ rồi xả sạch.',
 480000,NULL,2800,4.5,2800,
 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80',
 1,0,0),

(4,'Olaplex No.3 Hair Perfector','OLAPLEX',
 'Phục hồi liên kết tóc tại nhà, giảm gãy rụng.',
 'Bis-Aminopropyl Diglycol Dimaleate, Water',
 'Thoa lên tóc ẩm, để 20 phút rồi gội.',
 680000,NULL,4200,5.0,4200,
 'https://images.unsplash.com/photo-1585232350744-9d51d64d04a3?w=400&q=80',
 1,0,1),

(4,'Purple Shampoo Blonde Care','FANOLA',
 'Dầu gội tím trung hòa tông vàng cho tóc nhuộm.',
 'Violet Pigment, Glycerin, Citric Acid',
 'Để 3-5 phút rồi xả sạch.',
 320000,420000,3600,4.5,3600,
 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&q=80',
 1,0,0),

(4,'Nutritive Masquintense Fine Hair 500ml','KÉRASTASE',
 'Mặt nạ tóc mỏng dưỡng ẩm sâu, không nặng tóc.',
 'Glycerin, Irisome Complex, Ceramide',
 'Thoa sau gội, để 5-10 phút rồi xả.',
 920000,NULL,1500,4.5,1500,
 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80',
 1,0,0),

(4,'Dry Shampoo Original 200ml','BATISTE',
 'Dầu gội khô hấp thụ dầu thừa tức thì, tóc bồng bềnh.',
 'Rice Starch, Aluminum Starch, Isobutane',
 'Xịt lên chân tóc, để 1 phút rồi massage.',
 180000,250000,8900,4.0,8900,
 'https://images.unsplash.com/photo-1585232350744-9d51d64d04a3?w=400&q=80',
 1,0,0),

(4,'Sublimic Aqua Intensive Hair Mask','SHISEIDO',
 'Mặt nạ tóc cấp nước chuyên sâu, tóc mềm mượt.',
 'Hydro-Restore Complex, Glycerin, Amino Acids',
 'Thoa lên tóc ẩm, để 10 phút rồi xả.',
 780000,NULL,2100,5.0,2100,
 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&q=80',
 1,0,0),

(4,'Moroccanoil Treatment Original 100ml','MOROCCANOIL',
 'Dầu dưỡng tóc argan huyền thoại, bóng mượt tức thì.',
 'Argan Oil, Linseed Extract, Vitamin E',
 'Thoa 1-2 pumps lên tóc ẩm từ giữa đến ngọn.',
 650000,820000,5800,5.0,5800,
 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80',
 1,0,0),

(4,'Scalp Revival Charcoal Shampoo','BRIOGEO',
 'Dầu gội than hoạt tính làm sạch sâu da đầu.',
 'Binchotan Charcoal, Peppermint Oil, Tea Tree Oil',
 'Massage lên da đầu ướt, để 3 phút rồi xả.',
 580000,NULL,2300,4.0,2300,
 'https://images.unsplash.com/photo-1585232350744-9d51d64d04a3?w=400&q=80',
 1,0,1),

(4,'Leave-In Conditioner Shea Butter 350ml','CANTU',
 'Xịt dưỡng tóc xoăn với bơ shea, không cần xả.',
 'Shea Butter, Coconut Oil, Glycerin',
 'Xịt đều lên tóc ẩm, chải đều và tạo kiểu.',
 220000,280000,6700,4.5,6700,
 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&q=80',
 1,0,0),

(4,'Hair Oil Nourishing 100ml','OUAI',
 'Dầu dưỡng tóc đa năng: dưỡng, chống xơ rối, bảo vệ nhiệt.',
 'Camelia Oil, Sunflower Oil, Vitamin E',
 'Thoa 1-2 giọt lên tóc ẩm hoặc khô.',
 620000,780000,3100,4.5,3100,
 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&q=80',
 1,0,0),

-- ═══════════════════════════════════════════════════════════
--  CHỐNG NẮNG (ma_danh_muc = 5) — 12 sản phẩm
-- ═══════════════════════════════════════════════════════════
(5,'Perfect UV Sunscreen Skincare Milk SPF50+','ANESSA',
 'Kem chống nắng số 1 châu Á, AquaBooster kháng nước.',
 'Zinc Oxide, Titanium Dioxide, AquaBooster Technology',
 'Thoa đều và để thấm 15-20 phút trước khi ra nắng.',
 620000,890000,9400,5.0,9400,
 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
 1,1,0),

(5,'Pure Screen+ Mineral Moisturizer SPF40','CLINIQUE',
 'Chống nắng khoáng chất thuần chay, không vệt trắng.',
 'Zinc Oxide 10%, Titanium Dioxide, Hyaluronic Acid',
 'Thoa bước cuối chu trình dưỡng da sáng.',
 580000,NULL,2300,4.0,2300,
 'https://images.unsplash.com/photo-1643185539104-3622eb1b2a3a?w=400&q=80',
 1,0,1),

(5,'Biore UV Aqua Rich Watery Essence SPF50+','BIORÉ',
 'Kem chống nắng gel nước siêu nhẹ, thẩm thấu tức thì.',
 'Uvinul A Plus, Tinosorb S, Hyaluronic Acid',
 'Thoa đều lên mặt và cổ rồi vỗ nhẹ.',
 320000,420000,11200,4.5,11200,
 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80',
 1,0,0),

(5,'Daily UV Protection Cream SPF36','INNISFREE',
 'Kem chống nắng trà xanh SPF36 nhẹ dịu cho da thường.',
 'Green Tea Extract, Zinc Oxide, Glycerin',
 'Thoa đều lên mặt và cổ trước khi ra ngoài.',
 320000,NULL,6700,4.0,6700,
 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
 1,0,0),

(5,'UV Expert Supra Screen SPF50+','LANCÔME',
 'Chống nắng bảo vệ da khỏi tia UV, ô nhiễm và ánh sáng xanh.',
 'Mexoryl XL, Vitamin C, Hyaluronic Acid',
 'Thoa đều lên mặt và cổ.',
 890000,1100000,1800,4.5,1800,
 'https://images.unsplash.com/photo-1643185539104-3622eb1b2a3a?w=400&q=80',
 1,0,1),

(5,'Clear Face Oil-Free Sunscreen SPF55','LA ROCHE-POSAY',
 'Chống nắng không dầu cho da dầu mụn, không gây bít tắc.',
 'Avobenzone, Homosalate, Octisalate, Silica',
 'Thoa đều lên mặt trước khi ra ngoài.',
 520000,650000,2900,4.5,2900,
 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80',
 1,0,0),

(5,'Supergoop! Unseen Sunscreen SPF40','SUPERGOOP!',
 'Chống nắng dạng gel trong suốt, không mùi, không dầu.',
 'Avobenzone, Homosalate, Octisalate, Red Algae',
 'Thoa đều lên mặt, dùng làm lót trang điểm.',
 780000,NULL,4100,4.5,4100,
 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
 1,0,0),

(5,'Anthelios Invisible Fluid SPF50+ 50ml','LA ROCHE-POSAY',
 'Chống nắng dạng lỏng siêu nhẹ, bảo vệ phổ rộng UVA/UVB.',
 'Mexoryl XL, Mexoryl S, Titanium Dioxide',
 'Lắc đều, thoa lên mặt và cổ trước khi ra ngoài.',
 450000,550000,6200,5.0,6200,
 'https://images.unsplash.com/photo-1643185539104-3622eb1b2a3a?w=400&q=80',
 1,0,0),

(5,'Water-Light Sunscreen SPF50+ 60ml','KIEHL\'S',
 'Chống nắng dạng sữa nhẹ như nước, thẩm thấu nhanh.',
 'Mexoryl SX, Mexoryl XL, Glycerin, Vitamin E',
 'Thoa đều lên mặt và cổ.',
 750000,950000,1900,4.5,1900,
 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80',
 1,0,0),

(5,'Tinted Sunscreen SPF50 50ml','DRUNK ELEPHANT',
 'Chống nắng khoáng chất có màu, nâng tông da tự nhiên.',
 'Zinc Oxide 20%, Astaxanthin, Grape Juice Extract',
 'Thoa đều lên mặt, dùng thay kem nền nhẹ.',
 850000,NULL,1200,4.0,1200,
 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
 1,0,1),

(5,'Suncut UV Perfect Gel SPF50+ 100g','KOSE',
 'Gel chống nắng toàn thân siêu nhẹ, chống nước.',
 'Ethylhexyl Methoxycinnamate, Zinc Oxide, HA',
 'Thoa đều lên toàn thân trước khi ra ngoài.',
 280000,380000,9800,4.5,9800,
 'https://images.unsplash.com/photo-1643185539104-3622eb1b2a3a?w=400&q=80',
 1,0,0),

(5,'Skin Aqua Tone Up UV Essence SPF50+','ROHTO MENTHOLATUM',
 'Chống nắng nâng tông da hồng tự nhiên, dưỡng ẩm.',
 'Ethylhexyl Methoxycinnamate, HA, Vitamin C',
 'Thoa đều lên mặt và cổ.',
 190000,250000,14200,4.0,14200,
 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80',
 1,0,0),

-- ═══════════════════════════════════════════════════════════
--  CHĂM SÓC CƠ THỂ (ma_danh_muc = 6) — 12 sản phẩm
-- ═══════════════════════════════════════════════════════════
(6,'Shea Body Butter 200ml','THE BODY SHOP',
 'Kem dưỡng thể bơ shea đậm đặc, cấp ẩm sâu 48h.',
 'Shea Butter, Glycerin, Aloe Vera, Vitamin E',
 'Thoa toàn thân sau tắm, massage nhẹ.',
 420000,NULL,3400,4.5,3400,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0),

(6,'Almond Shower Oil 250ml','L\'OCCITANE',
 'Dầu tắm dưỡng ẩm với hạnh nhân, làm sạch nhẹ nhàng.',
 'Almond Oil, Grapeseed Oil, Glycerin',
 'Thoa lên da ẩm, massage rồi tắm sạch.',
 520000,NULL,2800,4.5,2800,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0),

(6,'Cetaphil Moisturizing Cream 250ml','CETAPHIL',
 'Kem dưỡng thể phục hồi da khô và nhạy cảm.',
 'Glycerin, Petrolatum, Sweet Almond Oil',
 'Thoa lên vùng da khô bất kỳ lúc nào.',
 320000,420000,8900,5.0,8900,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0),

(6,'Dove Body Love Body Lotion 400ml','DOVE',
 'Sữa dưỡng thể với ceramide và HA, da mềm mịn suốt ngày.',
 'Ceramide, Hyaluronic Acid, Glycerin',
 'Thoa toàn thân sau tắm.',
 180000,250000,12500,4.5,12500,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0),

(6,'Sublime Bronze Self-Tanning Serum','L\'ORÉAL',
 'Serum tự làm nâu da tự nhiên, không vệt cam.',
 'DHA, Glycerin, Vitamin E, Aloe Vera',
 'Thoa đều lên da khô, rửa tay sau dùng.',
 185000,225000,3300,4.0,3300,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0),

(6,'Crème de Corps Soy Milk Honey Lotion','KIEHL\'S',
 'Sữa dưỡng thể toàn thân với sữa đậu nành và mật ong.',
 'Soy Milk, Honey, Shea Butter, Aloe Vera',
 'Thoa lên toàn thân sau tắm.',
 650000,NULL,5800,5.0,5800,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0),

(6,'Brazilian Bum Bum Cream 240ml','SOL DE JANEIRO',
 'Kem dưỡng thể săn chắc da với bơ cupuaçu và cà phê.',
 'Cupuaçu Butter, Caffeine, Guarana Extract',
 'Thoa lên đùi, bụng, mông massage theo chuyển động tròn.',
 890000,1100000,4200,5.0,4200,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,1),

(6,'Eucerin Advanced Repair Cream 454g','EUCERIN',
 'Kem dưỡng thể phục hồi da cực khô, bong tróc.',
 'Urea, Ceramide-3, NMF Complex, Glycerin',
 'Thoa lên vùng da khô cần phục hồi.',
 480000,620000,2100,4.5,2100,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0),

(6,'Aveeno Daily Moisturizing Lotion 350ml','AVEENO',
 'Sữa dưỡng thể yến mạch dịu nhẹ cho da nhạy cảm.',
 'Colloidal Oatmeal, Glycerin, Dimethicone',
 'Thoa toàn thân sau tắm hoặc bất kỳ lúc nào.',
 280000,360000,7200,4.5,7200,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0),

(6,'The Body Shop Body Yogurt Mango 200ml','THE BODY SHOP',
 'Sữa chua dưỡng thể mát lạnh, thẩm thấu tức thì.',
 'Mango Extract, Yogurt Powder, Glycerin',
 'Thoa toàn thân sau tắm, không cần chờ khô.',
 280000,360000,5100,4.0,5100,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0),

(6,'Rapid Relief Body Cream 200ml','LA ROCHE-POSAY',
 'Kem dưỡng thể giảm ngứa và kích ứng tức thì.',
 'Niacinamide, Shea Butter, Thermal Spring Water',
 'Thoa lên vùng da khô, kích ứng.',
 520000,680000,1600,4.5,1600,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,1),

(6,'Bath Body Oil 200ml','AESOP',
 'Dầu tắm dưỡng ẩm thư giãn với cam và vanilla.',
 'Sweet Almond Oil, Orange Peel Oil, Vanilla Oil',
 'Thoa lên da ẩm trong lúc tắm rồi xả sạch.',
 950000,NULL,980,5.0,980,
 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
 1,0,0);


-- ------------------------------------------------------------
-- VARIANT SẢN PHẨM
-- ------------------------------------------------------------
INSERT INTO san_pham_variant (ma_san_pham, ten_variant, gia, gia_goc, thu_tu) VALUES
(1,'30ml', 1250000,1560000,0),
(1,'50ml', 1890000,2360000,1),
(1,'100ml',3200000,4000000,2),
(2,'75ml', 1650000,NULL,0),
(2,'160ml',2890000,NULL,1),
(2,'230ml',3890000,NULL,2),
(3,'30ml', 1250000,1780000,0),
(3,'50ml', 1890000,2700000,1),
(3,'75ml', 2650000,3780000,2),
(4,'170ml',385000,NULL,0),
(4,'400ml',690000,NULL,1),
(5,'15ml',290000,430000,0),
(5,'30ml',480000,720000,1),
(5,'50ml',720000,1080000,2),
(7,'50ml', 590000, 830000,0),
(7,'125ml',890000,1250000,1),
(13,'3.2g',1350000,NULL,0),
(29,'60ml',620000,890000,0),
(29,'90ml',850000,1190000,1),
(12,'20g',340000,400000,0),
(12,'60g',650000,760000,1);

-- ------------------------------------------------------------
-- FLASH SALE — 6 sản phẩm khớp với index.jsp
-- ------------------------------------------------------------
INSERT INTO flash_sale (ma_san_pham, gia_flash_sale, phan_tram_giam, so_luong_gioi_han, so_luong_da_ban, ngay_bat_dau, ngay_ket_thuc) VALUES
(5,  480000,  33, 120, 94,  '2026-04-01 00:00:00', '2026-12-31 23:59:59'),  -- L'Oréal HA
(29, 620000,  30, 80,  73,  '2026-04-01 00:00:00', '2026-12-31 23:59:59'),  -- Anessa SPF
(7,  890000,  29, 100, 55,  '2026-04-01 00:00:00', '2026-12-31 23:59:59'),  -- Kiehl's Ultra
(11, 230000,  25, 200, 126, '2026-04-01 00:00:00', '2026-12-31 23:59:59'),  -- The Ordinary
(12, 340000,  15, 150, 63,  '2026-04-01 00:00:00', '2026-12-31 23:59:59'),  -- Laneige Lip
(4,  308000,  20, 180, 155, '2026-04-01 00:00:00', '2026-12-31 23:59:59');  -- Innisfree Toner

-- ------------------------------------------------------------
-- TỒN KHO
-- ------------------------------------------------------------
INSERT INTO ton_kho (ma_san_pham, so_luong)
SELECT id, FLOOR(50 + RAND() * 200) FROM san_pham;

SET SQL_SAFE_UPDATES = 0;
UPDATE san_pham sp
JOIN ton_kho tk ON sp.id = tk.ma_san_pham
SET sp.so_luong_ton = tk.so_luong
WHERE sp.id > 0;
SET SQL_SAFE_UPDATES = 1;

-- ------------------------------------------------------------
-- KHUYẾN MÃI
-- ------------------------------------------------------------
INSERT INTO khuyen_mai
    (voucher_code, ten, loai, gia_tri_giam, don_hang_toi_thieu,
     so_luot_toi_da, gioi_han_moi_tk, ngay_bat_dau, ngay_ket_thuc)
VALUES
('LACTT10',   'Giảm 10% mọi đơn hàng',       'percent', 10,     0,      999, 1, '2026-01-01','2026-12-31'),
('LACTT50K',  'Giảm 50.000đ đơn từ 200K',    'fixed',   50000,  200000, 500, 1, '2026-01-01','2026-12-31'),
('NEWMEMBER', 'Thành viên mới giảm 15%',      'percent', 15,     0,      999, 1, '2026-01-01','2026-12-31'),
('FREESHIP',  'Miễn phí vận chuyển',          'fixed',   30000,  0,      NULL,1, '2026-01-01','2026-12-31'),
('WELCOME50', 'Chào mừng giảm 50K',           'fixed',   50000,  300000, 500, 1, '2026-01-01','2026-12-31'),
('SALE20',    'Giảm 20% mùa hè',              'percent', 20,     500000, 200, 1, '2026-04-01','2026-06-30'),
('VIP100K',   'Ưu đãi VIP giảm 100K',         'fixed',   100000, 999000, 100, 1, '2026-04-01','2026-05-31'),
('NEWUSER10', 'Giảm 10% đơn đầu tiên',        'percent', 10,     0,      999, 1, '2026-01-01','2026-12-31');

-- ------------------------------------------------------------
-- ĐƠN HÀNG MẪU
-- ------------------------------------------------------------
INSERT INTO don_hang
    (ma_nguoi_dung, ma_dia_chi, ma_don_hang, ten_nguoi_nhan,
     so_dien_thoai, dia_chi_giao, tong_tam_tinh, phi_van_chuyen,
     giam_gia, tong_tien, trang_thai)
VALUES
(3, 1,'LACTT-000001','Trần Thị Mai','0912345678',
 '123 Nguyễn Huệ, Q1, TP.HCM',
 1250000,0,0,1250000,'da_giao'),
(4, 2,'LACTT-000002','Lê Quốc Bảo','0987654321',
 '45 Hoàn Kiếm, Hà Nội',
 3230000,30000,50000,3210000,'dang_giao');

INSERT INTO chi_tiet_don_hang
    (ma_don_hang, ma_san_pham, ten_san_pham, thuong_hieu, ten_variant, so_luong, gia, thanh_tien)
VALUES
(1,1,'Génifique Advanced Youth Activating Serum','LANCÔME','50ml',1,1890000,1890000),
(2,2,'Facial Treatment Essence 230ml','SK-II','160ml',1,2890000,2890000),
(2,4,'Green Tea Hyaluronic Acid Hydration Toner','INNISFREE','170ml',1,385000,385000);

INSERT INTO giao_dich (ma_don_hang, ma_tham_chieu, so_tien, phuong_thuc, trang_thai) VALUES
(1,'TXN-LACTT-000001',1890000,'banking','da_thanh_toan'),
(2,NULL,3275000,'cod','chua_thanh_toan');

-- ------------------------------------------------------------
-- ĐÁNH GIÁ MẪU
-- ------------------------------------------------------------
INSERT INTO danh_gia (ma_san_pham, ma_nguoi_dung, diem, noi_dung) VALUES
(1,3,5,'Serum rất tốt, da mình sáng lên rõ rệt sau 2 tuần dùng!'),
(2,4,5,'Nước thần SK-II xứng danh huyền thoại, dùng rồi không bỏ được.'),
(4,3,5,'Toner innisfree nhẹ mà cấp ẩm tốt, mùi trà xanh dễ chịu lắm.');

USE lactt_db;

-- 1. Lancôme Génifique
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634688/G%C3%A9nifique_Advanced_Youth_Activating_Serum_ywlqs6.png' WHERE id = 1;

-- 2. SK-II Essence
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634687/Facial_Treatment_Essence_230ml_ibmzio.webp' WHERE id = 2;

-- 3. Estée Lauder Advanced Night Repair
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634687/Advanced_Night_Repair_Synchronized_Recovery_EST%C3%89E_LAUDER_lyljt9.webp' WHERE id = 3;

-- 4. Innisfree Green Tea Toner
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634687/Green_Tea_Hyaluronic_Acid_Hydration_Toner_INNISFREE_fn87sp.webp' WHERE id = 4;

-- 5. L'Oréal Hyaluronic Acid Serum
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634687/Revitalift_1.5_Pure_Hyaluronic_Acid_Serum_L_OR%C3%89AL_ct8hzx.webp' WHERE id = 5;

-- 6. Shiseido Vital Perfection Cream
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634688/Vital_Perfection_Uplifting_Firming_Cream_SHISEIDO_igvvpa.jpg' WHERE id = 6;

-- 7. Kiehl's Ultra Facial Cream
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634686/Ultra_Facial_Cream_SPF_30_125ml_KIEHL_S_bfhzkk.jpg' WHERE id = 7;

-- 8. Clinique Moisture Surge
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634688/Moisture_Surge_100H_Hydrator_75ml_CLINIQUE_fbbwge.webp' WHERE id = 8;

-- 9. Sulwhasoo First Care Serum
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634688/Sulwhasoo_First_Care_Activating_Serum_SULWHASOO_yk6nsw.webp' WHERE id = 9;

-- 10. Tatcha Water Cream
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777634688/The_Water_Cream_50ml_TATCHA_fjmdhb.webp' WHERE id = 10;
USE lactt_db;

-- ==========================================
-- TIẾP TỤC DANH MỤC CHĂM SÓC DA
-- ==========================================

-- 11. Niacinamide 10% + Zinc 1% Serum 30ml (THE ORDINARY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Niacinamide_10_Zinc_1_Serum_30ml_dhbmwa.jpg' WHERE id = 11;

-- 12. Lip Sleeping Mask Berry 20g (LANEIGE)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Lip_Sleeping_Mask_Berry_20g_s5wze1.webp' WHERE id = 12;

-- 13. Cicaplast Baume B5+ 100ml (LA ROCHE-POSAY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Cicaplast_Baume_B5_100ml_f6afqt.webp' WHERE id = 13;

-- 14. Hyaluronic Acid 2% + B5 Serum (THE ORDINARY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Hyaluronic_Acid_2_B5_Serum_dwamsh.jpg' WHERE id = 14;

-- 15. Retinol 0.5% Serum 30ml (COSRX)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Retinol_0.5_Serum_30ml_COSRX_ak0fid.jpg' WHERE id = 15;

-- 16. Vitamin C 23% Suspension (THE ORDINARY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Hyaluronic_Acid_2_B5_Serum_dwamsh.jpg' WHERE id = 16;

-- 17. Ceramide Moisturizing Cream 50ml (DR.JART+)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700276/Ceramide_Moisturizing_Cream_50ml_DR.JART_ats8er.webp' WHERE id = 17;

-- 18. Advanced Snail 96 Mucin Power Essence (COSRX)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700276/Advanced_Snail_96_Mucin_Power_Essence_COSRX_tr9o9m.webp' WHERE id = 18;

-- ==========================================
-- DANH MỤC TRANG ĐIỂM
-- ==========================================

-- 19. Rouge Dior Forever Lipstick 999 (DIOR BEAUTY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700276/Rouge_Dior_Forever_Lipstick_999_ne6l4j.jpg' WHERE id = 19;

-- 20. Pro Filt'r Soft Matte Longwear Foundation (FENTY BEAUTY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700276/Pro_Filt_r_Soft_Matte_Longwear_Foundation_FENTY_BEAUTY_whadsl.webp' WHERE id = 20;

-- 21. Pillow Talk Lipstick (CHARLOTTE TILBURY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700276/Pillow_Talk_Lipstick_CHARLOTTE_TILBURY_sizryl.webp' WHERE id = 21;

-- 22. Radiant Creamy Concealer (NARS)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700276/Radiant_Creamy_Concealer_NARS_alboxs.webp' WHERE id = 22;

-- 23. Studio Fix Fluid Foundation SPF 15 (MAC COSMETICS)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700278/Studio_Fix_Fluid_Foundation_SPF_15_MAC_COSMETICS_vlanhm.webp' WHERE id = 23;

-- 24. Lip Glow Oil 001 Pink (DIOR BEAUTY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700278/Lip_Glow_Oil_001_Pink_DIOR_BEAUTY_amfhul.jpg' WHERE id = 24;

-- 25. Double Wear Stay-in-Place Foundation (ESTÉE LAUDER)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700278/Double_Wear_Stay-in-Place_Foundation_EST%C3%89E_LAUDER_bavxx7.webp' WHERE id = 25;

-- 26. Airbrush Flawless Setting Spray (CHARLOTTE TILBURY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700278/Airbrush_Flawless_Setting_Spray_CHARLOTTE_TILBURY_aeoksv.webp' WHERE id = 26;

-- 27. Stay Vulnerable Glossy Lip Balm (RARE BEAUTY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Stay_Vulnerable_Glossy_Lip_Balm_RARE_BEAUTY_ydbt2l.webp' WHERE id = 27;

-- 28. Better Than Sex Mascara (TOO FACED)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Better_Than_Sex_Mascara_TOO_FACED_k9nl3g.jpg' WHERE id = 28;

-- 29. Translucent Loose Setting Powder (LAURA MERCIER)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Translucent_Loose_Setting_Powder_LAURA_MERCIER_ibhxdi.webp' WHERE id = 29;

-- 30. Shape Tape Concealer 10ml (TARTE)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777700277/Shape_Tape_Concealer_10ml_TARTE_okczek.jpg' WHERE id = 30;

-- ==========================================
-- DANH MỤC NƯỚC HOA
-- ==========================================

-- 31. N°5 Eau de Parfum 50ml — Đặc Biệt (CHANEL)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709713/N_5_Eau_de_Parfum_50ml_yuzsmc.jpg ' WHERE id = 31;

-- 32. Miss Dior Blooming Bouquet EDT 100ml (DIOR)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709713/Miss_Dior_Blooming_Bouquet_EDT_100ml_DIOR_chrxko.webp ' WHERE id = 32;

-- 33. Light Blue Eau de Toilette 100ml (DOLCE & GABBANA)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709713/Light_Blue_Eau_de_Toilette_100ml_DOLCE_GABBANA_fjje6v.webp' WHERE id = 33;

-- 34. Chloé Eau de Parfum 50ml (CHLOÉ)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709713/Chlo%C3%A9_Eau_de_Parfum_50ml_CHLO%C3%89_cglfey.jpg' WHERE id = 34;

-- 35. Black Opium EDP 90ml (YVES SAINT LAURENT)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709713/Black_Opium_EDP_90ml_YVES_SAINT_LAURENT_ti7qdl.webp' WHERE id = 35;

-- 36. La Vie Est Belle Eau de Parfum 50ml (LANCÔME)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709713/La_Vie_Est_Belle_Eau_de_Parfum_50ml_LANC%C3%94ME_eustrs.jpg' WHERE id = 36;

-- 37. Flowerbomb EDP 100ml (VIKTOR & ROLF)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709714/Flowerbomb_EDP_100ml_VIKTOR_ROLF_dklfyq.jpg' WHERE id = 37;

-- 38. Olympea EDP 80ml (PACO RABANNE)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709714/Olympea_EDP_80ml_PACO_RABANNE_jtmktz.jpg ' WHERE id = 38;

-- 39. Gucci Bloom EDP 100ml (GUCCI)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709714/Gucci_Bloom_EDP_100ml_GUCCI_azspc8.jpg ' WHERE id = 39;

-- 40. Idôle EDP 75ml (LANCÔME)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777709713/Id%C3%B4le_EDP_75ml_LANC%C3%94ME_ayv8gu.jpg' WHERE id = 40;

-- 41. J'adore EDP 100ml (DIOR)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1777711838/J_adore_EDP_100ml_DIOR_dllj2a.webp' WHERE id = 41;

-- 42. Terre d'Hermès EDT 100ml (HERMÈS)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778091970/Terre_d_Herm%C3%A8s_EDT_100ml_HERM%C3%88S_hm6l4s.webp ' WHERE id = 42;

-- ==========================================
-- DANH MỤC CHĂM SÓC TÓC
-- ==========================================

-- 43. Elseve Extraordinary Oil Serum (L'ORÉAL)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778091970/Elseve_Extraordinary_Oil_Serum_L_OR%C3%89AL_mrainu.webp ' WHERE id = 43;

-- 44. Damage Remedy Restructuring Conditioner (AVEDA)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092057/Damage_Remedy_Restructuring_Conditioner_AVEDA_xz1jan.webp ' WHERE id = 44;

-- 45. Résistance Bain Force Architecte Shampoo (KÉRASTASE)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092123/R%C3%A9sistance_Bain_Force_Architecte_Shampoo_K%C3%89RASTASE_ns1w9e.webp' WHERE id = 45;

-- 46. Olaplex No.3 Hair Perfector (OLAPLEX)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092171/Olaplex_No.3_Hair_Perfector_OLAPLEX_khtj05.webp' WHERE id = 46;

-- 47. Purple Shampoo Blonde Care (FANOLA)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092239/Purple_Shampoo_Blonde_Care_FANOLA_fdlqk6.webp' WHERE id = 47;

-- 48. Nutritive Masquintense Fine Hair 500ml (KÉRASTASE)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092323/Nutritive_Masquintense_Fine_Hair_500ml_K%C3%89RASTASE_c2svsh.webp ' WHERE id = 48;

-- 49. Dry Shampoo Original 200ml (BATISTE)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092547/Dry_Shampoo_Original_200ml_BATISTE_zxfuf1.webp' WHERE id = 49;

-- 50. Sublimic Aqua Intensive Hair Mask (SHISEIDO)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092596/Sublimic_Aqua_Intensive_Hair_Mask_SHISEIDO_xa70ky.jpg' WHERE id = 50;

-- 51. Moroccanoil Treatment Original 100ml (MOROCCANOIL)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092784/51._Moroccanoil_Treatment_Original_100ml_MOROCCANOIL_oc8nbn.webp ' WHERE id = 51;

-- 52. Scalp Revival Charcoal Shampoo (BRIOGEO)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1779378814/Scalp_Revival_Charcoal_Shampoo_BRIOGEO_bhpwmo.webp ' WHERE id = 52;

-- 53. Leave-In Conditioner Shea Butter 350ml (CANTU)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092872/Leave-In_Conditioner_Shea_Butter_350ml_CANTU_cuxvh3.webp ' WHERE id = 53;

-- 54. Hair Oil Nourishing 100ml (OUAI)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778092916/Hair_Oil_Nourishing_100ml_OUAI_fycrrv.webp ' WHERE id = 54;

-- ==========================================
-- DANH MỤC CHỐNG NẮNG
-- ==========================================

-- 55. Perfect UV Sunscreen Skincare Milk SPF50+ (ANESSA)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1779380365/anessa_x3libm.webp' WHERE id = 55;

-- 56. Pure Screen+ Mineral Moisturizer SPF40 (CLINIQUE)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778093071/Pure_Screen_Mineral_Moisturizer_SPF40_CLINIQUE_jw4ptb.jpg' WHERE id = 56;

-- 57. Biore UV Aqua Rich Watery Essence SPF50+ (BIORÉ)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778093120/Biore_UV_Aqua_Rich_Watery_Essence_SPF50_BIOR%C3%89_uchtbm.webp ' WHERE id = 57;

-- 58. Daily UV Protection Cream SPF36 (INNISFREE)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778093185/Daily_UV_Protection_Cream_SPF36_INNISFREE_i7f2wh.webp' WHERE id = 58;

-- 59. UV Expert Supra Screen SPF50+ (LANCÔME)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778093281/UV_Expert_Supra_Screen_SPF50_LANC%C3%94ME_kukhtk.jpg ' WHERE id = 59;

-- 60. Clear Face Oil-Free Sunscreen SPF55 (LA ROCHE-POSAY)
UPDATE san_pham SET hinh_anh = 'https://res.cloudinary.com/dmnfgghnw/image/upload/v1778093349/Clear_Face_Oil-Free_Sunscreen_SPF55_LA_ROCHE-POSAY_xn9f2j.webp ' WHERE id = 60;

-- Fix lỗi 1: đổi tên cột
ALTER TABLE dia_chi 
CHANGE COLUMN dia_chi dia_chi_cu_the TEXT NOT NULL;

-- Fix lỗi 2: thêm 2 cột còn thiếu
ALTER TABLE cau_hinh_diem 
ADD COLUMN freeship_tu DECIMAL(12,2) DEFAULT 499000,
ADD COLUMN qua_tang_tu DECIMAL(12,2) DEFAULT 999000;

SET SQL_SAFE_UPDATES = 0;

UPDATE cau_hinh_diem SET freeship_tu = 499000, qua_tang_tu = 999000;

SET SQL_SAFE_UPDATES = 1;
ALTER TABLE tai_khoan
ADD COLUMN gioi_tinh VARCHAR(10)  DEFAULT NULL,
ADD COLUMN loai_da   VARCHAR(50)  DEFAULT NULL,
ADD COLUMN ngay_sinh DATE         DEFAULT NULL;
-- Set tồn kho ngẫu nhiên 50-200 cho tất cả variant
SET SQL_SAFE_UPDATES = 0;
UPDATE san_pham_variant SET so_luong = FLOOR(50 + RAND() * 150);

ALTER TABLE don_hang 
MODIFY COLUMN trang_thai 
ENUM('cho_xac_nhan','dang_chuan_bi','dang_giao','da_giao','hoan_thanh','da_huy') 
DEFAULT 'cho_xac_nhan';

-- Bổ sung cột mới vào don_hang
ALTER TABLE don_hang
ADD COLUMN shipped_at         DATETIME     NULL AFTER ngay_dat,
ADD COLUMN shipped_by         VARCHAR(100) NULL AFTER shipped_at,
ADD COLUMN delivered_at       DATETIME     NULL AFTER shipped_by,
ADD COLUMN delivered_by       VARCHAR(100) NULL AFTER delivered_at,
ADD COLUMN refund_reason      TEXT         NULL AFTER delivered_by,
ADD COLUMN refund_approved    TINYINT(1)   NOT NULL DEFAULT 0 AFTER refund_reason,
ADD COLUMN refund_approved_at DATETIME     NULL AFTER refund_approved,
ADD COLUMN restocked_at       DATETIME     NULL AFTER refund_approved_at,
ADD COLUMN restocked_by       VARCHAR(100) NULL AFTER restocked_at,
MODIFY COLUMN trang_thai ENUM(
    'cho_xac_nhan',
    'dang_chuan_bi',
    'dang_giao',
    'da_giao',
    'hoan_thanh',
    'da_huy',
    'yeu_cau_hoan',
    'cho_hoan_kho',
    'cho_hoan_tien',
    'da_hoan_tien'
) NOT NULL DEFAULT 'cho_xac_nhan';

-- Tạo bảng nhật ký kho (chưa có trong schema)
CREATE TABLE IF NOT EXISTS nhat_ky_kho (
    id           INT UNSIGNED     NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham  INT UNSIGNED     NOT NULL,
    loai         ENUM('IN','OUT') NOT NULL,
    so_luong     INT              NOT NULL DEFAULT 0,
    ghi_chu      TEXT             NULL,
    ma_don_hang  INT UNSIGNED     NULL,
    ma_nhan_vien INT UNSIGNED     NULL,
    thoi_gian    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_san_pham)  REFERENCES san_pham(id),
    FOREIGN KEY (ma_don_hang)  REFERENCES don_hang(id),
    FOREIGN KEY (ma_nhan_vien) REFERENCES tai_khoan(id)
);


-- ============================================================
--  TRIGGER đồng bộ so_luong_ton ← SUM(variant.so_luong)
--  Áp dụng cho SP có variant, mỗi khi variant thay đổi
-- ============================================================

DELIMITER $$

-- Khi UPDATE so_luong của một variant
CREATE TRIGGER sync_ton_after_variant_update
AFTER UPDATE ON san_pham_variant
FOR EACH ROW
BEGIN
    UPDATE san_pham
    SET so_luong_ton = (
        SELECT COALESCE(SUM(so_luong), 0)
        FROM san_pham_variant
        WHERE ma_san_pham = NEW.ma_san_pham
    )
    WHERE id = NEW.ma_san_pham;
END$$

-- Khi INSERT variant mới
CREATE TRIGGER sync_ton_after_variant_insert
AFTER INSERT ON san_pham_variant
FOR EACH ROW
BEGIN
    UPDATE san_pham
    SET so_luong_ton = (
        SELECT COALESCE(SUM(so_luong), 0)
        FROM san_pham_variant
        WHERE ma_san_pham = NEW.ma_san_pham
    )
    WHERE id = NEW.ma_san_pham;
END$$

-- Khi DELETE variant
CREATE TRIGGER sync_ton_after_variant_delete
AFTER DELETE ON san_pham_variant
FOR EACH ROW
BEGIN
    UPDATE san_pham
    SET so_luong_ton = (
        SELECT COALESCE(SUM(so_luong), 0)
        FROM san_pham_variant
        WHERE ma_san_pham = OLD.ma_san_pham
    )
    WHERE id = OLD.ma_san_pham;
END$$

DELIMITER ;

-- ============================================================
--  Sync lại ngay cho toàn bộ SP đang có variant (chạy 1 lần)
-- ============================================================
UPDATE san_pham sp
SET sp.so_luong_ton = (
    SELECT COALESCE(SUM(v.so_luong), 0)
    FROM san_pham_variant v
    WHERE v.ma_san_pham = sp.id
)
WHERE EXISTS (
    SELECT 1 FROM san_pham_variant v WHERE v.ma_san_pham = sp.id
);


SELECT '=== TẠO DATABASE THÀNH CÔNG ===' AS status;
SELECT CONCAT('Tổng sản phẩm: ', COUNT(*)) FROM san_pham;
SELECT CONCAT('Sản phẩm flash sale: ', COUNT(*)) FROM flash_sale;
SELECT id, ten_sp, so_luong_ton 
FROM san_pham 
WHERE id = 55;
select * from don_hang;


ALTER TABLE giao_dich 
ADD COLUMN ma_giao_dich VARCHAR(50) AFTER ma_don_hang;

ALTER TABLE giao_dich 
ADD COLUMN trang_thai_doi_soat 
ENUM('KHOP', 'SAI_LECH', 'CHO_XU_LY') 
DEFAULT 'CHO_XU_LY';
-- Migration script for bank reconciliation feature
-- Run this script before using BankImportServlet and ReconcileExportServlet
-- 1. Create bank_transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ma_giao_dich VARCHAR(50) UNIQUE NOT NULL,
    so_tien DECIMAL(15,2) NOT NULL,
    thoi_gian DATETIME NOT NULL,
    ngan_hang VARCHAR(20),
    trang_thai ENUM('CHO_XU_LY', 'DA_DOI_SOAT', 'KHONG_KHOP') DEFAULT 'CHO_XU_LY',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_thoi_gian (thoi_gian),
    INDEX idx_ngan_hang (ngan_hang),
    INDEX idx_trang_thai (trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add columns to giao_dich table if not exists
-- Check and add columns for reconciliation
SET @exist_ma_gd_nh := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'lactt_db'
    AND TABLE_NAME = 'giao_dich'
    AND COLUMN_NAME = 'ma_giao_dich_ngan_hang'
);
SET @sql := IF(@exist_ma_gd_nh = 0,
    'ALTER TABLE giao_dich ADD COLUMN ma_giao_dich_ngan_hang VARCHAR(50) NULL AFTER ma_giao_dich',
    'SELECT "Column ma_giao_dich_ngan_hang already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_trang_thai_doi_soat := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'lactt_db'
    AND TABLE_NAME = 'giao_dich'
    AND COLUMN_NAME = 'trang_thai_doi_soat'
);
SET @sql2 := IF(@exist_trang_thai_doi_soat = 0,
    "ALTER TABLE giao_dich ADD COLUMN trang_thai_doi_soat ENUM('CHUA_DOI', 'KHOP', 'SAI_LECH', 'KHOP', 'CHO_XU_LY') DEFAULT 'CHUA_DOI' AFTER trang_thai",
    'SELECT "Column trang_thai_doi_soat already exists"'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 3. Create indexes for better performance
CREATE INDEX idx_giao_dich_ma_gdnh ON giao_dich(ma_giao_dich_ngan_hang);
CREATE INDEX idx_don_hang_ngay_dat ON don_hang(ngay_dat);
CREATE INDEX idx_don_hang_trang_thai ON don_hang(trang_thai);

-- 4. Verify table creation
SELECT 'bank_transactions table:' as '';
DESCRIBE bank_transactions;

SELECT 'giao_dich table columns:' as '';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'lactt_db' AND TABLE_NAME = 'giao_dich'
ORDER BY ORDINAL_POSITION;

-- 5. Insert sample bank transactions for testing
-- (Only insert if table is empty)
INSERT INTO bank_transactions (ma_giao_dich, so_tien, thoi_gian, ngan_hang)
SELECT * FROM (
    SELECT 'TXN-20260501-001' as ma, 1890000.00 as tien, '2026-05-01 10:30:00' as tg, 'VCB' as nh
    UNION ALL
    SELECT 'TXN-20260501-002', 2890000.00, '2026-05-01 14:15:00', 'BIDV'
    UNION ALL
    SELECT 'TXN-20260502-001', 1250000.00, '2026-05-02 09:00:00', 'MOMO'
    UNION ALL
    SELECT 'TXN-20260502-002', 850000.00, '2026-05-02 16:45:00', 'VCB'
    UNION ALL
    SELECT 'TXN-20260430-001', 625000.00, '2026-04-30 11:20:00', 'BIDV'
    UNION ALL
    SELECT 'TXN-20260429-001', 420000.00, '2026-04-29 08:15:00', 'VCB'
    UNION ALL
    SELECT 'TXN-20260428-001', 780000.00, '2026-04-28 13:50:00', 'MOMO'
    UNION ALL
    SELECT 'TXN-20260427-001', 1120000.00, '2026-04-27 10:10:00', 'VCB'
    UNION ALL
    SELECT 'TXN-20260426-001', 320000.00, '2026-04-26 15:30:00', 'BIDV'
    UNION ALL
    SELECT 'TXN-20260503-001', 1650000.00, '2026-05-03 09:45:00', 'VCB'
    UNION ALL
    SELECT 'TXN-20260503-002', 580000.00, '2026-05-03 14:20:00', 'MOMO'
    UNION ALL
    SELECT 'TXN-20260504-001', 920000.00, '2026-05-04 11:00:00', 'BIDV'
    UNION ALL
    SELECT 'TXN-20260504-002', 720000.00, '2026-05-04 16:45:00', 'VCB'
    UNION ALL
    SELECT 'TXN-20260505-001', 1100000.00, '2026-05-05 08:30:00', 'MOMO'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM bank_transactions WHERE ma_giao_dich = tmp.ma);

-- 6. Verify inserted data
SELECT 'Bank transactions:' as '';
SELECT ma_giao_dich, so_tien, thoi_gian, ngan_hang FROM bank_transactions ORDER BY thoi_gian;

INSERT IGNORE INTO don_hang 
(ma_nguoi_dung, ma_dia_chi, ma_don_hang, ten_nguoi_nhan, so_dien_thoai, dia_chi_giao, tong_tam_tinh, phi_van_chuyen, giam_gia, tong_tien, phuong_thuc_tt, trang_thai, ngay_dat) 
VALUES
(3, 1, 'LACTT-000013', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 450000, 30000, 0, 480000, 'cod', 'da_giao', '2026-04-10 09:15:00'),
(4, 2, 'LACTT-000014', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 1200000, 0, 50000, 1150000, 'banking', 'da_giao', '2026-04-11 14:20:00'),
(3, 1, 'LACTT-000015', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 850000, 30000, 0, 880000, 'momo', 'da_giao', '2026-04-12 10:30:00'),
(4, 2, 'LACTT-000016', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 320000, 30000, 0, 350000, 'cod', 'da_huy', '2026-04-13 16:45:00'),
(3, 1, 'LACTT-000017', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 2100000, 0, 100000, 2000000, 'banking', 'da_giao', '2026-04-14 08:00:00'),
(4, 2, 'LACTT-000018', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 500000, 30000, 0, 530000, 'momo', 'da_giao', '2026-04-15 11:15:00'),
(3, 1, 'LACTT-000019', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 780000, 30000, 50000, 760000, 'cod', 'da_giao', '2026-04-16 13:25:00'),
(4, 2, 'LACTT-000020', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 1500000, 0, 0, 1500000, 'banking', 'da_giao', '2026-04-17 09:40:00'),
(3, 1, 'LACTT-000021', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 250000, 30000, 0, 280000, 'momo', 'da_giao', '2026-04-18 15:50:00'),
(4, 2, 'LACTT-000022', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 920000, 30000, 0, 950000, 'cod', 'da_huy', '2026-04-19 10:10:00'),
(3, 1, 'LACTT-000023', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 1100000, 0, 50000, 1050000, 'banking', 'da_giao', '2026-04-20 14:30:00'),
(4, 2, 'LACTT-000024', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 650000, 30000, 0, 680000, 'momo', 'da_giao', '2026-04-21 08:45:00'),
(3, 1, 'LACTT-000025', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 380000, 30000, 0, 410000, 'cod', 'da_giao', '2026-04-22 11:20:00'),
(4, 2, 'LACTT-000026', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 2400000, 0, 150000, 2250000, 'banking', 'da_giao', '2026-04-23 16:15:00'),
(3, 1, 'LACTT-000027', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 560000, 30000, 0, 590000, 'momo', 'da_giao', '2026-04-24 09:05:00'),
(4, 2, 'LACTT-000028', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 890000, 30000, 50000, 870000, 'cod', 'da_huy', '2026-04-25 13:40:00'),
(3, 1, 'LACTT-000029', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 1350000, 0, 0, 1350000, 'banking', 'da_giao', '2026-04-26 10:55:00'),
(4, 2, 'LACTT-000030', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 420000, 30000, 0, 450000, 'momo', 'da_giao', '2026-04-27 15:10:00'),
(3, 1, 'LACTT-000031', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 750000, 30000, 0, 780000, 'cod', 'da_giao', '2026-04-28 08:25:00'),
(4, 2, 'LACTT-000032', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 1800000, 0, 100000, 1700000, 'banking', 'da_giao', '2026-04-29 11:30:00'),
(3, 1, 'LACTT-000033', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 950000, 30000, 0, 980000, 'momo', 'da_giao', '2026-04-29 14:45:00'),
(4, 2, 'LACTT-000034', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 520000, 30000, 0, 550000, 'cod', 'da_giao', '2026-04-30 09:10:00'),
(3, 1, 'LACTT-000035', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 1150000, 0, 50000, 1100000, 'banking', 'da_giao', '2026-04-30 15:20:00'),
(4, 2, 'LACTT-000036', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 340000, 30000, 0, 370000, 'momo', 'da_huy', '2026-04-30 18:35:00'),
(3, 1, 'LACTT-000037', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 2200000, 0, 150000, 2050000, 'banking', 'da_giao', '2026-05-01 08:50:00'),
(4, 2, 'LACTT-000038', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 680000, 30000, 0, 710000, 'cod', 'da_giao', '2026-05-01 11:05:00'),
(3, 1, 'LACTT-000039', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 890000, 30000, 50000, 870000, 'momo', 'da_giao', '2026-05-01 14:15:00'),
(4, 2, 'LACTT-000040', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 1600000, 0, 0, 1600000, 'banking', 'da_giao', '2026-05-01 16:30:00'),
(3, 1, 'LACTT-000041', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 450000, 30000, 0, 480000, 'cod', 'dang_giao', '2026-05-02 09:40:00'),
(4, 2, 'LACTT-000042', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 1250000, 0, 50000, 1200000, 'momo', 'dang_giao', '2026-05-02 13:55:00'),
(3, 1, 'LACTT-000043', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 720000, 30000, 0, 750000, 'banking', 'da_giao', '2026-05-02 18:10:00'),
(4, 2, 'LACTT-000044', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 310000, 30000, 0, 340000, 'cod', 'da_huy', '2026-05-03 08:25:00'),
(3, 1, 'LACTT-000045', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 1900000, 0, 100000, 1800000, 'momo', 'dang_chuan_bi', '2026-05-03 10:40:00'),
(4, 2, 'LACTT-000046', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 580000, 30000, 0, 610000, 'banking', 'dang_giao', '2026-05-03 14:55:00'),
(3, 1, 'LACTT-000047', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 820000, 30000, 50000, 800000, 'cod', 'cho_xac_nhan', '2026-05-04 09:15:00'),
(4, 2, 'LACTT-000048', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 1450000, 0, 0, 1450000, 'momo', 'cho_xac_nhan', '2026-05-04 11:30:00'),
(3, 1, 'LACTT-000049', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 270000, 30000, 0, 300000, 'banking', 'dang_chuan_bi', '2026-05-04 15:45:00'),
(4, 2, 'LACTT-000050', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 1050000, 0, 50000, 1000000, 'cod', 'cho_xac_nhan', '2026-05-05 08:00:00'),
(3, 1, 'LACTT-000051', 'Trần Thị Mai', '0912345678', '123 Nguyễn Huệ, Q1, TP.HCM', 630000, 30000, 0, 660000, 'momo', 'cho_xac_nhan', '2026-05-05 09:20:00'),
(4, 2, 'LACTT-000052', 'Lê Quốc Bảo', '0987654321', '45 Hoàn Kiếm, Hà Nội', 2600000, 0, 200000, 2400000, 'banking', 'cho_xac_nhan', '2026-05-05 10:50:00');
USE lactt_db;

-- 1. Tạo bảng tạm chứa dữ liệu chi tiết
CREATE TEMPORARY TABLE tmp_ctdh (
    ma_dh_str VARCHAR(20), ma_sp INT, ten_sp VARCHAR(255),
    thieu_hieu VARCHAR(100), ten_var VARCHAR(100), sl INT,
    gia DECIMAL(12,2), tien DECIMAL(12,2)
);

-- 2. Nạp dữ liệu vào bảng tạm
INSERT INTO tmp_ctdh VALUES
('LACTT-000013', 11, 'Niacinamide 10% + Zinc 1% Serum 30ml', 'THE ORDINARY', '30ml', 1, 450000, 450000),
('LACTT-000014', 19, 'Rouge Dior Forever Lipstick 999', 'DIOR BEAUTY', 'Màu 999', 1, 1200000, 1200000),
('LACTT-000015', 7, 'Ultra Facial Cream SPF 30', 'KIEHL''S', '50ml', 1, 850000, 850000),
('LACTT-000016', 43, 'Elseve Extraordinary Oil Serum', 'L''ORÉAL', '100ml', 1, 320000, 320000),
('LACTT-000017', 33, 'Black Opium EDP 90ml', 'YVES SAINT LAURENT', '90ml', 1, 2100000, 2100000),
('LACTT-000018', 61, 'Shea Body Butter 200ml', 'THE BODY SHOP', '200ml', 1, 500000, 500000),
('LACTT-000019', 21, 'Pillow Talk Lipstick', 'CHARLOTTE TILBURY', 'Standard', 1, 780000, 780000),
('LACTT-000020', 1, 'Génifique Advanced Youth Activating Serum', 'LANCÔME', '50ml', 1, 1500000, 1500000),
('LACTT-000021', 49, 'Perfect UV Sunscreen Skincare Milk', 'ANESSA', '60ml', 1, 250000, 250000),
('LACTT-000022', 7, 'Ultra Facial Cream SPF 30', 'KIEHL''S', '50ml', 1, 920000, 920000),
('LACTT-000023', 25, 'Double Wear Stay-in-Place Foundation', 'ESTÉE LAUDER', '1W1 Bone', 1, 1100000, 1100000),
('LACTT-000024', 22, 'Radiant Creamy Concealer', 'NARS', 'Vanilla', 1, 650000, 650000),
('LACTT-000025', 4, 'Green Tea Hyaluronic Acid Hydration Toner', 'INNISFREE', '170ml', 1, 380000, 380000),
('LACTT-000026', 31, 'Light Blue Eau de Toilette 100ml', 'DOLCE & GABBANA', '100ml', 1, 2400000, 2400000),
('LACTT-000027', 61, 'Shea Body Butter 200ml', 'THE BODY SHOP', '200ml', 1, 560000, 560000),
('LACTT-000028', 7, 'Ultra Facial Cream SPF 30', 'KIEHL''S', '50ml', 1, 890000, 890000),
('LACTT-000029', 19, 'Rouge Dior Forever Lipstick 999', 'DIOR BEAUTY', 'Màu 999', 1, 1350000, 1350000),
('LACTT-000030', 43, 'Elseve Extraordinary Oil Serum', 'L''ORÉAL', '100ml', 1, 420000, 420000),
('LACTT-000031', 21, 'Pillow Talk Lipstick', 'CHARLOTTE TILBURY', 'Standard', 1, 750000, 750000),
('LACTT-000032', 3, 'Advanced Night Repair Synchronized Recovery', 'ESTÉE LAUDER', '50ml', 1, 1800000, 1800000),
('LACTT-000033', 24, 'Lip Glow Oil 001 Pink', 'DIOR BEAUTY', '001 Pink', 1, 950000, 950000),
('LACTT-000034', 5, 'Revitalift 1.5% Pure Hyaluronic Acid Serum', 'L''ORÉAL', '30ml', 1, 520000, 520000),
('LACTT-000035', 25, 'Double Wear Stay-in-Place Foundation', 'ESTÉE LAUDER', '1W1 Bone', 1, 1150000, 1150000),
('LACTT-000036', 12, 'Lip Sleeping Mask Berry 20g', 'LANEIGE', '20g', 1, 340000, 340000),
('LACTT-000037', 33, 'Black Opium EDP 90ml', 'YVES SAINT LAURENT', '90ml', 1, 2200000, 2200000),
('LACTT-000038', 22, 'Radiant Creamy Concealer', 'NARS', 'Vanilla', 1, 680000, 680000),
('LACTT-000039', 7, 'Ultra Facial Cream SPF 30', 'KIEHL''S', '50ml', 1, 890000, 890000),
('LACTT-000040', 9, 'Sulwhasoo First Care Activating Serum', 'SULWHASOO', '60ml', 1, 1600000, 1600000),
('LACTT-000041', 11, 'Niacinamide 10% + Zinc 1% Serum 30ml', 'THE ORDINARY', '30ml', 1, 450000, 450000),
('LACTT-000042', 1, 'Génifique Advanced Youth Activating Serum', 'LANCÔME', '50ml', 1, 1250000, 1250000),
('LACTT-000043', 28, 'Better Than Sex Mascara', 'TOO FACED', 'Đen', 1, 720000, 720000),
('LACTT-000044', 49, 'Perfect UV Sunscreen Skincare Milk', 'ANESSA', '60ml', 1, 310000, 310000),
('LACTT-000045', 3, 'Advanced Night Repair Synchronized Recovery', 'ESTÉE LAUDER', '50ml', 1, 1900000, 1900000),
('LACTT-000046', 61, 'Shea Body Butter 200ml', 'THE BODY SHOP', '200ml', 1, 580000, 580000),
('LACTT-000047', 21, 'Pillow Talk Lipstick', 'CHARLOTTE TILBURY', 'Standard', 1, 820000, 820000),
('LACTT-000048', 10, 'The Water Cream 50ml', 'TATCHA', '50ml', 1, 1450000, 1450000),
('LACTT-000049', 11, 'Niacinamide 10% + Zinc 1% Serum 30ml', 'THE ORDINARY', '30ml', 1, 270000, 270000),
('LACTT-000050', 25, 'Double Wear Stay-in-Place Foundation', 'ESTÉE LAUDER', '1W1 Bone', 1, 1050000, 1050000),
('LACTT-000051', 22, 'Radiant Creamy Concealer', 'NARS', 'Vanilla', 1, 630000, 630000),
('LACTT-000052', 31, 'Light Blue Eau de Toilette 100ml', 'DOLCE & GABBANA', '100ml', 1, 2600000, 2600000);

USE lactt_db;

-- 1. Xóa trạm trung chuyển nếu có vết tích từ trước
DROP TABLE IF EXISTS bang_tam_ctdh;

-- 2. Tạo trạm trung chuyển (Dùng bảng thật để không bị lỗi bốc hơi)
CREATE TABLE bang_tam_ctdh (
    ma_dh_str VARCHAR(20), ma_sp INT, ten_sp VARCHAR(255),
    thieu_hieu VARCHAR(100), ten_var VARCHAR(100), sl INT,
    gia DECIMAL(12,2), tien DECIMAL(12,2)
);

-- 3. Nạp dữ liệu vào trạm trung chuyển
INSERT INTO bang_tam_ctdh VALUES
('LACTT-000013', 11, 'Niacinamide 10% + Zinc 1% Serum 30ml', 'THE ORDINARY', '30ml', 1, 450000, 450000),
('LACTT-000014', 19, 'Rouge Dior Forever Lipstick 999', 'DIOR BEAUTY', 'Màu 999', 1, 1200000, 1200000),
('LACTT-000015', 7, 'Ultra Facial Cream SPF 30', 'KIEHL''S', '50ml', 1, 850000, 850000),
('LACTT-000016', 43, 'Elseve Extraordinary Oil Serum', 'L''ORÉAL', '100ml', 1, 320000, 320000),
('LACTT-000017', 33, 'Black Opium EDP 90ml', 'YVES SAINT LAURENT', '90ml', 1, 2100000, 2100000),
('LACTT-000018', 61, 'Shea Body Butter 200ml', 'THE BODY SHOP', '200ml', 1, 500000, 500000),
('LACTT-000019', 21, 'Pillow Talk Lipstick', 'CHARLOTTE TILBURY', 'Standard', 1, 780000, 780000),
('LACTT-000020', 1, 'Génifique Advanced Youth Activating Serum', 'LANCÔME', '50ml', 1, 1500000, 1500000),
('LACTT-000021', 49, 'Perfect UV Sunscreen Skincare Milk', 'ANESSA', '60ml', 1, 250000, 250000),
('LACTT-000022', 7, 'Ultra Facial Cream SPF 30', 'KIEHL''S', '50ml', 1, 920000, 920000),
('LACTT-000023', 25, 'Double Wear Stay-in-Place Foundation', 'ESTÉE LAUDER', '1W1 Bone', 1, 1100000, 1100000),
('LACTT-000024', 22, 'Radiant Creamy Concealer', 'NARS', 'Vanilla', 1, 650000, 650000),
('LACTT-000025', 4, 'Green Tea Hyaluronic Acid Hydration Toner', 'INNISFREE', '170ml', 1, 380000, 380000),
('LACTT-000026', 31, 'Light Blue Eau de Toilette 100ml', 'DOLCE & GABBANA', '100ml', 1, 2400000, 2400000),
('LACTT-000027', 61, 'Shea Body Butter 200ml', 'THE BODY SHOP', '200ml', 1, 560000, 560000),
('LACTT-000028', 7, 'Ultra Facial Cream SPF 30', 'KIEHL''S', '50ml', 1, 890000, 890000),
('LACTT-000029', 19, 'Rouge Dior Forever Lipstick 999', 'DIOR BEAUTY', 'Màu 999', 1, 1350000, 1350000),
('LACTT-000030', 43, 'Elseve Extraordinary Oil Serum', 'L''ORÉAL', '100ml', 1, 420000, 420000),
('LACTT-000031', 21, 'Pillow Talk Lipstick', 'CHARLOTTE TILBURY', 'Standard', 1, 750000, 750000),
('LACTT-000032', 3, 'Advanced Night Repair Synchronized Recovery', 'ESTÉE LAUDER', '50ml', 1, 1800000, 1800000),
('LACTT-000033', 24, 'Lip Glow Oil 001 Pink', 'DIOR BEAUTY', '001 Pink', 1, 950000, 950000),
('LACTT-000034', 5, 'Revitalift 1.5% Pure Hyaluronic Acid Serum', 'L''ORÉAL', '30ml', 1, 520000, 520000),
('LACTT-000035', 25, 'Double Wear Stay-in-Place Foundation', 'ESTÉE LAUDER', '1W1 Bone', 1, 1150000, 1150000),
('LACTT-000036', 12, 'Lip Sleeping Mask Berry 20g', 'LANEIGE', '20g', 1, 340000, 340000),
('LACTT-000037', 33, 'Black Opium EDP 90ml', 'YVES SAINT LAURENT', '90ml', 1, 2200000, 2200000),
('LACTT-000038', 22, 'Radiant Creamy Concealer', 'NARS', 'Vanilla', 1, 680000, 680000),
('LACTT-000039', 7, 'Ultra Facial Cream SPF 30', 'KIEHL''S', '50ml', 1, 890000, 890000),
('LACTT-000040', 9, 'Sulwhasoo First Care Activating Serum', 'SULWHASOO', '60ml', 1, 1600000, 1600000),
('LACTT-000041', 11, 'Niacinamide 10% + Zinc 1% Serum 30ml', 'THE ORDINARY', '30ml', 1, 450000, 450000),
('LACTT-000042', 1, 'Génifique Advanced Youth Activating Serum', 'LANCÔME', '50ml', 1, 1250000, 1250000),
('LACTT-000043', 28, 'Better Than Sex Mascara', 'TOO FACED', 'Đen', 1, 720000, 720000),
('LACTT-000044', 49, 'Perfect UV Sunscreen Skincare Milk', 'ANESSA', '60ml', 1, 310000, 310000),
('LACTT-000045', 3, 'Advanced Night Repair Synchronized Recovery', 'ESTÉE LAUDER', '50ml', 1, 1900000, 1900000),
('LACTT-000046', 61, 'Shea Body Butter 200ml', 'THE BODY SHOP', '200ml', 1, 580000, 580000),
('LACTT-000047', 21, 'Pillow Talk Lipstick', 'CHARLOTTE TILBURY', 'Standard', 1, 820000, 820000),
('LACTT-000048', 10, 'The Water Cream 50ml', 'TATCHA', '50ml', 1, 1450000, 1450000),
('LACTT-000049', 11, 'Niacinamide 10% + Zinc 1% Serum 30ml', 'THE ORDINARY', '30ml', 1, 270000, 270000),
('LACTT-000050', 25, 'Double Wear Stay-in-Place Foundation', 'ESTÉE LAUDER', '1W1 Bone', 1, 1050000, 1050000),
('LACTT-000051', 22, 'Radiant Creamy Concealer', 'NARS', 'Vanilla', 1, 630000, 630000),
('LACTT-000052', 31, 'Light Blue Eau de Toilette 100ml', 'DOLCE & GABBANA', '100ml', 1, 2600000, 2600000);

-- 4. Bắn dữ liệu từ trạm trung chuyển vào bảng chi_tiet_don_hang thật
INSERT INTO chi_tiet_don_hang (ma_don_hang, ma_san_pham, ten_san_pham, thuong_hieu, ten_variant, so_luong, gia, thanh_tien)
SELECT dh.id, t.ma_sp, t.ten_sp, t.thieu_hieu, t.ten_var, t.sl, t.gia, t.tien
FROM bang_tam_ctdh t
JOIN don_hang dh ON dh.ma_don_hang = t.ma_dh_str
WHERE NOT EXISTS (
    SELECT 1 FROM chi_tiet_don_hang ctdh 
    WHERE ctdh.ma_don_hang = dh.id AND ctdh.ma_san_pham = t.ma_sp
);

-- 5. Xóa trạm trung chuyển dọn dẹp sạch sẽ
DROP TABLE bang_tam_ctdh;

-- Tạm tắt chế độ bảo vệ
SET SQL_SAFE_UPDATES = 0;

-- Chuyển toàn bộ các đơn hàng test trong tháng 4 và tháng 5 thành trạng thái 'da_giao'
UPDATE don_hang 
SET trang_thai = 'da_giao' 
WHERE DATE(ngay_dat) >= '2026-04-01';

-- Bật lại chế độ bảo vệ cho an toàn
SET SQL_SAFE_UPDATES = 1;

ALTER TABLE tai_khoan 
  MODIFY email VARCHAR(255) NULL UNIQUE;

SET SQL_SAFE_UPDATES = 0;

USE lactt_db;
ALTER TABLE vi_diem ADD COLUMN da_su_dung INT DEFAULT 0;

UPDATE vi_diem v SET da_su_dung = (
    SELECT COALESCE(SUM(so_diem), 0) 
    FROM lich_su_diem 
    WHERE ma_nguoi_dung = v.ma_nguoi_dung AND loai = 'tru'
);

SET SQL_SAFE_UPDATES = 1;

SHOW TABLES;
SELECT * FROM cau_hinh_diem;
SELECT * FROM vi_diem;

SELECT * FROM vi_diem;
SELECT * FROM lich_su_diem ORDER BY thoi_gian DESC LIMIT 5;
