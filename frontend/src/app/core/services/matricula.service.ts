import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Curso } from '../models/curso.model';
import { RespuestaPaginada } from './usuario.service';

/**
 * Servicio para gestionar las operaciones relacionadas con la matriculación de alumnos en cursos
 */
@Injectable({
  providedIn: 'root'
})
export class MatriculaService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene los cursos en los que está matriculado un alumno
   * 
   * @param alumnoId Identificador del alumno
   * @returns Observable con la respuesta que contiene los cursos del alumno
   */
  obtenerCursosDeAlumno(alumnoId: number): Observable<RespuestaPaginada<Curso>> {
    // Usamos la ruta de cursos para obtener los cursos de un alumno
    return this.http.get<RespuestaPaginada<Curso>>(`${this.apiUrl}/cursos/alumno/${alumnoId}`);
  }

  /**
   * Obtiene los cursos disponibles para matricular a un alumno
   * 
   * @param alumnoId Identificador del alumno
   * @returns Observable con la respuesta que contiene los cursos disponibles
   */
  obtenerCursosDisponibles(alumnoId: number): Observable<RespuestaPaginada<Curso>> {
    // Esta ruta devuelve los cursos en los que el alumno no está matriculado
    return this.http.get<RespuestaPaginada<Curso>>(`${this.apiUrl}/cursos/disponibles/${alumnoId}`);
  }

  /**
   * Matricula a un alumno en un curso
   * 
   * @param alumnoId Identificador del alumno
   * @param cursoId Identificador del curso
   * @returns Observable con la respuesta de la operación
   */
  matricularAlumno(alumnoId: number, cursoId: number): Observable<any> {
    // Usamos la ruta de cursos para matricular a un alumno
    return this.http.post(`${this.apiUrl}/cursos/${cursoId}/alumnos`, { usuario_id: alumnoId });
  }

  /**
   * Elimina la matrícula de un alumno en un curso
   * 
   * @param alumnoId Identificador del alumno
   * @param cursoId Identificador del curso
   * @returns Observable con la respuesta de la operación
   */
  eliminarMatricula(alumnoId: number, cursoId: number): Observable<any> {
    // Usamos la ruta de cursos para desmatricular a un alumno
    return this.http.delete(`${this.apiUrl}/cursos/${cursoId}/alumnos/${alumnoId}`);
  }
  
  /**
   * Cambia el curso de un alumno (desmatricula del curso actual y matricula en el nuevo)
   * 
   * @param alumnoId Identificador del alumno
   * @param nuevoCursoId Identificador del nuevo curso
   * @returns Observable con la respuesta de la operación
   */
  cambiarCursoAlumno(alumnoId: number, nuevoCursoId: number): Observable<any> {
    // Usamos la ruta de cursos para matricular a un alumno en un nuevo curso
    return this.http.post(`${this.apiUrl}/cursos/${nuevoCursoId}/alumnos`, { usuario_id: alumnoId });
  }
}
