import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplorarComponent } from './explorar';

describe('Explorar', () => {
  let component: ExplorarComponent;
  let fixture: ComponentFixture<ExplorarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExplorarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
