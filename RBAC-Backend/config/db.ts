import knex from "knex";
import config from "../knexfile";

// Determine our current running environment (defaults to development)
const environment = process.env.NODE_ENV || "development";

// Select the correct database credentials from our knexfile
const connectionConfig = config[environment];

// Initialize the live connection instance
const db = knex(connectionConfig);

export default db;
