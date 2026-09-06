import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const app = express();
const PORT = 8000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.send('Access control dashboard server is running.');
});

// returns recent access events for the dashboard table
app.get('/api/access-logs', (req, res) => {
    const rows = db.prepare(`
        SELECT
            access_logs.timestamp AS t,
            access_logs.event AS e,
            access_logs.severity AS sev,
            access_logs.attempts AS attempts,
            access_logs.expires_at AS expiresAt,
            users.first_name || ' ' || users.last_name AS user
        FROM access_logs
        LEFT JOIN users ON users.id = access_logs.user_id
        ORDER BY access_logs.timestamp DESC
    `).all();

    const events = rows.map(({ attempts, expiresAt, ...row }) => ({
        ...row,
        user: row.user || null,
        ...(row.e === 'Lockout Triggered' ? { lockout: { attempts, expires: expiresAt } } : {}),
    }));

    res.json(events);
});

// registers a new card uid to a user
app.post('/api/users', (req, res) => {
    const { uid, firstName, lastName } = req.body;

    if (!uid || !firstName || !lastName) {
        return res.status(400).json({ error: 'uid, firstName, and lastName are required' });
    }

    try {
        const result = db.prepare(`
            INSERT INTO users (uid, first_name, last_name)
            VALUES (?, ?, ?)
        `).run(uid, firstName, lastName);

        res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'uid already registered' });
        }
        throw err;
    }
});

// records a new access event, e.g. sent from the esp32 on a card scan
app.post('/api/access-logs', (req, res) => {
    const { uid, event, severity, attempts, expiresAt } = req.body;

    if (!event || !severity) {
        return res.status(400).json({ error: 'event and severity are required' });
    }

    const user = uid
        ? db.prepare('SELECT id FROM users WHERE uid = ?').get(uid)
        : null;

    const result = db.prepare(`
        INSERT INTO access_logs (user_id, event, severity, attempts, expires_at)
        VALUES (?, ?, ?, ?, ?)
    `).run(user?.id ?? null, event, severity, attempts ?? null, expiresAt ?? null);

    res.status(201).json({ id: result.lastInsertRowid });
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
