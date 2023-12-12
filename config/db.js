const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'sql12.freemysqlhosting.net',
  port: 3306,
  user: 'sql12669935',
  password: 'MULmAZZcdd',
  database: 'sql12669935',
});

const db = pool.promise();

module.exports = db;