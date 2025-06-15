import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../shared/header/header.component';
import { TareaService } from '../../../core/services/tarea.service';
import { EntregaService } from '../../../core/services/entrega.service';
import { TemaService } from '../../../core/services/tema.service';
import { AuthService } from '../../../core/services/auth.service';
import { Tarea, TareaExtendida, TareaConEntrega } from '../../../core/models/tarea.model';
import { TareaCalificacionExtendida } from '../../../core/models/tarea-calificacion.model';
import { Tema } from '../../../core/models/tema.model';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

/**
 * Componente para mostrar los entregables del alumno (tareas pendientes y entregas realizadas).
 */
@Component({
  selector: 'app-mis-entregables',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule],
  templateUrl: './mis-entregables.component.html',
  styleUrl: './mis-entregables.component.css'
})
export class MisEntregablesComponent implements OnInit {
  /**
   * Lista de tareas del tema seleccionado
   */
  tareas: (Tarea | TareaConEntrega)[] = [];
  
  /**
   * Lista de tareas pendientes (sin entregar)
   */
  tareasPendientes: (Tarea | TareaConEntrega)[] = [];
  
  /**
   * Lista de entregas del alumno
   */
  misEntregas: TareaCalificacionExtendida[] = [];
  
  /**
   * Tema seleccionado
   */
  temaSeleccionado: Tema | null = null;
  
  /**
   * ID del tema seleccionado
   */
  temaId: number | null = null;
  
  /**
   * Indica si se está cargando la información
   */
  cargando: boolean = true;
  
  /**
   * Mensaje de error para mostrar al usuario
   */
  error: string | null = null;
  
  /**
   * URL del entregable
   */
  urlEntrega: string = '';
  
  /**
   * Comentario para la entrega
   */
  comentarioEntrega: string = '';
  
  /**
   * ID de la tarea seleccionada para entregar
   */
  tareaSeleccionadaId: number | null = null;
  
  /**
   * Entrega seleccionada para ver detalles
   */
  entregaSeleccionada: TareaCalificacionExtendida | null = null;
  
  /**
   * Indica si se está mostrando el detalle de una entrega
   */
  mostrandoDetalleEntrega: boolean = false;
  
  /**
   * Indica si se está subiendo una entrega
   */
  subiendoEntrega: boolean = false;
  
  /**
   * Mensaje de éxito para mostrar al usuario
   */
  mensajeExito: string | null = null;

