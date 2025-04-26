import { Routes } from '@angular/router';
import { AllTemplatesComponent } from './all-templates/all-templates.component';
import { AllReportsComponent } from './all-reports/all-reports.component';
import { GeneratedReportComponent } from './generated-report/generated-report.component';

export const routes: Routes = [
    {
        path: 'reports',
        component: AllReportsComponent,
        title: 'Reports'
    },
    {
        path: 'templates',
        component: AllTemplatesComponent,
        title: 'All Templates'
    },
    {
        path:'generated-report',
        component:GeneratedReportComponent,
        title:"Generated Report",
    }
];
