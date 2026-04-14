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

// Endpoint de Register
app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    try {
        const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));

        // Validar si el usuario ya existe
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        // Crear el nuevo usuario (rol 'user' por defecto)
        const newUser = {
            id: Date.now(),
            email,
            password,
            role: 'user'
        };

        users.push(newUser);
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));

        res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (error) {
        res.status(500).json({ message: "Error al registrar" });
    }
});

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
      userId: user.id,
    });
  } else {
    res.status(401).json({ message: "Credenciales incorrectas" });
  }
});

const DATA_PATH = path.join(__dirname, "data", "movements.json");

// Endpoint para obtener movimientos
app.get("/api/movements", (req, res) => {
  const userId = req.query.userId; // Recibimos el id por la URL
  const userRole = req.query.userRole; // Recibimos el rol del usuario
  try {
    const movements = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    let userMovements = movements;

    // Filtrar según el rol
    if (userRole === "admin") {
      // Los admins ven todos los movimientos
      userMovements = movements;
    } else {
      // Los usuarios normales y lectores solo ven sus propios movimientos
      userMovements = movements.filter((m) => m.userId == userId);
    }
    
    res.json(userMovements);
  } catch (error) {
    res.status(500).json({ message: "Error al leer datos" });
  }
});

// Endpoint para crear movimientos
app.post('/api/movements', (req, res) => {
    const { userRole } = req.body;
    
    // Los lectores no pueden crear movimientos
    if (userRole === "reader") {
      return res.status(403).json({ message: "Los lectores no pueden crear movimientos" });
    }

    const nuevoMovimiento = {
        id: Date.now(),
        ...req.body
    };
    try {
        const movements = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        movements.push(nuevoMovimiento);
        fs.writeFileSync(DATA_PATH, JSON.stringify(movements, null, 2));
        res.status(201).json(nuevoMovimiento);
    } catch (e) {
        res.status(500).send("Error");
    }
});

// Endpoint para borrar un movimiento por ID
app.delete("/api/movements/:id", (req, res) => {
  const { id } = req.params;
  const { userRole, userId } = req.query;

  // Los lectores no pueden borrar movimientos
  if (userRole === "reader") {
    return res.status(403).json({ message: "Los lectores no pueden borrar movimientos" });
  }

  try {
    let movements = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    
    // Si no es admin, verificar que sea el propietario del movimiento
    if (userRole !== "admin") {
      const movementToDelete = movements.find((m) => Number(m.id) === Number(id));
      if (!movementToDelete || Number(movementToDelete.userId) !== Number(userId)) {
        return res.status(403).json({ message: "No tienes permiso para borrar este movimiento" });
      }
    }

    // Convertimos el id a número con Number() para evitar fallos de tipo
    const initialLength = movements.length;
    movements = movements.filter((m) => Number(m.id) !== Number(id));

    if (movements.length === initialLength) {
      return res.status(404).json({ message: "No se encontró el ID" });
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify(movements, null, 2));
    res.json({ message: "Borrado ok" });
  } catch (error) {
    res.status(500).json({ message: "Error interno" });
  }
});

// Endpoint para editar un movimiento por ID
app.put("/api/movements/:id", (req, res) => {
  const { id } = req.params;
  const { concept, userRole, userId } = req.body; // Solo permitiremos editar el concepto

  // Los lectores no pueden editar movimientos
  if (userRole === "reader") {
    return res.status(403).json({ message: "Los lectores no pueden editar movimientos" });
  }

  try {
    let movements = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    const index = movements.findIndex((m) => Number(m.id) === Number(id));

    if (index !== -1) {
      // Si no es admin, verificar que sea el propietario del movimiento
      if (userRole !== "admin" && Number(movements[index].userId) !== Number(userId)) {
        return res.status(403).json({ message: "No tienes permiso para editar este movimiento" });
      }

      movements[index].concept = concept;
      fs.writeFileSync(DATA_PATH, JSON.stringify(movements, null, 2));
      res.json(movements[index]);
    } else {
      res.status(404).json({ message: "No encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar" });
  }
});

// Endpoint para obtener todos los usuarios (Solo para el panel Admin)
app.get("/api/admin/users", (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
    // Devolvemos los usuarios pero sin la contraseña por seguridad
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Endpoint para cambiar el rol de un usuario (Solo admin)
app.put("/api/admin/users/:id/role", (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar que el rol sea uno de los permitidos
    const validRoles = ["admin", "user", "reader"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    let users = JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
    const userIndex = users.findIndex((u) => Number(u.id) === Number(id));

    if (userIndex !== -1) {
      users[userIndex].role = role;
      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
      const { password, ...safeUser } = users[userIndex];
      res.json({ message: "Rol actualizado", user: safeUser });
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar rol" });
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
