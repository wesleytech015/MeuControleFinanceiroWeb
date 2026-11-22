const { Pool, types } = require('pg');
const { databaseOptions } = require('../config/databaseOptions');

// Preserva o comportamento padrão do mysql2 para DATE: Date à meia-noite local.
// JSON continua serializando Date em ISO; mantenha o mesmo TZ do backend anterior.
const parsers = {
  getTypeParser(oid, format) {
    if (oid === 1082 && format !== 'binary') {
      return (value) => new Date(value + 'T00:00:00');
    }
    return types.getTypeParser(oid, format);
  }
};
const pool = new Pool({ ...databaseOptions(), types: parsers });
pool.on('error', () => console.error('Erro inesperado em conexão PostgreSQL ociosa.'));
module.exports = pool;
