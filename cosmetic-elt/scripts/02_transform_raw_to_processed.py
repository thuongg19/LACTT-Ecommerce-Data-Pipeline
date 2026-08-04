from pathlib import Path

import pandas as pd


def get_project_root() -> Path:
    """
    File hiện tại nằm trong: cosmetic-elt/scripts/
    parents[1] trỏ về: cosmetic-elt/
    """
    return Path(__file__).resolve().parents[1]


def get_paths():
    project_root = get_project_root()
    raw_path = project_root / "data_lake" / "raw"
    processed_path = project_root / "data_lake" / "processed"

    processed_path.mkdir(parents=True, exist_ok=True)

    return raw_path, processed_path


def read_raw(raw_path: Path, file_name: str) -> pd.DataFrame:
    file_path = raw_path / file_name

    if not file_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file raw: {file_path}")

    return pd.read_parquet(file_path)


def save_processed(df: pd.DataFrame, processed_path: Path, file_name: str):
    output_file = processed_path / file_name
    df.to_parquet(output_file, index=False, engine="pyarrow")

    print(
        f"Đã lưu: {output_file.name} | "
        f"Số dòng: {len(df)} | "
        f"Số cột: {len(df.columns)}"
    )


def normalize_text_series(series: pd.Series) -> pd.Series:
    """
    Chuẩn hóa text cơ bản: ép string, strip khoảng trắng.
    Không lower toàn bộ vì dữ liệu tiếng Việt/tên riêng cần giữ chữ hoa.
    """
    return series.astype("string").str.strip()


