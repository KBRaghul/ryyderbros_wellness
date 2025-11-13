const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "raghulkb",
  database: "ryyderbros_wellness",
});

module.exports = pool;
