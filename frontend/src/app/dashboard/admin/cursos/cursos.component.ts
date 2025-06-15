import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/header/header.component';
import { Curso } from '../../../core/models/curso.model';
import { CursoService } from '../../../core/services/curso.service';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './cursos.component.html',
  styleUrls: ['./cursos.component.css', '../../../shared/admin-common.css']
})
export class CursosAdminComponent implements OnInit {
  // Lista de colores para asignar aleatoriamente a los cursos
  private static readonly courseColors: string[] = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
  
  userEmail: string = '';
  userRole: string = '';
  showDropdown: boolean = false;
  
  cursos: Curso[] = [];
  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  
  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10; 
  totalItems: number = 0;
  totalPages: number = 0;
  
  // Filtros
  filterNombre: string = '';
  
  // Para el formulario de nuevo curso
  showNewForm: boolean = false;
  newCurso: Curso = this.getEmptyCurso();
  isEditMode: boolean = false;
  cursoId: number | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cursoService: CursoService
  ) {}


  ngOnInit(): void {
    // Obtener información del usuario desde el servicio de autenticación
    this.userEmail = this.authService.getUserEmail();
    this.userRole = this.authService.getUserRole();
    
    // Verificar si el usuario está autenticado y es administrador
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Comprobar si el usuario es administrador
    if (this.userRole !== 'admin') {
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // Verificar si estamos en modo edición (comprobando parámetros de URL)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.cursoId = +params['id'];
        this.isEditMode = true;
        this.loadCursoPorId(this.cursoId);
        this.showNewForm = true;
      }
    });
    
    this.loadCursos();
  }

  loadCursos(): void {
    this.loading = true;
    this.error = '';
    
    // Construir los parámetros de consulta
    let httpParams = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString());
    
    // Añadir filtros solo si tienen valor
    if (this.filterNombre && this.filterNombre.trim()) {
      httpParams = httpParams.set('nombre', this.filterNombre.trim());
    }
    
    // Utilizar el servicio de cursos para obtener los datos
    this.cursoService.obtenerTodosLosCursos(httpParams)
      .subscribe({
        next: (response) => {
          // Comprobar si la respuesta tiene una propiedad data (respuesta paginada)
          if (response && response.data) {
            this.cursos = response.data;
            
            // Manejar la paginación
            if (response.pagination) {
              // Usar los valores del servidor correctamente según la estructura de respuesta
              if (response.pagination.total !== undefined) {
                this.totalItems = response.pagination.total;
              }
              
              if (response.pagination.totalPages !== undefined) {
                this.totalPages = response.pagination.totalPages;
              } else if (response.pagination.total !== undefined) {
                // Calcular páginas si tenemos el total pero no totalPages
                this.totalPages = Math.ceil(response.pagination.total / this.itemsPerPage);
              }
              
              // Actualizar la página actual desde la respuesta
              if (response.pagination.page !== undefined) {
                this.currentPage = response.pagination.page;
              }
            } else {
              // Si no hay información de paginación, usar valores por defecto para pruebas
              this.totalItems = this.cursos.length > 0 ? 25 : 0;
              this.totalPages = this.totalItems > 0 ? 3 : 0;
            }
          } else if (Array.isArray(response)) {
            // Manejar el caso donde la respuesta es un array directo
            this.cursos = response;
            this.totalItems = response.length;
            this.totalPages = 1;
          } else {
            // Formato de respuesta inesperado
            console.error('Formato de respuesta inesperado:', response);
            this.error = 'Error en el formato de datos recibidos.';
            this.cursos = [];
            this.totalItems = 0;
            this.totalPages = 0;
          }
          
          // Solo inicializar contador de alumnos si no existe
          this.cursos.forEach(curso => {
            // Inicializar contador de alumnos a 0 si no existe
            if (curso.alumnosCount === undefined) {
              curso.alumnosCount = 0;
            }
          });
          
          this.loading = false;
          
          // Después de cargar los cursos, obtener el número de alumnos para cada uno
          this.loadAlumnosCounts();
        },
        error: (err) => {
          console.error('Error al cargar los cursos:', err);
          if (err.error && err.error.message) {
            this.error = `Error: ${err.error.message}`;
          } else {
            this.error = 'Error al cargar los cursos. Por favor, intente de nuevo.';
          }
          this.cursos = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.loading = false;
        }
      });
  }
  
  loadAlumnosCounts(): void {
    // Para cada curso, obtener el número de alumnos matriculados
    this.cursos.forEach(curso => {
      this.cursoService.obtenerAlumnosDeCurso(curso.id)
        .subscribe({
          next: (response) => {
            // Verificar si la respuesta tiene el formato esperado con data y pagination
            if (response && 'data' in response && Array.isArray(response.data)) {
              // Actualizar el contador de alumnos del curso usando la matriz de datos
              curso.alumnosCount = response.data.length;
              
              // Alternativa: usar el total de la paginación si está disponible
              if (response.pagination && response.pagination.total !== undefined) {
                curso.alumnosCount = response.pagination.total;
              }
            } else if (Array.isArray(response)) {
              // Si la respuesta es directamente un array (por compatibilidad)
              curso.alumnosCount = response.length;
            } else {
              console.warn(`Formato de respuesta inesperado para alumnos del curso ${curso.id}`);
              curso.alumnosCount = 0;
            }
          },
          error: (err) => {
            console.error(`Error al obtener alumnos del curso ${curso.id}:`, err);
            // En caso de error, dejamos el contador en 0 (valor por defecto)
          }
        });
    });
  }
  
  applyFilters(): void {
    // Restablecer a la primera página al aplicar filtros
    this.currentPage = 1; 
    this.error = '';
    this.successMessage = '';
    this.loadCursos();
  }
  
  resetFilters(): void {
    // Limpiar todos los filtros
    this.filterNombre = '';
    this.currentPage = 1;
    this.error = '';
    this.successMessage = '';
    this.loadCursos();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.authService.logout();
  }
  
  getRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * CursosAdminComponent.courseColors.length);
    return CursosAdminComponent.courseColors[randomIndex];
  }
  
  toggleNewForm(): void {
    this.showNewForm = !this.showNewForm;
    if (this.showNewForm && !this.isEditMode) {
      // Solo reiniciar el formulario si no estamos en modo edición
      this.newCurso = this.getEmptyCurso();
      this.isEditMode = false;
      this.cursoId = null;
    } else if (!this.showNewForm) {
      // Al cerrar el formulario, resetear el modo edición
      this.isEditMode = false;
      this.cursoId = null;
    }
  }
  
  getEmptyCurso(): Curso {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      alumnosCount: 0
    };
  }
  
  saveNewCurso(): void {
    console.log('Datos del nuevo curso:', this.newCurso);
    console.log(!this.validateCurso(this.newCurso))
    if (!this.validateCurso(this.newCurso)) {
      return;
    }
    
    this.error = ''; // Limpiar errores previos
    this.successMessage = '';
    this.loading = true;
    
    if (this.isEditMode && this.cursoId) {
      // Actualizar curso existente
      console.log('Enviando datos para actualizar:', this.newCurso);
      
      this.cursoService.actualizarCurso(this.cursoId, this.newCurso).subscribe({
        next: (response) => {
          console.log('Actualización exitosa:', response);
          this.showNewForm = false;
          this.successMessage = `Curso ${this.newCurso.nombre} actualizado correctamente.`;
          
          // Cargar los cursos de nuevo para mostrar los cambios
          this.loadCursos();
          
          // Resetear el modo edición
          this.isEditMode = false;
          this.cursoId = null;
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al actualizar el curso:', err);
          this.handleError(err, 'actualizar');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      // Crear nuevo curso
      const userId = this.authService.getUserId();
      if (!userId) {
        this.error = 'Error de autenticación. Por favor, inicie sesión nuevamente.';
        return;
      }
      
      this.cursoService.crearCurso({
        ...this.newCurso,
        usuario_id: parseInt(userId)
      }).subscribe({
        next: (response) => {
          console.log('Creación de curso exitosa:', response);
          this.showNewForm = false;
          this.successMessage = `Curso ${this.newCurso.nombre} creado correctamente.`;
          
          // Asegurarse de que estamos en la primera página para ver el nuevo curso
          this.currentPage = 1;
          
          // Recargar la lista de cursos después de una creación exitosa
          this.loadCursos();
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al crear el curso:', err);
          this.handleError(err, 'crear');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
  
  validateCurso(curso: Curso): boolean {
    if (!curso.nombre.trim()) {
      this.error = 'El nombre del curso es obligatorio';
      return false;
    }
    
    return true;
  }
  
  
  // Navegación para editar curso
  navigateToEditCurso(cursoId: number): void {
    // En lugar de navegar a otra ruta, cargar el curso y mostrar el formulario
    this.loadCursoPorId(cursoId);
  }
  
  // Cargar datos de un curso por su ID
  loadCursoPorId(cursoId: number): void {
    this.loading = true;
    this.error = '';
    
    this.cursoService.obtenerCursoPorId(cursoId).subscribe({
      next: (response) => {        
        // Extraer los datos del curso de la respuesta, que puede tener diferentes formatos
        let cursoData: Curso | undefined;
        
        // Comprobar si la respuesta es directamente el objeto de curso
        if ('id' in response && response.id) {
          cursoData = response as Curso;
        } 
        // Comprobar si la respuesta tiene un formato con propiedad data
        else if ('data' in response && response.data) {
          cursoData = response.data;
        }
        
        if (cursoData) {

          this.newCurso = {
            ...cursoData
          };
          this.isEditMode = true;
          this.cursoId = cursoId;
          this.showNewForm = true;
        } else {
          this.error = 'No se pudo cargar la información del curso.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el curso:', err);
        this.error = 'Error al cargar los datos del curso. Por favor, intente de nuevo.';
        this.loading = false;
      }
    });
  }

  // Método para eliminar un curso
  deleteCurso(curso: Curso, event: Event): void {
    event.stopPropagation(); // Evitar que el evento se propague
    
    if (!confirm(`¿Estás seguro de que deseas eliminar el curso "${curso.nombre}"?`)) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    this.cursoService.eliminarCurso(curso.id).subscribe({
        next: (response) => {
          console.log('Eliminación exitosa:', response);
          this.successMessage = `Curso ${curso.nombre} eliminado correctamente.`;
          
          // Cargar los cursos de nuevo para actualizar la lista
          this.loadCursos();
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al eliminar el curso:', err);
          this.handleError(err, 'eliminar');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
  }
  
  // Manejar errores comunes
  handleError(err: any, accion: string): void {
    if (err.error && err.error.message) {
      // Error con mensaje específico del servidor
      this.error = `${err.error.message}`;
    } else if (err.status === 409) {
      // Error de conflicto (nombre duplicado)
      this.error = `Ya existe un curso con ese nombre.`;
    } else if (err.status === 400) {
      // Error de validación
      this.error = `Datos inválidos. Por favor, revise la información proporcionada.`;
    } else {
      // Error genérico
      this.error = `Error al ${accion} el curso. Por favor, intente de nuevo.`;
    }
  }
  
  // Métodos para la paginación
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      console.log(`Cambiando de página ${this.currentPage} a ${page}`);
      
      // Cambiar a la página solicitada si es válida
      this.currentPage = page;
      
      // Desplazar al inicio de la tabla al cambiar de página
      const tableContainer = document.querySelector('.courses-grid');
      if (tableContainer) {
        const rect = tableContainer.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({ top: rect.top + scrollTop, behavior: 'smooth' });
      }
      
      // Cargar los datos de la nueva página
      this.loadCursos();
    }
  }
  
  /**
   * Genera un array con los números de página para la paginación
   * @returns Array con los números de página disponibles
   */
  getPageArray(): number[] {
    const pages: number[] = [];
    
    // Si hay menos de 7 páginas, mostrar todas
    if (this.totalPages <= 7) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar la primera página
      pages.push(1);
      
      // Determinar el rango de páginas a mostrar alrededor de la página actual
      let startPage = Math.max(2, this.currentPage - 2);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + 2);
      
      // Ajustar para mostrar 5 páginas en total
      if (startPage > 2) {
        pages.push(-1); // Indicador de "..."
      }
      
      // Añadir páginas intermedias
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Añadir indicador de "..." si es necesario
      if (endPage < this.totalPages - 1) {
        pages.push(-2); // Indicador de "..."
      }
      
      // Siempre mostrar la última página
      pages.push(this.totalPages);
    }
    
    return pages;
  }
  
  /**
   * Ir a la primera página
   */
  goToFirstPage(): void {
    if (this.currentPage !== 1) {
      this.onPageChange(1);
    }
  }
  
  /**
   * Ir a la última página
   */
  goToLastPage(): void {
    if (this.currentPage !== this.totalPages) {
      this.onPageChange(this.totalPages);
    }
  }
} 