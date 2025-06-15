/**
 * Middleware para manejar paginación en las respuestas API
 * Permite implementar paginación en cualquier endpoint que devuelva arrays de datos
 */

/**
 * Añade funcionalidad de paginación a la respuesta
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 * @param {Function} next - Función next de Express
 */
const paginacion = (req, res, next) => {
    // Obtener parámetros de paginación de la query
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    
    // Validar que los valores sean positivos
    if (pagina <= 0 || limite <= 0) {
        return res.status(400).json({ 
            message: 'Los parámetros de paginación deben ser números positivos' 
        });
    }
    
    // Calcular offset para la consulta SQL
    const offset = (pagina - 1) * limite;
    
    // Agregar función de paginación al objeto response
    res.paginar = (data, total) => {
        // Si no se proporciona el total, usar la longitud de data
        const totalItems = total !== undefined ? total : data.length;
        const totalPaginas = Math.ceil(totalItems / limite);
        
        // Paginar los datos si no vienen ya paginados desde la base de datos
        let paginatedData = data;
        if (total === undefined) {
            paginatedData = data.slice(offset, offset + limite);
        }
        
        return {
            data: paginatedData,
            meta: {
                pagina_actual: pagina,
                items_por_pagina: limite,
                total_items: totalItems,
                total_paginas: totalPaginas,
                hay_siguiente: pagina < totalPaginas,
                hay_anterior: pagina > 1
            }
        };
    };
    
    // Añadir parámetros de paginación a la request para uso en controladores
    req.paginacion = {
        pagina,
        limite,
        offset
    };
    
    next();
};

module.exports = paginacion; 