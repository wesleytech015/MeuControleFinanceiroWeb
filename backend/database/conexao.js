const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, '../certs/ca.pem')),
    minVersion: 'TLSv1.2' // força versão TLS
  },
  connectTimeout: 20000,   // aumenta timeout para 20s
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
