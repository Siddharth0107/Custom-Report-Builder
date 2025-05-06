import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ReportService } from './../service/report.service'
import { Filters, ReportColumns, Templates, TransformedReport, TransformedTemplate } from '../../types/reportTypes';

@Component({
  selector: 'ColumnDialog',
  templateUrl: './report-builder.component.html',
  styleUrl: './report-builder.component.css',
  standalone: true,
  imports: [Dialog, FormsModule, InputTextModule, ButtonModule, CommonModule],
})
export class ColumnDialog implements OnInit {
  @Input() data: any;
  @Input() visible: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  constructor(private reportService: ReportService) { }

  savedTempTemplate: Templates[] = [{
    id: 0,
    name: '',
    parent_report: {
      id: 0,
      report_name: '',
      report_columns: [],
      report_filters: [],
    },
    template: [],
    template_filter: [],
    dialogVisible: false,
  }];

  reportTypeData: TransformedReport = {
    columns: [],
    dialogVisible: false,
    isDisabled: false,
    outer_filters: [],
    parent_report_name: "",
    reportId: 0,
    saveBtnEnable: false,
  };

  templateTypeData: TransformedTemplate = {
    id: 0,
    name: '',
    parent_report: {
      id: 0,
      report_columns: [],
      report_filters: [],
      report_name: '',
    },
    template: [],
    template_filter: [],
  }

  last_template_id: number = 0;
  selectedFields: Set<ReportColumns> = new Set();
  selectedFilters: Set<Filters> = new Set();
  reportName: string = '';
  tempName: string = '';
  isTemporaryTemplate: boolean = false;

  ngOnInit(): void {
    if (this.data.columns) {
      this.reportTypeData = this.data;
      this.selectedFields = new Set();
      this.selectedFilters = new Set(this.reportTypeData.outer_filters.filter(f => f.is_compulsory));
    } else if (this.data.template) {
      this.templateTypeData = this.data;
      this.selectedFields = new Set(this.templateTypeData.template);
      this.selectedFilters = new Set(this.templateTypeData.template_filter);
      this.tempName = this.templateTypeData.name;
    } else {
      console.warn("this data is not in correct form")
    }
  }

  isSelected(action: string, field: ReportColumns): boolean {
    if (action === 'create') {
      return this.selectedFields.has(field);
    } else if (action === 'edit') {
      const reportColumns = Array.from(this.selectedFields).map(item => item.column_name);
      return reportColumns.includes(field.column_name);
    }
    return false;
  }

  isFilterSelected(action: string, filter: Filters): boolean {
    if (action === 'create') {
      return filter.is_compulsory || this.selectedFilters.has(filter);
    } else if (action === 'edit') {
      const reportFilters = Array.from(this.selectedFilters).map(
        (item) => item.filter_name
      );
      return reportFilters.includes(filter.filter_name);
    } else {
      return false;
    }
  }

  toggleField(field: ReportColumns): void {
    let existing = Array.from(this.selectedFields).find(
      (f: ReportColumns) => f.column_name === field.column_name
    );
    if (existing) {
      this.selectedFields.delete(existing);
      if (this.data.outer_filters) {
        const matchingFilter = this.data.outer_filters?.find(
          (f: Filters) => f.filter_name === field.column_name
        );
        if (matchingFilter) {
          this.selectedFilters.delete(matchingFilter);
        }
      } else {
        const matchingFilter = this.data.parent_report.report_filters?.find(
          (f: Filters) => {
            return f.filter_name === field.column_name;
          }
        );
        if (matchingFilter) {
          const existingFilter = Array.from(this.selectedFilters).find(
            (f: Filters) => f.filter_name === matchingFilter.filter_name
          );
          if (existingFilter) {
            this.selectedFilters.delete(existingFilter);
          }
        }
      }
    } else {
      this.selectedFields.add(field);
      if (this.data.outer_filters) {
        const matchingFilter = this.data.outer_filters?.find(
          (f: Filters) => f.filter_name === field.column_name
        );
        if (matchingFilter) {
          this.selectedFilters.add(matchingFilter);
        }
      } else {
        const matchingFilter = this.data.parent_report.report_filters?.find(
          (f: Filters) => f.filter_name == field.column_name
        );
        if (matchingFilter) {
          this.selectedFilters.add(matchingFilter);
        }
      }
    }
    this.data.selected_fields = Array.from(this.selectedFields);
    this.data.selected_filters = Array.from(this.selectedFilters).map((item: Filters) => ({
      filter_name: item.filter_name,
      filter_label: item.filter_label
    }));
  }

  toggleFilter(filter: Filters): void {
    try {
      const existingFilter = Array.from(this.selectedFilters).find(
        (f: Filters) => f.filter_name === filter.filter_name
      );

      if (existingFilter) {
        // If filter is already selected, remove it
        this.selectedFilters.delete(existingFilter);
      } else {
        // Otherwise, add it
        this.selectedFilters.add(filter);
      }

      // Update the selected_filters array
      this.data.selected_filters = Array.from(this.selectedFilters).map((item: Filters) => ({
        filter_name: item.filter_name,
        filter_label: item.filter_label
      }));

      console.log(this.data.selected_filters);
    } catch (error) {
      console.error('Error in toggleFilter:', error);
    }
  }

