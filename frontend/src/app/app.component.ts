import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'app.component.html',
})
export class AppComponent {
  private http = inject(HttpClient);

  response: string | null = null;
  error: string | null = null;
  isLoading = false;

  callApi() {
    this.isLoading = true;
    this.error = null;
    this.response = null;

    this.http.get<any>('http://localhost:8000/api/demo/').subscribe({
      next: (res) => {
        this.response = res.message;
      },
      error: (err) => {
        this.error = err.message;
        console.error('API Error:', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}