  /**
   * Constructor del componente.
   * 
   * @param tareaService Servicio para obtener información de tareas
   * @param entregaService Servicio para gestionar entregas
   * @param temaService Servicio para obtener información de temas
   * @param authService Servicio de autenticación para obtener el usuario actual
   * @param router Servicio para la navegación
   * @param route Servicio para obtener parámetros de la ruta
   */
  constructor(
    private tareaService: TareaService,
    private entregaService: EntregaService,
    private temaService: TemaService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /**
   * Inicializa el componente y carga las tareas del tema seleccionado y las entregas del alumno.
   */
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['temaId']) {
        this.temaId = +params['temaId'];
        this.cargarTemaYTareas();
      } else {
        this.cargarTodasMisEntregas();
      }
    });
  }

  /**
   * Carga la información del tema seleccionado y sus tareas.
   */
  cargarTemaYTareas(): void {
    this.cargando = true;
    this.error = null;
    
    if (!this.temaId) {
      this.cargando = false;
      this.error = 'No se ha seleccionado ningún tema.';
      return;
    }

    // Primero obtenemos la información del tema
    this.temaService.obtenerTemaPorId(this.temaId).subscribe({
      next: (tema) => {
        this.temaSeleccionado = tema;
        
        // Ahora cargamos las tareas del tema
        this.cargarTareas();
      },
      error: (err) => {
        this.error = 'Error al cargar la información del tema. Por favor, inténtalo de nuevo más tarde.';
        this.cargando = false;
        console.error('Error al obtener el tema:', err);
      }
    });
  }

  /**
   * Carga las tareas del tema seleccionado.
   */
  cargarTareas(): void {
    if (!this.temaId) {
      this.cargando = false;
      return;
    }

    this.tareaService.obtenerTareasPorTema(this.temaId).subscribe({
      next: (respuesta) => {
        // Verificar si la respuesta tiene el formato esperado con data y pagination
        if (respuesta && respuesta.data) {
          // Las tareas ya vienen con la información de entregas desde el backend
          this.tareas = respuesta.data as TareaConEntrega[];
          
          // Ya no necesitamos cargar las entregas por separado
          // Procesamos las tareas para identificar cuáles están entregadas
          this.procesarTareasConEntregas();
          
          this.cargando = false;
        } else {
          // Formato de respuesta antiguo (array directo)
          this.tareas = Array.isArray(respuesta) ? respuesta : [];
          // Cargar las entregas del alumno por el método antiguo
          this.cargarMisEntregas();
        }
      },
      error: (err) => {
        this.error = 'Error al cargar las tareas. Por favor, inténtalo de nuevo más tarde.';
        this.cargando = false;
        console.error('Error al obtener las tareas del tema:', err);
      }
    });
  }

  /**
   * Carga todas las tareas del curso del alumno y sus entregas.
   */
  cargarTodasMisEntregas(): void {
    this.cargando = true;
    this.error = null;
    
    console.log('Iniciando carga de tareas del curso...');
    
    // Usar el nuevo endpoint para obtener todas las tareas del curso del alumno
    this.tareaService.obtenerTareasMiCurso().subscribe({
      next: (respuesta) => {
        console.log('Respuesta del endpoint tareas/alumno/curso:', respuesta);
        
        if (respuesta && respuesta.data) {
          this.tareas = respuesta.data;
          console.log('Total de tareas recibidas:', this.tareas.length);
          
          // Filtrar las tareas pendientes (no entregadas)
          this.tareasPendientes = this.tareas.filter(tarea => !this.tareaEntregada(tarea.id));
          console.log('Tareas pendientes:', this.tareasPendientes.length);
          
          // Obtener las entregas para mostrarlas en la sección "Mis entregas"
          this.entregaService.obtenerMisEntregas().subscribe({
            next: (respuestaEntregas) => {
              console.log('Respuesta del endpoint entregas/mis-entregas:', respuestaEntregas);
              
              if (respuestaEntregas && respuestaEntregas.data) {
                this.misEntregas = respuestaEntregas.data;
                console.log('Total de entregas recibidas:', this.misEntregas.length);
                
                // Verificar si hay tareas que deberían estar en tareasPendientes pero no lo están
                const tareasEntregadas = new Set(this.misEntregas.map(entrega => entrega.tarea_id));
                const todasLasTareas = new Set(this.tareas.map(tarea => tarea.id));
                
                console.log('IDs de tareas entregadas:', Array.from(tareasEntregadas));
                console.log('IDs de todas las tareas:', Array.from(todasLasTareas));
                
                // Recalcular tareas pendientes para asegurarnos
                this.tareasPendientes = this.tareas.filter(tarea => !tareasEntregadas.has(tarea.id));
                console.log('Tareas pendientes recalculadas:', this.tareasPendientes.length);
              }
              this.cargando = false;
            },
            error: (err) => {
              this.error = 'Error al cargar tus entregas. Por favor, inténtalo de nuevo más tarde.';
              this.cargando = false;
              console.error('Error al obtener las entregas del alumno:', err);
            }
          });
        } else {
          this.cargando = false;
          this.error = 'Error al cargar las tareas. Formato de respuesta incorrecto.';
          console.error('Formato de respuesta incorrecto:', respuesta);
        }
      },
      error: (err) => {
        this.error = 'Error al cargar las tareas de tu curso. Por favor, inténtalo de nuevo más tarde.';
        this.cargando = false;
        console.error('Error al obtener las tareas del curso:', err);
      }
    });
  }

  /**
   * Carga las entregas del alumno para las tareas del tema seleccionado.
   */
  cargarMisEntregas(): void {
    // Ya no necesitamos el ID del usuario, el endpoint lo obtiene del token JWT
    this.entregaService.obtenerMisEntregas().subscribe({
      next: (respuesta) => {
        if (respuesta.data) {
          this.misEntregas = respuesta.data;
          
          // Actualizar la lista de tareas pendientes (aquellas que no tienen entrega)
          this.tareasPendientes = this.tareas.filter(tarea => {
            // Una tarea está pendiente si no tiene entrega
            return !this.tareaEntregada(tarea.id);
          });
          
          console.log(`Tareas pendientes actualizadas: ${this.tareasPendientes.length} de ${this.tareas.length}`);
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar tus entregas. Por favor, inténtalo de nuevo más tarde.';
        this.cargando = false;
        console.error('Error al obtener las entregas del alumno:', err);
      }
    });
  }

  /**
   * Verifica si una tarea ya ha sido entregada por el alumno.
   * 
   * @param tareaId ID de la tarea
   * @returns True si la tarea ya ha sido entregada, false en caso contrario
   */
  tareaEntregada(tareaId: number): boolean {
    return this.misEntregas.some(entrega => entrega.tarea_id === tareaId);
  }
  
  /**
   * Verifica si una tarea ha sido calificada.
   * 
   * @param tareaId ID de la tarea
   * @returns True si la tarea ha sido calificada, false en caso contrario
   */
  tareaCalificada(tareaId: number): boolean {
    const entrega = this.misEntregas.find(entrega => entrega.tarea_id === tareaId);
    return !!entrega && entrega.calificacion !== null;
  }

  /**
   * Obtiene la entrega del alumno para una tarea específica.
   * 
   * @param tareaId ID de la tarea
   * @returns La entrega del alumno o null si no existe
   */
  obtenerEntrega(tareaId: number): TareaCalificacionExtendida | null {
    return this.misEntregas.find((entrega: TareaCalificacionExtendida) => entrega.tarea_id === tareaId) || null;
  }

  /**
   * Obtiene el nombre completo del profesor de manera segura.
   * 
   * @param tarea La tarea de la que se quiere obtener el nombre del profesor
   * @returns El nombre completo del profesor o 'No disponible' si no existe
   */
  obtenerNombreProfesor(tarea: Tarea | TareaConEntrega): string {
    // Verificamos si es una TareaExtendida o TareaConEntrega usando el método existente
    if (this.esTareaConEntrega(tarea) && tarea.creador_nombre && tarea.creador_apellido) {
      return `${tarea.creador_nombre} ${tarea.creador_apellido}`;
    }
    
    // Si no es TareaConEntrega o no tiene los datos del profesor
    return 'No disponible';
  }

  /**
   * Verifica si una tarea tiene material adjunto.
   * 
   * @param tarea La tarea a verificar
   * @returns true si la tarea tiene archivo adjunto, false en caso contrario
   */
  tieneMaterialAdjunto(tarea: Tarea | TareaConEntrega): boolean {
    return !!tarea.archivo;
  }

  /**
   * Este método ya no es necesario con el nuevo enfoque de URL
   * Se mantiene por compatibilidad pero no realiza ninguna acción
   * 
   * @param event Evento de cambio del input
   */
  onArchivoSeleccionado(event: any): void {
    // No se requiere ninguna acción, ya que ahora usamos URL
  }

  /**
   * Prepara el formulario para entregar una tarea.
   * 
   * @param tareaId ID de la tarea a entregar
   */
  prepararEntrega(tareaId: number): void {
    this.tareaSeleccionadaId = tareaId;
    this.urlEntrega = '';
    this.comentarioEntrega = '';
  }

  /**
   * Cancela la entrega de una tarea.
   */
  cancelarEntrega(): void {
    this.tareaSeleccionadaId = null;
    this.urlEntrega = '';
    this.comentarioEntrega = '';
  }

  /**
   * Envía la entrega de una tarea.
   */
  enviarEntrega(): void {
    if (!this.tareaSeleccionadaId) {
      this.error = 'No se ha seleccionado ninguna tarea.';
      return;
    }

    if (!this.urlEntrega) {
      this.error = 'Debes proporcionar una URL para entregar tu trabajo.';
      return;
    }

    this.subiendoEntrega = true;
    this.error = null;
    this.mensajeExito = null;

    // Creamos el objeto de entrega con el formato requerido por la API
    const entrega = {
      tarea_id: this.tareaSeleccionadaId,
      url: this.urlEntrega,
      texto: this.comentarioEntrega
    };

    this.entregaService.entregarTarea(entrega).subscribe({
      next: (respuesta) => {
        this.mensajeExito = 'Entrega realizada con éxito.';
        this.subiendoEntrega = false;
        this.tareaSeleccionadaId = null;
        this.urlEntrega = '';
        this.comentarioEntrega = '';
        
        // Recargamos las entregas para mostrar la nueva
        this.cargarMisEntregas();
      },
      error: (err) => {
        this.error = 'Error al realizar la entrega. Por favor, inténtalo de nuevo más tarde.';
        this.subiendoEntrega = false;
        console.error('Error al entregar la tarea:', err);
      }
    });
  }

  /**
   * Procesa las tareas que ya vienen con información de entregas desde el backend
   */
  procesarTareasConEntregas(): void {
    // Filtrar las tareas pendientes (aquellas que no han sido entregadas)
    this.tareasPendientes = this.tareas.filter(tarea => {
      if (this.esTareaConEntrega(tarea)) {
        // Si es TareaConEntrega, verificar si no está entregada
        return !tarea.entregado;
      }
      // Si es una tarea normal, verificar si no tiene entrega
      return !this.tareaEntregada(tarea.id);
    });
    
    // Extraer las entregas de las tareas para mantener la compatibilidad con el resto del componente
    this.misEntregas = this.tareas
      .filter(tarea => {
        // Verificar si la tarea es de tipo TareaConEntrega
        return this.esTareaConEntrega(tarea) && tarea.entregado && tarea.entrega;
      })
      .map(tarea => {
        // Asegurar que TypeScript reconoce que estamos trabajando con TareaConEntrega
        const tareaConEntrega = tarea as TareaConEntrega;
        const entrega = tareaConEntrega.entrega!;
        
        return {
          id: entrega.id,
          usuario_id: Number(this.authService.getUserId()),
          tarea_id: tarea.id,
          url: entrega.url || '',
          texto: entrega.texto || '',
          fecha_entrega: entrega.fecha_entrega,
          calificacion: entrega.calificacion,
          feedback: entrega.feedback || '',
          corregido_por: entrega.corregido_por,
          fecha_correccion: entrega.fecha_correccion,
          // Añadir información extendida para mostrar en la interfaz
          tarea_titulo: tarea.titulo,
          tema_nombre: this.obtenerPropiedadExtendida(tarea, 'tema_nombre'),
          asignatura_nombre: this.obtenerPropiedadExtendida(tarea, 'asignatura_nombre'),
          curso_nombre: this.obtenerPropiedadExtendida(tarea, 'curso_nombre')
        } as TareaCalificacionExtendida;
      });
      
    console.log(`Tareas totales: ${this.tareas.length}, Pendientes: ${this.tareasPendientes.length}, Entregas: ${this.misEntregas.length}`);
  }
  
  /**
   * Verifica si una tarea es de tipo TareaConEntrega
   * @param tarea La tarea a verificar
   * @returns true si la tarea es de tipo TareaConEntrega, false en caso contrario
   */
  private esTareaConEntrega(tarea: Tarea | TareaConEntrega): tarea is TareaConEntrega {
    return 'entregado' in tarea && 'entrega' in tarea;
  }
  
  /**
   * Obtiene una propiedad extendida de una tarea, manejando correctamente los tipos
   * @param tarea La tarea de la que obtener la propiedad
   * @param propiedad Nombre de la propiedad a obtener
   * @returns El valor de la propiedad o una cadena vacía si no existe
   */
  private obtenerPropiedadExtendida(tarea: Tarea | TareaConEntrega, propiedad: string): string {
    // Si es TareaExtendida o TareaConEntrega, intentar obtener la propiedad
    if ((tarea as any)[propiedad] !== undefined) {
      return (tarea as any)[propiedad] || '';
    }
    return '';
  }

  /**
   * Navega a la página de temas del alumno.
   */
  volverATemas(): void {
    if (this.temaSeleccionado && this.temaSeleccionado.asignatura_id) {
      this.router.navigate(['/dashboard/alumno/mis-temas'], { 
        queryParams: { asignaturaId: this.temaSeleccionado.asignatura_id } 
      });
    } else {
      this.router.navigate(['/dashboard/alumno/mis-asignaturas']);
    }
  }

  /**
   * Navega a la página principal del alumno.
   */
  volver(): void {
    this.router.navigate(['/dashboard/alumno']);
  }
  
  /**
   * Navega a la vista de detalles de una entrega.
   * 
   * @param entrega La entrega cuyos detalles se quieren ver
   */
  verDetallesEntrega(entrega: TareaCalificacionExtendida): void {
    // Navegar a la ruta de detalle de entrega con el ID de la entrega
    this.router.navigate(['/dashboard/alumno/detalle-entrega', entrega.id]);
  }
  
  /**
   * Cierra la vista de detalles de una entrega.
   */
  cerrarDetallesEntrega(): void {
    this.entregaSeleccionada = null;
    this.mostrandoDetalleEntrega = false;
    this.urlEntrega = '';
    this.comentarioEntrega = '';
  }
}
