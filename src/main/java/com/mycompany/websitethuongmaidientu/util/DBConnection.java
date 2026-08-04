package com.mycompany.websitethuongmaidientu.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * DBConnection.java — Quản lý kết nối MySQL dùng HikariCP Connection Pool.
 *
 * CÁCH DÙNG THÔNG THƯỜNG (auto-commit):
 *   try (Connection conn = DBConnection.getConnection()) { ... }
 *
 * CÁCH DÙNG KHI CẦN TRANSACTION (đặt hàng, trừ kho, cộng điểm...):
 *   Connection conn = null;
 *   try {
 *       conn = DBConnection.getConnection();
 *       DBConnection.beginTransaction(conn);
 *       // ... thực hiện các thao tác SQL ...
 *       DBConnection.commit(conn);
 *   } catch (Exception e) {
 *       DBConnection.rollback(conn);
 *       throw e;
 *   } finally {
 *       DBConnection.close(conn);
 *   }
 */
public class DBConnection {

    // ─────────────────────────────────────────────────────────────
    //  CẤU HÌNH KẾT NỐI — chỉnh sửa 3 dòng này cho phù hợp
    // ─────────────────────────────────────────────────────────────
    private static final String DB_HOST     = "localhost";
    private static final String DB_PORT     = "3306";
    private static final String DB_NAME     = "lactt_db";
    private static final String DB_USER     = "root";
    private static final String DB_PASSWORD = "20050219";   // ← đổi thành mật khẩu MySQL của bạn

    // ─────────────────────────────────────────────────────────────
    //  URL đầy đủ
    // ─────────────────────────────────────────────────────────────
    private static final String JDBC_URL =
            "jdbc:mysql://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME
            + "?useUnicode=true"
            + "&characterEncoding=UTF-8"
            + "&serverTimezone=Asia/Ho_Chi_Minh"
            + "&useSSL=false"
            + "&allowPublicKeyRetrieval=true"
            + "&rewriteBatchedStatements=true";   // tăng hiệu năng insert nhiều dòng

    // ─────────────────────────────────────────────────────────────
    //  HikariCP DataSource — khởi tạo 1 lần duy nhất (Singleton)
    // ─────────────────────────────────────────────────────────────
    private static final HikariDataSource dataSource;

    static {
        try {
            HikariConfig config = new HikariConfig();

            config.setJdbcUrl(JDBC_URL);
            config.setUsername(DB_USER);
            config.setPassword(DB_PASSWORD);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");

            // Pool size — phù hợp cho project nhỏ/trung
            config.setMaximumPoolSize(10);          // tối đa 10 connection đồng thời
            config.setMinimumIdle(2);               // giữ sẵn 2 connection khi nhàn
            config.setConnectionTimeout(30_000);    // chờ tối đa 30s để lấy connection
            config.setIdleTimeout(600_000);         // connection nhàn 10 phút thì đóng
            config.setMaxLifetime(1_800_000);       // connection sống tối đa 30 phút
            config.setLeakDetectionThreshold(15_000); // cảnh báo nếu connection bị giữ > 15s

            // Kiểm tra connection còn sống trước khi dùng
            config.setConnectionTestQuery("SELECT 1");
            config.setPoolName("LacttPool");

            // Auto-commit mặc định = true (chỉ tắt khi dùng transaction thủ công)
            config.setAutoCommit(true);

            dataSource = new HikariDataSource(config);
            System.out.println("✅ HikariCP khởi tạo thành công — Pool: " + config.getPoolName());

        } catch (Exception e) {
            throw new RuntimeException("❌ Không thể khởi tạo Connection Pool: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Constructor private — không cho khởi tạo object
    // ─────────────────────────────────────────────────────────────
    private DBConnection() {}

    // ─────────────────────────────────────────────────────────────
    //  LẤY CONNECTION (auto-commit = true theo mặc định)
    // ─────────────────────────────────────────────────────────────

    /**
     * Lấy một connection từ pool.
     * Dùng trong try-with-resources để tự động trả về pool khi xong.
     */
    public static Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    // ─────────────────────────────────────────────────────────────
    //  TRANSACTION MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    /**
     * Bắt đầu transaction — tắt auto-commit.
     * Gọi trước khi thực hiện chuỗi thao tác cần đảm bảo toàn vẹn dữ liệu.
     */
    public static void beginTransaction(Connection conn) throws SQLException {
        if (conn != null && !conn.isClosed()) {
            conn.setAutoCommit(false);
        }
    }

    /**
     * Commit transaction — xác nhận lưu tất cả thay đổi.
     * Gọi khi tất cả thao tác trong chuỗi đều thành công.
     */
    public static void commit(Connection conn) {
        if (conn != null) {
            try {
                conn.commit();
                conn.setAutoCommit(true); // trả về trạng thái bình thường
            } catch (SQLException e) {
                System.err.println("⚠️ Lỗi khi commit: " + e.getMessage());
            }
        }
    }

    /**
     * Rollback transaction — hủy toàn bộ thay đổi chưa commit.
     * Gọi trong khối catch khi có lỗi xảy ra giữa chừng.
     */
    public static void rollback(Connection conn) {
        if (conn != null) {
            try {
                conn.rollback();
                conn.setAutoCommit(true); // trả về trạng thái bình thường
                System.out.println("↩️  Rollback thành công");
            } catch (SQLException e) {
                System.err.println("⚠️ Lỗi khi rollback: " + e.getMessage());
            }
        }
    }

    /**
     * Đóng connection và trả về pool.
     * Luôn gọi trong khối finally khi dùng transaction thủ công.
     */
    public static void close(Connection conn) {
        if (conn != null) {
            try {
                if (!conn.isClosed()) {
                    conn.close(); // HikariCP tự trả về pool, không đóng thật
                }
            } catch (SQLException e) {
                System.err.println("⚠️ Lỗi khi đóng connection: " + e.getMessage());
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  KIỂM TRA TRẠNG THÁI POOL (dùng khi debug)
    // ─────────────────────────────────────────────────────────────

    /**
     * In ra thông tin pool hiện tại — tiện debug khi cần.
     */
    public static void printPoolStatus() {
        System.out.println("📊 Pool status — Active: " + dataSource.getHikariPoolMXBean().getActiveConnections()
                + " | Idle: " + dataSource.getHikariPoolMXBean().getIdleConnections()
                + " | Total: " + dataSource.getHikariPoolMXBean().getTotalConnections()
                + " | Waiting: " + dataSource.getHikariPoolMXBean().getThreadsAwaitingConnection());
    }

    /**
     * Đóng toàn bộ pool — gọi khi shutdown ứng dụng (ServletContextListener).
     */
    public static void shutdown() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            System.out.println("🔴 Connection Pool đã đóng.");
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  TEST KẾT NỐI — chạy thẳng file này để kiểm tra
    // ─────────────────────────────────────────────────────────────
    public static void main(String[] args) {
        System.out.println("🔌 Đang kiểm tra kết nối MySQL...");
        try (Connection conn = getConnection()) {
            if (conn != null && !conn.isClosed()) {
                System.out.println("✅ Kết nối thành công!");
                printPoolStatus();
            }
        } catch (SQLException e) {
            System.out.println("❌ Kết nối thất bại: " + e.getMessage());
        } finally {
            shutdown();
        }
    }
}