const express = require('express');
const router = express.Router();
const usuarioController = require('../controller/usuarioController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const paginacionMiddleware = require('../middlewares/paginationMiddleware');

/**
 * Rutas para gestión de usuarios
 */

// Rutas públicas (no requieren autenticación)
router.post('/registrar', usuarioController.registrarUsuario);
router.post('/login', usuarioController.loginUsuario);

// Rutas de Perfil (requieren solo autenticación)
router.get('/perfil', authMiddleware, usuarioController.obtenerPerfil);
router.put('/perfil', authMiddleware, usuarioController.actualizarUsuario);
router.put('/perfil/contrasena', authMiddleware, usuarioController.actualizarContrasenaUsuario);

router.get('/perfil/cursos-matriculados', authMiddleware, authorize(['alumno']), usuarioController.obtenerMisCursosMatriculados);
router.get('/perfil/asignaturas-asignadas', authMiddleware, authorize(['profesor']), usuarioController.obtenerMisAsignaturasAsignadas);

// Rutas de Gestión de Usuarios (requieren rol de Admin en su mayoría)

// Obtener todos los usuarios (con filtros: ?rol=alumno&nombre=ana&page=1&limit=10)
router.get('/', authMiddleware, authorize(['admin', 'profesor']), paginacionMiddleware, usuarioController.obtenerTodosLosUsuarios);

// Obtener todos los alumnos (con filtros: ?page=1&limit=10&profesorId=123)
router.get('/alumnos', authMiddleware, authorize(['admin', 'profesor']), paginacionMiddleware, usuarioController.obtenerAlumnos);

// Obtener un usuario específico por ID
router.get('/:id', authMiddleware, authorize(['admin', 'profesor']), usuarioController.obtenerUsuarioPorId);

// Actualizar un usuario específico (por Admin)
router.put('/:id', authMiddleware, authorize(['admin']), usuarioController.actualizarUsuario);

// Cambiar contraseña de un usuario específico (por Admin)
router.put('/:id/contrasena', authMiddleware, authorize(['admin']), usuarioController.actualizarContrasenaUsuario);

// Eliminar un usuario (por Admin)
router.delete('/:id', authMiddleware, authorize(['admin']), usuarioController.eliminarUsuario);

module.exports = router; 