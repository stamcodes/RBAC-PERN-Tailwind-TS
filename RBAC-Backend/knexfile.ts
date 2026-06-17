import type { Knex } from "knex";
import * as dotenv from "dotenv";

// Link your environment variables
dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg", // Tells Knex to stop looking for SQLite3 and use PostgreSQL instead!
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "RBAC_db",
      port: 5432, // Default PostgreSQL port
    },
    migrations: {
      directory: "./database/migrations",
      tableName: "knex_migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./database/seeds",
      extension: "ts",
    },
  },
};

export default config;
