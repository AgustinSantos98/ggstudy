import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, HeaderComponent],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css', '../dashboard.component.css']
})
export class PerfilComponent implements OnInit {
  // Inicializamos con valores parciales, se completará cuando obtengamos los datos reales
  datosUsuario: Partial<Usuario> = {
    nombre: 'Cargando...',
    apellido: '',
    email: ''
  };
  
  cargando: boolean = true;
  error: string | null = null;

  // Propiedades para el header
  userEmail: string = '';
  userRole: string = '';
  showDropdown: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener información del usuario para el header
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.fetchUserProfile().subscribe(
      (usuario: Usuario) => {
        if (usuario) {
          this.datosUsuario = usuario;
        }
        this.cargando = false;
      },
      (error: Error) => {
        console.error('Error al obtener datos del usuario:', error);
        this.error = 'No se pudo cargar la información del usuario';
        this.cargando = false;
      }
    );
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.authService.logout();
  }
} 