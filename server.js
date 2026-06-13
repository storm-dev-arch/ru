const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(cors());

const ROBLOX_API_KEY = "TERRLISSON_SECRET_KEY";
const DB_FILE = './database.json';

const readDB = () => {
    if (!fs.existsSync(DB_FILE)) return { players: [], servers: {}, logs: [], commands: [] };
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};
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
    if (req.headers.authorization !== ROBLOX_API_KEY) return res.status(403).json({});
    const db = readDB();
    const { jobId, players } = req.body;
    
    db.servers[jobId] = { lastSeen: Date.now(), playerCount: players.length, players: players.map(p => p.username) };
    
    for (const id in db.servers) {
        if (Date.now() - db.servers[id].lastSeen > 15000) {
            delete db.servers[id];
        }
    }

    players.forEach(p => { 
        let existingPlayer = db.players.find(x => x.userId === p.userId);
        if (existingPlayer) {
            existingPlayer.username = p.username;
            existingPlayer.coins = p.coins;
            existingPlayer.lastSeen = Date.now();
            if (!existingPlayer.firstJoined) existingPlayer.firstJoined = Date.now();
        } else {
            db.players.push({ 
                userId: p.userId, 
                username: p.username, 
                coins: p.coins,
                firstJoined: Date.now(),
                lastSeen: Date.now()
            });
        }
    });

    const commands = db.commands.filter(c => c.jobId === jobId || c.jobId === "all");
    db.commands = db.commands.filter(c => !(c.jobId === jobId || c.jobId === "all"));
    
    writeDB(db);
    res.json({ commands });
});

app.post('/api/roblox/log', (req, res) => {
    if (req.headers.authorization !== ROBLOX_API_KEY) return res.status(403).send();
    const db = readDB();
    db.logs.push({ time: new Date().toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' }), ...req.body });
    if (db.logs.length > 100) db.logs.shift();
    writeDB(db);
    res.json({ status: 'ok' });
});

app.get('/api/admin/data', (req, res) => res.json(readDB()));

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

app.listen(process.env.PORT || 3000);
