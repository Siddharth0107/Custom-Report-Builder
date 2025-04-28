import { Component } from '@angular/core';
import { Product } from '../../domain/product';
import { ReportService } from '../service/report.service';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ColumnDialog } from '../report-builder/report-builder.component';

@Component({
  selector: 'app-all-reports',
  imports: [ColumnDialog, ButtonModule, FormsModule, CommonModule, TableModule, RouterModule],
  templateUrl: './all-reports.component.html',
  styleUrl: './all-reports.component.css'
})
export class AllReportsComponent {

  selectedProduct: any = null;
  columnData: any = {};
  ediBtnEnable: boolean = true;
  saveBtnEnable: boolean = true;
  roles: any = [
    { id: 1, name: "Sales Person" },
    { id: 2, name: "Delivery Partner" },
    { id: 3, name: "Manager" },
    { id: 4, name: "Accountant" },
    { id: 5, name: "Cashier" }
  ];

  // allOuterFilers: any = {
  //   "1": [
  //     {
  //       "id": 1,
  //       "filter_name": "from_to_date",
  //       "filter_label": "From-To-Date",
  //       "filter_exists_in_report_columns": false
  //     },
  //     {
  //       "id": 2,
  //       "filter_name": "assign_to",
  //       "filter_label": "Assign To",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 3,
  //       "filter_name": "assign_by",
  //       "filter_label": "Assign By",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 4,
  //       "filter_name": "task_type",
  //       "filter_label": "Task Type",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 5,
  //       "filter_name": "priority",
  //       "filter_label": "Priority",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 6,
  //       "filter_name": "status",
  //       "filter_label": "Status",
  //       "filter_exists_in_report_columns": true
  //     }
  //   ],
  //   "2": [
  //     {
  //       "id": 7,
  //       "filter_name": "from_to_date",
  //       "filter_label": "From-To-Date",
  //       "filter_exists_in_report_columns": false
  //     },
  //     {
  //       "id": 8,
  //       "filter_name": "lead_source",
  //       "filter_label": "Lead Source",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 9,
  //       "filter_name": "lead_lost_reason",
  //       "filter_label": "Lead Lost Reason",
  //       "filter_exists_in_report_columns": false
  //     },
  //     {
  //       "id": 10,
  //       "filter_name": "status",
  //       "filter_label": "Status",
  //       "filter_exists_in_report_columns": true
  //     }
  //   ],
  //   "3": [
  //     {
  //       "id": 11,
  //       "filter_name": "from_to_date",
  //       "filter_label": "From-To-Date",
  //       "filter_exists_in_report_columns": false
  //     },
  //     {
  //       "id": 12,
  //       "filter_name": "company",
  //       "filter_label": "Company",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 13,
  //       "filter_name": "enquiry_lost_reason",
  //       "filter_label": "Enquiry Lost Reason",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 14,
  //       "filter_name": "assign_to",
  //       "filter_label": "Assign To",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 15,
  //       "filter_name": "status",
  //       "filter_label": "Status",
  //       "filter_exists_in_report_columns": true
  //     }
  //   ],
  //   "4": [
  //     {
  //       "id": 16,
  //       "filter_name": "from_to_date",
  //       "filter_label": "From-To-Date",
  //       "filter_exists_in_report_columns": false
  //     },
  //     {
  //       "id": 17,
  //       "filter_name": "company",
  //       "filter_label": "Company",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 18,
  //       "filter_name": "status",
  //       "filter_label": "Status",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 19,
  //       "filter_name": "assign_to",
  //       "filter_label": "Assign To",
  //       "filter_exists_in_report_columns": true
  //     }
  //   ],
  //   "5": [
  //     {
  //       "id": 20,
  //       "filter_name": "report_type",
  //       "filter_label": "Report Type",
  //       "filter_exists_in_report_columns": false
  //     },
  //     {
  //       "id": 21,
  //       "filter_name": "from_to_date",
  //       "filter_label": "From-To-Date",
  //       "filter_exists_in_report_columns": false
  //     },
  //     {
  //       "id": 22,
  //       "filter_name": "company",
  //       "filter_label": "Company",
  //       "filter_exists_in_report_columns": true
  //     },
  //     {
  //       "id": 23,
  //       "filter_name": "item_type",
  //       "filter_label": "Item Type",
  //       "filter_exists_in_report_columns": false
  //     },
  //     {
  //       "id": 24,
  //       "filter_name": "status",
  //       "filter_label": "Status",
  //       "filter_exists_in_report_columns": true
  //     }
  //   ]
  // }


  filteredRoles: any[] = [];
  products!: Product[];
  showSubmit = true;
  overAllData: any = [];
  selectedTab: string = '';
  allOuterFilers:any = [];

  constructor(private reportService: ReportService, private router: Router) { }

  search(event: any) {
    const query = event.query.toLowerCase();
    this.filteredRoles = this.roles.filter((role: any) =>
      role.name.toLowerCase().includes(query)
    );
  }
  async ngOnInit() {
    try {
      this.reportService.getAllReportsWithColumns().subscribe({
        next: (response: any) => {
          this.overAllData = response;
          if (response?.data?.length) {
            const transformedReports = this.transformReportsByRole(response.data);
            this.products = transformedReports;
            console.log(transformedReports);
          }
        },
        error: (error: any) => {
          console.error("Error fetching reports", error);
        }
      });
    } catch (err) {
      console.error("Error loading product data", err);
    }
  }
  
  transformReportsByRole(roleReports: any): any[] {
    if (!roleReports) return [];
  
    return roleReports.map((report: any) => ({
      reportId: report.id,
      parent_report_name: report.report_name,
      saveBtnEnable: true,
      columns: report.report_columns,
      outer_filters: report.report_filters.filter((filter: any) =>filter.report_id == report.id), 
      dialogVisible: false,
      isDisabled: false,
    }));
  }
  
  isColumnSelected(selectedColumns: any[], colName: string): boolean {
    const found = selectedColumns.find(col => col.column === colName);
    return found ? found.is_selected : false;
  }

  toggleColumnSelectionByField(product: any, colName: string): void {
    const col = product.selectedColumns.find((c: any) => c.column === colName);
    if (col) {
      col.is_selected = !col.is_selected;
    } else {
      product.selectedColumns.push({
        column: colName,
        is_selected: true
      });
    }
  }

  openDialog(product: any) {
    product.dialogVisible = true;
  }

  closeDialog(product: any) {
    product.dialogVisible = false;
  }
}
