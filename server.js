const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

const ROBLOX_API_KEY = "TERRLISSON_SECRET_KEY";
const DB_FILE = './database.json';

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

app.post('/api/roblox/sync', (req, res) => {
    if (req.headers.authorization !== ROBLOX_API_KEY) return res.status(403).json({ error: 'Unauthorized' });
    const db = readDB();
    const { jobId, players } = req.body;
    db.servers[jobId] = { lastSeen: Date.now(), playerCount: players.length, players: players.map(p => p.userId) };
    players.forEach(p => { if (!db.players.find(x => x.userId === p.userId)) db.players.push({ userId: p.userId, username: p.username }); });
    const commands = db.commands.filter(c => c.jobId === jobId || c.jobId === "all");
    db.commands = db.commands.filter(c => !(c.jobId === jobId || c.jobId === "all"));
    writeDB(db);
    res.json({ commands }); // Всегда возвращаем JSON
});

app.post('/api/roblox/log', (req, res) => {
    if (req.headers.authorization !== ROBLOX_API_KEY) return res.status(403).json({ status: 'err' });
    const db = readDB();
    db.logs.push({ time: Date.now(), ...req.body });
    if (db.logs.length > 100) db.logs.shift();
    writeDB(db);
    res.json({ status: 'ok' }); // Всегда JSON
});

app.get('/api/admin/data', (req, res) => res.json(readDB()));

app.post('/api/admin/command', (req, res) => {
    const db = readDB();
    db.commands.push(req.body);
    writeDB(db);
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000);
