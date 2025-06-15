import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tema } from '../models/tema.model';

@Injectable({
  providedIn: 'root'
})
export class TemaService {
  private apiUrl = 'http://localhost:3000/api/temas';

  constructor(private http: HttpClient) { }

  obtenerTodosLosTemas(params?: HttpParams): Observable<Tema[]> {
    return this.http.get<Tema[]>(this.apiUrl, { params });
  }

  obtenerTemaPorId(id: number): Observable<Tema> {
    return this.http.get<Tema>(`${this.apiUrl}/${id}`);
  }

  crearTema(tema: Tema): Observable<Tema> {
    return this.http.post<Tema>(this.apiUrl, tema);
  }

  actualizarTema(id: number, tema: Tema): Observable<Tema> {
    return this.http.put<Tema>(`${this.apiUrl}/${id}`, tema);
  }

  eliminarTema(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerTemasPorAsignatura(asignaturaId: number): Observable<Tema[]> {
    return this.http.get<Tema[]>(`${this.apiUrl}/asignatura/${asignaturaId}`);
  }
} 