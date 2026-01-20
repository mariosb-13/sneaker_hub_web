import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SneakerlistComponent } from './sneakerlist.component';

describe('SneakerlistComponent', () => {
  let component: SneakerlistComponent;
  let fixture: ComponentFixture<SneakerlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SneakerlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SneakerlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
