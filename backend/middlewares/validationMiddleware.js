/**
 * Middleware para validación de datos de entrada
 * Permite validar los datos recibidos en las peticiones antes de procesarlos
 */

/**
 * Valida que los campos requeridos estén presentes en el cuerpo de la petición
 * @param {Array} requiredFields - Array con los nombres de los campos requeridos
 * @returns {Function} - Middleware de Express
 */
const validateRequiredFields = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = [];
        
        // Verificar cada campo requerido
        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                missingFields.push(field);
            }
        }
        
        // Si faltan campos, devolver error
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios',
                missing: missingFields
            });
        }
        
        next();
    };
};

/**
 * Valida que el campo email tenga un formato válido
 * @param {string} field - Nombre del campo que contiene el email
 * @returns {Function} - Middleware de Express
 */
const validateEmail = (field = 'email') => {
    return (req, res, next) => {
        const email = req.body[field];
        
        // Si no hay email, continuar (la validación de campos requeridos se encargará si es necesario)
        if (!email) {
            return next();
        }
        
        // Expresión regular para validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Formato de email inválido',
                field
            });
        }
        
        next();
    };
};

/**
 * Valida que el valor de un campo sea uno de los valores permitidos
 * @param {string} field - Nombre del campo a validar
 * @param {Array} allowedValues - Array con los valores permitidos
 * @returns {Function} - Middleware de Express
 */
const validateEnum = (field, allowedValues) => {
    return (req, res, next) => {
        const value = req.body[field];
        
        // Si no hay valor, continuar
        if (value === undefined || value === null) {
            return next();
        }
        
        // Verificar si el valor está entre los permitidos
        if (!allowedValues.includes(value)) {
            return res.status(400).json({
                message: `Valor inválido para ${field}`,
                field,
                allowedValues
            });
        }
        
        next();
    };
};

/**
 * Valida que un campo fecha tenga un formato válido
 * @param {string} field - Nombre del campo a validar
 * @returns {Function} - Middleware de Express
 */
const validateDate = (field) => {
    return (req, res, next) => {
        const date = req.body[field];
        
        // Si no hay fecha, continuar
        if (!date) {
            return next();
        }
        
        // Verificar si es una fecha válida
        const timestamp = Date.parse(date);
        
        if (isNaN(timestamp)) {
            return res.status(400).json({
                message: `Formato de fecha inválido para ${field}`,
                field
            });
        }
        
        next();
    };
};

// Validadores específicos para entidades del sistema

/**
 * Validador para datos de usuario
 */
const validateUser = [
    validateRequiredFields(['dni', 'nombre', 'apellido', 'email', 'rol']),
    validateEmail(),
    validateEnum('rol', ['alumno', 'profesor', 'admin']),
    validateDate('fecha_nacimiento'),
    validateDate('fecha_ingreso'),
    validateDate('fecha_fin')
];

/**
 * Validador para datos de curso
 */
const validateCurso = [
    validateRequiredFields(['nombre'])
];

/**
 * Validador para datos de tema
 */
const validateTema = [
    validateRequiredFields(['nombre', 'curso_id'])
];

/**
 * Validador para datos de tarea
 */
const validateTarea = [
    validateRequiredFields(['titulo', 'tema_id', 'fecha_entrega'])
];

/**
 * Validador para datos de material lectivo
 */
const validateLectivo = [
    validateRequiredFields(['nombre', 'url', 'tema_id'])
];

module.exports = {
    validateRequiredFields,
    validateEmail,
    validateEnum,
    validateDate,
    validateUser,
    validateCurso,
    validateTema,
    validateTarea,
    validateLectivo
}; 