const curso = require('../models/cursoModel');
const cursoProfesor = require('../models/cursoProfesorModel');

/**
 * Middleware para verificar la propiedad de recursos
 * Permite controlar el acceso a recursos según si el usuario es propietario o tiene privilegios
 */

/**
 * Verifica si el usuario es propietario de un curso o es administrador
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 */
const isCursoOwner = async (req, res, next) => {
    try {
        // Asegurarse de que el usuario esté autenticado
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const cursoId = req.params.id || req.body.curso_id;
        
        // Si no hay ID de curso, no podemos verificar la propiedad
        if (!cursoId) {
            return res.status(400).json({ message: 'ID de curso no proporcionado' });
        }

        // Los administradores siempre tienen acceso
        if (req.user.rol === 'admin') {
            return next();
        }

        // Obtener el curso
        const cursoInfo = await curso.getById(cursoId);
        
        // Si el curso no existe
        if (!cursoInfo) {
            return res.status(404).json({ message: 'Curso no encontrado' });
        }

        // Verificar si el usuario es propietario del curso
        if (cursoInfo.usuario_id === req.user.id) {
            return next();
        }

        // Verificar si el usuario es profesor del curso
        if (req.user.rol === 'profesor') {
            const esProfesor = await cursoProfesor.esProfesorDeCurso(req.user.id, cursoId);
            if (esProfesor) {
                return next();
            }
        }

        // Si no es propietario ni profesor asignado, denegar acceso
        return res.status(403).json({ message: 'No tiene permisos para acceder a este curso' });
    } catch (error) {
        console.error('Error al verificar propiedad del curso:', error);
        return res.status(500).json({ message: 'Error al verificar permisos' });
    }
};

/**
 * Middleware factory para verificar propiedad genérica de recursos
 * @param {Function} getResourceById - Función para obtener el recurso por ID
 * @param {string} userIdField - Campo que contiene el ID del propietario
 * @param {string} resourceName - Nombre del recurso para mensajes de error
 * @param {string} paramName - Nombre del parámetro que contiene el ID del recurso
 * @returns {Function} - Middleware de Express
 */
const createOwnershipMiddleware = (getResourceById, userIdField, resourceName, paramName = 'id') => {
    return async (req, res, next) => {
        try {
            // Asegurarse de que el usuario esté autenticado
            if (!req.user) {
                return res.status(401).json({ message: 'No autenticado' });
            }

            const resourceId = req.params[paramName] || req.body[paramName];
            
            // Si no hay ID de recurso, no podemos verificar la propiedad
            if (!resourceId) {
                return res.status(400).json({ message: `ID de ${resourceName} no proporcionado` });
            }

            // Los administradores siempre tienen acceso
            if (req.user.rol === 'admin') {
                return next();
            }

            // Obtener el recurso
            const resource = await getResourceById(resourceId);
            
            // Si el recurso no existe
            if (!resource) {
                return res.status(404).json({ message: `${resourceName} no encontrado` });
            }

            // Verificar si el usuario es propietario del recurso
            if (resource[userIdField] === req.user.id) {
                return next();
            }

            // Si no es propietario, denegar acceso
            return res.status(403).json({ message: `No tiene permisos para acceder a este ${resourceName}` });
        } catch (error) {
            console.error(`Error al verificar propiedad del ${resourceName}:`, error);
            return res.status(500).json({ message: 'Error al verificar permisos' });
        }
    };
};

module.exports = {
    isCursoOwner,
    createOwnershipMiddleware
}; 