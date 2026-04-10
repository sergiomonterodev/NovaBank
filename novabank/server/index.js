const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'novabank_secret_key'; // En producción, esto va en un .env

const USERS_PATH = path.join(__dirname, 'data', 'users.json');

const getUsers = () => {
    const data = fs.readFileSync(USERS_PATH, 'utf-8');
    return JSON.parse(data);
};

// Endpoint de Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = getUsers(); // Leemos del archivo JSON
  
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      SECRET_KEY, 
      { expiresIn: '1h' }
    );
    res.json({ token, role: user.role });
  } else {
    res.status(401).json({ message: "Credenciales incorrectas" });
  }
});

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

// Endpoint para borrar un movimiento por ID
app.delete('/api/movements/:id', (req, res) => {
    const { id } = req.params;
    try {
        let movements = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        
        // Filtramos para quitar el movimiento (ojo: convertimos id a número si es necesario)
        const nuevosMovimientos = movements.filter(m => m.id !== parseInt(id));

        if (movements.length === nuevosMovimientos.length) {
            return res.status(404).json({ message: "Movimiento no encontrado" });
        }

        fs.writeFileSync(DATA_PATH, JSON.stringify(nuevosMovimientos, null, 2));
        res.json({ message: "Movimiento eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al borrar los datos" });
    }
});

// Simulación de Cron Job: Cada 2 minutos (120000 ms)
setInterval(() => {
    try {
        const movements = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        
        const nuevoInteres = {
            id: Date.now(),
            concept: "Intereses ganados (Auto)",
            amount: 0.50,
            type: "income",
            date: new Date().toISOString().split('T')[0]
        };

        movements.push(nuevoInteres);
        fs.writeFileSync(DATA_PATH, JSON.stringify(movements, null, 2));
        
        console.log("💰 [NovaBank Bot]: Se han ingresado 0.50€ de intereses.");
    } catch (error) {
        console.error("Error en el proceso automático:", error);
    }
}, 120000);

// Server iniciado
app.listen(PORT, () => {
    console.log(`🚀 NovaBank Server corriendo en http://localhost:${PORT}`);
});