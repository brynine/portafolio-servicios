import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Persona } from '../../models/persona';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PersonaService {
  private apiBaseUrl = `${environment.apiBaseUrl}/personas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.apiBaseUrl);
  }

  getById(cedula: string): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiBaseUrl}/${cedula}`);
  }

  create(persona: Persona): Observable<Persona> {
    return this.http.post<Persona>(this.apiBaseUrl, persona);
  }

  update(cedula: string, persona: Persona): Observable<Persona> {
    return this.http.put<Persona>(`${this.apiBaseUrl}/${cedula}`, persona);
  }

  delete(cedula: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${cedula}`);
  }
}
