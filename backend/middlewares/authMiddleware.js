const jwt = require('jsonwebtoken');
// const sessions = require('../utils/session'); // Eliminado

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'No se proporcionó el token' });
    }

    
    const tokenParts = authHeader.trim().split(/\s+/); 

    if (tokenParts.length !== 2) {
        return res.status(401).json({ message: 'Formato de token inválido' });
    }

    const [scheme, token] = tokenParts;

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Formato de token inválido' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if the session is still active
        // if (!sessions.has(payload.id)) { // Eliminado
        //     return res.status(401).json({ message: 'La sesión ha sido cerrada. Por favor, inicie sesión nuevamente.' });
        // }
        
        req.user = payload;
        next();
    } catch (err) {
        console.error('Error al verificar el token:', err.message); 
        return res.status(401).json({ message: 'Token no válido o expirado' });
    }
}

module.exports = authMiddleware;
