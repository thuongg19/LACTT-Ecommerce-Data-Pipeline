package com.mycompany.websitethuongmaidientu.servlet;

import com.mycompany.websitethuongmaidientu.model.CategoryRevenue;
import com.mycompany.websitethuongmaidientu.model.DailyRevenue;
import com.mycompany.websitethuongmaidientu.model.ProductRevenue;
import com.mycompany.websitethuongmaidientu.model.UserBehavior;
import com.mycompany.websitethuongmaidientu.model.CustomerSegment;
import com.mycompany.websitethuongmaidientu.model.DashboardDTO;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@WebServlet(urlPatterns = {"/admin/dashboard-export"})
public class DashboardExportServlet extends HttpServlet {

    private final DashboardService dashboardService = new DashboardService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        // Validate date
        Date fromDate = parseFromDate(req);
        Date toDate = parseToDate(req);

        if (fromDate.after(toDate)) {
            resp.setStatus(400);
            resp.getWriter().write("{\"error\": \"Ngay ket thuc khong duoc nho hon ngay bat dau\"}");
            return;
        }

        // Get data
        DashboardDTO data = dashboardService.getDashboardData(fromDate, toDate);

        // Create styles
        try ( // Create Excel workbook
                Workbook workbook = new XSSFWorkbook()) {
            // Create styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle numberStyle = createNumberStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            CellStyle percentStyle = createPercentStyle(workbook);
            
            // Sheet 1: Tong quan
            createTongQuanSheet(workbook, data, fromDate, toDate, headerStyle, numberStyle, currencyStyle, percentStyle);
            
            // Sheet 2: Doanh thu theo ngay
            createDoanhThuTheoNgaySheet(workbook, data, headerStyle, currencyStyle, numberStyle);
            
            // Sheet 3: Theo danh muc
            createTheoDanhMucSheet(workbook, data, headerStyle, currencyStyle, percentStyle);
            
            // Sheet 4: Top san pham
            createTopSanPhamSheet(workbook, data, headerStyle, currencyStyle, numberStyle);
            
            // Sheet 5: Traffic & Buyer
            createTrafficBuyerSheet(workbook, data, headerStyle, numberStyle, percentStyle);
            
            // Sheet 6: Customer Segment
            createCustomerSegmentSheet(workbook, data, headerStyle, numberStyle, percentStyle);
            
            // Set response headers
            String fileName = "report_dashboard_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";
            resp.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            resp.setHeader("Content-Disposition", "attachment; filename=" + fileName);
            resp.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            resp.setHeader("Pragma", "no-cache");
            resp.setHeader("Expires", "0");
            
            // Write to response
            workbook.write(resp.getOutputStream());
        }
    }

    // ==================== SHEET 1: TONG QUAN ====================
    private void createTongQuanSheet(Workbook wb, DashboardDTO data, Date from, Date to,
                                     CellStyle headerStyle, CellStyle numberStyle,
                                     CellStyle currencyStyle, CellStyle percentStyle) {
        Sheet sheet = wb.createSheet("Tong quan");
        int rowNum = 0;

        // Title
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BAO CAO DASHBOARD");
        titleCell.setCellStyle(headerStyle);

        // Period
        Row periodRow = sheet.createRow(rowNum++);
        periodRow.createCell(0).setCellValue("Tu ngay: " + from);
        periodRow.createCell(1).setCellValue("Den ngay: " + to);

        rowNum++; // Empty row

        // Headers
        String[] tongQuanHeaders = {"Chi tieu", "Gia tri"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < tongQuanHeaders.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(tongQuanHeaders[i]);
            cell.setCellStyle(headerStyle);
        }

        // Data rows
        String[] labels = {"Doanh thu thuan (Net Revenue)", "Doanh thu gop (Gross Revenue)",
                           "Tong don hang", "AOV (Gia tri don trung binh)",
                           "Ty le huy don", "Tang truong so voi ky truoc",
                           "Tang truong so voi nam truoc"};
        Object[] values = {data.getNetRevenue(), data.getGrossRevenue(),
                          data.getTotalOrders(), data.getAov(),
                          data.getCancelRate(), data.getVsLastPeriod(),
                          data.getVsLastYear()};
        CellStyle[] styles = {currencyStyle, currencyStyle, numberStyle, currencyStyle,
                             percentStyle, percentStyle, percentStyle};

        for (int i = 0; i < labels.length; i++) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(labels[i]);
            Cell valueCell = row.createCell(1);
            if (values[i] instanceof Number number) {
                valueCell.setCellValue(number.doubleValue());
                valueCell.setCellStyle(styles[i]);
            } else {
                valueCell.setCellValue(values[i].toString());
            }
        }

        // Auto size columns
        for (int i = 0; i < 2; i++) sheet.autoSizeColumn(i);
    }

    // ==================== SHEET 2: DOANH THU THEO NGAY ====================
    private void createDoanhThuTheoNgaySheet(Workbook wb, DashboardDTO data,
                                             CellStyle headerStyle, CellStyle currencyStyle,
                                             CellStyle numberStyle) {
        Sheet sheet = wb.createSheet("Doanh thu theo ngay");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("DOANH THU THEO NGAY");

        rowNum++; // Empty

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
        } else {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue("No data");
        }

        for (int i = 0; i < 4; i++) sheet.autoSizeColumn(i);
    }

    // ==================== SHEET 3: THEO DANH MUC ====================
    private void createTheoDanhMucSheet(Workbook wb, DashboardDTO data,
                                        CellStyle headerStyle, CellStyle currencyStyle,
                                        CellStyle percentStyle) {
        Sheet sheet = wb.createSheet("Theo danh muc");
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
                pctCell.setCellValue(cr.getPercentage() / 100); // Excel percentage format
                pctCell.setCellStyle(percentStyle);
            }
        } else {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue("No data");
        }

        for (int i = 0; i < 3; i++) sheet.autoSizeColumn(i);
    }

    // ==================== SHEET 4: TOP SAN PHAM ====================
    private void createTopSanPhamSheet(Workbook wb, DashboardDTO data,
                                      CellStyle headerStyle, CellStyle currencyStyle,
                                      CellStyle numberStyle) {
        Sheet sheet = wb.createSheet("Top san pham");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("TOP SAN PHAM");

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
        } else {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue("No data");
        }

        for (int i = 0; i < 3; i++) sheet.autoSizeColumn(i);
    }

    // ==================== SHEET 5: TRAFFIC & BUYER ====================
    private void createTrafficBuyerSheet(Workbook wb, DashboardDTO data,
                                        CellStyle headerStyle, CellStyle numberStyle,
                                        CellStyle percentStyle) {
        Sheet sheet = wb.createSheet("Traffic & Buyer");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("HANH VI NGUOI DUNG (TRAFFIC & BUYER)");

        rowNum++;

        String[] headers = {"Ngay", "Luot xem", "Luot mua", "Conversion Rate (%)"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        List<UserBehavior> behaviorList = data.getUserBehaviorList();
        if (behaviorList != null && !behaviorList.isEmpty()) {
            for (UserBehavior ub : behaviorList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(ub.getDate());

                Cell viewsCell = row.createCell(1);
                viewsCell.setCellValue(ub.getViews());
                viewsCell.setCellStyle(numberStyle);

                Cell buysCell = row.createCell(2);
                buysCell.setCellValue(ub.getBuys());
                buysCell.setCellStyle(numberStyle);

                Cell rateCell = row.createCell(3);
                rateCell.setCellValue(ub.getConversionRate() / 100);
                rateCell.setCellStyle(percentStyle);
            }
        } else {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue("No data");
        }

        for (int i = 0; i < 4; i++) sheet.autoSizeColumn(i);
    }

    // ==================== SHEET 6: CUSTOMER SEGMENT ====================
    private void createCustomerSegmentSheet(Workbook wb, DashboardDTO data,
                                          CellStyle headerStyle, CellStyle numberStyle,
                                          CellStyle percentStyle) {
        Sheet sheet = wb.createSheet("Customer Segment");
        int rowNum = 0;

        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("PHAN KHUC KHACH HANG");

        rowNum++;

        String[] headers = {"Loai khach", "So luong", "%"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        List<CustomerSegment> segList = data.getCustomerSegmentList();
        if (segList != null && !segList.isEmpty()) {
            for (CustomerSegment seg : segList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(seg.getType());

                Cell countCell = row.createCell(1);
                countCell.setCellValue(seg.getCount());
                countCell.setCellStyle(numberStyle);

                Cell pctCell = row.createCell(2);
                pctCell.setCellValue(seg.getPercentage() / 100);
                pctCell.setCellStyle(percentStyle);
            }
        } else {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue("No data");
        }

        for (int i = 0; i < 3; i++) sheet.autoSizeColumn(i);
    }

    // ==================== STYLES ====================
    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
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

    private CellStyle createPercentStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("0.00%"));
        return style;
    }

    // ==================== PARSE DATE ====================
    private Date parseFromDate(HttpServletRequest req) {
        String from = req.getParameter("from");
        if (from == null || from.isEmpty()) {
            LocalDate today = LocalDate.now();
            return Date.valueOf(today.withDayOfMonth(1));
        }
        return Date.valueOf(from);
    }

    private Date parseToDate(HttpServletRequest req) {
        String to = req.getParameter("to");
        if (to == null || to.isEmpty()) {
            return Date.valueOf(LocalDate.now());
        }
        return Date.valueOf(to);
    }
}