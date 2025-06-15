/**
 * Middleware para verificar roles de usuario
 * Permite controlar el acceso a rutas según el rol del usuario autenticado
 */

/**
 * Crea un middleware que verifica si el usuario tiene alguno de los roles permitidos.
 * El middleware de autenticación (que establece req.user) debe haberse ejecutado antes.
 * @param {Array<String>} allowedRoles - Array de strings con los roles permitidos (ej: ['admin', 'profesor']).
 * @returns {Function} - Middleware de Express.
 */
function authorize(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado. Acceso denegado.' });
        }

        const userRole = req.user.rol;
        if (allowedRoles.includes(userRole)) {
            next(); // El rol del usuario está en la lista de roles permitidos
        } else {
            res.status(403).json({ 
                message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}. Rol actual: ${userRole}`
            });
        }
    };
}

// Middlewares específicos como conveniencia, usando authorize
const isAdmin = authorize(['admin']);
const isProfesor = authorize(['profesor']); // Solo profesor
const isAdminOrProfesor = authorize(['admin', 'profesor']); // Admin o Profesor
const isAlumno = authorize(['alumno']);

module.exports = {
    authorize, // Exportar la función genérica
    isAdmin,
    isProfesor,
    isAdminOrProfesor,
    isAlumno
}; 