const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuarioModel');

/**
 * Controlador para gestionar la autenticación de usuarios
 */

/**
 * Autentica a un usuario mediante email y contraseña
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.login = async (req, res) => {
    const { email, contrasena } = req.body;
    
    // Validar campos requeridos
    if (!email || !contrasena) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    
    try {
        // Buscar usuario por email
        const user = await usuarioModel.getByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(contrasena, user.contrasena);
        
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // Enviar respuesta con token y datos del usuario (sin contraseña)
        res.json({ 
            message: 'Login exitoso', 
            token, 
            user: { 
                id: user.id, 
                nombre: user.nombre, 
                apellido: user.apellido, 
                email: user.email, 
                rol: user.rol 
            } 
        });
    } catch (err) {
        console.error('Error en el login:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

/**
 * Cierra la sesión de un usuario
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.logout = (req, res) => {
    const userId = req.user?.id;
    
    // Verificar que existe un usuario autenticado
    if (!userId) {
        return res.status(400).json({ message: 'No hay usuario autenticado' });
    }
    
    res.json({ message: 'Sesión cerrada correctamente. El cliente debe eliminar el token.' });
};

/**
 * Verifica si el token de un usuario es válido
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.checkAuth = (req, res) => {
    // Si llegamos aquí, es porque el middleware de autenticación ya verificó el token
    res.json({
        isLogged: true,
        user: req.user
    });
};

/**
 * Refresca el token JWT de un usuario
 * @param {Object} req - Objeto request de Express
 * @param {Object} res - Objeto response de Express
 */
exports.refreshToken = (req, res) => {
    // Generar un nuevo token con el mismo payload pero nueva fecha de expiración
    const token = jwt.sign(
        { id: req.user.id, rol: req.user.rol },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    
    res.json({ token });
};
