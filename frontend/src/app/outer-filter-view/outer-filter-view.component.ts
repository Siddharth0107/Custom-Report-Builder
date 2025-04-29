import { Component } from '@angular/core';

@Component({
  selector: 'app-outer-filter-view',
  imports: [],
  templateUrl: './outer-filter-view.component.html',
  styleUrl: './outer-filter-view.component.css'
})
export class OuterFilterViewComponent {
  reportData: any = {}
  constructor() { }
  ngOnInit(): void {
    this.reportData = history.state?.report_data;
    if (!this.reportData) {
      console.warn('No data found in state!');
    }
  }
}
