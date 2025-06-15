const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Rutas para autenticación de usuarios
 */


// Verificar autenticación actual y obtener datos del usuario si el token es válido
router.get('/verificar', authMiddleware, authController.checkAuth);

// Cerrar sesión (si el backend maneja listas negras de tokens o similar)
router.post('/salir', authMiddleware, authController.logout);

// Refrescar token JWT
router.post('/refrescar', authMiddleware, authController.refreshToken);

module.exports = router;
