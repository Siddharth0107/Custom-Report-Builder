import { Component, OnInit } from '@angular/core';
import { ReportService } from './../service/report.service'
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { ColumnDialog } from './../report-builder/report-builder.component'

@Component({
  selector: 'app-all-templates',
  imports: [ButtonModule, ColumnDialog, CommonModule],
  templateUrl: './all-templates.component.html',
  styleUrl: './all-templates.component.css'
})
export class AllTemplatesComponent implements OnInit {

  templates: any = [];

  constructor(private reportService: ReportService, private router: Router) { }

  async handleTemplateListing() {
    try {
      this.reportService.getAllTemplates().subscribe({
        next: (response: any) => {
          this.templates = response;
        },
        error: (error: any) => {
          console.log(error);
        }
      })
    } catch (error) {
      console.log(error);
    }
  }


  async ngOnInit() {
    this.handleTemplateListing()
  }

  deleteTemplate(id: any) {
    this.reportService.deleteTemplate(id).subscribe({
      next: (response: any) => {
        console.log(response);
        this.handleTemplateListing()
      },
      error: (error: any) => {
        console.log(error)
      }
    })
  }

  openDialog(template: any) {
    template.dialogVisible = true;
  }

  closeDialog(template: any) {
    template.dialogVisible = false;
    this.handleTemplateListing();
  }
}
