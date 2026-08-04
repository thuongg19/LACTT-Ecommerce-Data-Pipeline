import random
from datetime import datetime, timedelta
import mysql.connector
from faker import Faker

fake = Faker('vi_VN')

def sql_str(value):
    if value is None:
        return 'NULL'
    return "'" + str(value).replace('\\', '\\\\').replace("'", "''") + "'"

def generate_pipeline_data():
    print('Đang kết nối database')
    try:
        db = mysql.connector.connect(
            host='localhost',
            user='root',
            password='20050219',
            database='lactt_db'
        )
        cursor = db.cursor(dictionary=True)
        cursor.execute('SELECT id, ten_sp, thuong_hieu, gia FROM san_pham')
        products = cursor.fetchall()
        db.close()
    except Exception as e:
        print(f'Lỗi kết nối MySQL: {e}')
        return

    if not products:
        print('Không có sản phẩm nào trong database!')
        return

    print(f'Đã lấy thành công {len(products)} sản phẩm. Đang sinh dữ liệu...')

    sql_lines = []
    
    # 1. BLOCK RESET DỮ LIỆU ĐẦU FILE
    sql_lines.append('/* --- BLOCK RESET DỮ LIỆU --- */')
    sql_lines.append('SET FOREIGN_KEY_CHECKS = 0;')
    sql_lines.append('TRUNCATE TABLE hoan_tien;')
    sql_lines.append('TRUNCATE TABLE giao_dich;')
    sql_lines.append('-- TRUNCATE TABLE don_hang_km; /* Bỏ comment nếu bảng này tồn tại */')
    sql_lines.append('TRUNCATE TABLE chi_tiet_don_hang;')
    sql_lines.append('TRUNCATE TABLE don_hang;')
    sql_lines.append('TRUNCATE TABLE ton_kho;')
    sql_lines.append('TRUNCATE TABLE dia_chi;')
    sql_lines.append("DELETE FROM tai_khoan WHERE vai_tro = 'khach_hang' AND ten_dang_nhap LIKE 'khach%';")
    sql_lines.append('SET FOREIGN_KEY_CHECKS = 1;\n')

    # Dữ liệu hằng số
    danh_sach_ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ']
    dem_nam = ['Văn', 'Hữu', 'Công', 'Quang', 'Minh', 'Đức', 'Xuân', 'Đình', 'Thành', 'Thái', 'Trọng', 'Đức', 'Hải', 'Phong', 'Hùng', 'Cường', 'Long', 'Sơn', 'Tuấn']
    ten_nam = ['Nam', 'Hải', 'Phong', 'Hùng', 'Cường', 'Long', 'Sơn', 'Tuấn']
    dem_nu = ['Thị', 'Ngọc', 'Hoài', 'Thu', 'Phương', 'Thanh', 'Bích', 'Diễm']
    ten_nu = ['Thương', 'Lan', 'Hoa', 'Mai', 'Hương', 'Linh', 'Nga', 'Trang','Lê','Tú','My','Vy','Anh','Thảo','Hà']
    cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ']
    phone_prefixes = ['090', '091', '093', '094', '096', '097', '098']

    generated_phones = set()
    def get_unique_phone():
        while True:
            phone = random.choice(phone_prefixes) + str(random.randint(1000000, 9999999))
            if phone not in generated_phones:
                generated_phones.add(phone)
                return phone

    def generate_vn_name():
        gioi_tinh = random.choice(['Nam', 'Nữ'])
        ho = random.choice(danh_sach_ho)
        if gioi_tinh == 'Nam':
            return f'{ho} {random.choice(dem_nam)} {random.choice(ten_nam)}', gioi_tinh
        return f'{ho} {random.choice(dem_nu)} {random.choice(ten_nu)}', gioi_tinh

    # 2. TÀI KHOẢN & ĐỊA CHỈ
    start_date = datetime(2026, 1, 1, 8, 0, 0)
    end_date = datetime(2026, 6, 2, 22, 0, 0)
    delta_days = (end_date - start_date).days

    num_customers = 150
    tai_khoan_values = []
    dia_chi_values = []
    
    # Tracking ID cho khóa ngoại
    tk_id_counter = 1000 
    addr_id_counter = 1
    default_address_by_customer = {}

    for i in range(num_customers):
        tk_id = tk_id_counter + i
        ten_dang_nhap = f'khach{i+1:03d}'
        email = f'khach{i+1:03d}@example.com'
        phone = get_unique_phone()
        ho_ten, gioi_tinh = generate_vn_name()
        is_active = 1 if random.random() < 0.9 else 0
        created_at = (start_date + timedelta(days=random.randint(0, delta_days))).strftime('%Y-%m-%d %H:%M:%S')

        tai_khoan_values.append(f"({tk_id}, {sql_str(ten_dang_nhap)}, MD5('Khach@123'), {sql_str(ho_ten)}, {sql_str(email)}, {sql_str(phone)}, 'khach_hang', {is_active}, {sql_str(created_at)}, {sql_str(gioi_tinh)})")

        num_addresses = random.choices([1, 2], weights=[70, 30])[0]
        for addr_idx in range(num_addresses):
            ten_nguoi_nhan, _ = generate_vn_name()
            so_dien_thoai = get_unique_phone()
            dia_chi_cu_the = f'{fake.street_address()}, {random.choice(cities)}'
            is_default = 1 if addr_idx == 0 else 0
            
            if is_default == 1:
                default_address_by_customer[tk_id] = addr_id_counter
                
            dia_chi_values.append(f"({addr_id_counter}, {tk_id}, {sql_str(ten_nguoi_nhan)}, {sql_str(so_dien_thoai)}, {sql_str(dia_chi_cu_the)}, {is_default})")
            addr_id_counter += 1

    # 3. TỒN KHO
    ton_kho_values = []
    shuffled_pids = [p['id'] for p in products]
    random.shuffle(shuffled_pids)
    
    out_of_stock = set(shuffled_pids[:5])
    low_stock = set(shuffled_pids[5:13])
    high_stock = set(shuffled_pids[13:23])

    for p in products:
        p_id = p['id']
        if p_id in out_of_stock:
            sl = 0
        elif p_id in low_stock:
            sl = random.randint(1, 10)
        elif p_id in high_stock:
            sl = random.randint(200, 400)
        else:
            sl = random.randint(20, 180)
        ton_kho_values.append(f"({p_id}, {sl})")

    # 4. ĐƠN HÀNG & CHI TIẾT
    total_orders = 1000
    customers = list(range(tk_id_counter, tk_id_counter + num_customers))
    order_assignments = customers[:90]
    for cus in customers[90:128]:
        order_assignments.extend([cus] * random.randint(2, 3))
    remaining = total_orders - len(order_assignments)
    order_assignments.extend([random.choice(customers[128:]) for _ in range(remaining)])
    random.shuffle(order_assignments)

    order_dates = sorted([start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds()))) for _ in range(total_orders)])

    product_weights = []
    for i, p in enumerate(products):
        if i < 15:
            product_weights.append(8)
        elif i >= len(products) - 10:
            product_weights.append(1)
        else:
            product_weights.append(3)

    vouchers = [{'id': 1, 'loai': 'percent', 'gia_tri': 10, 'min_order': 0}, {'id': 2, 'loai': 'fixed', 'gia_tri': 50000, 'min_order': 200000}]

    don_hang_values = []
    chi_tiet_values = []
    orders_metadata = []
    order_counter = 1000

    for i in range(total_orders):
        cus_id = order_assignments[i]
        ma_dia_chi = default_address_by_customer.get(cus_id, 1) # Fallback an toàn
        ngay_dat = order_dates[i]
        
        num_items = random.choices([random.randint(1, 2), random.randint(3, 5)], weights=[70, 30])[0]
        selected_products = []
        available_pids = list(range(len(products)))
        current_weights = list(product_weights)
        
        for _ in range(min(num_items, len(available_pids))):
            idx = random.choices(range(len(available_pids)), weights=current_weights)[0]
            selected_products.append(products[available_pids[idx]])
            available_pids.pop(idx)
            current_weights.pop(idx)
            
        tong_tam_tinh = 0
        for sp in selected_products:
            so_luong = random.randint(1, 4)
            thanh_tien = int(sp['gia']) * so_luong
            tong_tam_tinh += thanh_tien
            chi_tiet_values.append(f"({order_counter}, {sp['id']}, {sql_str(sp['ten_sp'])}, {sql_str(sp['thuong_hieu'])}, NULL, {so_luong}, {sp['gia']}, {thanh_tien})")
            
        phi_van_chuyen = 0 if tong_tam_tinh >= 500000 else 30000
        giam_gia = 0
        ma_khuyen_mai = 'NULL'
        
        if random.random() < 0.3:
            voucher = random.choice(vouchers)
            if tong_tam_tinh >= voucher['min_order']:
                ma_khuyen_mai = voucher['id']
                if voucher['loai'] == 'fixed':
                    giam_gia = min(voucher['gia_tri'], tong_tam_tinh)
                else:
                    giam_gia = int(tong_tam_tinh * voucher['gia_tri'] / 100)
                    
        tong_tien = tong_tam_tinh + phi_van_chuyen - giam_gia
        trang_thai = random.choices(['da_giao', 'dang_giao', 'dang_chuan_bi', 'cho_xac_nhan', 'da_huy'], weights=[65, 10, 10, 10, 5])[0]
        phuong_thuc = random.choices(['cod', 'banking', 'momo'], weights=[50, 30, 20])[0]
        
        dh_val = f"({order_counter}, {cus_id}, {ma_dia_chi}, {sql_str(f'LACTT-{order_counter:06d}')}, {sql_str(f'Khách hàng {cus_id}')}, '0900000000', {sql_str('Địa chỉ giả lập')}, {tong_tam_tinh}, {phi_van_chuyen}, {giam_gia}, {tong_tien}, {sql_str(phuong_thuc)}, {ma_khuyen_mai}, {sql_str(trang_thai)}, {sql_str(ngay_dat.strftime('%Y-%m-%d %H:%M:%S'))})"
        don_hang_values.append(dh_val)
        
        orders_metadata.append({
            'id': order_counter,
            'tong_tien': tong_tien,
            'phuong_thuc_tt': phuong_thuc,
            'trang_thai': trang_thai,
            'ngay_dat': ngay_dat
        })
        order_counter += 1

    # 5. GIAO DỊCH & HOÀN TIỀN
    giao_dich_values = []
    hoan_tien_values = []
    gd_id_counter = 1000
    ly_do_hoan = ['Khách hủy đơn sau thanh toán', 'Sản phẩm bị lỗi', 'Giao hàng thất bại', 'Giao sai sản phẩm', 'Khách trả hàng']

    for order in orders_metadata:
        dh_trang_thai = order['trang_thai']
        phuong_thuc = order['phuong_thuc_tt']
        tong_tien = order['tong_tien']
        ngay_dat = order['ngay_dat']
        
        if dh_trang_thai == 'da_giao':
            gd_trang_thai = random.choices(['da_thanh_toan', 'hoan_tien'], weights=[95, 5])[0]
        elif dh_trang_thai == 'da_huy':
            if phuong_thuc == 'cod':
                gd_trang_thai = random.choice(['chua_thanh_toan', 'that_bai'])
            else:
                gd_trang_thai = random.choices(['hoan_tien', 'chua_thanh_toan'], weights=[80, 20])[0]
        elif dh_trang_thai in ['cho_xac_nhan', 'dang_chuan_bi']:
            if phuong_thuc == 'cod':
                gd_trang_thai = 'chua_thanh_toan'
            else:
                gd_trang_thai = random.choices(['da_thanh_toan', 'chua_thanh_toan', 'that_bai'], weights=[70, 25, 5])[0]
        elif dh_trang_thai == 'dang_giao':
            gd_trang_thai = 'chua_thanh_toan' if phuong_thuc == 'cod' else 'da_thanh_toan'
        else:
            gd_trang_thai = 'chua_thanh_toan'

        thoi_gian_gd = ngay_dat + timedelta(minutes=random.randint(5, 120))
        date_str = ngay_dat.strftime('%Y%m%d')
        trang_thai_doi_soat = 'CHO_XU_LY' if phuong_thuc == 'cod' else random.choices(['KHOP', 'SAI_LECH', 'CHO_XU_LY'], weights=[85, 5, 10])[0]
        
        giao_dich_values.append(f"({gd_id_counter}, {order['id']}, {sql_str(f'TXN{date_str}{gd_id_counter:04d}')}, {sql_str(f'GD{date_str}{gd_id_counter:04d}')}, {tong_tien}, {sql_str(phuong_thuc)}, {sql_str(gd_trang_thai)}, {sql_str(trang_thai_doi_soat)}, {sql_str(thoi_gian_gd.strftime('%Y-%m-%d %H:%M:%S'))})")
        
        if gd_trang_thai == 'hoan_tien':
            ti_le = random.choice([1.0, 0.5])
            so_tien_hoan = int(float(tong_tien) * ti_le)
            thoi_gian_hoan = thoi_gian_gd + timedelta(days=random.randint(1, 5))
            hoan_tien_values.append(f"({gd_id_counter}, {so_tien_hoan}, {sql_str(random.choice(ly_do_hoan))}, {sql_str(thoi_gian_hoan.strftime('%Y-%m-%d %H:%M:%S'))})")
            
        gd_id_counter += 1

    # Chunk list helper
    def chunk_list(data, size=100):
        return [data[i:i + size] for i in range(0, len(data), size)]

    # Xuất SQL
    sql_lines.append('/* --- INSERT DỮ LIỆU --- */')
    for chunk in chunk_list(tai_khoan_values):
        sql_lines.append("INSERT INTO tai_khoan (id, ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, vai_tro, is_active, created_at, gioi_tinh) VALUES\n" + ",\n".join(chunk) + ";")
    
    for chunk in chunk_list(dia_chi_values):
        sql_lines.append("INSERT INTO dia_chi (id, ma_nguoi_dung, ten_nguoi_nhan, so_dien_thoai, dia_chi_cu_the, is_default) VALUES\n" + ",\n".join(chunk) + ";")
        
    for chunk in chunk_list(ton_kho_values):
        sql_lines.append("INSERT INTO ton_kho (ma_san_pham, so_luong) VALUES\n" + ",\n".join(chunk) + ";")

    for chunk in chunk_list(don_hang_values):
        sql_lines.append("INSERT INTO don_hang (id, ma_nguoi_dung, ma_dia_chi, ma_don_hang, ten_nguoi_nhan, so_dien_thoai, dia_chi_giao, tong_tam_tinh, phi_van_chuyen, giam_gia, tong_tien, phuong_thuc_tt, ma_khuyen_mai, trang_thai, ngay_dat) VALUES\n" + ",\n".join(chunk) + ";")

    for chunk in chunk_list(chi_tiet_values):
        sql_lines.append('INSERT INTO chi_tiet_don_hang (ma_don_hang, ma_san_pham, ten_san_pham, thuong_hieu, ten_variant, so_luong, gia, thanh_tien) VALUES\n' + ',\n'.join(chunk) + ';')
    for chunk in chunk_list(giao_dich_values):
        sql_lines.append("INSERT INTO giao_dich (id, ma_don_hang, ma_giao_dich, ma_tham_chieu, so_tien, phuong_thuc, trang_thai, trang_thai_doi_soat, thoi_gian) VALUES\n" + ",\n".join(chunk) + ";")

    for chunk in chunk_list(hoan_tien_values):
        sql_lines.append("INSERT INTO hoan_tien (ma_giao_dich, so_tien, ly_do, thoi_gian) VALUES\n" + ",\n".join(chunk) + ";")

    # 6. SQL UPDATE TỔNG HỢP CUỐI FILE
    sql_lines.append('\n/* --- UPDATE TỔNG HỢP SỐ LIỆU --- */')
    sql_lines.append("""
UPDATE san_pham sp
LEFT JOIN (
    SELECT ctdh.ma_san_pham, SUM(ctdh.so_luong) AS total_sold
    FROM chi_tiet_don_hang ctdh
    JOIN don_hang dh ON ctdh.ma_don_hang = dh.id
    WHERE dh.trang_thai = 'da_giao'
    GROUP BY ctdh.ma_san_pham
) x ON sp.id = x.ma_san_pham
SET sp.so_luong_ban = COALESCE(x.total_sold, 0);
""")
    sql_lines.append("""
UPDATE san_pham sp
JOIN ton_kho tk ON sp.id = tk.ma_san_pham
SET sp.so_luong_ton = tk.so_luong;
""")

    file_name = 'master_data.sql'
    with open(file_name, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    # In báo cáo
    print('\n================ THỐNG KÊ DỮ LIỆU FAKE ================')
    print(f'- Số khách hàng đã tạo       : {len(tai_khoan_values)}')
    print(f'- Số địa chỉ đã tạo          : {len(dia_chi_values)}')
    print(f'- Số voucher đã sử dụng      : 2')
    print(f'- Số đơn hàng đã tạo         : {len(don_hang_values)}')
    print(f'- Số dòng chi tiết đơn hàng  : {len(chi_tiet_values)}')
    print(f'- Số giao dịch               : {len(giao_dich_values)}')
    print(f'- Số lệnh hoàn tiền          : {len(hoan_tien_values)}')
    print(f'- Số dòng tồn kho            : {len(ton_kho_values)}')
    print(f'-> Đã xuất thành công ra file: {file_name}')
    print('=======================================================')

if __name__ == '__main__':
    generate_pipeline_data()