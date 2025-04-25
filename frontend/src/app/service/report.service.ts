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
  private getAllTemplatesUrl = 'http://localhost:8000/api/create-template/';

  constructor(private http: HttpClient) {}

  getAllReportsWithColumns(): Observable<any> {
    return this.http.get(this.getAllReportsWithColumnsUrl);
  }

  createTemplate(data:any):Observable<any>{
    return this.http.post(this.createTemplateUrl,data);
  }

  getAllTemplates():Observable<any>{
    return this.http.get(this.getAllTemplatesUrl);
  }
}
