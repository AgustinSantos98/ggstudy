const express = require('express');
const router = express.Router();
const temaController = require('../controller/temaController');
const authMiddleware = require('../middlewares/authMiddleware');
// Middleware para verificar si el usuario es admin o profesor de la asignatura del tema
const { authorize, isProfesorDeAsignaturaDelTemaOAdmin } = require('../middlewares/roleMiddleware'); 
const paginacionMiddleware = require('../middlewares/paginationMiddleware');

/**
 * Rutas para gestión de Temas
 */

// Obtener todos los temas (con filtros: ?asignaturaId=X&nombre=ABC)
router.get('/', authMiddleware, paginacionMiddleware, temaController.obtenerTemas);

// Obtener un tema específico por ID (con sus tareas)
router.get('/:id', authMiddleware, temaController.obtenerTemaPorId);

// Obtener todas las tareas de un tema específico
router.get('/:id/tareas', authMiddleware, paginacionMiddleware, temaController.obtenerTareasPorTema);

// Obtener todos los temas de una asignatura específica
router.get('/asignatura/:asignaturaId', authMiddleware, paginacionMiddleware, temaController.obtenerTemasPorAsignatura);

// Para las siguientes rutas (POST, PUT, DELETE), se necesita verificar que:
// 1. El usuario esté autenticado (authMiddleware).
// 2. Si el usuario es 'profesor', debe ser el profesor de la 'asignatura' a la que pertenece el 'tema'.
//    Esto requiere obtener el tema, luego su asignatura, luego el profesor de la asignatura.
//    O, si al crear/actualizar se pasa asignatura_id, verificar que el profesor esté asignado a esa asignatura_id.
// 3. Si el usuario es 'admin', tiene permiso.

// Un middleware como `isProfesorDeAsignaturaDelTemaOAdmin` podría hacer esto consultando la BD.
// Por simplicidad, se usará authorize(['admin', 'profesor']) y el controlador hará la verificación detallada.

// Crear un nuevo tema
router.post('/', 
    authMiddleware, 
    authorize(['admin', 'profesor']), // Controlador verificará pertenencia a asignatura si rol es profesor
    temaController.crearTema
);

// Actualizar un tema
router.put('/:id', 
    authMiddleware, 
    authorize(['admin', 'profesor']), // Controlador verificará
    temaController.actualizarTema
);

// Eliminar un tema
router.delete('/:id', 
    authMiddleware, 
    authorize(['admin', 'profesor']), // Controlador verificará
    temaController.eliminarTema
);

module.exports = router; 