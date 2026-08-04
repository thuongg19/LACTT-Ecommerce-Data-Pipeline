from pathlib import Path

import duckdb
import pandas as pd


def get_project_root() -> Path:
    """
    File hiện tại nằm trong: cosmetic-elt/scripts/
    parents[1] trỏ về: cosmetic-elt/
    """
    return Path(__file__).resolve().parents[1]


def get_paths():
    project_root = get_project_root()

    processed_path = project_root / "data_lake" / "processed"
    mart_path = project_root / "data_lake" / "mart"
    output_powerbi_path = project_root / "output_powerbi"

    mart_path.mkdir(parents=True, exist_ok=True)
    output_powerbi_path.mkdir(parents=True, exist_ok=True)

    return processed_path, mart_path, output_powerbi_path


def read_processed(processed_path: Path, file_name: str) -> pd.DataFrame:
    file_path = processed_path / file_name

    if not file_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file processed: {file_path}")

    return pd.read_parquet(file_path)


def save_mart_table(df: pd.DataFrame, mart_path: Path, output_powerbi_path: Path, table_name: str):
    """
    Lưu mart ra 2 định dạng:
    1. Parquet trong data_lake/mart
    2. CSV trong output_powerbi để Power BI đọc dễ hơn
    """
    parquet_file = mart_path / f"{table_name}.parquet"
    csv_file = output_powerbi_path / f"{table_name}.csv"

    df.to_parquet(parquet_file, index=False, engine="pyarrow")
    df.to_csv(csv_file, index=False, encoding="utf-8-sig")

    print(
        f"Đã tạo {table_name}: "
        f"{len(df)} dòng, {len(df.columns)} cột | "
        f"Parquet: {parquet_file.name} | CSV: {csv_file.name}"
    )


def build_dim_customer(con) -> pd.DataFrame:
    query = """
    SELECT
        customer_id,
        customer_name,
        email,
        phone,
        is_active,
        created_at
    FROM customers_clean
    WHERE customer_id IS NOT NULL
    """

    return con.execute(query).df()


def build_dim_category(con) -> pd.DataFrame:
    query = """
    SELECT
        category_id,
        category_name
    FROM categories_clean
    WHERE category_id IS NOT NULL
    """

    return con.execute(query).df()


def build_dim_product(con) -> pd.DataFrame:
    query = """
    SELECT
        p.product_id,
        p.product_name,
        p.brand,
        p.category_id,
        COALESCE(p.category_name, c.category_name) AS category_name,
        p.price,
        COALESCE(i.stock_quantity, p.stock_quantity_in_product, 0) AS stock_quantity,
        COALESCE(p.sold_quantity, 0) AS sold_quantity,
        p.is_active,
        p.created_at
    FROM products_clean p
    LEFT JOIN categories_clean c
        ON p.category_id = c.category_id
    LEFT JOIN inventory_clean i
        ON p.product_id = i.product_id
    WHERE p.product_id IS NOT NULL
    """

    return con.execute(query).df()


def build_dim_date(con) -> pd.DataFrame:
    """
    Sinh dim_date từ min/max ngày đơn hàng.
    Nếu dữ liệu đơn hàng rỗng hoặc ngày lỗi thì dùng khoảng mặc định.
    """
    date_range_query = """
    SELECT
        MIN(CAST(order_date AS DATE)) AS min_date,
        MAX(CAST(order_date AS DATE)) AS max_date
    FROM orders_clean
    WHERE order_date IS NOT NULL
    """

    date_range = con.execute(date_range_query).df()

    min_date = date_range.loc[0, "min_date"]
    max_date = date_range.loc[0, "max_date"]

    if pd.isna(min_date) or pd.isna(max_date):
        min_date = pd.to_datetime("2026-01-01").date()
        max_date = pd.to_datetime("2026-12-31").date()

    dates = pd.date_range(start=min_date, end=max_date, freq="D")

    dim_date = pd.DataFrame({
        "date_key": dates.strftime("%Y%m%d").astype(int),
        "full_date": dates.date,
        "day": dates.day,
        "month": dates.month,
        "quarter": dates.quarter,
        "year": dates.year,
        "weekday": dates.day_name(),
        "month_name": dates.month_name(),
    })

    return dim_date


def build_fact_order_status(con) -> pd.DataFrame:
    query = """
    SELECT
        order_id,
        customer_id,
        CAST(STRFTIME(order_date, '%Y%m%d') AS INTEGER) AS date_key,
        order_status,
        subtotal,
        shipping_fee,
        discount_amount,
        order_total,
        payment_method
    FROM orders_clean
    WHERE order_id IS NOT NULL
    """

    return con.execute(query).df()


def build_fact_sales(con) -> pd.DataFrame:
    """
    fact_sales là bảng ở cấp dòng sản phẩm trong đơn hàng.
    Một đơn hàng có nhiều sản phẩm thì sẽ có nhiều dòng trong fact_sales.
    Không dùng fact_sales để COUNT tổng đơn hàng nếu không DISTINCT order_id.
    """
    query = """
    SELECT
        oi.order_item_id,
        o.order_id,
        o.customer_id,
        oi.product_id,
        p.category_id,
        CAST(STRFTIME(o.order_date, '%Y%m%d') AS INTEGER) AS date_key,
        o.order_status,
        oi.quantity,
        oi.unit_price,
        oi.line_amount,
        o.payment_method
    FROM order_items_clean oi
    INNER JOIN orders_clean o
        ON oi.order_id = o.order_id
    LEFT JOIN products_clean p
        ON oi.product_id = p.product_id
    WHERE oi.order_id IS NOT NULL
      AND oi.product_id IS NOT NULL
      AND oi.quantity > 0
      AND oi.line_amount >= 0
    """

    return con.execute(query).df()


