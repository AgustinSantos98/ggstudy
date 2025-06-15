const mysql2 = require('mysql2'); 
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

let connection;

try {
    connection = mysql2.createConnection(dbConfig);

    connection.connect((err) => {
        if (err) {
            console.error('Error de conexion a MYSQL:', err);
            return;
        }
        console.log('Conexion exitosa a MYSQL');
    });
} catch (err) {
    console.error('Error al crear la conexion con MYSQL:', err);
}

module.exports = connection;