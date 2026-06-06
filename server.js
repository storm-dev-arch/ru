const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

const ROBLOX_API_KEY = "TERRLISSON_SECRET_KEY";
const DB_FILE = './database.json';

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ players: [], servers: {}, logs: [], commands: [] }));
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

app.post('/api/roblox/sync', (req, res) => {
    if (req.headers.authorization !== ROBLOX_API_KEY) return res.status(403).json({ error: 'Unauthorized' });
    
    const { jobId, players } = req.body;
    const db = readDB();
    
    db.servers[jobId] = {
        lastSeen: Date.now(),
        playerCount: players.length,
        players: players.map(p => p.userId)
    };

    players.forEach(p => {
        let player = db.players.find(x => x.userId === p.userId);
        if (player) {
            player.username = p.username;
        } else {
            db.players.push({ userId: p.userId, username: p.username, isBanned: false });
        }
    });

    for (const id in db.servers) {
        if (Date.now() - db.servers[id].lastSeen > 15000) {
            delete db.servers[id];
        }
    }

    const pendingCommands = db.commands.filter(c => c.jobId === jobId || c.jobId === "all");
    db.commands = db.commands.filter(c => !(c.jobId === jobId || c.jobId === "all"));

    writeDB(db);
    res.json({ commands: pendingCommands });
});

app.post('/api/roblox/log', (req, res) => {
    if (req.headers.authorization !== ROBLOX_API_KEY) return res.status(403).send();
    const db = readDB();
    db.logs.push({ time: Date.now(), ...req.body });
    if (db.logs.length > 200) db.logs.shift();
    writeDB(db);
    res.send();
});

app.get('/api/admin/data', (req, res) => {
    res.json(readDB());
});

app.post('/api/admin/command', (req, res) => {
    const db = readDB();
    db.commands.push(req.body);
    writeDB(db);
    res.json({ success: true });
});

app.get('/api/avatar/:id', async (req, res) => {
    try {
        const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${req.params.id}&size=150x150&format=Png&isCircular=true`);
        res.redirect(response.data.data[0].imageUrl);
    } catch (e) {
        res.redirect('https://tr.rbxcdn.com/30day-avatar-default.png');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {});
