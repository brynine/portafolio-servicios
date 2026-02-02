import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Availability } from '../../models/availability';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private apiBaseUrl = `${environment.apiBaseUrl}/availability`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Availability[]> {
    return this.http.get<Availability[]>(this.apiBaseUrl);
  }

  getById(id: string): Observable<Availability> {
    return this.http.get<Availability>(`${this.apiBaseUrl}/${id}`);
  }

  create(a: Availability): Observable<Availability> {
    return this.http.post<Availability>(this.apiBaseUrl, a);
  }

  update(id: string, a: Availability): Observable<Availability> {
    return this.http.put<Availability>(`${this.apiBaseUrl}/${id}`, a);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }

  getByUser(userId: string): Observable<Availability[]> {
  return this.http.get<Availability[]>(
    `${this.apiBaseUrl}/user/${userId}`
  );
}

}
