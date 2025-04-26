import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ReportService } from './../service/report.service'

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

  selectedFields: Set<any> = new Set();
  reportName: string = '';

  ngOnInit(): void {
    if (this.data?.selected_fields) {
      this.selectedFields = new Set(this.data.selected_fields);
    } else if (this.data?.template) {
      console.log(this.data.template)
      this.selectedFields = new Set(this.data.template);
    } else {
      this.selectedFields = new Set();
    }
  }

  isSelected(action: string, field: string): boolean {
    if (action === 'create') {
      return this.selectedFields.has(field); // Check if the field is in the Set (for 'create' action)
    } else if (action === 'edit') {
      const reportColumns = Array.from(this.selectedFields).map(item => item.column_name);
      return reportColumns.includes(field);
    }
    return false;
  }

  toggleField(field: any): void {
    console.log(field)
    console.log(this.selectedFields.has(field));
    // debugger
    const exists = Array.from(this.selectedFields).some(item => item.column_name === field.column_name);
    console.log(exists);
    if (exists) {
      this.selectedFields.delete(field);
      for (let item of this.selectedFields){
        if(item.column_name === field.column_name){
          this.selectedFields.delete(item);
          console.log(`Deleted : ${field.column_name}`);
          break;
        }
      }
    } else {
      this.selectedFields.add(field);
    }
    console.log(this.selectedFields);
    this.data.selected_fields = Array.from(this.selectedFields);
    console.log(this.data.selected_fields);
  }

  close(): void {
    this.visible = false;
    this.onClose.emit();
  }

  async createUpdateTemplate(product: any) {
    try {
      if (product.columns) {
        product.generated_report_name = this.reportNameToUse;
        product.selected_fields = Array.from(this.selectedFields).map(item => item.column_name);
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
      }

      else if (product?.template) {
        product.selected_fields = Array.from(this.selectedFields).map(item => item.column_name);
        const payload = {
          template_id: product.id,
          name: product.name,
          columns: product.selected_fields,
        }
        this.reportService.updateTemplate(payload).subscribe({
          next: (response: any) => {
            console.log(response);
          },
          error: (error: any) => {
            console.log(error);
          }
        })
      }
    } catch (error: any) {
      console.log(error);
    } finally {
      this.visible = false;
    }
  }

  get reportNameToUse() {
    return this.data?.name || this.reportName;
  }

  set reportNameToUse(value: string) {
    if (this.data) {
      this.data.name = value;
    } else {
      this.reportName = value;
    }
  }

}