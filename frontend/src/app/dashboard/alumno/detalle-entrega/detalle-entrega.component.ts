import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EntregaService } from '../../../core/services/entrega.service';
import { TareaCalificacionExtendida } from '../../../core/models/tarea-calificacion.model';
import { HeaderComponent } from '../../../shared/header/header.component';
import { FormsModule } from '@angular/forms';

/**
 * Componente para mostrar los detalles de una entrega específica.
 */
@Component({
  selector: 'app-detalle-entrega',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule],
  templateUrl: './detalle-entrega.component.html',
  styleUrl: './detalle-entrega.component.css'
})
export class DetalleEntregaComponent implements OnInit {
  /**
   * Entrega seleccionada para ver detalles
   */
  entrega: TareaCalificacionExtendida | null = null;
  
  /**
   * Indica si se está cargando la información
   */
  cargando: boolean = true;
  
  /**
   * Mensaje de error para mostrar al usuario
   */
  error: string | null = null;

  /**
   * Constructor del componente.
   * 
   * @param route Servicio para obtener parámetros de la ruta
   * @param router Servicio para la navegación
   * @param entregaService Servicio para gestionar entregas
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entregaService: EntregaService
  ) {}

  /**
   * Inicializa el componente y carga los detalles de la entrega.
   */
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        const entregaId = +params['id'];
        this.cargarDetallesEntrega(entregaId);
      } else {
        this.error = 'No se ha especificado ninguna entrega.';
        this.cargando = false;
      }
    });
  }

  /**
   * Carga los detalles de una entrega específica.
   * 
   * @param entregaId ID de la entrega
   */
  cargarDetallesEntrega(entregaId: number): void {
    this.cargando = true;
    this.error = null;
    
    // Utilizamos el método específico para alumnos
    this.entregaService.obtenerMiEntregaDetalle(entregaId).subscribe({
      next: (entrega) => {
        this.entrega = entrega;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los detalles de la entrega. Por favor, inténtalo de nuevo más tarde.';
        this.cargando = false;
        console.error('Error al obtener los detalles de la entrega:', err);
      }
    });
  }

  /**
   * Navega de vuelta a la página de entregables.
   */
  volver(): void {
    this.router.navigate(['/dashboard/alumno/mis-entregables']);
  }
}
