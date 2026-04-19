export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  authSecret: process.env.AUTH_SECRET ?? "development-secret-change-me",
  databaseUrl: process.env.DATABASE_URL ?? "",
};