def transform_customers(raw_path: Path, processed_path: Path):
    df = read_raw(raw_path, "tai_khoan.parquet")

    # Lọc khách hàng
    if "vai_tro" in df.columns:
        df = df[df["vai_tro"] == "khach_hang"].copy()

    # Các cột muốn giữ, cột nào có thì giữ
    wanted_cols = [
        "id",
        "ten_dang_nhap",
        "ho_ten",
        "email",
        "so_dien_thoai",
        "vai_tro",
        "is_active",
        "created_at",
        "gioi_tinh",
    ]
    existing_cols = [col for col in wanted_cols if col in df.columns]
    df = df[existing_cols].copy()

    # Đổi tên cột sang dạng dễ dùng cho mart/Power BI
    rename_map = {
        "id": "customer_id",
        "ten_dang_nhap": "username",
        "ho_ten": "customer_name",
        "so_dien_thoai": "phone",
        "vai_tro": "role",
        "gioi_tinh": "gender",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    # Chuẩn hóa kiểu dữ liệu
    if "customer_id" in df.columns:
        df["customer_id"] = pd.to_numeric(df["customer_id"], errors="coerce").astype("Int64")

    for col in ["username", "customer_name", "email", "phone", "role", "gender"]:
        if col in df.columns:
            df[col] = normalize_text_series(df[col])

    if "is_active" in df.columns:
        df["is_active"] = pd.to_numeric(df["is_active"], errors="coerce").fillna(0).astype(int)

    if "created_at" in df.columns:
        df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")

    # Loại dòng thiếu customer_id
    if "customer_id" in df.columns:
        df = df[df["customer_id"].notna()].copy()

    save_processed(df, processed_path, "customers_clean.parquet")


def transform_categories(raw_path: Path, processed_path: Path):
    df = read_raw(raw_path, "danh_muc.parquet")

    wanted_cols = ["id", "ten_danh_muc", "ten"]
    existing_cols = [col for col in wanted_cols if col in df.columns]
    df = df[existing_cols].copy()

    rename_map = {
        "id": "category_id",
        "ten_danh_muc": "category_name",
        "ten": "category_name",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    if "category_id" in df.columns:
        df["category_id"] = pd.to_numeric(df["category_id"], errors="coerce").astype("Int64")

    if "category_name" in df.columns:
        df["category_name"] = normalize_text_series(df["category_name"])

    if "category_id" in df.columns:
        df = df[df["category_id"].notna()].drop_duplicates(subset=["category_id"])

    save_processed(df, processed_path, "categories_clean.parquet")


def transform_products(raw_path: Path, processed_path: Path):
    products = read_raw(raw_path, "san_pham.parquet")
    categories = read_raw(raw_path, "danh_muc.parquet")

    products = products.copy()
    categories = categories.copy()

    # Đổi tên cột sản phẩm theo schema thường gặp
    product_rename = {
        "id": "product_id",
        "ten_sp": "product_name",
        "thuong_hieu": "brand",
        "ma_danh_muc": "category_id",
        "gia": "price",
        "gia_goc": "original_price",
        "so_luong_ban": "sold_quantity",
        "so_luong_ton": "stock_quantity_in_product",
        "is_active": "is_active",
        "created_at": "created_at",
    }
    products = products.rename(columns={k: v for k, v in product_rename.items() if k in products.columns})

    # Đổi tên cột danh mục
    category_rename = {
        "id": "category_id",
        "ten_danh_muc": "category_name",
        "ten": "category_name",
    }
    categories = categories.rename(columns={k: v for k, v in category_rename.items() if k in categories.columns})

    # Chọn cột sản phẩm cần giữ
    wanted_product_cols = [
        "product_id",
        "product_name",
        "brand",
        "category_id",
        "price",
        "original_price",
        "sold_quantity",
        "stock_quantity_in_product",
        "is_active",
        "created_at",
    ]
    products = products[[col for col in wanted_product_cols if col in products.columns]].copy()

    # Chuẩn hóa kiểu dữ liệu
    for col in ["product_id", "category_id", "sold_quantity", "stock_quantity_in_product", "is_active"]:
        if col in products.columns:
            products[col] = pd.to_numeric(products[col], errors="coerce").astype("Int64")

    for col in ["price", "original_price"]:
        if col in products.columns:
            products[col] = pd.to_numeric(products[col], errors="coerce").fillna(0)

    for col in ["product_name", "brand"]:
        if col in products.columns:
            products[col] = normalize_text_series(products[col])

    if "created_at" in products.columns:
        products["created_at"] = pd.to_datetime(products["created_at"], errors="coerce")

    # Join danh mục để có category_name
    if "category_id" in products.columns and "category_id" in categories.columns:
        categories["category_id"] = pd.to_numeric(categories["category_id"], errors="coerce").astype("Int64")

        if "category_name" in categories.columns:
            categories["category_name"] = normalize_text_series(categories["category_name"])

        categories = categories[["category_id", "category_name"]].drop_duplicates("category_id")
        products = products.merge(categories, on="category_id", how="left")

    # Loại sản phẩm thiếu id
    if "product_id" in products.columns:
        products = products[products["product_id"].notna()].drop_duplicates(subset=["product_id"])

    # Không cho giá âm
    if "price" in products.columns:
        products = products[products["price"] >= 0].copy()

    save_processed(products, processed_path, "products_clean.parquet")


def transform_orders(raw_path: Path, processed_path: Path):
    df = read_raw(raw_path, "don_hang.parquet")
    df = df.copy()

    rename_map = {
        "id": "order_id",
        "ma_nguoi_dung": "customer_id",
        "ma_dia_chi": "address_id",
        "ma_don_hang": "order_code",
        "tong_tam_tinh": "subtotal",
        "phi_van_chuyen": "shipping_fee",
        "giam_gia": "discount_amount",
        "tong_tien": "order_total",
        "phuong_thuc_tt": "payment_method",
        "ma_khuyen_mai": "promotion_id",
        "trang_thai": "order_status",
        "ngay_dat": "order_date",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    wanted_cols = [
        "order_id",
        "customer_id",
        "address_id",
        "order_code",
        "subtotal",
        "shipping_fee",
        "discount_amount",
        "order_total",
        "payment_method",
        "promotion_id",
        "order_status",
        "order_date",
    ]
    df = df[[col for col in wanted_cols if col in df.columns]].copy()

    for col in ["order_id", "customer_id", "address_id", "promotion_id"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    for col in ["subtotal", "shipping_fee", "discount_amount", "order_total"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    for col in ["order_code", "payment_method", "order_status"]:
        if col in df.columns:
            df[col] = normalize_text_series(df[col])

    if "order_date" in df.columns:
        df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")

    # Chuẩn hóa trạng thái đơn hàng theo nhóm hợp lệ
    valid_statuses = ["da_giao", "dang_giao", "dang_chuan_bi", "cho_xac_nhan", "da_huy"]
    if "order_status" in df.columns:
        df["order_status"] = df["order_status"].fillna("khong_xac_dinh")
        df.loc[~df["order_status"].isin(valid_statuses), "order_status"] = "khong_xac_dinh"

    # Chuẩn hóa phương thức thanh toán
    valid_methods = ["cod", "banking", "momo"]
    if "payment_method" in df.columns:
        df["payment_method"] = df["payment_method"].fillna("khong_xac_dinh")
        df.loc[~df["payment_method"].isin(valid_methods), "payment_method"] = "khong_xac_dinh"

    # Kiểm tra tiền không âm
    if "order_total" in df.columns:
        before = len(df)
        df = df[df["order_total"] >= 0].copy()
        removed = before - len(df)
        if removed > 0:
            print(f"Cảnh báo: Đã loại {removed} đơn hàng có order_total âm.")

    # Loại dòng thiếu order_id
    if "order_id" in df.columns:
        df = df[df["order_id"].notna()].drop_duplicates(subset=["order_id"])

    save_processed(df, processed_path, "orders_clean.parquet")


def transform_order_items(raw_path: Path, processed_path: Path):
    df = read_raw(raw_path, "chi_tiet_don_hang.parquet")
    df = df.copy()

    rename_map = {
        "id": "order_item_id",
        "ma_don_hang": "order_id",
        "ma_san_pham": "product_id",
        "ten_san_pham": "product_name_snapshot",
        "thuong_hieu": "brand_snapshot",
        "ten_variant": "variant_name",
        "so_luong": "quantity",
        "gia": "unit_price",
        "thanh_tien": "line_amount",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    wanted_cols = [
        "order_item_id",
        "order_id",
        "product_id",
        "product_name_snapshot",
        "brand_snapshot",
        "variant_name",
        "quantity",
        "unit_price",
        "line_amount",
    ]
    df = df[[col for col in wanted_cols if col in df.columns]].copy()

    for col in ["order_item_id", "order_id", "product_id", "quantity"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    for col in ["unit_price", "line_amount"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    for col in ["product_name_snapshot", "brand_snapshot", "variant_name"]:
        if col in df.columns:
            df[col] = normalize_text_series(df[col])

    # Loại dòng không hợp lệ
    before = len(df)

    if "order_id" in df.columns:
        df = df[df["order_id"].notna()].copy()

    if "product_id" in df.columns:
        df = df[df["product_id"].notna()].copy()

    if "quantity" in df.columns:
        df = df[df["quantity"] > 0].copy()

    if "unit_price" in df.columns:
        df = df[df["unit_price"] >= 0].copy()

    if "line_amount" in df.columns:
        df = df[df["line_amount"] >= 0].copy()

    removed = before - len(df)
    if removed > 0:
        print(f"Cảnh báo: Đã loại {removed} dòng chi tiết đơn hàng không hợp lệ.")

    # Kiểm tra line_amount lệch so với quantity * unit_price
    if {"quantity", "unit_price", "line_amount"}.issubset(df.columns):
        expected = df["quantity"].astype(float) * df["unit_price"].astype(float)
        diff = (df["line_amount"].astype(float) - expected).abs()

        mismatch_count = (diff > 1).sum()
        if mismatch_count > 0:
            print(
                f"Cảnh báo: Có {mismatch_count} dòng line_amount lệch so với quantity * unit_price. "
                "Đã chuẩn hóa lại line_amount."
            )
            df["line_amount"] = expected

    save_processed(df, processed_path, "order_items_clean.parquet")


def transform_payments(raw_path: Path, processed_path: Path):
    df = read_raw(raw_path, "giao_dich.parquet")
    df = df.copy()

    rename_map = {
        "id": "payment_id",
        "ma_don_hang": "order_id",
        "ma_giao_dich": "transaction_code",
        "ma_tham_chieu": "reference_code",
        "so_tien": "payment_amount",
        "phuong_thuc": "payment_method",
        "trang_thai": "payment_status",
        "trang_thai_doi_soat": "reconciliation_status",
        "thoi_gian": "payment_time",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    wanted_cols = [
        "payment_id",
        "order_id",
        "transaction_code",
        "reference_code",
        "payment_amount",
        "payment_method",
        "payment_status",
        "reconciliation_status",
        "payment_time",
    ]
    df = df[[col for col in wanted_cols if col in df.columns]].copy()

    for col in ["payment_id", "order_id"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    if "payment_amount" in df.columns:
        df["payment_amount"] = pd.to_numeric(df["payment_amount"], errors="coerce").fillna(0)

    for col in ["transaction_code", "reference_code", "payment_method", "payment_status", "reconciliation_status"]:
        if col in df.columns:
            df[col] = normalize_text_series(df[col])

    if "payment_time" in df.columns:
        df["payment_time"] = pd.to_datetime(df["payment_time"], errors="coerce")

    valid_methods = ["cod", "banking", "momo"]
    if "payment_method" in df.columns:
        df["payment_method"] = df["payment_method"].fillna("khong_xac_dinh")
        df.loc[~df["payment_method"].isin(valid_methods), "payment_method"] = "khong_xac_dinh"

    valid_statuses = ["da_thanh_toan", "chua_thanh_toan", "that_bai", "hoan_tien"]
    if "payment_status" in df.columns:
        df["payment_status"] = df["payment_status"].fillna("khong_xac_dinh")
        df.loc[~df["payment_status"].isin(valid_statuses), "payment_status"] = "khong_xac_dinh"

    if "payment_amount" in df.columns:
        df = df[df["payment_amount"] >= 0].copy()

    if "payment_id" in df.columns:
        df = df[df["payment_id"].notna()].drop_duplicates(subset=["payment_id"])

    save_processed(df, processed_path, "payments_clean.parquet")


def transform_refunds(raw_path: Path, processed_path: Path):
    df = read_raw(raw_path, "hoan_tien.parquet")
    df = df.copy()

    rename_map = {
        "id": "refund_id",
        "ma_giao_dich": "payment_id",
        "so_tien": "refund_amount",
        "ly_do": "refund_reason",
        "thoi_gian": "refund_time",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

    wanted_cols = [
        "refund_id",
        "payment_id",
        "refund_amount",
        "refund_reason",
        "refund_time",
    ]
    df = df[[col for col in wanted_cols if col in df.columns]].copy()

    for col in ["refund_id", "payment_id"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    if "refund_amount" in df.columns:
        df["refund_amount"] = pd.to_numeric(df["refund_amount"], errors="coerce").fillna(0)
        df = df[df["refund_amount"] >= 0].copy()

    if "refund_reason" in df.columns:
        df["refund_reason"] = normalize_text_series(df["refund_reason"])

    if "refund_time" in df.columns:
        df["refund_time"] = pd.to_datetime(df["refund_time"], errors="coerce")

    if "refund_id" in df.columns:
        df = df[df["refund_id"].notna()].drop_duplicates(subset=["refund_id"])

    save_processed(df, processed_path, "refunds_clean.parquet")


def transform_inventory(raw_path: Path, processed_path: Path):
    inventory = read_raw(raw_path, "ton_kho.parquet")
    products = read_raw(raw_path, "san_pham.parquet")
    categories = read_raw(raw_path, "danh_muc.parquet")

    inventory = inventory.copy()
    products = products.copy()
    categories = categories.copy()

    inventory_rename = {
        "id": "inventory_id",
        "ma_san_pham": "product_id",
        "so_luong": "stock_quantity",
        "updated_at": "updated_at",
    }
    inventory = inventory.rename(columns={k: v for k, v in inventory_rename.items() if k in inventory.columns})

    product_rename = {
        "id": "product_id",
        "ten_san_pham": "product_name",
        "thuong_hieu": "brand",
        "ma_danh_muc": "category_id",
        "gia": "price",
    }
    products = products.rename(columns={k: v for k, v in product_rename.items() if k in products.columns})

    category_rename = {
        "id": "category_id",
        "ten_danh_muc": "category_name",
        "ten": "category_name",
    }
    categories = categories.rename(columns={k: v for k, v in category_rename.items() if k in categories.columns})

    for col in ["inventory_id", "product_id", "stock_quantity"]:
        if col in inventory.columns:
            inventory[col] = pd.to_numeric(inventory[col], errors="coerce").astype("Int64")

    if "updated_at" in inventory.columns:
        inventory["updated_at"] = pd.to_datetime(inventory["updated_at"], errors="coerce")

    for col in ["product_id", "category_id"]:
        if col in products.columns:
            products[col] = pd.to_numeric(products[col], errors="coerce").astype("Int64")

    if "price" in products.columns:
        products["price"] = pd.to_numeric(products["price"], errors="coerce").fillna(0)

    for col in ["product_name", "brand"]:
        if col in products.columns:
            products[col] = normalize_text_series(products[col])

    if "category_id" in categories.columns:
        categories["category_id"] = pd.to_numeric(categories["category_id"], errors="coerce").astype("Int64")

    if "category_name" in categories.columns:
        categories["category_name"] = normalize_text_series(categories["category_name"])

    product_cols = [col for col in ["product_id", "product_name", "brand", "category_id", "price"] if col in products.columns]
    products = products[product_cols].drop_duplicates("product_id")

    if "category_id" in products.columns and "category_id" in categories.columns:
        categories = categories[["category_id", "category_name"]].drop_duplicates("category_id")
        products = products.merge(categories, on="category_id", how="left")

    inventory = inventory.merge(products, on="product_id", how="left")

    # Tính giá trị tồn kho
    if {"stock_quantity", "price"}.issubset(inventory.columns):
        inventory["stock_value"] = inventory["stock_quantity"].fillna(0).astype(float) * inventory["price"].fillna(0).astype(float)

    # Phân loại tồn kho
    if "stock_quantity" in inventory.columns:
        def classify_stock(qty):
            if pd.isna(qty):
                return "khong_xac_dinh"
            if qty == 0:
                return "het_hang"
            if 1 <= qty <= 10:
                return "sap_het_hang"
            if qty >= 200:
                return "ton_cao"
            return "binh_thuong"

        inventory["stock_status"] = inventory["stock_quantity"].apply(classify_stock)

    # Loại dòng thiếu product_id
    if "product_id" in inventory.columns:
        inventory = inventory[inventory["product_id"].notna()].drop_duplicates(subset=["product_id"])

    save_processed(inventory, processed_path, "inventory_clean.parquet")


def main():
    print("========== BẮT ĐẦU TRANSFORM RAW → PROCESSED ==========")

    raw_path, processed_path = get_paths()

    transform_customers(raw_path, processed_path)
    transform_categories(raw_path, processed_path)
    transform_products(raw_path, processed_path)
    transform_orders(raw_path, processed_path)
    transform_order_items(raw_path, processed_path)
    transform_payments(raw_path, processed_path)
    transform_refunds(raw_path, processed_path)
    transform_inventory(raw_path, processed_path)

    print("========== HOÀN THÀNH TRANSFORM PROCESSED ==========")
    print(f"Processed layer path: {processed_path}")


if __name__ == "__main__":
    main()