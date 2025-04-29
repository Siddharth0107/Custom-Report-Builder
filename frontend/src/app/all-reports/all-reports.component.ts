import { Component } from '@angular/core';
import { APIResponse, Report, ReportFilters, TransformedReport } from '../../types/reportTypes';
import { ReportService } from '../service/report.service';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ColumnDialog } from '../report-builder/report-builder.component';

@Component({
  selector: 'app-all-reports',
  imports: [ColumnDialog, ButtonModule, FormsModule, CommonModule, TableModule, RouterModule],
  templateUrl: './all-reports.component.html',
  styleUrl: './all-reports.component.css'
})
export class AllReportsComponent {
  products: TransformedReport[] = [];

  overAllData: Report[] = [{
    id: 0,
    report_name: '',
    report_columns: [],
    report_filters: [],
  }];

  constructor(private reportService: ReportService) { }

  async ngOnInit() {
    try {
      this.reportService.getAllReportsWithColumns().subscribe({
        next: (response: APIResponse) => {
          this.overAllData = response.data;
          if (response.data.length) {
            const transformedReports = this.transformReportsByRole(response.data);
            this.products = transformedReports;
          }
        },
        error: (error: any) => {
          console.error("Error fetching reports", error);
        }
      });
    } catch (err) {
      console.error("Error loading product data", err);
    }
  }

  transformReportsByRole(roleReports: Report[]): TransformedReport[] {
    if (!roleReports) return [];

    return roleReports.map((report: Report) => ({
      reportId: report.id,
      parent_report_name: report.report_name,
      saveBtnEnable: true,
      columns: report.report_columns,
      outer_filters: report.report_filters.filter((filter: ReportFilters) => filter.report_id == report.id),
      dialogVisible: false,
      isDisabled: false,
    }));
  }

  openDialog(product: TransformedReport) {
    product.dialogVisible = true;
  }

  closeDialog(product: TransformedReport) {
    product.dialogVisible = false;
  }
}