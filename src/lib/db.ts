import { Database } from '@libsql/client';

const db = new Database({
  url: 'file:doorprize.db',
});

await db.execute(`
  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export { db };