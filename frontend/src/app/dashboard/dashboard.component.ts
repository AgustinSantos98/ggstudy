import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userEmail: string = '';
  userRole: string = '';
  showDropdown: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener información del usuario desde el servicio de autenticación
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Redirigir al usuario según su rol
    if (this.userRole === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else if (this.userRole === 'profesor') {
      this.router.navigate(['/dashboard/profesor']);
    } else if (this.userRole === 'alumno') {
      this.router.navigate(['/dashboard/alumno']);
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.authService.logout();
  }
} 