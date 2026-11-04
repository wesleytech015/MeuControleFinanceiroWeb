const mysql = require('mysql2');
const { databaseOptions } = require('../config/databaseOptions');

module.exports = mysql.createPool(databaseOptions()).promise();
