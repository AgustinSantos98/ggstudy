const express = require('express');
const router = express.Router();
const tareaController = require('../controller/tareaController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize, isCreadorDeTareaOAdmin } = require('../middlewares/roleMiddleware');
const paginacionMiddleware = require('../middlewares/paginationMiddleware');

/**
 * Rutas para gestión de Tareas
 */

// Obtener todas las tareas (con filtros: ?temaId=X&creadorId=Y&visibles=true&titulo=...
// El controlador tareaController.obtenerTareas debe manejar la lógica de visibilidad
// para alumnos (solo visibles) vs profesores/admin (todas + filtro visibles)
router.get('/', authMiddleware, paginacionMiddleware, tareaController.obtenerTareas);

// Obtener una tarea específica por ID
// El controlador tareaController.obtenerTareaPorId debe manejar la lógica de visibilidad
router.get('/:id', authMiddleware, tareaController.obtenerTareaPorId);

// Obtener todas las tareas de un tema específico con información de entregas para el alumno actual
router.get('/tema/:temaId', authMiddleware, paginacionMiddleware, tareaController.obtenerTareasPorTemaParaAlumno);

// Obtener todas las tareas del curso en el que está matriculado el alumno actual
router.get('/alumno/curso', authMiddleware, paginacionMiddleware, tareaController.obtenerTareasCursoAlumno);

// Para las siguientes rutas (POST, PUT, DELETE, PATCH), se necesita verificar que:
// 1. El usuario esté autenticado (authMiddleware).
// 2. Si el usuario es 'profesor', debe ser el 'creado_por' de la tarea o el profesor de la asignatura del tema de la tarea.
// 3. Si el usuario es 'admin', tiene permiso.
// Un middleware como `isCreadorDeTareaOAdmin` (o más genérico) podría hacer esto.
// Por simplicidad, se usará authorize(['admin', 'profesor']) y el controlador hará la verificación detallada.

// Crear una nueva tarea (creado_por se toma de req.user.id)
router.post('/', 
    authMiddleware, 
    authorize(['admin', 'profesor']), // Admin puede crear, Profesor crea y se autoasigna como creador
    tareaController.crearTarea
);

// Actualizar una tarea
router.put('/:id', 
    authMiddleware, 
    authorize(['admin', 'profesor']), // Controlador verificará si es admin o creador
    tareaController.actualizarTarea
);

// Eliminar una tarea
router.delete('/:id', 
    authMiddleware, 
    authorize(['admin', 'profesor']), // Controlador verificará si es admin o creador
    tareaController.eliminarTarea
);

// Cambiar la visibilidad de una tarea
router.patch('/:id/visibilidad', 
    authMiddleware, 
    authorize(['admin', 'profesor']), // Controlador verificará si es admin o creador
    tareaController.cambiarVisibilidadTarea
);

// Aquí irían rutas relacionadas con TareaCalificacion, si se decide ponerlas bajo /tareas/:id/calificaciones
// o en un /calificaciones router separado.

module.exports = router; 