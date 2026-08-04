import os
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def get_project_root() -> Path:
    """
    File hiện tại nằm trong: cosmetic-elt/scripts/
    parents[1] sẽ trỏ về: cosmetic-elt/
    """
    return Path(__file__).resolve().parents[1]


def load_config():
    """
    Đọc cấu hình kết nối MySQL từ file .env
    """
    project_root = get_project_root()
    env_path = project_root / ".env"

    if not env_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file .env tại: {env_path}")

    load_dotenv(env_path)

    config = {
        "mysql_host": os.getenv("MYSQL_HOST", "localhost"),
        "mysql_port": os.getenv("MYSQL_PORT", "3306"),
        "mysql_user": os.getenv("MYSQL_USER", "root"),
        "mysql_password": os.getenv("MYSQL_PASSWORD", "20050219"),
        "mysql_database": os.getenv("MYSQL_DATABASE", "lactt_db"),
        "data_lake_path": os.getenv("DATA_LAKE_PATH", "data_lake"),
    }

    return config


def create_mysql_engine(config):
    """
    Tạo kết nối SQLAlchemy tới MySQL.
    Dùng pymysql để pandas có thể đọc bảng bằng read_sql.
    """
    user = config["mysql_user"]
    password = config["mysql_password"]
    host = config["mysql_host"]
    port = config["mysql_port"]
    database = config["mysql_database"]

    connection_url = (
        f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"
        "?charset=utf8mb4"
    )

    engine = create_engine(connection_url)
    return engine


def ensure_raw_folder(config) -> Path:
    """
    Tạo folder data_lake/raw nếu chưa tồn tại.
    """
    project_root = get_project_root()
    raw_path = project_root / config["data_lake_path"] / "raw"
    raw_path.mkdir(parents=True, exist_ok=True)
    return raw_path


def test_connection(engine):
    """
    Test kết nối MySQL trước khi extract.
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1 AS test_value"))
        value = result.fetchone()[0]
        if value != 1:
            raise ConnectionError("Kết nối MySQL không trả về kết quả hợp lệ.")
    print("Kết nối MySQL thành công.")


def extract_table_to_parquet(engine, table_name: str, raw_path: Path):
    """
    Đọc toàn bộ dữ liệu từ 1 bảng MySQL và lưu thành file parquet.
    """
    print(f"Đang extract bảng: {table_name}")

    query = f"SELECT * FROM {table_name}"
    df = pd.read_sql(query, engine)

    output_file = raw_path / f"{table_name}.parquet"
    df.to_parquet(output_file, index=False, engine="pyarrow")

    print(
        f"Đã lưu: {output_file} | "
        f"Số dòng: {len(df)} | "
        f"Số cột: {len(df.columns)}"
    )


def main():
    print("========== BẮT ĐẦU EXTRACT MYSQL → RAW ==========")

    config = load_config()
    engine = create_mysql_engine(config)
    raw_path = ensure_raw_folder(config)

    test_connection(engine)

    tables = [
        "tai_khoan",
        "danh_muc",
        "san_pham",
        "ton_kho",
        "don_hang",
        "chi_tiet_don_hang",
        "giao_dich",
        "hoan_tien",
    ]

    for table in tables:
        extract_table_to_parquet(engine, table, raw_path)

    print("========== HOÀN THÀNH EXTRACT RAW ==========")
    print(f"Raw layer path: {raw_path}")


if __name__ == "__main__":
    main()