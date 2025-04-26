import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import * as fs from 'file-saver';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-generated-report',
  standalone: true,
  imports: [ButtonModule, CommonModule],
  templateUrl: './generated-report.component.html',
  styleUrls: ['./generated-report.component.css']
})
export class GeneratedReportComponent {
  reportData: any = {};

  constructor() { }

  ngOnInit(): void {
    this.reportData = history.state?.report_data;
    if (!this.reportData) {
      console.warn('No data found in state!');
    } else {
      console.log('Received report data:', this.reportData);
    }
  }

  downloadExcel(): void {
    const originalData = this.reportData.data;
    const columns = this.reportData.columns || [];

    // Dynamically map data based on column names
    const formattedData = originalData.map((item: any) => {
      const formattedItem: any = {};
      columns.forEach((column: string) => {
        formattedItem[column] = item[column];
      });
      return formattedItem;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Report': worksheet },
      SheetNames: ['Report']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileName = `${this.reportData.report_name || 'template report'}.xlsx`;
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    fs.saveAs(blob, fileName);
  }
}
