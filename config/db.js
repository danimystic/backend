const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
  database: 'toko_outer'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database!');
});

module.exports = db;
