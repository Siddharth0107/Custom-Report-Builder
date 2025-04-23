// src/app/service/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private reportPermissionsUrl = 'http://localhost:8000/api/report_permissions/'; // Replace with your Django URL
  private initialListUrl = 'http://localhost:8000/api/all_permissions/';

  constructor(private http: HttpClient) {}

  submitReport(data: any): Observable<any> {
    return this.http.post(this.reportPermissionsUrl, data);
  }

  handleList():Observable<any>{
    return this.http.get(this.initialListUrl);
  }
}
