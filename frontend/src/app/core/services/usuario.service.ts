import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { AuthService } from './auth.service';

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
 * Servicio para gestionar las operaciones relacionadas con usuarios
 */
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api/usuarios';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtiene todos los usuarios con posibilidad de paginación y filtrado
   * 
   * @param params Parámetros de consulta HTTP opcionales para filtrado y paginación
   * @returns Observable con la respuesta paginada que contiene los usuarios
   */
  obtenerTodosLosUsuarios(params?: HttpParams): Observable<RespuestaPaginada<Usuario>> {
    return this.http.get<RespuestaPaginada<Usuario>>(this.apiUrl, { params });
  }

  /**
   * Obtiene un usuario por su identificador
   * 
   * @param id Identificador del usuario
   * @returns Observable con la respuesta que contiene los datos del usuario
   */
  obtenerUsuarioPorId(id: number): Observable<RespuestaIndividual<Usuario> | Usuario> {
    return this.http.get<RespuestaIndividual<Usuario> | Usuario>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo usuario
   * 
   * @param usuario Datos del usuario a crear
   * @returns Observable con la respuesta que contiene los datos del usuario creado
   */
  crearUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }
  
  /**
   * Registra un nuevo usuario con contraseña
   * 
   * @param usuario Datos del usuario a registrar, incluyendo contraseña
   * @returns Observable con la respuesta que contiene los datos del usuario registrado
   */
  registrarUsuario(usuario: Usuario & { contrasena: string }): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registrar`, usuario);
  }

  /**
   * Actualiza un usuario existente
   * 
   * @param id Identificador del usuario
   * @param usuario Datos actualizados del usuario
   * @returns Observable con la respuesta que contiene los datos del usuario actualizado
   */
  actualizarUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  /**
   * Elimina un usuario
   * 
   * @param id Identificador del usuario a eliminar
   * @returns Observable con la respuesta del servidor
   */
  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene todos los profesores
   * 
   * @returns Observable con la respuesta paginada que contiene los profesores
   */
  obtenerProfesores(params?: HttpParams): Observable<RespuestaPaginada<Usuario>> {
    const httpParams = params || new HttpParams();
    const paramsConRol = httpParams.set('rol', 'profesor');
    return this.http.get<RespuestaPaginada<Usuario>>(this.apiUrl, { params: paramsConRol });
  }

  /**
   * Obtiene todos los alumnos
   * Si el usuario es profesor, solo devuelve los alumnos de sus asignaturas
   * 
   * @param params Parámetros adicionales para la consulta
   * @returns Observable con la respuesta paginada que contiene los alumnos
   */
  obtenerAlumnos(params?: HttpParams): Observable<RespuestaPaginada<Usuario>> {
    let httpParams = params || new HttpParams();
    
    // Si el usuario es profesor, agregar su ID a los parámetros
    if (this.authService.getUserRole() === 'profesor') {
      const profesorId = this.authService.getUserId();
      if (profesorId) {
        httpParams = httpParams.set('profesorId', profesorId);
      }
    }
    
    // Usar la ruta específica para obtener alumnos
    return this.http.get<RespuestaPaginada<Usuario>>(`${this.apiUrl}/alumnos`, { params: httpParams });
  }
}
