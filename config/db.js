// const mysql = require('mysql2');
const { Pool } = require('pg');
const fs = require('fs');

// const pool = mysql.createPool({
//   host: 'localhost',
//   port: 3307,
//   user: 'root',
//   password: '',
//   database: 'toko_outer',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// const db = pool.promise();

const db = new Pool({
  connectionString: 'postgres://postgres.gpmavoucjsjnkjjswnee:SMHCUwmSwjo590Rs@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { 
    rejectUnauthorized: true,
    ca: fs.readFileSync('config/prod-ca-2021.crt')
  }
});

module.exports = db;
