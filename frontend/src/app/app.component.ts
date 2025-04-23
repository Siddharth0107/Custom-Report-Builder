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
  roleValue={id:0,name:''};
  products!: Product[];
  count = Array.from({ length: 10 });

  constructor(private productService: ProductService, private reportService: ReportService) {}

  search(event: any) {
    const query = event.query.toLowerCase();
    this.filteredRoles = this.roles.filter((role:any) =>
      role.name.toLowerCase().includes(query)
    );
  }

  ngOnInit() {
    this.productService.getProductsMini().then((data) => {
      // Add selectedColumns field dynamically to each product
      this.products = data.map((product: any) => ({
        ...product,
        selectedColumns: product.columnsList.map((col: string) => ({
          column: col,
          is_selected: false
        })),
        isSaved: false,
      }));      
    });
  }

  save(product: any) {
    if (!this.isAnyColumnSelected(product)) return;
    product.readonly = true;
    product.isSaved = true;
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
  }

  isAnyColumnSelected(product: any): boolean {
    return product.selectedColumns.some((col: any) => col.is_selected);
  }

  isAnyReportSaved(): boolean {
    return this.products.some(product => product.isSaved);
  } 

  edit(product: any) {
    product.readonly = false;
  }
}