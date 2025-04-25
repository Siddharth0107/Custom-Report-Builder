import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../domain/product';
import { ProductService } from '../service/productservice';
import { RouterModule, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ReportService } from './service/report.service';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.css',
  standalone: true,
  imports: [TabsModule, ButtonModule, FormsModule, CommonModule, TableModule, RouterModule, AutoCompleteModule], // <-- Add CommonModule here
  providers: [ProductService]
})

export class AppComponent {
  tabs = [
    { route: 'reports', label: 'Reports', icon: 'pi pi-home' ,pathMatch:'full'},
    { route: 'templates', label: 'Templates', icon: 'pi pi-chart-line' },
  ];
  constructor(private reportService: ReportService, private router:Router) { }
}