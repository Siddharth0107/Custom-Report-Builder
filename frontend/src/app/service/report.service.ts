// src/app/service/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private apiUrl = 'http://localhost:8000/api/report_permissions/'; // Replace with your Django URL

  constructor(private http: HttpClient) {}

  submitReport(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
