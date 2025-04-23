import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ReportPermissionService {
  private apiUrl = 'http://localhost:8000/api/report_permissions/'; 

  constructor(private http: HttpClient) {}

  sendPermissions(data: any) {
    return this.http.post(this.apiUrl, data);
  }
}
