// import { Component, inject, OnInit } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { CommonModule } from '@angular/common';
// import {RouterModule} from '@angular/router';
// import { TableModule } from 'primeng/table';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [CommonModule, RouterModule, TableModule],
//   templateUrl: 'app.component.html',
// })
// export class AppComponent implements OnInit {
//   private http = inject(HttpClient);

//   response: string | null = null;
//   error: string | null = null;
//   isLoading = false;

//   products=[];

//   constructor(private productService: ProductService) {}

//   ngOnInit() {
//     this.productService.getProductsMini().then((data) => {
//         this.products = data;
//     });
// }

//   // callApi() {
//   //   this.isLoading = true;
//   //   this.error = null;
//   //   this.response = null;

//   //   this.http.get<any>('http://localhost:8000/api/demo/').subscribe({
//   //     next: (res) => {
//   //       this.response = res.message;
//   //     },
//   //     error: (err) => {
//   //       this.error = err.message;
//   //       console.error('API Error:', err);
//   //     },
//   //     complete: () => {
//   //       this.isLoading = false;
//   //     }
//   //   });
//   // }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Add this
import { Product } from '../domain/product';
import { ProductService } from '../service/productservice';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms'; // ⬅️ Add this import


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule, TableModule, RouterModule, AutoCompleteModule], // <-- Add CommonModule here
  providers: [ProductService]
})

export class AppComponent implements OnInit {
  roles:any= [] ;

  roleValue='';
  products!: Product[];
  count = Array.from({ length: 10 });

  constructor(private productService: ProductService) {}

  search(event: any) {
    let _roles = [...Array(10).keys()];

    this.roles = event.query ? [...Array(10).keys()].map((role) => event.query + '-' + role) : _roles;
    }


  ngOnInit() {
    this.productService.getProductsMini().then((data) => {
      this.products = data;
    });
  }
}
