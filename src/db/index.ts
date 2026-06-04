import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from environment variables");
}

const connectionString = process.env.DATABASE_URL;

// Prevent multiple database connections in development hot-reloading
declare global {
  // eslint-disable-next-line no-var
  var postgresClient: postgres.Sql | undefined;
}

// Reuse connection client in development, create new one in production
const client = globalThis.postgresClient || postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalThis.postgresClient = client;
}

export const db = drizzle(client, { schema });
