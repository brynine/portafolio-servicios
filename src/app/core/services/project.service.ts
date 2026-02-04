import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../../models/project';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiBaseUrl = `${environment.apiBaseUrl}/projects`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiBaseUrl);
  }

  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiBaseUrl}/${id}`);
  }

  create(project: Project): Observable<Project> {
    return this.http.post<Project>(this.apiBaseUrl, project);
  }

  update(id: string, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiBaseUrl}/${id}`, project);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }

  getByUser(uid: string): Observable<Project[]> {
  return this.http.get<Project[]>(`${this.apiBaseUrl}/user/${uid}`);
}

}
