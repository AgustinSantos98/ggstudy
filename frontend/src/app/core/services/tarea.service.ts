import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tarea } from '../models/tarea.model';
import { RespuestaPaginada } from './asignatura.service';

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  private apiUrl = 'http://localhost:3000/api/tareas';

  constructor(private http: HttpClient) { }

  obtenerTodasLasTareas(params?: HttpParams): Observable<RespuestaPaginada<Tarea>> {
    return this.http.get<RespuestaPaginada<Tarea>>(this.apiUrl, { params });
  }

  obtenerTareaPorId(id: number): Observable<Tarea> {
    return this.http.get<Tarea>(`${this.apiUrl}/${id}`);
  }

  crearTarea(tarea: Tarea): Observable<Tarea> {
    return this.http.post<Tarea>(this.apiUrl, tarea);
  }

  actualizarTarea(id: number, tarea: Tarea): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.apiUrl}/${id}`, tarea);
  }

  eliminarTarea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene todas las tareas de un tema específico con información de entregas para el alumno actual
   * @param temaId ID del tema
   * @param page Número de página (opcional)
   * @param limit Cantidad de registros por página (opcional)
   * @returns Observable con la respuesta paginada de tareas
   */
  obtenerTareasPorTema(temaId: number, page: number = 1, limit: number = 10): Observable<RespuestaPaginada<Tarea>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
      
    return this.http.get<RespuestaPaginada<Tarea>>(`${this.apiUrl}/tema/${temaId}`, { params });
  }

  obtenerTareasPorAsignatura(asignaturaId: number): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.apiUrl}/asignatura/${asignaturaId}`);
  }

  /**
   * Obtiene todas las tareas del curso en el que está matriculado el alumno actual
   * @param page Número de página (opcional)
   * @param limit Cantidad de registros por página (opcional)
   * @returns Observable con la respuesta paginada de tareas con información de entregas
   */
  obtenerTareasMiCurso(page: number = 1, limit: number = 10): Observable<RespuestaPaginada<Tarea>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
      
    return this.http.get<RespuestaPaginada<Tarea>>(`${this.apiUrl}/alumno/curso`, { params });
  }
} 