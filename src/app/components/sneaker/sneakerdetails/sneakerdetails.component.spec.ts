import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SneakerdetailsComponent } from './sneakerdetails.component';

describe('SneakerdetailsComponent', () => {
  let component: SneakerdetailsComponent;
  let fixture: ComponentFixture<SneakerdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SneakerdetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SneakerdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
