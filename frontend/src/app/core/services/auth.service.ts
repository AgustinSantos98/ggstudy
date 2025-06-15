import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

/**
 * Servicio de autenticación que gestiona el inicio de sesión, cierre de sesión
 * y el estado de autenticación de los usuarios en la aplicación.
 * 
 * Este servicio se encarga de:
 * - Realizar peticiones de autenticación al backend
 * - Almacenar y gestionar el token JWT
 * - Mantener información básica del usuario autenticado
 * - Proporcionar métodos para verificar el estado de autenticación
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  /**
   * Constructor del servicio de autenticación.
   * 
   * Inicializa el estado de autenticación al crear el servicio.
   * 
   * @param http Cliente HTTP para realizar peticiones al backend.
   * @param router Enrutador de la aplicación para redirigir al usuario después del login o logout.
   */
  constructor(private http: HttpClient, private router: Router) {
    // Inicializar estado de autenticación al crear el servicio
    this.isAuthenticatedSubject.next(this.hasToken());
  }

  /**
   * Realiza el inicio de sesión del usuario con sus credenciales.
   * 
   * @param credentials Objeto con el email y contraseña del usuario
   * @returns Observable con la respuesta del servidor que incluye el token JWT
   */
  login(credentials: { email: string, contrasena: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/usuarios/login`, credentials)
      .pipe(
        tap(respuesta => {
          if (respuesta && respuesta.token) {            
            // Almacenar el token
            localStorage.setItem('token', respuesta.token);
            
            // Almacenar email del usuario
            localStorage.setItem('userEmail', credentials.email);
            
            // Almacenar rol de usuario directamente desde el objeto user si está disponible
            if (respuesta.usuario.rol) {
              localStorage.setItem('userRole', respuesta.usuario.rol);
            } else  {
              console.error('No se encontró el rol de usuario en la respuesta:', respuesta);
            }

            if (respuesta.usuario.id) {
              localStorage.setItem('userId', respuesta.usuario.id.toString());
            } else {
              console.error('No se encontró el ID de usuario en la respuesta:', respuesta);
            }
            
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Extrae el ID de usuario de la respuesta del servidor.
   * 
   * Intenta encontrar el ID en diferentes estructuras de respuesta posibles.
   * 
   * @param response Respuesta del servidor que puede contener el ID de usuario
   * @returns ID del usuario como string, o null si no se encuentra
   * @private
   */
  private extractUserId(response: any): string | null {
    // Intentar diferentes rutas posibles para encontrar el ID de usuario
    if (response.user?.id) return response.user.id.toString();
    if (response.id) return response.id.toString();
    if (response.userId) return response.userId.toString();
    if (response.data?.user?.id) return response.data.user.id.toString();
    if (response.data?.id) return response.data.id.toString();
    
    // Intentar extraer del token JWT si está disponible
    if (response.token) {
      try {
        const base64Url = response.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        if (payload.id) {
          return payload.id.toString();
        }
      } catch (e) {
        console.error('Error al extraer el ID de usuario del token:', e);
      }
    }
    
    return null;
  }

  /**
   * Obtiene la información de un usuario por su ID.
   * 
   * @param userId ID del usuario a consultar
   * @returns Observable con la información del usuario
   */
  fetchUserById(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/${userId}`);
  }

  /**
   * Obtiene la información del perfil del usuario actual.
   * 
   * @returns Observable con la información del perfil del usuario
   */
  fetchUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/perfil`);
  }

  /**
   * Cierra la sesión del usuario actual.
   * 
   * Elimina toda la información de autenticación del almacenamiento local,
   * actualiza el estado de autenticación y redirige al usuario a la página principal.
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  /**
   * Obtiene el token JWT almacenado en el localStorage.
   * 
   * @returns Token JWT como string, o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtiene el ID del usuario autenticado.
   * 
   * @returns ID del usuario como string, o cadena vacía si no existe
   */
  getUserId(): string {
    return localStorage.getItem('userId') || '';
  }

  /**
   * Obtiene el correo electrónico del usuario autenticado.
   * 
   * @returns Correo electrónico del usuario como string, o cadena vacía si no existe
   */
  getUserEmail(): string {
    return localStorage.getItem('userEmail') || '';
  }

  /**
   * Obtiene el rol del usuario autenticado (alumno, profesor o admin).
   * 
   * @returns Rol del usuario como string, o cadena vacía si no existe
   */
  getUserRole(): string {
    return localStorage.getItem('userRole') || '';
  }

  /**
   * Verifica si existe un token JWT en el almacenamiento local.
   * 
   * @returns true si existe un token, false en caso contrario
   * @private
   */
  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Verifica si el usuario está autenticado actualmente.
   * 
   * @returns true si el usuario está autenticado, false en caso contrario
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }
} 