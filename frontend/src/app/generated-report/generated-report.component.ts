import { Component } from '@angular/core';
import { Location, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ReportData } from '../../types/reportTypes';
import * as FileSaver from 'file-saver';
import { Workbook } from 'exceljs';

@Component({
  selector: 'app-generated-report',
  standalone: true,
  imports: [ButtonModule, CommonModule],
  templateUrl: './generated-report.component.html',
  styleUrls: ['./generated-report.component.css'],
})
export class GeneratedReportComponent {
  reportData: ReportData = {
    template_id: 0,
    report_name: '',
    template_name: '',
    columns: [],
    data: [],
  };

  constructor(private location: Location) {}

  ngOnInit(): void {
    this.reportData = history.state.report_data;
    if (!this.reportData) {
      this.location.back();
    }
  }

  downloadExcel(): void {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Report');

    const columns = this.reportData.columns || [];
    const data = this.reportData.data || [];

    const worksheetColumns = [
      { header: 'Sr. No.', key: 'sr_no', width: 10 },
      ...columns.map((col) => ({
        header: col,
        key: col.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, ''),
        width: 20,
      })),
    ];
    worksheet.columns = worksheetColumns;

    // Add data rows
    data.forEach((item, index) => {
      const row: any = { sr_no: index + 1 };
      columns.forEach((col) => {
        const key = col.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
        row[key] = item[key] || '';
      });
      worksheet.addRow(row);
    });

    const headerRow = worksheet.getRow(1);
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });
    // Save file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const filename = `${this.reportData.report_name || 'template-report'}.xlsx`;
      FileSaver.saveAs(blob, filename);
    });
  }
}
