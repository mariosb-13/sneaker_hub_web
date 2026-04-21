import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminStorageComponent } from './admin-storage.component';

describe('AdminStorageComponent', () => {
  let component: AdminStorageComponent;
  let fixture: ComponentFixture<AdminStorageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminStorageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminStorageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
