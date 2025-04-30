import { Component } from '@angular/core';
import { ReportService } from '../service/report.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { OuterFilterViewData } from '../../types/reportTypes';

@Component({
  selector: 'app-outer-filter-view',
  imports: [AutoCompleteModule, FormsModule, CommonModule, ButtonModule],
  templateUrl: './outer-filter-view.component.html',
  styleUrl: './outer-filter-view.component.css'
})
export class OuterFilterViewComponent {
  templateId: number = 0;
    reportData: OuterFilterViewData = {}
  dropdownValues: { [key: string]: string } = {};
  suggestions: string[] = [];

  constructor(private location: Location, private reportService: ReportService, private router: Router) { }
  ngOnInit(): void {
    this.templateId = history.state.id;
    this.reportData = history.state.report_data;
    if (!this.templateId) {
      this.location.back();
      return
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

  filterFields(event: any) {
    const query = event.query.toLowerCase();
    const options = this.reportData['assigned_to'] || [];
    this.suggestions = options.filter((option: string) =>
      option.toLowerCase().includes(query)
    );
  }
  

  objectKeys = Object.keys;

  filteredOptions: { [key: string]: string[] } = {};

  filterSuggestions(event: any, key: string) {
    const query = event.query.toLowerCase();
    this.filteredOptions[key] = this.reportData[key].filter((item: string) =>
      item.toLowerCase().includes(query)
    );
  }

  getLabelName(key: string) {
    key = key.replaceAll('_', ' ')
    key = key.charAt(0).toUpperCase() + key.slice(1);
    return key
  }

  async createSubReport() {
    const payload = {
      template_id: this.templateId,
      filters: this.dropdownValues
    }

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
    })
  }
}
