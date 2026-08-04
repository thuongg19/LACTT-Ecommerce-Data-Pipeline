package com.mycompany.websitethuongmaidientu.servlet;

import com.mycompany.websitethuongmaidientu.model.GiaoDichDTO;
import com.mycompany.websitethuongmaidientu.service.DoiSoatGDService;

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

@WebServlet(urlPatterns = {"/admin/reconcile-export"})
public class ReconcileExportServlet extends HttpServlet {

    private final DoiSoatGDService reconcileService = new DoiSoatGDService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        // Parse parameters
        Date fromDate = parseFromDate(req);
        Date toDate = parseToDate(req);
        String categoryId = req.getParameter("categoryId");
        String status = req.getParameter("status");
        String bank = req.getParameter("bank");

        // Validate date
        if (fromDate.after(toDate)) {
            resp.setStatus(400);
            resp.getWriter().write("{\"error\": \"Ngay ket thuc khong duoc nho hon ngay bat dau\"}");
            return;
        }

        // Get data
        List<GiaoDichDTO> list = reconcileService.getTransactions(fromDate, toDate);

        // Apply filters
        if (status != null && !status.isEmpty()) {
            list.removeIf(t -> !status.equals(t.getTrangThai()));
        }
        if (bank != null && !bank.isEmpty()) {
            list.removeIf(t -> !bank.equals(t.getNganHang()));
        }

        // Create Excel
        Workbook workbook = new XSSFWorkbook();

        // Styles
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle currencyStyle = createCurrencyStyle(workbook);
        CellStyle redStyle = createRedHighlightStyle(workbook);
        CellStyle normalStyle = createNormalStyle(workbook);

        Sheet sheet = workbook.createSheet("Ket qua doi soat");
        int rowNum = 0;

        // Title
        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("KET QUA DOI SOAT GIAO DICH");
        rowNum++;

        // Period
        Row periodRow = sheet.createRow(rowNum++);
        periodRow.createCell(0).setCellValue("Tu: " + fromDate);
        periodRow.createCell(1).setCellValue("Den: " + toDate);
        rowNum++;

        // Headers
        String[] headers = {"Ma GD", "Ngay", "Khach hang", "So tien HT (VND)",
                           "So tien NH (VND)", "Chenh lech", "Ngan hang", "Trang thai"};
        Row headerRow = sheet.createRow(rowNum++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Data rows
        for (GiaoDichDTO t : list) {
            Row row = sheet.createRow(rowNum++);

            row.createCell(0).setCellValue(t.getMaGD() != null ? t.getMaGD() : "-");

            row.createCell(1).setCellValue(t.getNgayGD() != null ? t.getNgayGD() : "-");

            row.createCell(2).setCellValue(t.getKhachHang() != null ? t.getKhachHang() : "Khach le");

            // So tien HT
            Cell htCell = row.createCell(3);
            htCell.setCellValue(t.getSoTienHeThong());
            htCell.setCellStyle(currencyStyle);

            // So tien NH
            Cell nhCell = row.createCell(4);
            if (t.getSoTienNganHang() != null) {
                nhCell.setCellValue(t.getSoTienNganHang());
            } else {
                nhCell.setCellValue("-");
            }
            nhCell.setCellStyle(currencyStyle);

            // Chenh lech
            Cell diffCell = row.createCell(5);
            diffCell.setCellValue(t.getChenhLech());
            if (t.getChenhLech() != 0) {
                diffCell.setCellStyle(redStyle);
            } else {
                diffCell.setCellStyle(currencyStyle);
            }

            row.createCell(6).setCellValue(t.getNganHang() != null ? t.getNganHang() : "-");

            // Trang thai (highlight red if SAI_LECH)
            Cell statusCell = row.createCell(7);
            statusCell.setCellValue(t.getTrangThai());
            if ("SAI_LECH".equals(t.getTrangThai())) {
                statusCell.setCellStyle(redStyle);
            } else {
                statusCell.setCellStyle(normalStyle);
            }
        }

        // Auto size columns
        for (int i = 0; i < 8; i++) sheet.autoSizeColumn(i);

        // Set response headers
        String fileName = "doi_soat_" + fromDate.toString().replace("-", "") + "_" + toDate.toString().replace("-", "") + ".xlsx";
        resp.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        resp.setHeader("Content-Disposition", "attachment; filename=" + fileName);

        workbook.write(resp.getOutputStream());
        workbook.close();
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

    private CellStyle createRedHighlightStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setFillForegroundColor(IndexedColors.RED.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font font = wb.createFont();
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setBold(true);
        style.setFont(font);
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0 \"VND\""));
        return style;
    }

    private CellStyle createNormalStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
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