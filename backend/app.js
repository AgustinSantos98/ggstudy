const express = require('express');
const cors = require('cors');
require('dotenv').config();


const app = express();

// Middleware globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a la base de datos
require('./config/db');

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({ message: 'API de GgStudy funcionando correctamente' });
});

// Rutas de la API
const usuarioRoutes = require('./routes/usuarioRoutes');
app.use('/api/usuarios', usuarioRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const cursoRoutes = require('./routes/cursoRoutes');
app.use('/api/cursos', cursoRoutes);

const temaRoutes = require('./routes/temaRoutes');
app.use('/api/temas', temaRoutes);

const tareaRoutes = require('./routes/tareaRoutes');
app.use('/api/tareas', tareaRoutes);

const asignaturaRoutes = require('./routes/asignaturaRoutes');
app.use('/api/asignaturas', asignaturaRoutes);

const tareaCalificacionRoutes = require('./routes/tareaCalificacionRoutes');
app.use('/api/entregas', tareaCalificacionRoutes);

// Si se necesita registrar más rutas, agregarlas aquí

// Ruta de manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de manejo de errores globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Error interno del servidor' });
});

// Configuración del puerto y arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

module.exports = app; // Exportar para pruebas