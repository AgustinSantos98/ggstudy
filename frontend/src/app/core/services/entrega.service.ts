import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TareaCalificacion, TareaCalificacionExtendida } from '../models/tarea-calificacion.model';
import { RespuestaPaginada } from './asignatura.service';

@Injectable({
  providedIn: 'root'
})
export class EntregaService {
  private apiUrl = 'http://localhost:3000/api/entregas';

  constructor(private http: HttpClient) { }

  // Para un alumno: entregar una tarea
  entregarTarea(entrega: { tarea_id: number, url: string, texto: string }): Observable<TareaCalificacion> {
    // Se envía un objeto con tarea_id, url y texto
    return this.http.post<TareaCalificacion>(this.apiUrl, entrega);
  }

  // Para un profesor: calificar una entrega
  calificarEntrega(id: number, calificacionData: Partial<TareaCalificacion>): Observable<TareaCalificacion> {
    // Usamos la ruta específica para calificar entregas: PATCH /api/entregas/:id/calificar
    return this.http.patch<TareaCalificacion>(`${this.apiUrl}/${id}/calificar`, calificacionData);
  }

  obtenerEntregaPorId(id: number): Observable<TareaCalificacion> {
    return this.http.get<TareaCalificacion>(`${this.apiUrl}/${id}`);
  }

  // Para un profesor: obtener todas las entregas de una tarea
  obtenerEntregasPorTarea(tareaId: number, params?: HttpParams): Observable<RespuestaPaginada<TareaCalificacionExtendida>> {
    return this.http.get<RespuestaPaginada<TareaCalificacionExtendida>>(`${this.apiUrl}/tarea/${tareaId}`, { params });
  }

  // Para un alumno: obtener su entrega para una tarea específica
  obtenerMiEntregaPorTarea(tareaId: number, usuarioId: number): Observable<TareaCalificacion> {
    return this.http.get<TareaCalificacion>(`${this.apiUrl}/tarea/${tareaId}/alumno/${usuarioId}`);
  }

  // Para un profesor: obtener todas las entregas de sus asignaturas
  obtenerEntregasProfesor(profesorId: number, params?: HttpParams): Observable<RespuestaPaginada<TareaCalificacionExtendida>> {
    // Construimos la URL correcta sin parámetros adicionales en la ruta
    const url = `${this.apiUrl}/profesor`;
    
    // Aseguramos que los parámetros se envían correctamente
    const httpParams = params || new HttpParams();
    const paramsConProfesor = httpParams.set('profesorId', profesorId.toString());
    
    return this.http.get<RespuestaPaginada<TareaCalificacionExtendida>>(url, { params: paramsConProfesor });
  }

  // Para un alumno: obtener todas sus entregas
  obtenerMisEntregas(params?: HttpParams): Observable<RespuestaPaginada<TareaCalificacionExtendida>> {
    // Usar el endpoint específico para que los alumnos vean sus propias entregas
    return this.http.get<RespuestaPaginada<TareaCalificacionExtendida>>(`${this.apiUrl}/mis-entregas`, { params });
  }
  
  // Para un alumno: obtener los detalles de una entrega específica
  obtenerMiEntregaDetalle(entregaId: number): Observable<TareaCalificacionExtendida> {
    // Usar el endpoint específico para que los alumnos vean los detalles de su propia entrega
    return this.http.get<TareaCalificacionExtendida>(`${this.apiUrl}/${entregaId}/mi-entrega`);
  }

  // Para un admin (potencialmente): eliminar una entrega
  eliminarEntrega(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}