package com.mycompany.websitethuongmaidientu.servlet;

import com.mycompany.websitethuongmaidientu.model.DashboardDTO;
import com.mycompany.websitethuongmaidientu.model.DailyRevenue;
import com.mycompany.websitethuongmaidientu.model.CategoryRevenue;
import com.mycompany.websitethuongmaidientu.model.ProductRevenue;
import com.mycompany.websitethuongmaidientu.service.DashboardService;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Date;
import java.util.List;

@WebServlet(urlPatterns = {"/admin/report-export"})
public class ReportExportServlet extends HttpServlet {

    private final DashboardService dashboardService = new DashboardService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        // Parse parameters
        Date fromDate = parseFromDate(req);
        Date toDate = parseToDate(req);
        String categoryId = req.getParameter("categoryId");

        // Validate date
        if (fromDate.after(toDate)) {
            resp.setStatus(400);
            resp.getWriter().write("{\"error\": \"Ngay ket thuc khong duoc nho hon ngay bat dau\"}");
            return;
        }

        // Get data
        DashboardDTO data = dashboardService.getDashboardData(fromDate, toDate);

        // Create Excel workbook
        Workbook workbook = new XSSFWorkbook();

        // Styles
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle numberStyle = createNumberStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);

        // Sheet 1: Tong quan
        createTongQuanSheet(workbook, data, headerStyle, numberStyle, currencyStyle);

        // Sheet 2: Theo ngay
        createTheoNgaySheet(workbook, data, headerStyle, numberStyle, currencyStyle);

        // Sheet 3: Theo danh muc
        createTheoDanhMucSheet(workbook, data, headerStyle, currencyStyle);

        // Sheet 4: Top san pham
        createTopSanPhamSheet(workbook, data, headerStyle, numberStyle, currencyStyle);

        // Set response headers
        String fileName = "bao_cao_doanh_thu_" + System.currentTimeMillis() + ".xlsx";
        resp.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        resp.setHeader("Content-Disposition", "attachment; filename=" + fileName);

        // Write to response
        workbook.write(resp.getOutputStream());
        workbook.close();
    }

    // ==================== SHEET 1: TONG QUAN ====================
    private void createTongQuanSheet(Workbook wb, DashboardDTO data,
                                     CellStyle headerStyle, CellStyle numberStyle,
                                     CellStyle currencyStyle) {
        Sheet sheet = wb.createSheet("Tong quan");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("BAO CAO TONG QUAN");

        rowNum++;

        String[] headers = {"Chi tieu", "Gia tri"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        String[] labels = {"Doanh thu thuan (Net Revenue)", "Doanh thu gop (Gross Revenue)",
                           "Tong don hang", "AOV (Gia tri don trung binh)",
                           "Ty le huy don"};
        Object[] values = {data.getNetRevenue(), data.getGrossRevenue(),
                          data.getTotalOrders(), data.getAov(),
                          data.getCancelRate()};

        for (int i = 0; i < labels.length; i++) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(labels[i]);
            Cell valueCell = row.createCell(1);
            if (values[i] instanceof Number) {
                valueCell.setCellValue(((Number) values[i]).doubleValue());
                if (i < 4) {
                    valueCell.setCellStyle(currencyStyle);
                } else {
                    valueCell.setCellStyle(numberStyle);
                }
            }
        }

        for (int i = 0; i < 2; i++) sheet.autoSizeColumn(i);
    }

    // ==================== SHEET 2: THEO NGAY ====================
    private void createTheoNgaySheet(Workbook wb, DashboardDTO data,
                                       CellStyle headerStyle, CellStyle numberStyle,
                                       CellStyle currencyStyle) {
        Sheet sheet = wb.createSheet("Doanh thu theo ngay");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("DOANH THU THEO NGAY");

        rowNum++;

        String[] headers = {"Ngay", "Doanh thu (VND)", "So don", "AOV (VND)"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        List<DailyRevenue> dailyList = data.getDailyRevenueList();
        if (dailyList != null && !dailyList.isEmpty()) {
            for (DailyRevenue dr : dailyList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(dr.getDate());

                Cell revCell = row.createCell(1);
                revCell.setCellValue(dr.getRevenue());
                revCell.setCellStyle(currencyStyle);

                Cell orderCell = row.createCell(2);
                orderCell.setCellValue(dr.getOrderCount());
                orderCell.setCellStyle(numberStyle);

                Cell aovCell = row.createCell(3);
                aovCell.setCellValue(dr.getAov());
                aovCell.setCellStyle(currencyStyle);
            }
        }

        for (int i = 0; i < 4; i++) sheet.autoSizeColumn(i);
    }

    // ==================== SHEET 3: THEO DANH MUC ====================
    private void createTheoDanhMucSheet(Workbook wb, DashboardDTO data,
                                          CellStyle headerStyle, CellStyle currencyStyle) {
        Sheet sheet = wb.createSheet("Doanh thu theo danh muc");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("DOANH THU THEO DANH MUC");

        rowNum++;

        String[] headers = {"Danh muc", "Doanh thu (VND)", "% Dong gop"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        List<CategoryRevenue> catList = data.getCategoryList();
        if (catList != null && !catList.isEmpty()) {
            for (CategoryRevenue cr : catList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(cr.getCategoryName());

                Cell revCell = row.createCell(1);
                revCell.setCellValue(cr.getRevenue());
                revCell.setCellStyle(currencyStyle);

                Cell pctCell = row.createCell(2);
                pctCell.setCellValue(cr.getPercentage());
                pctCell.setCellStyle(currencyStyle);
            }
        }

        for (int i = 0; i < 3; i++) sheet.autoSizeColumn(i);
    }

    // ==================== SHEET 4: TOP SAN PHAM ====================
    private void createTopSanPhamSheet(Workbook wb, DashboardDTO data,
                                        CellStyle headerStyle, CellStyle numberStyle,
                                        CellStyle currencyStyle) {
        Sheet sheet = wb.createSheet("Top san pham");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("TOP SAN PHAM BAN CHAY");

        rowNum++;

        String[] headers = {"Ten san pham", "So luong ban", "Doanh thu (VND)"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        List<ProductRevenue> prodList = data.getTopProducts();
        if (prodList != null && !prodList.isEmpty()) {
            for (ProductRevenue pr : prodList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(pr.getName());

                Cell qtyCell = row.createCell(1);
                qtyCell.setCellValue(pr.getTotalSold());
                qtyCell.setCellStyle(numberStyle);

                Cell revCell = row.createCell(2);
                revCell.setCellValue(pr.getRevenue());
                revCell.setCellStyle(currencyStyle);
            }
        }

        for (int i = 0; i < 3; i++) sheet.autoSizeColumn(i);
    }

    // ==================== STYLES ====================
    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createNumberStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0 \"VND\""));
        return style;
    }

    // ==================== PARSE DATE ====================
    private Date parseFromDate(HttpServletRequest req) {
        String from = req.getParameter("from");
        if (from == null || from.isEmpty()) {
            java.time.LocalDate today = java.time.LocalDate.now();
            return Date.valueOf(today.withDayOfMonth(1));
        }
        return Date.valueOf(from);
    }

    private Date parseToDate(HttpServletRequest req) {
        String to = req.getParameter("to");
        if (to == null || to.isEmpty()) {
            return Date.valueOf(java.time.LocalDate.now());
        }
        return Date.valueOf(to);
    }
}