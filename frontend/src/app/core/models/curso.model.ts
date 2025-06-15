/**
 * Interfaz que representa un curso académico en el sistema.
 * 
 * Un curso es una unidad organizativa que contiene asignaturas y alumnos matriculados.
 */
export interface Curso {
  /** Identificador único del curso */
  id: number;
  
  /** Nombre descriptivo del curso */
  nombre: string;
  
  /** Descripción detallada del curso */
  descripcion: string;
  
  /** Número de alumnos matriculados en el curso (para visualización) */
  alumnosCount?: number;
  
  /** Identificador del usuario (administrador) que creó el curso */
  usuario_id?: number;
  
  /** Color asignado al curso para visualización en la interfaz */
  color?: string;
}