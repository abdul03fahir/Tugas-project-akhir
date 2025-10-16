const { Pool } = require('pg');

// Langsung hardcode URL koneksi di sini (pastikan sudah di-encode)
const pool = new Pool({
  connectionString: 'postgres://postgres:Super123%40%21@localhost:5432/final-task'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
