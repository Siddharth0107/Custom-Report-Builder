import { Component } from '@angular/core';
import { ReportService } from '../service/report.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { OuterFilterViewData } from '../../types/reportTypes';
import { MultiSelectModule } from 'primeng/multiselect';
// Define enum outside the component class
export enum MultiSelectFields {
  Status = 'status',  // Add more fields for multi-select if needed
}

@Component({
  selector: 'app-outer-filter-view',
  imports: [AutoCompleteModule, FormsModule, CommonModule, MultiSelectModule,ButtonModule],
  templateUrl: './outer-filter-view.component.html',
  styleUrls: ['./outer-filter-view.component.css']
})
export class OuterFilterViewComponent {
  templateId: number = 0;
  reportData: OuterFilterViewData = {};
  dropdownValues: { [key: string]: string | string[] } = {}; 
  suggestions: string[] = [];
  filteredOptions: { [key: string]: string[] } = {};

  constructor(private location: Location, private reportService: ReportService, private router: Router) {}

  ngOnInit(): void {
    this.templateId = history.state.id;
    this.reportData = history.state.report_data;
    if (!this.templateId) {
      this.location.back();
      return;
    }
    this.reportService.showFilterView({ template_id: this.templateId }).subscribe({
      next: (response: any) => {
        this.reportData = response.Data;
      },
      error: (error: any) => {
        console.error(error);
      }
    });
  }


  isMultiSelect(field: string): boolean {
    return Object.values(MultiSelectFields).includes(field as MultiSelectFields);
  }

  filterSuggestions(event: any, key: string) {
    const query = event.query.toLowerCase();
    this.filteredOptions[key] = this.reportData[key].filter((item: string) =>
      item.toLowerCase().includes(query)
    );
  }

  objectKeys = Object.keys;

  getLabelName(key: string) {
    key = key.replaceAll('_', ' ');
    key = key.charAt(0).toUpperCase() + key.slice(1);
    return key;
  }

  generateFilters() {
    const dynamicFilters: { [key: string]: string | string[] } = {};

    for (const key of Object.keys(this.reportData)) {
      if (this.isMultiSelect(key)) {
        dynamicFilters[key] = [];  // Multi-select fields will be empty by default
      } else {
        dynamicFilters[key] = '';  // Single-select fields will be a single value
      }
    }

    return dynamicFilters;
  }

  async createSubReport() {
    const payload = {
      template_id: this.templateId,
      filters: this.dropdownValues
    };

    this.reportService.createSubReport(payload).subscribe({
      next: (response: any) => {
        this.router.navigate(['/generated-report'], {
          state: {
            report_data: response
          }
        });
      },
      error: (error: any) => {
        alert(error.error.error)
      }
    });
  }
}
