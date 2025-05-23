import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../service/productservice';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.css',
  standalone: true,
  imports: [TabsModule, ButtonModule, FormsModule, CommonModule, TableModule, RouterModule, AutoCompleteModule], // <-- Add CommonModule here
  providers: [ProductService]
})

export class AppComponent {
  activeTab = '';
  tabs = [
    { route: 'reports', label: 'Reports', icon: 'pi pi-home', pathMatch: 'full' },
    { route: 'templates', label: 'Templates', icon: 'pi pi-list' },
    { route: 'outer-filter-view', label: 'Filter Selection', icon: 'pi pi-receipt', disabled: true },
    { route: 'generated-report', label: 'Generated Report', icon: 'pi pi-book', disabled: true },
  ];
  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects || event.url;
        const firstSegment = url.split('/')[1];
        this.activeTab = firstSegment;
      });
  }
}