import { Component, OnInit } from '@angular/core';
import { ReportService } from './../service/report.service';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { ColumnDialog } from '../report-builder/report-builder.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-all-templates',
  standalone: true,
  imports: [ButtonModule, ColumnDialog, CommonModule, ConfirmDialogModule],
  templateUrl: './all-templates.component.html',
  styleUrl: './all-templates.component.css',
  providers: [ConfirmationService]
})
export class AllTemplatesComponent implements OnInit {
  templates: any = [];
  reportData: any = {};

  allOuterFilers: any = {
    "1": [
      {
        "id": 1,
        "filter_name": "from_to_date",
        "filter_label": "From-To-Date",
        "filter_exists_in_report_columns": false
      },
      {
        "id": 2,
        "filter_name": "assign_to",
        "filter_label": "Assign To",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 3,
        "filter_name": "assign_by",
        "filter_label": "Assign By",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 4,
        "filter_name": "task_type",
        "filter_label": "Task Type",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 5,
        "filter_name": "priority",
        "filter_label": "Priority",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 6,
        "filter_name": "status",
        "filter_label": "Status",
        "filter_exists_in_report_columns": true
      }
    ],
    "2": [
      {
        "id": 7,
        "filter_name": "from_to_date",
        "filter_label": "From-To-Date",
        "filter_exists_in_report_columns": false
      },
      {
        "id": 8,
        "filter_name": "lead_source",
        "filter_label": "Lead Source",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 9,
        "filter_name": "lead_lost_reason",
        "filter_label": "Lead Lost Reason",
        "filter_exists_in_report_columns": false
      },
      {
        "id": 10,
        "filter_name": "status",
        "filter_label": "Status",
        "filter_exists_in_report_columns": true
      }
    ],
    "3": [
      {
        "id": 11,
        "filter_name": "from_to_date",
        "filter_label": "From-To-Date",
        "filter_exists_in_report_columns": false
      },
      {
        "id": 12,
        "filter_name": "company",
        "filter_label": "Company",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 13,
        "filter_name": "enquiry_lost_reason",
        "filter_label": "Enquiry Lost Reason",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 14,
        "filter_name": "assign_to",
        "filter_label": "Assign To",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 15,
        "filter_name": "status",
        "filter_label": "Status",
        "filter_exists_in_report_columns": true
      }
    ],
    "4": [
      {
        "id": 16,
        "filter_name": "from_to_date",
        "filter_label": "From-To-Date",
        "filter_exists_in_report_columns": false
      },
      {
        "id": 17,
        "filter_name": "company",
        "filter_label": "Company",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 18,
        "filter_name": "status",
        "filter_label": "Status",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 19,
        "filter_name": "assign_to",
        "filter_label": "Assign To",
        "filter_exists_in_report_columns": true
      }
    ],
    "5": [
      {
        "id": 20,
        "filter_name": "report_type",
        "filter_label": "Report Type",
        "filter_exists_in_report_columns": false
      },
      {
        "id": 21,
        "filter_name": "from_to_date",
        "filter_label": "From-To-Date",
        "filter_exists_in_report_columns": false
      },
      {
        "id": 22,
        "filter_name": "company",
        "filter_label": "Company",
        "filter_exists_in_report_columns": true
      },
      {
        "id": 23,
        "filter_name": "item_type",
        "filter_label": "Item Type",
        "filter_exists_in_report_columns": false
      },
      {
        "id": 24,
        "filter_name": "status",
        "filter_label": "Status",
        "filter_exists_in_report_columns": true
      }
    ]
  }

  constructor(
    private reportService: ReportService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.handleTemplateListing();
  }

  async handleTemplateListing() {
    try {
      this.reportService.getAllTemplates().subscribe({
        next: (response: any) => {
          this.templates = response;
        },
        error: (error: any) => {
          console.log(error);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  deleteTemplate(id: number) {
    this.reportService.deleteTemplate(id).subscribe({
      next: (response: any) => {
        console.log(response);
        this.handleTemplateListing();
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  confirmDeleteTemplate(id: number) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this template?',
      header: 'Delete Template',
      icon: 'pi pi-trash',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      closeOnEscape:false,
      accept: () => {
        this.deleteTemplate(id);
      }
    });
  }  

  openDialog(template: any) {
    template.dialogVisible = true;
  }

  closeDialog(template: any) {
    template.dialogVisible = false;
    this.handleTemplateListing();
  }

  createReportFromTemplate(id: number) {
    this.reportService.createSubReport({ template_id: id }).subscribe({
      next: (response: any) => {
        this.reportData = response;
        this.router.navigate(['./generated-report'], {
          state: {
            report_data: this.reportData
          }
        });
      },
      error: (error: any) => {
        console.error(error);
      }
    });
  }
}
