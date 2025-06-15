const express = require('express');
const router = express.Router();
const tareaCalificacionController = require('../controller/tareaCalificacionController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const paginacionMiddleware = require('../middlewares/paginationMiddleware');

/**
 * Rutas para gestión de Entregas y Calificaciones de Tareas
 * Prefijo sugerido en app.js: /api/calificaciones o /api/entregas
 */

// --- Rutas para Alumnos ---
// Entregar una tarea (crea una TareaCalificacion)
router.post('/', authMiddleware, authorize(['alumno']), tareaCalificacionController.crearEntrega);

// Obtener mis calificaciones/entregas
router.get('/mis-entregas', authMiddleware, authorize(['alumno']), paginacionMiddleware, tareaCalificacionController.obtenerMisCalificaciones);

// Obtener una de mis entregas específicas por ID
router.get('/:id/mi-entrega', authMiddleware, authorize(['alumno']), tareaCalificacionController.obtenerCalificacionPorId); // El controlador verifica propiedad

// Actualizar mi entrega (si no está calificada)
router.put('/:id/mi-entrega', authMiddleware, authorize(['alumno']), tareaCalificacionController.actualizarMiEntrega);

// Eliminar mi entrega (si no está calificada)
router.delete('/:id/mi-entrega', authMiddleware, authorize(['alumno']), tareaCalificacionController.eliminarEntrega);


// --- Rutas para Profesores y Administradores ---
// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros

// Obtener todas las entregas asociadas a las asignaturas de un profesor
router.get('/profesor', authMiddleware, authorize(['admin', 'profesor']), paginacionMiddleware, tareaCalificacionController.obtenerEntregasPorProfesor);

// Obtener todas las entregas de una tarea específica
router.get('/tarea/:tareaId', authMiddleware, authorize(['admin', 'profesor']), paginacionMiddleware, tareaCalificacionController.obtenerEntregasPorTarea);

// Obtener todas las calificaciones de un alumno específico (para admin/profesor)
router.get('/alumno/:alumnoId', authMiddleware, authorize(['admin', 'profesor']), paginacionMiddleware, tareaCalificacionController.obtenerCalificacionesDeAlumno);

// Calificar una entrega (actualiza TareaCalificacion)
router.patch('/:id/calificar', authMiddleware, authorize(['admin', 'profesor']), tareaCalificacionController.calificarEntrega);

// Obtener una entrega/calificación específica por ID (para admin/profesor)
// NOTA: Esta ruta debe ir después de todas las rutas específicas con '/algo'
router.get('/:id', authMiddleware, authorize(['admin', 'profesor']), tareaCalificacionController.obtenerCalificacionPorId);

// Eliminar una entrega (admin/profesor con permisos)
router.delete('/:id', authMiddleware, authorize(['admin', 'profesor']), tareaCalificacionController.eliminarEntrega);


module.exports = router;