package com.mycompany.websitethuongmaidientu.servlet;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.mycompany.websitethuongmaidientu.util.DBConnection;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Date;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

@WebServlet(urlPatterns = {"/admin/bank-import"})
@MultipartConfig(
    maxFileSize = 10 * 1024 * 1024,  // 10MB
    maxRequestSize = 20 * 1024 * 1024 // 20MB
)
public class BankImportServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            // Get uploaded file
            jakarta.servlet.http.Part filePart = req.getPart("bankFile");
            if (filePart == null || filePart.getSize() == 0) {
                sendJson(resp, "{\"success\": false, \"error\": \"Vui long chon file\"}");
                return;
            }

            String fileName = filePart.getSubmittedFileName();
            boolean isExcel = fileName != null && (fileName.endsWith(".xlsx") || fileName.endsWith(".xls"));
            boolean isCSV = fileName != null && fileName.endsWith(".csv");

            if (!isExcel && !isCSV) {
                sendJson(resp, "{\"success\": false, \"error\": \"Chi ho tro file .xlsx, .xls hoac .csv\"}");
                return;
            }

            List<BankTransaction> transactions = new ArrayList<>();

            if (isExcel) {
                transactions = parseExcelFile(filePart.getInputStream());
            } else if (isCSV) {
                transactions = parseCSVFile(filePart.getInputStream());
            }

            if (transactions.isEmpty()) {
                sendJson(resp, "{\"success\": false, \"error\": \"File khong co du lieu hop le\"}");
                return;
            }

            // Validate and insert to DB
            int inserted = insertBankTransactions(transactions);

            sendJson(resp, "{\"success\": true, \"message\": \"Da import " + inserted + " giao dich tu file\", \"total\": " + inserted + "}");

        } catch (Exception e) {
            e.printStackTrace();
            sendJson(resp, "{\"success\": false, \"error\": \"Loi he thong: " + e.getMessage() + "\"}");
        }
    }

    // ==================== PARSE EXCEL FILE ====================
    private List<BankTransaction> parseExcelFile(InputStream is) throws Exception {
        List<BankTransaction> list = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);

            // Skip header row, start from row 1
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    BankTransaction tx = new BankTransaction();

                    // ma_giao_dich (column 0)
                    Cell maGDCell = row.getCell(0);
                    if (maGDCell != null) {
                        tx.setMaGiaoDich(getCellValueAsString(maGDCell));
                    }

                    // so_tien (column 1)
                    Cell soTienCell = row.getCell(1);
                    if (soTienCell != null) {
                        tx.setSoTien(getCellValueAsDouble(soTienCell));
                    }

                    // thoi_gian (column 2)
                    Cell thoiGianCell = row.getCell(2);
                    if (thoiGianCell != null) {
                        tx.setThoiGian(getCellValueAsDate(thoiGianCell));
                    }

                    // ngan_hang (column 3)
                    Cell nhCell = row.getCell(3);
                    if (nhCell != null) {
                        tx.setNganHang(getCellValueAsString(nhCell));
                    }

                    // Validate: so_tien must not be null or 0
                    if (tx.getSoTien() != null && tx.getSoTien() > 0) {
                        list.add(tx);
                    }
                } catch (Exception e) {
                    // Skip invalid rows
                    System.err.println("Skip row " + i + ": " + e.getMessage());
                }
            }
        }
        return list;
    }

    // ==================== PARSE CSV FILE ====================
    private List<BankTransaction> parseCSVFile(InputStream is) throws Exception {
        List<BankTransaction> list = new ArrayList<>();
        SimpleDateFormat[] dateFormats = {
            new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"),
            new SimpleDateFormat("dd/MM/yyyy HH:mm:ss"),
            new SimpleDateFormat("dd-MM-yyyy HH:mm:ss"),
            new SimpleDateFormat("yyyy-MM-dd")
        };

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"))) {
            String line;
            boolean firstLine = true;

            while ((line = reader.readLine()) != null) {
                // Skip empty lines
                line = line.trim();
                if (line.isEmpty()) continue;

                // Skip header
                if (firstLine) {
                    firstLine = false;
                    if (line.toLowerCase().contains("ma_giao_dich") ||
                        line.toLowerCase().contains("so_tien")) {
                        continue;
                    }
                }

                String[] parts = line.split(",");
                if (parts.length < 3) continue;

                try {
                    BankTransaction tx = new BankTransaction();

                    // ma_giao_dich
                    tx.setMaGiaoDich(parts[0].trim().replace("\"", ""));

                    // so_tien
                    String soTienStr = parts[1].trim().replace("\"", "").replace(",", "");
                    double soTien = Double.parseDouble(soTienStr);

                    // thoi_gian
                    String dateStr = parts[2].trim().replace("\"", "");
                    java.util.Date parsedDate = null;
                    for (SimpleDateFormat sdf : dateFormats) {
                        try {
                            parsedDate = sdf.parse(dateStr);
                            break;
                        } catch (Exception ignored) {}
                    }

                    // ngan_hang (optional)
                    if (parts.length > 3) {
                        tx.setNganHang(parts[3].trim().replace("\"", ""));
                    }

                    if (soTien > 0) {
                        tx.setSoTien(soTien);
                        tx.setThoiGian(parsedDate != null ? new Date(parsedDate.getTime()) : new Date(System.currentTimeMillis()));
                        list.add(tx);
                    }
                } catch (Exception e) {
                    System.err.println("Skip line: " + line + " - " + e.getMessage());
                }
            }
        }
        return list;
    }

    // ==================== INSERT TO DATABASE ====================
    private int insertBankTransactions(List<BankTransaction> transactions) {
        int count = 0;
        String sql = "INSERT INTO bank_transactions (ma_giao_dich, so_tien, thoi_gian, ngan_hang) VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            for (BankTransaction tx : transactions) {
                ps.setString(1, tx.getMaGiaoDich());
                ps.setDouble(2, tx.getSoTien());
                ps.setDate(3, tx.getThoiGian());
                ps.setString(4, tx.getNganHang());

                ps.addBatch();
                count++;

                // Execute in batches of 100
                if (count % 100 == 0) {
                    ps.executeBatch();
                }
            }
            ps.executeBatch();

        } catch (Exception e) {
            e.printStackTrace();
        }
        return count;
    }

    // ==================== HELPER METHODS ====================
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private Double getCellValueAsDouble(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> {
                try {
                    yield Double.parseDouble(cell.getStringCellValue().replace(",", "").replace("\"", ""));
                } catch (NumberFormatException e) {
                    yield null;
                }
            }
            default -> null;
        };
    }

    private Date getCellValueAsDate(Cell cell) {
        if (cell == null) return new Date(System.currentTimeMillis());

        return switch (cell.getCellType()) {
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield new Date(cell.getDateCellValue().getTime());
                }
                yield new Date((long) (cell.getNumericCellValue() * 86400000));
            }
            case STRING -> {
                String dateStr = cell.getStringCellValue();
                SimpleDateFormat[] formats = {
                    new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"),
                    new SimpleDateFormat("dd/MM/yyyy HH:mm:ss"),
                    new SimpleDateFormat("dd-MM-yyyy"),
                    new SimpleDateFormat("yyyy-MM-dd")
                };
                for (SimpleDateFormat sdf : formats) {
                    try {
                        yield new Date(sdf.parse(dateStr).getTime());
                    } catch (Exception ignored) {}
                }
                yield new Date(System.currentTimeMillis());
            }
            default -> new Date(System.currentTimeMillis());
        };
    }

    private void sendJson(HttpServletResponse resp, String json) throws IOException {
        resp.getWriter().write(json);
    }

    // ==================== INNER CLASS ====================
    private static class BankTransaction {
        private String maGiaoDich;
        private Double soTien;
        private Date thoiGian;
        private String nganHang;

        public String getMaGiaoDich() { return maGiaoDich; }
        public void setMaGiaoDich(String ma) { this.maGiaoDich = ma; }

        public Double getSoTien() { return soTien; }
        public void setSoTien(Double soTien) { this.soTien = soTien; }

        public Date getThoiGian() { return thoiGian; }
        public void setThoiGian(Date thoiGian) { this.thoiGian = thoiGian; }

        public String getNganHang() { return nganHang; }
        public void setNganHang(String nganHang) { this.nganHang = nganHang; }
    }
}