  close(): void {
    this.visible = false;
    this.onClose.emit();
  }

  //NOTE - seperate functions
  async createTemplate(reportTypeData: TransformedReport) {
    try {
      // Selected Column Guard Condition
      if (this.selectedFields.size === 0) {
        alert('Atleast select 1 column');
        return;
      }

      // Report Name Guard Condition
      if (this.tempName === '') {
        alert('Report Name Cannot be empty');
        return;
      }

      if (this.isTemporaryTemplate) {
        let savedTemplates = localStorage.getItem('tempTemplate');
        let lastId = localStorage.getItem('lastId');

        if (savedTemplates) {
          this.savedTempTemplate = JSON.parse(savedTemplates);
        } else {
          this.savedTempTemplate.pop();
        }

        if (lastId) {
          this.last_template_id = JSON.parse(lastId);
        }

        const tempTemplatePayload: Templates = {
          id: this.last_template_id + 1,
          name: this.tempName,
          parent_report: {
            id: reportTypeData.reportId,
            report_name: reportTypeData.parent_report_name,
            report_columns: reportTypeData.columns,
            report_filters: reportTypeData.outer_filters,
          },
          template: Array.from(this.selectedFields),
          template_filter: Array.from(this.selectedFilters),
          dialogVisible: false,
          isTemporary: true,
        };

        this.savedTempTemplate = this.savedTempTemplate.filter((t: any) => t.id !== 0);
        this.savedTempTemplate.push(tempTemplatePayload);
        localStorage.setItem('lastId', JSON.stringify(tempTemplatePayload.id));
        localStorage.setItem('tempTemplate', JSON.stringify(this.savedTempTemplate));
        this.visible = false;
      } else {
        const payload = {
          parent_report_id: reportTypeData.reportId,
          template_name: this.tempName,
          columns: Array.from(this.selectedFields),
          report_filters: Array.from(this.selectedFilters),
        };
        this.reportService.createTemplate(payload).subscribe({
          next: () => {
            this.visible = false;
          },
          error: (error: any) => {
            alert(error.error.error);
          },
        });
      }
    } catch (error) {
      console.error(error)
    }
  }

  async updateTemplate(templateTypeData: TransformedTemplate) {
    try {

      // Selected Column Guard Condition
      if (this.selectedFields.size === 0) {
        alert('Atleast select 1 column');
        return;
      }

      // Report Name Guard Condition
      if (this.tempName === '') {
        alert('Report Name Cannot be empty');
        return;
      }

      if (templateTypeData.isTemporary) {
        let savedTemplates = localStorage.getItem('tempTemplate');
        if (savedTemplates) {
          this.savedTempTemplate = JSON.parse(savedTemplates);
        }

        const tempTemplatePayload: Templates = {
          id: templateTypeData.id,
          name: this.tempName,
          parent_report: templateTypeData.parent_report,
          template: Array.from(this.selectedFields),
          template_filter: Array.from(this.selectedFilters),
          dialogVisible: false,
          isTemporary: true,
        };

        const index = this.savedTempTemplate.findIndex((t: any) => t.id === templateTypeData.id);
        if (index !== -1) {
          this.savedTempTemplate[index] = tempTemplatePayload;
        } else {
          this.savedTempTemplate.push(tempTemplatePayload);
        }

        localStorage.setItem('tempTemplate', JSON.stringify(this.savedTempTemplate));
        this.visible = false;
      } else {
        const payload = {
          template_id: templateTypeData.id,
          name: this.tempName,
          columns: Array.from(this.selectedFields),
          report_filters: Array.from(this.selectedFilters),
        };
        this.reportService.updateTemplate(payload).subscribe({
          next: () => {
            this.visible = false;
          },
          error: (error: any) => {
            alert(error.error.error);
          },
        });
      }

    } catch (error) {
      console.error(error)
    }
  }

  //NOTE - this is the combined function
  // async saveTemplate(isUpdate: boolean, data: TransformedReport | TransformedTemplate) {
  //   try {
  //     if (this.selectedFields.size === 0) {
  //       alert('At least select 1 column');
  //       return;
  //     }

  //     if (this.tempName === '') {
  //       alert('Report Name cannot be empty');
  //       return;
  //     }

  //     const payload = {
  //       columns: Array.from(this.selectedFields),
  //       report_filters: Array.from(this.selectedFilters),
  //     };

  //     let request$;

  //     if (isUpdate) {
  //       const updatePayload = {
  //         ...payload,
  //         template_id: (data as TransformedTemplate).id,
  //         name: this.tempName,
  //       };
  //       request$ = this.reportService.updateTemplate(updatePayload);
  //     } else {
  //       const createPayload = {
  //         ...payload,
  //         parent_report_id: (data as TransformedReport).reportId,
  //         template_name: this.tempName,
  //       };
  //       request$ = this.reportService.createTemplate(createPayload);
  //     }

  //     request$.subscribe({
  //       next: () => this.visible = false,
  //       error: (error: any) => alert(error.error.error),
  //     });

  //   } catch (error) {
  //     console.error(error);
  //   }
  // }
}
