import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

/**
 * Open a SQLite database at `file` and bring it up to date with migrations.
 * Pass ":memory:" for an ephemeral database (tests).
 */
export function createDb(file: string): Db {
  if (file !== ":memory:") {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

/** Database file location; override with SUPERFREJ_DB. */
export function defaultDbFile(): string {
  return (
    process.env.SUPERFREJ_DB ?? path.join(process.cwd(), "data", "superfrej.db")
  );
}

// Cache the connection on globalThis so Next.js dev-mode hot reloads reuse it
// instead of opening a new file handle per reload.
const globalForDb = globalThis as unknown as { __superfrejDb?: Db };

/** The application database (singleton). */
export function getDb(): Db {
  globalForDb.__superfrejDb ??= createDb(defaultDbFile());
  return globalForDb.__superfrejDb;
}