def build_fact_payment(con) -> pd.DataFrame:
    query = """
    SELECT
        payment_id,
        order_id,
        CAST(STRFTIME(payment_time, '%Y%m%d') AS INTEGER) AS date_key,
        payment_amount,
        payment_method,
        payment_status,
        reconciliation_status,
        payment_time
    FROM payments_clean
    WHERE payment_id IS NOT NULL
    """

    return con.execute(query).df()


def build_fact_refund(con) -> pd.DataFrame:
    query = """
    SELECT
        r.refund_id,
        r.payment_id,
        p.order_id,
        CAST(STRFTIME(r.refund_time, '%Y%m%d') AS INTEGER) AS date_key,
        r.refund_amount,
        r.refund_reason,
        r.refund_time
    FROM refunds_clean r
    LEFT JOIN payments_clean p
        ON r.payment_id = p.payment_id
    WHERE r.refund_id IS NOT NULL
    """

    return con.execute(query).df()


def build_fact_inventory(con) -> pd.DataFrame:
    query = """
    SELECT
        product_id,
        category_id,
        stock_quantity,
        price,
        stock_value,
        stock_status
    FROM inventory_clean
    WHERE product_id IS NOT NULL
    """

    return con.execute(query).df()


def validate_mart_tables(tables: dict):
    """
    Kiểm tra nhanh dữ liệu mart.
    """
    print("\n========== KIỂM TRA NHANH MART ==========")

    fact_order_status = tables["fact_order_status"]
    fact_sales = tables["fact_sales"]
    fact_inventory = tables["fact_inventory"]

    print(f"Tổng số đơn trong fact_order_status: {fact_order_status['order_id'].nunique()}")
    print(f"Tổng số dòng bán hàng trong fact_sales: {len(fact_sales)}")
    print(f"Tổng số sản phẩm tồn kho trong fact_inventory: {len(fact_inventory)}")

    if "order_status" in fact_order_status.columns:
        print("\nPhân bổ trạng thái đơn:")
        print(fact_order_status["order_status"].value_counts())

    if "stock_status" in fact_inventory.columns:
        print("\nPhân bổ trạng thái tồn kho:")
        print(fact_inventory["stock_status"].value_counts())

    delivered_revenue = fact_order_status.loc[
        fact_order_status["order_status"] == "da_giao",
        "order_total"
    ].sum()

    print(f"\nDoanh thu đơn đã giao: {delivered_revenue:,.0f}")

    delivered_orders = fact_order_status.loc[
        fact_order_status["order_status"] == "da_giao",
        "order_id"
    ].nunique()

    if delivered_orders > 0:
        aov = delivered_revenue / delivered_orders
        print(f"AOV theo đơn đã giao: {aov:,.0f}")

    print("=========================================\n")


def main():
    print("========== BẮT ĐẦU TẠO MART BẰNG DUCKDB ==========")

    processed_path, mart_path, output_powerbi_path = get_paths()

    # Đọc processed data
    customers_clean = read_processed(processed_path, "customers_clean.parquet")
    categories_clean = read_processed(processed_path, "categories_clean.parquet")
    products_clean = read_processed(processed_path, "products_clean.parquet")
    orders_clean = read_processed(processed_path, "orders_clean.parquet")
    order_items_clean = read_processed(processed_path, "order_items_clean.parquet")
    payments_clean = read_processed(processed_path, "payments_clean.parquet")
    refunds_clean = read_processed(processed_path, "refunds_clean.parquet")
    inventory_clean = read_processed(processed_path, "inventory_clean.parquet")

    # Tạo DuckDB in-memory
    con = duckdb.connect(database=":memory:")

    # Đăng ký DataFrame thành bảng trong DuckDB
    con.register("customers_clean", customers_clean)
    con.register("categories_clean", categories_clean)
    con.register("products_clean", products_clean)
    con.register("orders_clean", orders_clean)
    con.register("order_items_clean", order_items_clean)
    con.register("payments_clean", payments_clean)
    con.register("refunds_clean", refunds_clean)
    con.register("inventory_clean", inventory_clean)

    # Build mart tables
    mart_tables = {
        "dim_customer": build_dim_customer(con),
        "dim_category": build_dim_category(con),
        "dim_product": build_dim_product(con),
        "dim_date": build_dim_date(con),
        "fact_order_status": build_fact_order_status(con),
        "fact_sales": build_fact_sales(con),
        "fact_payment": build_fact_payment(con),
        "fact_refund": build_fact_refund(con),
        "fact_inventory": build_fact_inventory(con),
    }

    # Validate nhanh
    validate_mart_tables(mart_tables)

    # Lưu mart ra parquet và CSV
    for table_name, df in mart_tables.items():
        save_mart_table(df, mart_path, output_powerbi_path, table_name)

    con.close()

    print("========== HOÀN THÀNH TẠO MART ==========")
    print(f"Mart layer path: {mart_path}")
    print(f"Power BI output path: {output_powerbi_path}")


if __name__ == "__main__":
    main()