import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const db = new Database('participants.db');

app.use(cors());
app.use(express.json());

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL
  )
`);

// Get all participants
app.get('/api/participants', (req, res) => {
  const participants = db.prepare('SELECT * FROM participants').all();
  res.json(participants);
});

// Add a participant
app.post('/api/participants', (req, res) => {
  const { name, unit } = req.body;
  const id = crypto.randomUUID();
  
  try {
    db.prepare('INSERT INTO participants (id, name, unit) VALUES (?, ?, ?)')
      .run(id, name, unit);
    
    res.json({ id, name, unit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add participant' });
  }
});

// Import participants
app.post('/api/participants/import', (req, res) => {
  const { participants } = req.body;
  
  try {
    const insert = db.prepare('INSERT INTO participants (id, name, unit) VALUES (?, ?, ?)');
    
    db.transaction(() => {
      db.prepare('DELETE FROM participants').run();
      for (const p of participants) {
        insert.run(p.id, p.name, p.unit);
      }
    })();
    
    const updated = db.prepare('SELECT * FROM participants').all();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to import participants' });
  }
});

// Clear all participants
app.delete('/api/participants', (req, res) => {
  try {
    db.prepare('DELETE FROM participants').run();
    res.json({ message: 'All participants deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete participants' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});