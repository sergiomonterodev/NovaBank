const jwt = require('jsonwebtoken');
const SECRET_KEY = 'novabank_secret_key'; // En producción, esto va en un .env

// Mock de usuarios (luego pasarlo a un users.json)
const users = [
  { id: 1, email: 'admin@nova.com', password: 'admin', role: 'admin' },
  { id: 2, email: 'user@nova.com', password: 'user', role: 'user' }
];

// Endpoint de Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } else {
    res.status(401).json({ message: "Credenciales incorrectas" });
  }
});


const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'data', 'movements.json');

// Helper para leer el JSON
const getMovements = () => JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// Endpoint para obtener movimientos
app.get('/api/movements', (req, res) => {
    try {
        const movements = getMovements();
        res.json(movements);
    } catch (error) {
        res.status(500).json({ message: "Error al leer los datos" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 NovaBank Server corriendo en http://localhost:${PORT}`);
});