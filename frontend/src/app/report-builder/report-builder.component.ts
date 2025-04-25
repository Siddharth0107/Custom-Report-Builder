import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ReportService } from './../service/report.service'
import { AppComponent } from '../app.component';

@Component({
  selector: 'ColumnDialog',
  templateUrl: './report-builder.component.html',
  styleUrl: './report-builder.component.css',
  standalone: true,
  imports: [Dialog, FormsModule, InputTextModule, ButtonModule, CommonModule]
})

export class ColumnDialog implements OnInit {
  @Input() data: any;
  @Input() visible: boolean = false;
  @Output() onClose = new EventEmitter<void>();

  constructor(private reportService: ReportService) { }

  selectedFields: Set<string> = new Set();
  reportName: string = '';

  ngOnInit(): void {
    if (this.data?.selected_fields) {
      this.selectedFields = new Set(this.data.selected_fields);
    } else {
      this.selectedFields = new Set();
    }
  }

  isSelected(field: string): boolean {
    return this.selectedFields.has(field);
  }

  toggleField(field: string): void {
    if (this.selectedFields.has(field)) {
      this.selectedFields.delete(field);
    } else {
      this.selectedFields.add(field);
    }
    this.data.selected_fields = Array.from(this.selectedFields); // save it back if needed
    console.log("selected fields", this.data.selected_fields);
  }

  close(): void {
    this.visible = false;
    this.onClose.emit();
  }

  async createTemplate(product: any) {
    try {
      product.generated_report_name = this.reportName
      product.selected_fields = this.data.selected_fields
      console.log("selected Product", product);

      const payload = {
        parent_report_id: product.reportId,
        template_name: product.generated_report_name,
        columns: product.selected_fields,
      }; 

      this.reportService.createTemplate(payload).subscribe({
        next: (response: any) => {
          console.log(response);
        },
        error: (err: any) => {
          console.log(err);
        }
      });

    } catch (error: any) {
      console.log(error);

    }
  }
}