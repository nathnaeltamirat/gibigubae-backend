require("dotenv").config();

const getEnvVar = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not defined`);
  }
  return value;
};

module.exports = {
  DATABASE_URL: getEnvVar("DATABASE_URL"),
  NODE_ENV: getEnvVar("NODE_ENV"),
  PORT: parseInt(getEnvVar("PORT"), 10),
  JWT_SECRET: getEnvVar("JWT_SECRET"),
  JWT_REFRESH_SECRET: getEnvVar("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRES_IN: getEnvVar("JWT_REFRESH_EXPIRES_IN"),
  JWT_EXPIRES_IN: getEnvVar("JWT_EXPIRES_IN"),
  API_KEY: getEnvVar("API_KEY"),
  API_SECRET: getEnvVar("API_SECRET"),
  CLOUD_NAME: getEnvVar("CLOUD_NAME"),
};
