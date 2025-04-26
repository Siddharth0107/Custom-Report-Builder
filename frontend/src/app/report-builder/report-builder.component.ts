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
    // debugger
    // const exists = Array.from(this.selectedFields).some(item => item.column_name === field.column_name);
    // if (exists) {
    //   this.selectedFields.delete(field);
    //   for (let item of this.selectedFields) {
    //     if (item.column_name === field.column_name) {
    //       this.selectedFields.delete(item);
    //       console.log(`Deleted : ${field.column_name}`);
    //       break;
    //     }
    //   }
    // } else {
    //   this.selectedFields.add(field);
    // }
    // this.data.selected_fields = Array.from(this.selectedFields);

    const fieldWithLabel = {
      column_name: field.column_name.toLowerCase().replace(' ', '_'),
      label: field.column_name
    };

    // Check if an object with the same db_column_name is already in the Set
    let existing = Array.from(this.selectedFields).find(
      (f: any) => f.column_name === fieldWithLabel.column_name
    );

    console.log(this.selectedFields);
    console.log(existing);
    console.log(fieldWithLabel);
    
    if (existing) {
      this.selectedFields.delete(existing);
      console.log('Removed existing:');
    } else {
      this.selectedFields.add(fieldWithLabel);
      console.log('Added new:');
    }

    console.log(this.selectedFields);
    this.data.selected_fields = Array.from(this.selectedFields);
  }

  close(): void {
    this.visible = false;
    this.onClose.emit();
  }

  async createUpdateTemplate(product: any) {
    try {
      if (product.columns) {
        product.generated_report_name = this.reportNameToUse;
        console.log(this.selectedFields);

        product.selected_fields = Array.from(this.selectedFields).map(
          (item: any) => ({
            ...item,
            label: item.label
          })
        );

        if (product.selected_fields.length == 0) {
          alert("Atleast select 1 column")
          return
        }

        if (product.generated_report_name == '') {
          alert("Report Name Cannot be empty")
          return
        }

        const payload = {
          parent_report_id: product.reportId,
          template_name: product.generated_report_name,
          columns: product.selected_fields,
        };

        console.log(product.selected_fields);
        // debugger
        this.reportService.createTemplate(payload).subscribe({
          next: (response: any) => {
            console.log(response);
            this.visible = false;
          },
          error: (error: any) => {
            alert(error.error.error)
          }
        });
      }

      else if (product?.template) {
        product.selected_fields = Array.from(this.selectedFields).map(
          (item: any) => ({
            ...item,
            abel: item.label
          })
        );
        if (product.name == "") {
          alert("Report name cannot be empty")
          return
        }

        if (product.selected_fields.length == 0) {
          alert("Atleast select 1 column")
          return
        }
        console.log(product.selected_fields);

        const payload = {
          template_id: product.id,
          name: product.name,
          columns: product.selected_fields,
        }
        this.reportService.updateTemplate(payload).subscribe({
          next: (response: any) => {
            console.log(response);
            this.visible = false;
          },
          error: (error: any) => {
            console.log(error.error.error);
            alert(error.error.error)
            return
          }
        })
      }
    } catch (error: any) {
      console.log(error);
    } finally {
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