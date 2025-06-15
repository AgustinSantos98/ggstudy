/**
 * Interfaz que representa un tema o unidad temática dentro de una asignatura.
 * 
 * Los temas son divisiones de contenido dentro de una asignatura y pueden contener tareas.
 */
export interface Tema {
  /** Identificador único del tema */
  id: number;
  
  /** Identificador de la asignatura a la que pertenece este tema */
  asignatura_id: number;
  
  /** Nombre del tema */
  nombre: string;
  
  /** Nombre del tema (formato alternativo que puede venir del backend) */
  tema_nombre?: string;
  
  /** Nombre de la asignatura a la que pertenece (para visualización) */
  asignatura_nombre?: string;
  
  /** Identificador del curso al que pertenece la asignatura */
  curso_id?: number;
  
  /** Nombre del curso al que pertenece la asignatura (para visualización) */
  curso_nombre?: string;
  
  /** Número de tareas asociadas a este tema */
  tareasCount?: number;
}