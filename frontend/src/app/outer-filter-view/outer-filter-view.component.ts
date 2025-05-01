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
  reportData: Array<OuterFilterViewData> = [{
    filter_label: '',
    filter_name: '',
    filter_type: '',
    is_compulsory: false,
    values: [],
  }];

  dropdownValues: { [key: string]: string } = {};
  suggestions: string[] = [];
  filteredOptions: { [key: string]: string[] } = {};

  constructor(private location: Location, private reportService: ReportService, private router: Router) { }

  ngOnInit(): void {
    if (!this.templateId) {
      this.location.back();
      return;
    }
    this.templateId = history.state.id;
    this.reportData = history.state.report_data.data;
  }

  filterSuggestions(event: any, key: string) {
    const query = event.query.toLowerCase();
    const matchedItem = this.reportData.find((item:OuterFilterViewData) => item.filter_name === key);
    if (matchedItem) {
      this.filteredOptions[key] = matchedItem.values.filter((value: string) =>
        value.toLowerCase().includes(query)
      );
    }
  }

  getLabelName(key: string) {
    key = key.replaceAll('_', ' ');
    key = key.charAt(0).toUpperCase() + key.slice(1);
    return key;
  }

  createSubReport() {
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
        alert(error.error?.error || 'Something went wrong');
      }
    });
  }
}
