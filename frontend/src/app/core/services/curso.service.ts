import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Curso } from '../models/curso.model';

/**
 * Interfaz para respuestas paginadas del servidor
 * 
 * Esta interfaz es genérica y puede adaptarse a diferentes tipos de datos
 * que devuelve el backend.
 */
export interface RespuestaPaginada<T> {
  data: T[];
  pagination?: {
    total?: number;
    totalPages?: number;
    page?: number;
    limit?: number;
  };
}

/**
 * Interfaz para respuestas de un solo elemento
 */
export interface RespuestaIndividual<T> {
  data?: T;
  [key: string]: any;
}

/**
 * Servicio para gestionar las operaciones relacionadas con cursos
 */
@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private apiUrl = 'http://localhost:3000/api/cursos';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los cursos con posibilidad de filtrado y paginación
   * 
   * @param params Parámetros de consulta para filtrado y paginación
   * @returns Observable con la respuesta paginada que contiene los cursos
   */
  obtenerTodosLosCursos(params?: HttpParams): Observable<RespuestaPaginada<Curso>> {
    return this.http.get<RespuestaPaginada<Curso>>(this.apiUrl, { params });
  }

  /**
   * Obtiene un curso por su identificador
   * 
   * @param id Identificador del curso
   * @returns Observable con la respuesta que contiene los datos del curso
   */
  obtenerCursoPorId(id: number): Observable<RespuestaIndividual<Curso> | Curso> {
    return this.http.get<RespuestaIndividual<Curso> | Curso>(`${this.apiUrl}/${id}`);
  }

  crearCurso(curso: Curso): Observable<Curso> {
    return this.http.post<Curso>(this.apiUrl, curso);
  }

  actualizarCurso(id: number, curso: Curso): Observable<Curso> {
    return this.http.put<Curso>(`${this.apiUrl}/${id}`, curso);
  }

  eliminarCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene la lista de alumnos matriculados en un curso
   * 
   * @param id Identificador del curso
   * @returns Observable con la respuesta paginada que contiene los alumnos
   */
  obtenerAlumnosDeCurso(id: number): Observable<RespuestaPaginada<any>> { // Usar Usuario en lugar de any cuando se implemente
    return this.http.get<RespuestaPaginada<any>>(`${this.apiUrl}/${id}/alumnos`);
  }

  inscribirAlumnoEnCurso(cursoId: number, usuarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${cursoId}/alumnos/${usuarioId}`, {});
  }

  desinscribirAlumnoDeCurso(cursoId: number, usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${cursoId}/alumnos/${usuarioId}`);
  }
} 