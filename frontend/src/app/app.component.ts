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
  roles: any = [
    { id: 1, name: "Sales Person" },
    { id: 2, name: "Delivery Partner" },
    { id: 3, name: "Manager" },
    { id: 4, name: "Accountant" },
    { id: 5, name: "Cashier" }
  ];
  filteredRoles: any[] = []; 
  roleValue={id:1,name:'Sales Person'};
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
      next:(response:any)=>{
        console.log(typeof response);
        
        this.products = response.map((product: any) => ({
          ...product,
          selectedColumns: product.columnsList.map((col: string) => ({
            column: col,
            is_selected: false
          })),
          isSaved: false,
        }));    
        console.log("Response",response)
        console.log("products",this.products)
      },
      error:(error:any)=>{
        console.error("Error",error)
      }
    })

    this.products = this.transformReportsByRole(this.products, this.roleValue.id,this.products);
  }

  save(product: any) {
    if (!this.isAnyColumnSelected(product)) return;
    product.readonly = true;
    product.isSaved = true;
    this.showSubmit = true;
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
    this.showSubmit = false;
  }

  isAnyColumnSelected(product: any): boolean {
    return product.selectedColumns.some((col: any) => col.is_selected);
  }

  // isAnyReportSaved(): boolean {
  //   return this.products.some(product => product.isSaved)  
  // } 

  edit(product: any) {
    product.readonly = false;
  }

  transformReportsByRole(dataFromAPI: any, selectedRoleId: number, products: any[]): any[] {
    const transformed: any[] = [];

    const roleReports = dataFromAPI[selectedRoleId];
    if (!roleReports) return [];
  
    for (const product of products) {
      for (const reportId in roleReports) {
        const report = roleReports[reportId];
  
        // Build a map of selected columns
        const selectionMap = new Map(
          report.selected_columns.map((item: any) => [item.column, item.is_selected])
        );
  
        const selectedColumns = product.columnsList.map((col: string) => ({
          column: col,
          is_selected: selectionMap.get(col) || false,
        }));
  
        transformed.push({
          reportId,
          name: report.name,
          selectedColumns,
          isSaved: false,
        });
      }
    }
  
    return transformed;
  }
   

  onRoleChange() {
    this.products = this.transformReportsByRole(this.products, this.roleValue.id,this.products);
  }
}