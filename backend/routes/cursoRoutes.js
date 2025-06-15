const express = require('express');
const router = express.Router();
const cursoController = require('../controller/cursoController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const paginacionMiddleware = require('../middlewares/paginationMiddleware');
// const { validateCurso } = require('../middlewares/validationMiddleware'); // Para POST y PUT si es necesario

/**
 * Rutas para gestión de Cursos
 */

// --- Rutas Públicas o para Usuarios Autenticados (lectura) ---
// Obtener todos los cursos (con filtros opcionales como ?activos=true)
router.get('/', authMiddleware, paginacionMiddleware, cursoController.obtenerTodosLosCursos);

// Obtener todos los cursos en los que está matriculado un alumno
router.get('/alumno/:alumnoId', authMiddleware, paginacionMiddleware, cursoController.obtenerCursosPorAlumno);

// Obtener todos los cursos disponibles para matricular a un alumno
router.get('/disponibles/:alumnoId', authMiddleware, paginacionMiddleware, cursoController.obtenerCursosDisponibles);

// Obtener un curso específico por ID (con sus asignaturas y temas)
router.get('/:id', authMiddleware, cursoController.obtenerCursoPorId);

// Obtener todas las asignaturas de un curso específico
router.get('/:id/asignaturas', authMiddleware, paginacionMiddleware, cursoController.obtenerAsignaturasPorCurso);

// Obtener todos los alumnos matriculados en un curso
router.get('/:id/alumnos', authMiddleware, paginacionMiddleware, cursoController.obtenerAlumnosPorCurso);

// Obtener todos los profesores que imparten asignaturas en un curso específico
router.get('/:id/profesores', authMiddleware, cursoController.obtenerProfesoresPorCurso);

// --- Rutas de Administración de Cursos (requieren rol Admin) ---
router.post('/', authMiddleware, authorize(['admin']), /* validateCurso, */ cursoController.crearCurso);

router.put('/:id', authMiddleware, authorize(['admin']), /* validateCurso, */ cursoController.actualizarCurso);

router.delete('/:id', authMiddleware, authorize(['admin']), cursoController.eliminarCurso);


// --- Rutas de Matriculación/Desmatriculación de Alumnos (Admin o Profesor del curso) ---
// Para matricular, el controlador debe verificar que el usuario_id sea de un alumno.
// La autorización de profesor aquí es general. Idealmente, se verificaría que el profesor logueado
// esté asociado a alguna asignatura de este cursoId.
router.post('/:cursoId/alumnos', 
    authMiddleware, 
    authorize(['admin', 'profesor']), 
    cursoController.matricularAlumnoEnCurso
);

router.delete('/:cursoId/alumnos/:alumnoId', 
    authMiddleware, 
    authorize(['admin', 'profesor']), 
    cursoController.desmatricularAlumnoDeCurso
);

module.exports = router; 