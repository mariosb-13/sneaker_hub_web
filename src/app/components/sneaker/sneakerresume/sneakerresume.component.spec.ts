import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SneakerresumeComponent } from './sneakerresume.component';

describe('SneakerresumeComponent', () => {
  let component: SneakerresumeComponent;
  let fixture: ComponentFixture<SneakerresumeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SneakerresumeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SneakerresumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
