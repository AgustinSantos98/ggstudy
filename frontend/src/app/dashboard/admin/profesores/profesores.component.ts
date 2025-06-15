import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/header/header.component';
import { UsuarioService, RespuestaPaginada } from '../../../core/services/usuario.service';
import { Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './profesores.component.html',
  styleUrls: ['./profesores.component.css', '../../../shared/admin-common.css']
})
export class ProfesoresComponent implements OnInit {
  userEmail: string = '';
  userRole: string = '';
  showDropdown: boolean = false;
  
  profesores: Usuario[] = [];
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
  filterEmail: string = '';
  filterDni: string = '';
  
  // Almacena datos del último acceso por ID de usuario
  private lastAccessMap: Map<number, string> = new Map();
  
  // Para el formulario de profesor (nuevo o edición)
  showNewForm: boolean = false;
  newProfesor: Usuario = this.getEmptyProfesor();
  isEditMode: boolean = false;
  profesorId: number | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private usuarioService: UsuarioService
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
        this.profesorId = +params['id'];
        this.isEditMode = true;
        this.loadProfesorById(this.profesorId);
        this.showNewForm = true;
      }
    });
    
    this.loadProfesores(); 
  }

  /**
   * Carga la lista de profesores con filtros y paginación
   */
  loadProfesores(): void {
    this.loading = true;
    this.error = ''; 

    // Construir los parámetros de consulta usando HttpParams
    let httpParams = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString());
    
    // Añadir filtros solo si tienen valor
    if (this.filterNombre && this.filterNombre.trim()) {
      httpParams = httpParams.set('nombre', this.filterNombre.trim());
    }
    if (this.filterEmail && this.filterEmail.trim()) {
      httpParams = httpParams.set('email', this.filterEmail.trim());
    }
    if (this.filterDni && this.filterDni.trim()) {
      httpParams = httpParams.set('dni', this.filterDni.trim());
    }

    // Usar el servicio de usuarios para obtener los datos
    this.usuarioService.obtenerProfesores(httpParams)
      .subscribe({
        next: (response: RespuestaPaginada<Usuario>) => {
          
          if (response && response.data) {
            this.profesores = response.data;
            
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
              this.totalItems = 0;
              this.totalPages = 0;
            }
            
            // Si no hay resultados pero hay filtros aplicados, mostrar mensaje
            if (this.profesores.length === 0 && (this.filterNombre || this.filterEmail || this.filterDni)) {
              this.error = 'No se encontraron profesores con los filtros aplicados.';
            }
          } else {
            // Formato de respuesta inesperado
            console.error('Formato de respuesta inesperado:', response);
            this.error = 'Error en el formato de datos recibidos.';
            this.profesores = [];
            this.totalItems = 0;
            this.totalPages = 0;
          }
          
          // Generar texto de último acceso para cada profesor una vez
          this.profesores.forEach(profesor => {
            if (!this.lastAccessMap.has(profesor.id)) {
              const days = Math.floor(Math.random() * 5) + 1;
              const hours = Math.floor(Math.random() * 24);
              this.lastAccessMap.set(profesor.id, `${days} día${days !== 1 ? 's' : ''} ${hours} hora${hours !== 1 ? 's' : ''}`);
            }
          });
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar los profesores:', err);
          this.handleError(err, 'cargar');
          this.profesores = [];
          this.totalItems = 0;
          this.totalPages = 0;
          this.loading = false;
        }
      });
  }

  applyFilters(): void {
    // Restablecer a la primera página al aplicar filtros
    this.currentPage = 1; 
    this.error = '';
    this.successMessage = '';
    this.loadProfesores();
  }

  resetFilters(): void {
    // Limpiar todos los filtros
    this.filterNombre = '';
    this.filterEmail = '';
    this.filterDni = '';
    this.currentPage = 1;
    this.error = '';
    this.successMessage = '';
    this.loadProfesores();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      console.log(`Cambiando de página ${this.currentPage} a ${page}`);
      
      // Cambiar a la página solicitada si es válida
      this.currentPage = page;
      
      // Desplazar al inicio de la tabla al cambiar de página
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        const rect = tableContainer.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({ top: rect.top + scrollTop, behavior: 'smooth' });
      }
      
      // Cargar los datos de la nueva página
      this.loadProfesores();
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

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.authService.logout();
  }
  
  toggleNewForm(): void {
    this.showNewForm = !this.showNewForm;
    if (this.showNewForm && !this.isEditMode) {
      // Solo reiniciar el formulario si no estamos en modo edición
      this.newProfesor = this.getEmptyProfesor();
      this.isEditMode = false;
      this.profesorId = null;
    } else if (!this.showNewForm) {
      // Al cerrar el formulario, resetear el modo edición
      this.isEditMode = false;
      this.profesorId = null;
    }
  }
  
  getEmptyProfesor(): Usuario {
    return {
      id: 0,
      dni: '',
      nombre: '',
      apellido: '',
      rol: 'profesor',
      email: '',
      fecha_nacimiento: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      telefono: ''
    };
  }
  
  saveNewProfesor(): void {
    if (!this.validateProfesor(this.newProfesor)) {
      return;
    }
    
    this.error = ''; 
    this.successMessage = '';
    this.loading = true;
    
    // Formatear fechas correctamente para MySQL (YYYY-MM-DD)
    const profesorData = {...this.newProfesor};
    
    // Formatear fecha_ingreso si existe
    if (profesorData.fecha_ingreso) {
      const fecha = new Date(profesorData.fecha_ingreso);
      profesorData.fecha_ingreso = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }
    
    // Formatear fecha_nacimiento si existe
    if (profesorData.fecha_nacimiento) {
      const fecha = new Date(profesorData.fecha_nacimiento);
      profesorData.fecha_nacimiento = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }
    
    // Formatear fecha_fin si existe
    if (profesorData.fecha_fin) {
      const fecha = new Date(profesorData.fecha_fin);
      profesorData.fecha_fin = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }
    
    if (this.isEditMode && this.profesorId) {
      // Actualizar profesor existente
      this.usuarioService.actualizarUsuario(this.profesorId, profesorData)
        .subscribe({
          next: (response) => {
            this.successMessage = 'Profesor actualizado correctamente';
            this.showNewForm = false;
            this.isEditMode = false;
            this.profesorId = null;
            this.newProfesor = this.getEmptyProfesor();
            this.loadProfesores(); // Recargar la lista
            this.loading = false;
          },
          error: (err) => {
            console.error('Error al actualizar el profesor:', err);
            this.handleError(err, 'actualizar');
            this.loading = false;
          },
          complete: () => {
            // Este bloque es opcional pero puede ser útil para acciones finales
            console.log('Operación de actualización completada');
          }
        });
    } else {
      // Crear nuevo profesor
      // Usamos la ruta de registro correcta
      this.http.post<any>('http://localhost:3000/api/usuarios/registrar', {
        ...profesorData,
        contrasena: profesorData.dni // Usar el DNI como contraseña por defecto
      }).subscribe({
          next: (response) => {
            this.successMessage = 'Profesor creado correctamente';
            this.showNewForm = false;
            this.newProfesor = this.getEmptyProfesor();
            this.loadProfesores(); // Recargar la lista
            this.loading = false;
          },
          error: (err) => {
            console.error('Error al crear el profesor:', err);
            this.handleError(err, 'crear');
            this.loading = false;
          },
          complete: () => {
            // Este bloque es opcional pero puede ser útil para acciones finales
            console.log('Operación de creación completada');
          }
        });
    }
  }

  /**
   * Carga datos de un profesor por su ID utilizando el servicio
   * 
   * @param profesorId Identificador del profesor a cargar
   */
  loadProfesorById(profesorId: number): void {
    this.loading = true;
    this.error = '';
    
    this.usuarioService.obtenerUsuarioPorId(profesorId)
      .subscribe({
        next: (response) => {
          if (response) {
            // Manejar los diferentes formatos de respuesta
            let profesorData: Usuario | null = null;
            
            if ('data' in response && response.data) {
              // Si la respuesta tiene formato {data: Usuario}
              profesorData = response.data as Usuario;
            } else if ('id' in response) {
              // Si la respuesta es directamente un Usuario
              profesorData = response as Usuario;
            }
            
            if (profesorData) {
              // Crear un nuevo objeto con las propiedades requeridas
              this.newProfesor = {
                id: profesorData.id,
                dni: profesorData.dni,
                nombre: profesorData.nombre,
                apellido: profesorData.apellido,
                rol: profesorData.rol,
                email: profesorData.email,
                fecha_nacimiento: profesorData.fecha_nacimiento,
                fecha_ingreso: profesorData.fecha_ingreso ? new Date(profesorData.fecha_ingreso).toISOString().split('T')[0] : '',
                fecha_fin: profesorData.fecha_fin,
                telefono: profesorData.telefono,
                foto_perfil_url: profesorData.foto_perfil_url
              };
              
              // Establecer el modo de edición
              this.isEditMode = true;
              this.profesorId = profesorId;
            } else {
              this.error = 'Formato de respuesta inesperado.';
              this.newProfesor = this.getEmptyProfesor();
            }
          } else {
            this.error = 'No se pudo cargar la información del profesor.';
            this.newProfesor = this.getEmptyProfesor();
          }
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error al cargar el profesor:', err);
          this.handleError(err, 'cargar');
          this.newProfesor = this.getEmptyProfesor();
          this.loading = false;
        }
      });
  }

  /**
   * Valida los datos del profesor antes de guardar
   * 
   * @param profesor Datos del profesor a validar
   * @returns true si los datos son válidos, false en caso contrario
   */
  validateProfesor(profesor: Usuario): boolean {
    if (!profesor.dni.trim()) {
      this.error = 'El DNI es obligatorio';
      return false;
    }
    
    if (!profesor.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return false;
    }
    
    if (!profesor.apellido.trim()) {
      this.error = 'El apellido es obligatorio';
      return false;
    }
    
    if (!profesor.email.trim()) {
      this.error = 'El email es obligatorio';
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profesor.email)) {
      this.error = 'El formato del email es inválido';
      return false;
    }
    
    return true;
  }

  /**
   * Navegación para editar profesor
   * 
   * @param profesorId Identificador del profesor a editar
   */
  navigateToEditProfesor(profesorId: number): void {
    // En lugar de navegar a otra ruta, cargar el profesor y mostrar el formulario
    this.isEditMode = true;
    this.profesorId = profesorId;
    this.showNewForm = true;
    this.loadProfesorById(profesorId);
  }

  /**
   * Cambia el estado de un profesor (activo/inactivo)
   * 
   * @param profesorId Identificador del profesor
   * @param activo Nuevo estado (true = activo, false = inactivo)
   */
  cambiarEstadoProfesor(profesorId: number, activo: boolean): void {
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    // Construir el objeto con el estado actualizado
    const estadoActualizado = { activo: activo };
    
    // Usar el método PATCH a través del servicio HTTP ya que no tenemos un método específico en el servicio
    this.http.patch<any>(`http://localhost:3000/api/usuarios/${profesorId}/estado`, estadoActualizado)
      .subscribe({
        next: (response) => {
          this.successMessage = `Profesor ${activo ? 'activado' : 'desactivado'} correctamente`;
          this.loadProfesores(); // Recargar la lista
          this.loading = false;
        },
        error: (err) => {
          console.error(`Error al ${activo ? 'activar' : 'desactivar'} el profesor:`, err);
          this.handleError(err, activo ? 'activar' : 'desactivar');
          this.loading = false;
        }
      });
  }

  /**
   * Elimina un profesor del sistema
   * 
   * @param profesor Objeto profesor a eliminar
   */
  eliminarProfesor(profesor: Usuario): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar al profesor "${profesor.nombre} ${profesor.apellido}"?`)) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    this.successMessage = '';
    
    this.usuarioService.eliminarUsuario(profesor.id)
      .subscribe({
        next: (response) => {
          console.log('Eliminación exitosa:', response);
          this.successMessage = `Profesor ${profesor.nombre} ${profesor.apellido} eliminado correctamente.`;
          
          // Cargar los profesores de nuevo para actualizar la lista
          this.loadProfesores();
          
          // Limpiar el mensaje de éxito después de 5 segundos
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        },
        error: (err) => {
          console.error('Error al eliminar el profesor:', err);
          // Capturar el mensaje de error específico
          this.error = err.error?.message || 'Error al eliminar el profesor. Por favor, intente de nuevo.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Maneja errores comunes
   * 
   * @param err Error recibido
   * @param accion Acción que se estaba realizando
   */
  handleError(err: any, accion: string): void {
    if (err.error && err.error.message) {
      // Si el servidor devuelve un mensaje de error específico
      this.error = `Error: ${err.error.message}`;
      
      // Manejar casos específicos de error
      if (err.status === 409 && accion === 'crear') {
        if (err.error.message.includes('dni')) {
          this.error = 'Error: Ya existe un usuario con ese DNI.';
        } else if (err.error.message.includes('email')) {
          this.error = 'Error: Ya existe un usuario con ese correo electrónico.';
        } else {
          this.error = `Ya existe un usuario con ese DNI o email.`;
        }
      } else if (err.status === 404) {
        this.error = 'Error: No se encontró el profesor solicitado.';
      } else if (err.status === 403) {
        this.error = 'Error: No tiene permisos para realizar esta acción.';
      } else if (err.status === 400) {
        // Error de validación
        this.error = `Datos inválidos. Por favor, revise la información proporcionada.`;
      }
    } else {
      // Mensaje genérico si no hay información específica
      this.error = `Error al ${accion} el profesor. Por favor, intente de nuevo.`;
    }
  }
}