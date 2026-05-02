require("dotenv").config();

const config = {
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || "development",
  },
  db: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "field_force_db",
    dialect: "postgres",
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
};

if (!config.jwt.secret) {
  throw new Error("JWT_SECRET is required");
}

module.exports = config;