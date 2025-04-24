import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../domain/product';
import { ProductService } from '../service/productservice';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ReportService } from './service/report.service';
import { ColumnDialog } from './report-builder/report-builder.component';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.css',
  standalone: true,
  imports: [ColumnDialog, ButtonModule, FormsModule, CommonModule, TableModule, RouterModule, AutoCompleteModule], // <-- Add CommonModule here
  providers: [ProductService]
})

export class AppComponent implements OnInit {
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
  roleValue = { id: 4, name: 'Accountant' };
  products!: Product[];
  showSubmit = true;
  overAllData: any = [];

  constructor(private productService: ProductService, private reportService: ReportService) { }

  search(event: any) {
    const query = event.query.toLowerCase();
    this.filteredRoles = this.roles.filter((role: any) =>
      role.name.toLowerCase().includes(query)
    );
  }

  async ngOnInit() {
    try {
      this.columnData = await this.productService.getProductsMini();
      this.reportService.handleList().subscribe({
        next: (response: any) => {
          this.overAllData = response;
          const transformedReports = this.transformReportsByRole(response, this.roleValue.id, this.columnData);
          this.products = transformedReports;
        },
        error: (error: any) => {
          console.error("Error fetching reports", error);
        }
      });
    } catch (err) {
      console.error("Error loading product data", err);
    }
  }

  save(product: any) {
    product.ediBtnEnable = false;
    product.saveBtnEnable = true;
    this.showSubmit = false;
  }

  submit() {
    const selectedData = this.products.filter(product => product.saveBtnEnable).map(product => ({
      report_name: product.name,
      role: this.roleValue,
      report_id: product.reportId,
      all_fields: product.selectedColumns,
      alldata: product,
    }));

    this.reportService.submitReport(selectedData).subscribe({
      next: (response: any) => {
        console.log('Submitted Successfully:', response);
      },
      error: (error: any) => {
        console.error('Error submitting data:', error);
      }
    });
    this.showSubmit = true;
  }

  edit(product: any) {
    product.ediBtnEnable = true;
    product.saveBtnEnable = false;
  }

  transformReportsByRole(roleBasedReports: any, selectedRoleId: number, columnData: any): any[] {
    const transformed: any[] = [];
    const roleReports = roleBasedReports[selectedRoleId];

    if (!roleReports) return [];

    for (const key in roleReports) {
      const report = roleReports[key];
      const selectedColumns = report.columns.map((col: any) => ({
        column: col.column,
        is_selected: col.is_selected
      }));

      const matchingColumnData = columnData.find((item: any) => {
        if (item.report_id == key) {
          return item
        }
      });

      transformed.push({
        reportId: key,
        code: key,
        name: report.report_name,
        selectedColumns,
        saveBtnEnable: true,
        columns: roleReports[key].columns,
        dialogVisible:false,
        all_fields: matchingColumnData ? matchingColumnData.columnsList : [],
      });
    }
    return transformed;
  }

  onRoleChange() {
    const transformed = this.transformReportsByRole(this.overAllData, this.roleValue.id, this.columnData);
    this.products = transformed;
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