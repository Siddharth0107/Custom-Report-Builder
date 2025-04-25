import { Component } from '@angular/core';
import { Product } from '../../domain/product';
import { ReportService } from '../service/report.service';
import { Router, RouterModule } from '@angular/router';
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

  dialogVisible: boolean = false;
  selectedProduct: any = null;
  columnData: any = {};
  ediBtnEnable: boolean = true;
  saveBtnEnable: boolean = true;
  roles: any = [
    { id: 1, name: "Sales Person" },
    { id: 2, name: "Delivery Partner" },
    { id: 3, name: "Manager" },
    { id: 4, name: "Accountant" },
    { id: 5, name: "Cashier" }
  ];


  filteredRoles: any[] = [];
  products!: Product[];
  showSubmit = true;
  overAllData: any = [];
  selectedTab: string = '';

  constructor(private reportService: ReportService, private router:Router) { }

  search(event: any) {
    const query = event.query.toLowerCase();
    this.filteredRoles = this.roles.filter((role: any) =>
      role.name.toLowerCase().includes(query)
    );
  }

  async ngOnInit() {
    try {
      this.reportService.getAllReportsWithColumns().subscribe({
        next: (response: any) => {
          this.overAllData = response;
          const transformedReports = this.transformReportsByRole(response, this.columnData);
          this.products = transformedReports;
          console.log(this.products);

        },
        error: (error: any) => {
          console.error("Error fetching reports", error);
        }
      });
    } catch (err) {
      console.error("Error loading product data", err);
    }
  }

  transformReportsByRole(roleBasedReports: any, columnData: any): any[] {
    const transformed: any[] = [];
    const roleReports = roleBasedReports;

    if (!roleReports) return [];
    for (const key in roleReports) {
      const report = roleReports[key];
      transformed.push({
        reportId: +key,
        parent_report_name: report.report_name,
        saveBtnEnable: true,
        columns: roleReports[key].columns,
        dialogVisible: false,
        isDisabled:false,
      });
    }
    return transformed;
  }

  isColumnSelected(selectedColumns: any[], colName: string): boolean {
    const found = selectedColumns.find(col => col.column === colName);
    return found ? found.is_selected : false;
  }

  toggleColumnSelectionByField(product: any, colName: string): void {
    const col = product.selectedColumns.find((c: any) => c.column === colName);
    if (col) {
      col.is_selected = !col.is_selected;
    } else {
      product.selectedColumns.push({
        column: colName,
        is_selected: true
      });
    }
  }

  openDialog(product: any) {
    product.dialogVisible = true;
  }

  closeDialog(product: any) {
    product.dialogVisible = false;
  }
}
