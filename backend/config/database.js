const mysql = require('mysql2/promise');
require('dotenv').config();

async function connect() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log("✅ Banco conectado");

    // teste opcional
    const [rows] = await connection.query("SELECT 1+1 AS resultado");
    console.log(rows);

    return connection;
  } catch (error) {
    console.error("❌ Erro ao conectar no banco:", error.message);
  }
}

module.exports = connect;