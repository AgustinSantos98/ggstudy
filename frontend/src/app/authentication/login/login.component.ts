import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = {
    email: '',
    contrasena: ''
  };
  errorMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    if (!this.credentials.email || !this.credentials.contrasena) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials)
      .subscribe({
        next: (response) => {
          // Esperar un breve tiempo para permitir que se complete cualquier obtención de ID de usuario en segundo plano
          setTimeout(() => {
            this.loading = false;
            
            // Verificar si tenemos un token, incluso si aún no tenemos un ID de usuario
            // El servicio de autenticación se encargará de obtener el ID de usuario si es necesario
            if (this.authService.getToken()) {
              this.router.navigate(['/dashboard']);
            } else {
              this.errorMessage = 'Error de autenticación. No se recibió un token válido.';
            }
          }, 300);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
          this.loading = false;
        }
      });
  }
} 