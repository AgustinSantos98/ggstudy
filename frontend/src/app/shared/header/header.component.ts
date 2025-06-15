import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  userEmail: string = '';
  userRole: string = '';
  userName: string = '';
  userLastName: string = '';
  userPhotoUrl: string = '';
  showDropdown: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener información del usuario desde el servicio de autenticación
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    
    // Obtener datos adicionales del usuario
    this.authService.fetchUserProfile().subscribe(
      (usuario: Usuario) => {
        if (usuario) {
          this.userName = usuario.nombre || '';
          this.userLastName = usuario.apellido || '';
          this.userPhotoUrl = usuario.foto_perfil_url || '';
        }
      },
      (error) => {
        console.error('Error al obtener datos del usuario para el header:', error);
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
