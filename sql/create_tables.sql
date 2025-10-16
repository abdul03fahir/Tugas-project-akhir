-- create_tables.sql
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image VARCHAR(300),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS works (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image VARCHAR(300),
  created_at TIMESTAMP DEFAULT now()
);
