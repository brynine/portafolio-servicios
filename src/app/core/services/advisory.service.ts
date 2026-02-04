import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Advisory } from '../../models/advisory';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdvisoryService {
  private apiBaseUrl = `${environment.apiBaseUrl}/advisories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Advisory[]> {
    return this.http.get<Advisory[]>(this.apiBaseUrl);
  }

  getById(id: string): Observable<Advisory> {
    return this.http.get<Advisory>(`${this.apiBaseUrl}/${id}`);
  }

  create(advisory: Advisory): Observable<Advisory> {
    return this.http.post<Advisory>(this.apiBaseUrl, advisory);
  }

  update(id: string, advisory: Advisory): Observable<Advisory> {
    return this.http.put<Advisory>(`${this.apiBaseUrl}/${id}`, advisory);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }

  getByUser(userId: string) {
  return this.http.get<any[]>(
    `${environment.apiBaseUrl}/advisories/user/${userId}`
  );
}

getByProgramador(programadorId: string) {
  return this.http.get<any[]>(
    `${this.apiBaseUrl}/programador/${programadorId}`
  );
}

updateEstado(id: string, estado: string) {
  return this.http.put(
    `${this.apiBaseUrl}/${id}/estado`,
    estado,
    { responseType: 'text' }
  );
}

}
