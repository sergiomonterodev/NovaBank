const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const jwt = require("jsonwebtoken");
const SECRET_KEY = "novabank_secret_key"; // En producción, esto va en un .env

const USERS_PATH = path.join(__dirname, "data", "users.json");

const getUsers = () => {
  const data = fs.readFileSync(USERS_PATH, "utf-8");
  return JSON.parse(data);
};

// Endpoint de Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const users = getUsers(); // Leemos del archivo JSON

  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({
      token: token,
      role: user.role,
      userId: user.id
    });
  } else {
    res.status(401).json({ message: "Credenciales incorrectas" });
  }
});

const DATA_PATH = path.join(__dirname, "data", "movements.json");

// Helper para leer el JSON
const getMovements = () => JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

// Endpoint para obtener movimientos
app.get("/api/movements", (req, res) => {
  const userId = req.query.userId; // Recibimos el id por la URL
  try {
    const movements = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    // Filtramos: solo los movimientos que coincidan con el userId del login
    const userMovements = movements.filter((m) => m.userId == userId);
    res.json(userMovements);
  } catch (error) {
    res.status(500).json({ message: "Error al leer datos" });
  }
});

// Endpoint para borrar un movimiento por ID
app.delete('/api/movements/:id', (req, res) => {
    const { id } = req.params;
    try {
        let movements = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        
        // Convertimos el id a número con Number() para evitar fallos de tipo
        const initialLength = movements.length;
        movements = movements.filter(m => Number(m.id) !== Number(id));

        if (movements.length === initialLength) {
            return res.status(404).json({ message: "No se encontró el ID" });
        }

        fs.writeFileSync(DATA_PATH, JSON.stringify(movements, null, 2));
        res.json({ message: "Borrado ok" });
    } catch (error) {
        res.status(500).json({ message: "Error interno" });
    }
});

// Endpoint para obtener todos los usuarios (Solo para el panel Admin)
app.get('/api/admin/users', (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
        // Devolvemos los usuarios pero sin la contraseña por seguridad
        const safeUsers = users.map(({ password, ...user }) => user);
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios" });
    }
});

// Simulación de Cron Job: Cada 2 minutos (120000 ms)
setInterval(() => {
  try {
    const movements = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));

    // Creamos un interés para CADA usuario registrado
    users.forEach((user) => {
      movements.push({
        id: Date.now() + Math.random(),
        userId: user.id, // <--- Relacionamos con el usuario
        concept: "Intereses ganados (Individual)",
        amount: 0.5,
        type: "income",
        date: new Date().toISOString().split("T")[0],
      });
    });

    fs.writeFileSync(DATA_PATH, JSON.stringify(movements, null, 2));
  } catch (e) {
    console.log(e);
  }
}, 120000);

// Server iniciado
app.listen(PORT, () => {
  console.log(`🚀 NovaBank Server corriendo en http://localhost:${PORT}`);
});