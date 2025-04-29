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
    this.reportService.showFilterView({ template_id: id }).subscribe({
      next: (response: any) => {
        this.reportData = response;
        this.router.navigate(['./outer-filter-view'], {
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
