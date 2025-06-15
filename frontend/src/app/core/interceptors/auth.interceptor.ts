import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de autenticación para peticiones HTTP.
 * 
 * Este interceptor se encarga de añadir automáticamente el token JWT
 * a todas las peticiones HTTP salientes cuando el usuario está autenticado.
 * Esto permite que el backend pueda verificar la identidad del usuario en cada petición.
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Añadir encabezado de autorización con token JWT si está disponible
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Continuar con la petición modificada
  return next(req);
};