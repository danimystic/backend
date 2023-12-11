const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'dan-octa.online',
  port: 3306,
  user: 'dano4196_dan',
  password: 'Mamanx724@anzuui',
  database: 'dano4196_toko_outer',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

module.exports = db;