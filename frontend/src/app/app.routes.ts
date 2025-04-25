import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { AllTemplatesComponent } from './all-templates/all-templates.component';
import { AllReportsComponent } from './all-reports/all-reports.component';

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

];
