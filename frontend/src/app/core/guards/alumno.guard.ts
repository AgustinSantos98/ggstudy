import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guardia para proteger rutas que solo deben ser accesibles por usuarios con rol de alumno.
 */
@Injectable({
  providedIn: 'root'
})
export class AlumnoGuard implements CanActivate {
  
  /**
   * Constructor del guardia.
   * 
   * @param authService Servicio de autenticación para verificar el rol del usuario
   * @param router Servicio de enrutamiento para redirigir si no tiene permisos
   */
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Verifica si el usuario puede activar la ruta.
   * 
   * @returns true si el usuario tiene rol de alumno, de lo contrario redirige al dashboard
   */
  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const rol = this.authService.getUserRole();
    
    if (rol === 'alumno') {
      return true;
    }
    
    // Si no es alumno, redirigir al dashboard general
    this.router.navigate(['/dashboard']);
    return false;
  }
}
