/** CLI: create/upgrade the local database file. Usage: npm run db:migrate */
import { createDb, defaultDbFile } from "./client";

const file = defaultDbFile();
createDb(file);
console.log(`Database ready at ${file}`);
