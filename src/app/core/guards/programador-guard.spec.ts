import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { programadorGuard } from './programador-guard';

describe('programadorGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => programadorGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
