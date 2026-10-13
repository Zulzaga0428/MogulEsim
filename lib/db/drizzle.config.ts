import { defineConfig } from "drizzle-kit";

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("NEON_DATABASE_URL or DATABASE_URL must be set, ensure the database is provisioned");
}

export default defineConfig({
  // Relative, forward-slash path: drizzle-kit globs it, and path.join gave
  // backslashes on Windows that matched nothing. pnpm --filter runs from lib/db.
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
