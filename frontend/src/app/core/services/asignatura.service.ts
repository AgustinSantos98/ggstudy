import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asignatura } from '../models/asignatura.model';

/**
 * Interfaz para respuestas paginadas del servidor
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

@Injectable({
  providedIn: 'root'
})
export class AsignaturaService {
  private apiUrl = 'http://localhost:3000/api/asignaturas';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las asignaturas con posibilidad de paginación y filtrado
   * 
   * @param params Parámetros de consulta HTTP opcionales para filtrado y paginación
   * @returns Observable con la respuesta paginada que contiene las asignaturas
   */
  obtenerTodasLasAsignaturas(params?: HttpParams): Observable<RespuestaPaginada<Asignatura>> {
    return this.http.get<RespuestaPaginada<Asignatura>>(this.apiUrl, { params });
  }

  /**
   * Obtiene una asignatura por su identificador
   * 
   * @param id Identificador de la asignatura
   * @returns Observable con la respuesta que contiene los datos de la asignatura
   */
  obtenerAsignaturaPorId(id: number): Observable<RespuestaIndividual<Asignatura> | Asignatura> {
    return this.http.get<RespuestaIndividual<Asignatura> | Asignatura>(`${this.apiUrl}/${id}`);
  }

  crearAsignatura(asignatura: Asignatura): Observable<Asignatura> {
    return this.http.post<Asignatura>(this.apiUrl, asignatura);
  }

  actualizarAsignatura(id: number, asignatura: Asignatura): Observable<Asignatura> {
    return this.http.put<Asignatura>(`${this.apiUrl}/${id}`, asignatura);
  }

  eliminarAsignatura(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Métodos adicionales según las rutas disponibles en el backend
  /**
   * Obtiene todas las asignaturas de un curso específico
   * 
   * @param cursoId Identificador del curso
   * @returns Observable con la respuesta paginada que contiene las asignaturas del curso
   */
  obtenerAsignaturasPorCurso(cursoId: number): Observable<RespuestaPaginada<Asignatura>> {
    return this.http.get<RespuestaPaginada<Asignatura>>(`${this.apiUrl}/curso/${cursoId}`);
  }

  /**
   * Obtiene todas las asignaturas asignadas a un profesor específico
   * 
   * @param profesorId Identificador del profesor
   * @param page Número de página (opcional, por defecto 1)
   * @param limit Límite de resultados por página (opcional, por defecto 10)
   * @returns Observable con la respuesta paginada que contiene las asignaturas del profesor
   */
  obtenerAsignaturasPorProfesor(profesorId: number, page: number = 1, limit: number = 10): Observable<RespuestaPaginada<Asignatura>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('profesorId', profesorId.toString());
    
    return this.http.get<RespuestaPaginada<Asignatura>>(this.apiUrl, { params });
  }
  
  /**
   * Obtiene los temas asociados a una asignatura
   * 
   * @param asignaturaId Identificador de la asignatura
   * @returns Observable con la respuesta paginada que contiene los temas
   */
  obtenerTemasDeAsignatura(asignaturaId: number): Observable<RespuestaPaginada<any>> { // Usar Tema en lugar de any cuando se implemente
    return this.http.get<RespuestaPaginada<any>>(`${this.apiUrl}/${asignaturaId}/temas`);
  }
} 