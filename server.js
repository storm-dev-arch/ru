const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

const ROBLOX_API_KEY = "TERRLISSON_SECRET_KEY";
const DB_FILE = './database.json';

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ players: [] }));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({ token: 'local-admin-token' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/roblox/playerJoin', (req, res) => {
    if (req.headers.authorization !== ROBLOX_API_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { userId, username } = req.body;
    const db = readDB();
    let player = db.players.find(p => p.userId === userId);
    
    if (player) {
        if (player.isBanned) return res.status(403).json({ banned: true, reason: player.banReason });
        player.visits += 1;
    } else {
        db.players.push({ userId, username, visits: 1, isBanned: false });
    }
    
    writeDB(db);
    res.json({ success: true, banned: false });
});

app.get('/api/admin/players', (req, res) => {
    const db = readDB();
    res.json(db.players);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});