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