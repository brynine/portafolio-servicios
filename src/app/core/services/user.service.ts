import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models/user';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BackendUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiBaseUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiBaseUrl);
  }

  getById(id: string): Observable<User> {
  console.log('URL:', `${this.apiBaseUrl}/${id}`);
  return this.http.get<User>(`${this.apiBaseUrl}/${id}`);
}


  create(user: User): Observable<User> {
    return this.http.post<User>(this.apiBaseUrl, user);
  }

  update(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiBaseUrl}/${id}`, user);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }

  getByEmail(email: string) {
  return this.http.get<User>(`${this.apiBaseUrl}/email/${email}`);
}

syncUser(email: string, nombre: string | null): Observable<BackendUser> {
  return this.http.post<BackendUser>(
    `${this.apiBaseUrl}/sync`,
    {
      email: email,
      nombre: nombre
    }
  );
}

getProgramadores(): Observable<User[]> {
  return this.http.get<User[]>(
    `${this.apiBaseUrl}/programadores`
  );
}

crearProgramador(data: {
  email: string;
  nombre: string;
  especialidad?: string;
}) {
  return this.http.post(`${this.apiBaseUrl}/programador`, data);
}

}
