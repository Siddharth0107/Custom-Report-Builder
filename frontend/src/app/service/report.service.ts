// src/app/service/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private getAllReportsWithColumnsUrl = 'http://localhost:8000/api/get-reports/'; // Replace with your Django URL
  // private initialListUrl = 'http://localhost:8000/api/all_permissions/';

  constructor(private http: HttpClient) {}

  getAllReportsWithColumns(): Observable<any> {
    return this.http.get(this.getAllReportsWithColumnsUrl);
  }

  // handleList():Observable<any>{
  //   return this.http.get(this.initialListUrl);
  // }
}
