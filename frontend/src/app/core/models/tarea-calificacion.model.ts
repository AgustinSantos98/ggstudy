/**
 * Interfaz que representa la calificación de una tarea entregada por un alumno.
 * 
 * Esta interfaz refleja exactamente la estructura de la tabla tarea_calificacion en la base de datos.
 */
export interface TareaCalificacion {
  /** Identificador único de la calificación */
  id: number;
  
  /** Identificador del alumno que entregó la tarea */
  usuario_id: number;
  
  /** Identificador de la tarea entregada */
  tarea_id: number;
  
  /** URL o ruta al archivo entregado por el alumno (opcional) */
  url?: string;
  
  /** Texto complementario de la entrega (opcional) */
  texto?: string;
  
  /** Fecha y hora de la entrega */
  fecha_entrega: string;
  
  /** Calificación numérica asignada a la entrega (opcional, decimal con 2 decimales) */
  calificacion?: number;
  
  /** Comentarios o retroalimentación del profesor sobre la entrega (opcional) */
  feedback?: string;
  
  /** Identificador del profesor que corrigió la entrega (opcional) */
  corregido_por?: number;
  
  /** Fecha y hora de la corrección (opcional) */
  fecha_correccion?: string;
}

/**
 * Interfaz extendida de TareaCalificacion que incluye información adicional para la vista
 * 
 * Esta interfaz añade propiedades relacionadas con el alumno, la tarea, y el profesor corrector
 * que son útiles para mostrar en la interfaz de usuario.
 */
export interface TareaCalificacionExtendida extends TareaCalificacion {
  /** Nombre del alumno que entregó la tarea */
  alumno_nombre?: string;
  
  /** Apellido del alumno que entregó la tarea */
  alumno_apellido?: string;
  
  /** Título de la tarea entregada */
  tarea_titulo?: string;
  
  /** Nombre del tema al que pertenece la tarea */
  tema_nombre?: string;
  
  /** Nombre de la asignatura a la que pertenece el tema */
  asignatura_nombre?: string;
  
  /** Identificador de la asignatura a la que pertenece el tema */
  asignatura_id?: number;
  
  /** Nombre del profesor que corrigió la entrega */
  corrector_nombre?: string;
  
  /** Apellido del profesor que corrigió la entrega */
  corrector_apellido?: string;
}