import { createDb, type Db } from "./client";

/** Fresh in-memory database with all migrations applied. One per test (file). */
export function createTestDb(): Db {
  return createDb(":memory:");
}
