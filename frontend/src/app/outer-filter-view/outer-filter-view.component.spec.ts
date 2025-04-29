import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OuterFilterViewComponent } from './outer-filter-view.component';

describe('OuterFilterViewComponent', () => {
  let component: OuterFilterViewComponent;
  let fixture: ComponentFixture<OuterFilterViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OuterFilterViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OuterFilterViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
