import { Component, OnInit } from '@angular/core';
import { ReportService } from './../service/report.service';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { ColumnDialog } from '../report-builder/report-builder.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Filters, OuterFilterViewData, Templates } from '../../types/reportTypes';

@Component({
  selector: 'app-all-templates',
  standalone: true,
  imports: [ButtonModule, ColumnDialog, CommonModule, ConfirmDialogModule],
  templateUrl: './all-templates.component.html',
  styleUrl: './all-templates.component.css',
  providers: [ConfirmationService]
})

export class AllTemplatesComponent implements OnInit {
  templates: Templates[] = [{
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

  reportData: OuterFilterViewData = {
    filter_label: '',
    filter_name: '',
    filter_type: '',
    is_compulsory: false,
    values: [],
  };

  constructor(
    private reportService: ReportService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.handleTemplateListing();
  }

  async handleTemplateListing() {
    try {
      const temp = localStorage.getItem('tempTemplate');
      if (temp) {
        this.savedTempTemplate = JSON.parse(temp);
      }

      this.reportService.getAllTemplates().subscribe({
        next: (response: any) => {
          this.templates = response;
          if (temp) {
            const validTemplates = this.savedTempTemplate.filter((t: any) => t.id !== 0);
            this.templates.push(...validTemplates)
          }
        },
        error: (error: any) => {
          console.error(error);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  deleteTemplate(id: number, isTemporary: boolean) {
    if (isTemporary) {
      const index = this.savedTempTemplate.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        this.savedTempTemplate.splice(index, 1);
        localStorage.setItem('tempTemplate', JSON.stringify(this.savedTempTemplate));
      }
      this.handleTemplateListing()
    } else {
      this.reportService.deleteTemplate(id).subscribe({
        next: () => {
          this.handleTemplateListing();
        },
        error: (error: any) => {
          console.error(error);
        }
      });
    }
  }

  confirmDeleteTemplate(id: number, isTemporary: boolean | undefined) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this template?',
      header: 'Delete Template',
      icon: 'pi pi-trash',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      closeOnEscape: false,
      accept: () => {
        this.deleteTemplate(id, isTemporary as boolean);
      }
    });
  }

  openDialog(template: Templates) {
    template.dialogVisible = true;
  }

  closeDialog(template: Templates) {
    template.dialogVisible = false;
    this.handleTemplateListing();
  }

  createReportFromTemplate(id: number, isTemporary: boolean | undefined) {
    console.log("id=>", id);
    if (isTemporary) {
      let data: Templates[];
      let temp = localStorage.getItem('tempTemplate');
      if (temp) {
        data = JSON.parse(temp);
        console.log(data);

        // Prepare the payload with filter_name and filter_label
        const payload = {
          report_id: data[id - 1].parent_report.id,
          filter_names: data[id - 1].template_filter.map((item: Filters) => ({
            filter_name: item.filter_name,
            filter_label: item.filter_label, // Make sure filter_label is available in the data
          }))
        };

        this.reportService.showFilterView(payload).subscribe({
          next: (response: any) => {
            this.reportData = response.data;
            this.router.navigate(['./outer-filter-view'], {
              state: {
                report_data: this.reportData,
                id: id,
              }
            });
          },
          error: (error: any) => {
            console.error(error);
          }
        });
      }

    } else {
      this.reportService.showFilterView({ template_id: id }).subscribe({
        next: (response: any) => {
          this.reportData = response.data;
          this.router.navigate(['./outer-filter-view'], {
            state: {
              report_data: this.reportData,
              id: id,
            }
          });
        },
        error: (error: any) => {
          console.error(error);
        }
      });
    }
  }
}
