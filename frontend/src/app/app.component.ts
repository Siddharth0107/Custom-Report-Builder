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

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [ButtonModule, FormsModule, CommonModule, TableModule, RouterModule, AutoCompleteModule], // <-- Add CommonModule here
  providers: [ProductService]
})

export class AppComponent implements OnInit {
  ediBtnEnable:boolean=true;
  saveBtnEnable:boolean=true;
  roles: any = [
    { id: 1, name: "Sales Person" },
    { id: 2, name: "Delivery Partner" },
    { id: 3, name: "Manager" },
    { id: 4, name: "Accountant" },
    { id: 5, name: "Cashier" }
  ];
  filteredRoles: any[] = [];
  roleValue={id:4,name:'Accountant'};
  products!: Product[];
  count = Array.from({ length: 10 });
  showSubmit = true;

  constructor(private productService: ProductService, private reportService: ReportService) {}

  search(event: any) {
    const query = event.query.toLowerCase();
    this.filteredRoles = this.roles.filter((role:any) =>
      role.name.toLowerCase().includes(query)
    );
  }

  ngOnInit() {
    this.reportService.handleList().subscribe({
      next: (response: any) => {
        console.log('Raw Response:', response);
        const transformedReports = this.transformReportsByRole(response, this.roleValue.id);
        console.log('Reports for Role:', this.roleValue.name, transformedReports);
        this.products = transformedReports;
      },
      error: (error: any) => {
        console.error("Error", error);
      }
    });
  }


  save(product: any) {
    console.log("this",!this.isAnyColumnSelected);
    console.log("product",product);
    product.readonly = true;
    product.isSaved = true;
    product.ediBtnEnable = false;
    product.saveBtnEnable = false;
    this.showSubmit = false;
    console.log('Saved for:', product.name, product.selectedColumns);
  }


  submit() {
    const selectedData = this.products.filter(product => product.isSaved).map(product => ({
      report_name: product.name,
      role: this.roleValue,
      report_id:product.code,
      all_fields: product.selectedColumns
    }));

    console.log('Final Submitted Data:', selectedData);

    this.reportService.submitReport(selectedData).subscribe({
      next: (response:any) => {
        console.log('Submitted Successfully:', response);
      },
      error: (error:any) => {
        console.error('Error submitting data:', error);
      }
    });
    this.showSubmit = true;
  }

  isAnyColumnSelected(product: any): boolean {
    return product.selectedColumns.some((col: any) => col.is_selected);
  }

  edit(product: any) {
    product.ediBtnEnable = true;
    product.saveBtnEnable = true;
  }

  transformReportsByRole(roleBasedReports: any, selectedRoleId: number): any[] {
    const transformed: any[] = [];
    const roleReports = roleBasedReports[selectedRoleId];
    if (!roleReports) return [];

    for (const key in roleReports) {
      const report = roleReports[key];

      const selectedColumns = report.columns.map((col: any) => ({
        column: col.column,
        is_selected: col.is_selected
      }));

      transformed.push({
        reportId: key,
        code: key,
        name: report.report_name,
        selectedColumns,
        isSaved: false,
        columns:roleReports[key].columns,
      });
    }
    return transformed;
  }


  onRoleChange() {
    console.log("changed");

    this.reportService.handleList().subscribe({
      next: (response: any) => {
        const transformed = this.transformReportsByRole(response, this.roleValue.id);
        this.products = transformed;
      },
      error: (error: any) => {
        console.error('Error changing role:', error);
      }
    });
  }

  toggleColumnSelection(product: any, column: any) {
    column.is_selected = !column.is_selected;
    product.isSaved = false;
    product.saveBtnEnable = true;
    this.showSubmit = true;
  }

}