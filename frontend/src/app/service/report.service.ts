// src/app/service/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private getAllReportsWithColumnsUrl = 'http://localhost:8000/api/get-reports/'; // Replace with your Django URL
  private createTemplateUrl = 'http://localhost:8000/api/create-template/';
  private updateTemplateUrl = 'http://localhost:8000/api/update-template/';
  private getAllTemplatesUrl = 'http://localhost:8000/api/get-templates/';
  private deleteTemplatesUrl = 'http://localhost:8000/api/delete-template/';
  private createSubReportUrl = 'http://localhost:8000/api/create-sub-report/';
  private showFilterViewUrl = 'http://localhost:8000/api/get-filter-values/';

  constructor(private http: HttpClient) { }

  getAllReportsWithColumns(): Observable<any> {
    return this.http.get(this.getAllReportsWithColumnsUrl);
  }

  createTemplate(data: any): Observable<any> {
    return this.http.post(this.createTemplateUrl, data);
  }

  updateTemplate(data: any): Observable<any> {
    return this.http.put(this.updateTemplateUrl, data);
  }

  getAllTemplates(): Observable<any> {
    return this.http.get(this.getAllTemplatesUrl);
  }

  deleteTemplate(id: any): Observable<any> {
    const options = {
      body: { template_id: id }
    };
    return this.http.delete(this.deleteTemplatesUrl, options);
  }

  createSubReport(payload: any): Observable<any> {
    return this.http.post(this.createSubReportUrl, payload);
  }

  showFilterView(payload: any): Observable<any> {
    return this.http.post(this.showFilterViewUrl, payload);
  }
}
