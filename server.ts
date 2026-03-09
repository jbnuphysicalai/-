import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/visits.db' : 'visits.db';

// In production, if we want to persist data, we'd need a mounted volume. 
// For Cloud Run without a volume, /tmp is the only writable location (in-memory).
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    affiliation TEXT NOT NULL,
    purpose TEXT NOT NULL,
    contact TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add new columns safely
try { db.exec("ALTER TABLE visits ADD COLUMN time TEXT DEFAULT '10:00'"); } catch (e) {}
try { db.exec("ALTER TABLE visits ADD COLUMN end_time TEXT DEFAULT '11:00'"); } catch (e) {}
try { db.exec("ALTER TABLE visits ADD COLUMN position TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE visits ADD COLUMN reject_reason TEXT"); } catch (e) {}

// Admin table
db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL
  )
`);
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin').get();
if (adminCount && adminCount.count === 0) {
  db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run('admin', 'admin123');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/visits', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const { month } = req.query; // Format: YYYY-MM
    let query = 'SELECT * FROM visits';
    let params = [];

    if (month) {
      query += ' WHERE date LIKE ?';
      params.push(`${month}-%`);
    }

    query += ' ORDER BY date ASC, time ASC, created_at DESC';

    try {
      const visits = db.prepare(query).all(...params);
      res.json(visits);
    } catch (error) {
      console.error('Error fetching visits:', error);
      res.status(500).json({ error: 'Failed to fetch visits' });
    }
  });

  app.post('/api/visits', (req, res) => {
    const { date, time, end_time, name, position, affiliation, purpose, contact } = req.body;

    if (!date || !time || !end_time || !name || !affiliation || !purpose || !contact) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO visits (date, time, end_time, name, position, affiliation, purpose, contact, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `);
      const info = stmt.run(date, time, end_time, name, position || '', affiliation, purpose, contact);
      
      const newVisit = db.prepare('SELECT * FROM visits WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json(newVisit);
    } catch (error) {
      console.error('Error creating visit:', error);
      res.status(500).json({ error: 'Failed to create visit application' });
    }
  });

  app.patch('/api/visits/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, reject_reason } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    try {
      const stmt = db.prepare('UPDATE visits SET status = ?, reject_reason = ? WHERE id = ?');
      const info = stmt.run(status, reject_reason || null, Number(id));

      if (info.changes === 0) {
        return res.status(404).json({ error: 'Visit not found' });
      }

      const updatedVisit = db.prepare('SELECT * FROM visits WHERE id = ?').get(Number(id));
      res.json(updatedVisit);
    } catch (error) {
      console.error('Error updating visit status:', error);
      res.status(500).json({ error: 'Failed to update visit status' });
    }
  });

  app.delete('/api/visits/:id', (req, res) => {
    const { id } = req.params;

    try {
      const stmt = db.prepare('DELETE FROM visits WHERE id = ?');
      const info = stmt.run(Number(id));

      if (info.changes === 0) {
        return res.status(404).json({ error: 'Visit not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting visit:', error);
      res.status(500).json({ error: 'Failed to delete visit' });
    }
  });

  app.post('/api/visits/bulk-delete', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No ids provided' });
    }

    try {
      const placeholders = ids.map(() => '?').join(',');
      const stmt = db.prepare(`DELETE FROM visits WHERE id IN (${placeholders})`);
      const info = stmt.run(...ids.map(Number));
      res.json({ success: true, deletedCount: info.changes });
    } catch (error) {
      console.error('Error bulk deleting visits:', error);
      res.status(500).json({ error: 'Failed to delete visits' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const admin = db.prepare('SELECT * FROM admin WHERE username = ? AND password = ?').get(username, password);
    if (admin) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
  });

  app.put('/api/auth/admin', (req, res) => {
    const { currentUsername, currentPassword, newUsername, newPassword } = req.body;
    const admin = db.prepare('SELECT * FROM admin WHERE username = ? AND password = ?').get(currentUsername, currentPassword);
    if (!admin) {
      return res.status(401).json({ error: '현재 아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
    try {
      db.prepare('UPDATE admin SET username = ?, password = ? WHERE id = ?').run(newUsername, newPassword, admin.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update admin credentials' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
