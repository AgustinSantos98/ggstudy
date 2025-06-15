import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { HeaderComponent } from '../../../shared/header/header.component';
import { AuthService } from '../../../core/services/auth.service';
import { EntregaService } from '../../../core/services/entrega.service';
import { TareaCalificacionExtendida } from '../../../core/models/tarea-calificacion.model';

@Component({
  selector: 'app-calificar-entrega',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './calificar-entrega.component.html',
  styleUrls: ['./calificar-entrega.component.css', '../../../shared/admin-common.css']
})
export class CalificarEntregaComponent implements OnInit {
  // Datos de usuario
  userEmail: string = '';
  userRole: string = '';
  profesorId: string = '';
  
  // ID de la entrega a calificar
  entregaId: number | null = null;
  
  // Datos de la entrega
  entrega: TareaCalificacionExtendida | null = null;
  
  // Datos del formulario de calificación
  calificacionData = {
    calificacion: null as number | null,
    feedback: ''
  };
  
  // Estado de la UI
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private entregaService: EntregaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener información del usuario autenticado
    this.userEmail = this.authService.getUserEmail() || '';
    this.userRole = this.authService.getUserRole() || '';
    this.profesorId = this.authService.getUserId() || '';
    
    // Verificar que el usuario sea profesor
    if (this.userRole !== 'profesor' && this.userRole !== 'admin') {
      this.error = 'No tienes permisos para acceder a esta página.';
      return;
    }
    
    // Obtener el ID de la entrega de los parámetros de la URL
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.entregaId = parseInt(id, 10);
        this.cargarEntrega();
      } else {
        this.error = 'No se ha especificado una entrega para calificar.';
      }
    });
  }

  /**
   * Carga los datos de la entrega desde el servidor
   */
  cargarEntrega(): void {
    if (this.entregaId === null) return;
    
    this.loading = true;
    this.error = '';
    
    this.entregaService.obtenerEntregaPorId(this.entregaId)
      .subscribe({
        next: (entrega) => {
          this.entrega = entrega as TareaCalificacionExtendida;
          this.loading = false;
          
          // Si ya está calificada, mostrar los datos de la calificación
          if (this.entrega.calificacion !== null && this.entrega.calificacion !== undefined) {
            // Asegurar que la calificación es un número
            this.calificacionData.calificacion = Number(this.entrega.calificacion);
            this.calificacionData.feedback = this.entrega.feedback || '';
          }
        },
        error: (err) => {
          console.error('Error al cargar la entrega:', err);
          this.error = 'Error al cargar los datos de la entrega. Por favor, inténtalo de nuevo.';
          this.loading = false;
        }
      });
  }

  /**
   * Guarda la calificación de la entrega
   */
  guardarCalificacion(): void {
    if (this.entregaId === null || !this.entrega) return;
    
    // Validar los datos de la calificación
    if (this.calificacionData.calificacion === null) {
      this.error = 'Debes introducir una calificación.';
      return;
    }
    
    if (this.calificacionData.calificacion < 0 || this.calificacionData.calificacion > 10) {
      this.error = 'La calificación debe estar entre 0 y 10.';
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    // Crear un objeto con la calificación como number (no null)
    const datosCalificacion = {
      calificacion: this.calificacionData.calificacion as number,
      feedback: this.calificacionData.feedback
    };
    
    this.entregaService.calificarEntrega(this.entregaId, datosCalificacion)
      .subscribe({
        next: (entregaActualizada) => {
          this.entrega = entregaActualizada as TareaCalificacionExtendida;
          this.successMessage = 'La entrega ha sido calificada correctamente.';
          this.loading = false;
          
          // Esperar 1.5 segundos y volver a la lista de entregas
          // Esto da tiempo suficiente para ver el mensaje de éxito pero no demasiado para que sea molesto
          setTimeout(() => {
            // Navegar directamente a la lista de entregas sin pasar por el método volver()
            // para evitar problemas con la recarga de la página
            this.router.navigate(['/dashboard/profesor/entregas-tareas']);
          }, 1500);
        },
        error: (err) => {
          console.error('Error al calificar la entrega:', err);
          this.error = 'Error al guardar la calificación. Por favor, inténtalo de nuevo.';
          this.loading = false;
        }
      });
  }

  /**
   * Vuelve a la página de gestión de entregas
   */
  volver(): void {
    this.router.navigate(['/dashboard/profesor/entregas-tareas']);
  }
}
