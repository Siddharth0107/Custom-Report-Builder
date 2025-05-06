import { Component } from '@angular/core';
import { ReportService } from '../service/report.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { OuterFilterViewData } from '../../types/reportTypes';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { CalendarModule } from 'primeng/calendar'
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-outer-filter-view',
  imports: [AutoCompleteModule, FormsModule, CommonModule, ButtonModule, MultiSelectModule, SelectModule, CalendarModule, DatePickerModule],
  templateUrl: './outer-filter-view.component.html',
  styleUrl: './outer-filter-view.component.css'
})
export class OuterFilterViewComponent {
  templateId: number = 0;
  parentReportId: number = 0;
  isTemporary: boolean = false;
  reportData: Array<OuterFilterViewData> = [{
    filter_label: '',
    filter_name: '',
    filter_type: '',
    is_compulsory: false,
    values: [],
  }];

  dropdownValues: { [key: string]: any } = {};

  suggestions: string[] = [];
  filteredOptions: { [key: string]: string[] } = {};

  constructor(private location: Location, private reportService: ReportService, private router: Router) { }

  ngOnInit(): void {
    this.templateId = history.state.id;
    this.parentReportId = history.state.parent_report_id;
    this.isTemporary = history.state.is_temporary;
    if (!this.templateId) {
      this.location.back();
      return;
    }
    const incomingData = history.state.report_data;
    if (!incomingData) {
      this.location.back();
      return;
    }

    this.reportData = incomingData;

    // Initialize default dropdown values (e.g., set today's date for date filters)
    for (const item of this.reportData) {
      if (item.filter_type === 'date') {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        this.dropdownValues[item.filter_name] = [lastMonth, today];
      } else {
        this.dropdownValues[item.filter_name] = '';
      }
    }
  }

  filterSuggestions(event: any, key: string) {
    const query = event.query.toLowerCase();
    if (query.startsWith('#')) {
      const matchedItem = this.reportData.find((item: OuterFilterViewData) => item.filter_name === key);
      if (matchedItem) {
        this.filteredOptions[key] = matchedItem.values.filter((value: string) =>
          value.toLowerCase().includes(query.slice(1)) // removing '#' from the query for matching
        );
      }
    } else {
      const matchedItem = this.reportData.find((item: OuterFilterViewData) => item.filter_name === key);
      if (matchedItem) {
        this.filteredOptions[key] = matchedItem.values.filter((value: string) =>
          value.toLowerCase().includes(query)
        );
      }
    }
  }

  getLabelName(key: string) {
    key = key.replaceAll('_', ' ');
    key = key.charAt(0).toUpperCase() + key.slice(1);
    return key;
  }

  createSubReport() {
    const filters = { ...this.dropdownValues };

    // Format the from_to_date if it's present
    if (filters['from_to_date'] && filters['from_to_date'].length === 2) {
      const [from, to] = filters['from_to_date'];

      const formatDate = (date: Date) =>
        date instanceof Date
          ? date.toISOString().slice(0, 10)
          : date;

      filters['from_to_date'] = [formatDate(from), formatDate(to)];
    }

    // Construct the payload based on whether it's a temporary template
    let payload: any;
    if (this.isTemporary && this.parentReportId) {
      payload = {
        report_id: this.parentReportId,
        filters: filters
      };
    } else {
      payload = {
        template_id: this.templateId,
        filters: filters
      };
    }

    // API call
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

  onDoubleClick(autoComp: any, filterName: string) {
    this.filterSuggestions({ query: '#' }, filterName);
    autoComp.show();
  }
}
