const express = require('express');
const router = express.Router();
const asignaturaController = require('../controller/asignaturaController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize, isProfesorAsignadoOAdmin } = require('../middlewares/roleMiddleware');
const paginacionMiddleware = require('../middlewares/paginationMiddleware');

/**
 * Rutas para gestión de Asignaturas
 */

// Obtener todas las asignaturas (con filtros: ?cursoId=X&profesorId=Y&activas=true&nombre=ABC)
router.get('/', authMiddleware, paginacionMiddleware, asignaturaController.obtenerAsignaturas);

// Obtener una asignatura específica por ID (con su profesor y temas)
router.get('/:id', authMiddleware, asignaturaController.obtenerAsignaturaPorId);

// Obtener todos los temas de una asignatura específica
router.get('/:id/temas', authMiddleware, paginacionMiddleware, asignaturaController.obtenerTemasPorAsignatura);

// Obtener todas las asignaturas de un curso específico
router.get('/curso/:cursoId', authMiddleware, paginacionMiddleware, asignaturaController.obtenerAsignaturasPorCurso);

// Crear una nueva asignatura (Admin puede asignar cualquier profesor, Profesor solo puede crear para sí mismo o sin asignar)
router.post('/', authMiddleware, authorize(['admin', 'profesor']), asignaturaController.crearAsignatura);

// Actualizar una asignatura
// Solo Admin, o el Profesor asignado a ESA asignatura.
router.put('/:id', 
    authMiddleware, 
    authorize(['admin', 'profesor']), // El controlador verificará si el profesor es el asignado
    asignaturaController.actualizarAsignatura
);

// Eliminar una asignatura
// Solo Admin, o el Profesor asignado.
router.delete('/:id', 
    authMiddleware, 
    authorize(['admin', 'profesor']), // El controlador verificará
    asignaturaController.eliminarAsignatura
);

module.exports = router; 