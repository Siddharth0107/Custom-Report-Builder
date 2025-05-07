import { Component } from '@angular/core';
import { APIResponse, Filters, Report, ReportSelect, TransformedReport } from '../../types/reportTypes';
import { ReportService } from '../service/report.service';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MultiSelect } from 'primeng/multiselect';
import { ColumnDialog } from '../report-builder/report-builder.component';

@Component({
  selector: 'app-all-reports',
  imports: [ColumnDialog, MultiSelect, ButtonModule, FormsModule, CommonModule, TableModule, RouterModule],
  templateUrl: './all-reports.component.html',
  styleUrl: './all-reports.component.css'
})
export class AllReportsComponent {
  products: TransformedReport[] = [];
  groupedDataDialog: boolean = false;
  reports: ReportSelect[] = [];
  selectedReports: Report[] = [];
  passedReportData: any = [];

  overAllData: Report[] = [{
    id: 0,
    report_name: '',
    report_columns: [],
    report_filters: [],
  }];

  constructor(private reportService: ReportService) { }

  async ngOnInit() {
    try {
      let tempId = localStorage.getItem('lastId');
      if (!tempId) {
        localStorage.setItem('lastId', JSON.stringify(0));
      }
      this.reportService.getAllReportsWithColumns().subscribe({
        next: (response: APIResponse) => {
          this.overAllData = response.data;
          if (response.data.length) {
            const transformedReports = this.transformReportsByRole(response.data);
            this.products = transformedReports;
            this.reports = this.products.map(report => ({
              id: report.reportId,
              name: report.parent_report_name,
            }));
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
      columns: report.report_columns,
      outer_filters: report.report_filters.filter((filter: Filters) => filter.report_id == report.id),
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

  onReportsChange(selected: any[]) {
    // this.selectedReports = [...selected]; // shallow copy to preserve immutability
    // console.log(this.selectedReports);
  }

  // openGroupDialog() {
  //   let data: any = [];
  //   console.log(this.selectedReports)
  //   this.selectedReports.forEach(selectedItem => {
  //     const matchingItem = this.overAllData.find(overallItem => overallItem.id === selectedItem.id);
  //     if (matchingItem) {
  //       console.log(matchingItem);
  //       data.push(matchingItem);
  //     }
  //   });
  //   // const transformedReports = this.transformReportsByRole(this.selectedReports);

  //   console.log("grouped template created => ", data);
  //   this.passedReportData = data;
  //   this.groupedDataDialog = true;
  // }
  
  openGroupDialog() {
    const transformedData: TransformedReport[] = [];

    this.selectedReports.forEach(selected => {
      const fullReport = this.overAllData.find(report => report.id === selected.id);
      if (fullReport) {
        transformedData.push({
          reportId: fullReport.id,
          parent_report_name: fullReport.report_name,
          columns: fullReport.report_columns,
          outer_filters: fullReport.report_filters.filter(filter => filter.report_id === fullReport.id),
          dialogVisible: false,
          isDisabled: false,
        });
      }
    });
    console.log("Grouped template created =>", transformedData);
    this.passedReportData = transformedData;
    this.groupedDataDialog = true;
  }
}