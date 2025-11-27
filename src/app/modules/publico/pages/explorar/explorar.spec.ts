import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Explorar } from './explorar';

describe('Explorar', () => {
  let component: Explorar;
  let fixture: ComponentFixture<Explorar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Explorar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Explorar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
