const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Genera un número de cuenta único con formato AAA000000.
 * @param {object} connection - Conexión MySQL activa
 * @returns {Promise<string>}
 */
const generateUniqueAccountNumber = async (connection) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let accountNumber;
  let isUnique = false;

  while (!isUnique) {
    const prefix = Array.from({ length: 3 }, () =>
      letters.charAt(Math.floor(Math.random() * letters.length))
    ).join("");
    const digits = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    accountNumber = `${prefix}${digits}`;

    const [existing] = await connection.query(
      "SELECT id FROM users WHERE account_number = ?",
      [accountNumber]
    );
    isUnique = existing.length === 0;
  }

  return accountNumber;
};
const SECRET_KEY = process.env.JWT_SECRET || "novabank_secret_key";
const isTestEnv = process.env.NODE_ENV === "test";

app.use(cors());
app.use(express.json());

// Crear pool de conexiones a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "novabank",
  port: process.env.DB_PORT || 3306,
  timezone: "Z",
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const toMySqlDateTime = (date = new Date()) =>
  date.toISOString().slice(0, 19).replace("T", " ");

const toUtcIsoString = (value) => {
  if (!value) return value;

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    const seconds = String(value.getSeconds()).padStart(2, "0");
    // Preserva la hora de reloj de MySQL DATETIME y la marca como UTC explícito.
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  }

  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(raw)) {
    return `${raw.replace(" ", "T")}Z`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(raw)) {
    return `${raw}Z`;
  }

  return raw;
};

const normalizeMovementDate = (movement) => ({
  ...movement,
  date: toUtcIsoString(movement.date),
});

const ensureMovementsDateTimeColumn = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [columns] = await connection.query("SHOW COLUMNS FROM movements LIKE 'date'");

    if (columns.length > 0 && String(columns[0].Type).toLowerCase() === "date") {
      await connection.query("ALTER TABLE movements MODIFY COLUMN date DATETIME NOT NULL");
      console.log("✅ Columna movements.date migrada de DATE a DATETIME");
    }
  } catch (error) {
    console.error("Error validando/migrando columna movements.date:", error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Endpoint de Register
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const connection = await pool.getConnection();

    // Validar si el usuario ya existe
    const [existingUser] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Generar número de cuenta único
    const accountNumber = await generateUniqueAccountNumber(connection);

    // Crear el nuevo usuario (rol 'user' por defecto)
    await connection.query(
      "INSERT INTO users (email, password, role, account_number) VALUES (?, ?, ?, ?)",
      [email, password, "user", accountNumber]
    );

    connection.release();
    res.status(201).json({ message: "Usuario creado con éxito", accountNumber });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error al registrar" });
  }
});

// Endpoint de Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      "SELECT id, role FROM users WHERE email = ? AND password = ?",
      [email, password]
    );

    connection.release();

    if (users.length > 0) {
      const user = users[0];
      const token = jwt.sign(
        { id: user.id, role: user.role },
        SECRET_KEY,
        { expiresIn: "1h" }
      );
      res.json({
        token: token,
        role: user.role,
        userId: user.id,
      });
    } else {
      res.status(401).json({ message: "Credenciales incorrectas" });
    }
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
});

// Endpoint para obtener movimientos
app.get("/api/movements", async (req, res) => {
  const userId = req.query.userId;
  const userRole = req.query.userRole;

  try {
    const connection = await pool.getConnection();
    let query;
    let params;

    // Todos ven solo sus propios movimientos (incluyendo admins)
    query =
      "SELECT * FROM movements WHERE userId = ? ORDER BY date DESC, id DESC";
    params = [userId];

    const [movements] = await connection.query(query, params);
    connection.release();

    res.json(movements.map(normalizeMovementDate));
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    res.status(500).json({ message: "Error al leer datos" });
  }
});

// Endpoint para obtener datos del usuario (incluyendo balance y account_number)
app.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      "SELECT id, email, role, account_number, balance FROM users WHERE id = ?",
      [id]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error al obtener datos del usuario" });
  }
});

// Endpoint para crear movimientos (transferencias)
app.post("/api/movements", async (req, res) => {
  const { userId, concept, amount, userRole, targetAccountNumber } = req.body;

  // Los lectores no pueden crear movimientos
  if (userRole === "reader") {
    return res
      .status(403)
      .json({ message: "Los lectores no pueden crear movimientos" });
  }

  try {
    const connection = await pool.getConnection();

    // Obtener datos del usuario origen (para validar saldo)
    const [sourceUser] = await connection.query(
      "SELECT id, balance FROM users WHERE id = ?",
      [userId]
    );

    if (sourceUser.length === 0) {
      connection.release();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Validar que a cantidad es menor al balance
    if (amount > sourceUser[0].balance) {
      connection.release();
      return res.status(400).json({ 
        message: `No tienes suficiente saldo. Saldo disponible: ${sourceUser[0].balance}€` 
      });
    }

    // Buscar usuario destino por account_number
    const [targetUser] = await connection.query(
      "SELECT id FROM users WHERE account_number = ?",
      [targetAccountNumber]
    );

    if (targetUser.length === 0) {
      connection.release();
      return res.status(404).json({ message: "Cuenta destino no encontrada" });
    }

    const movementDateTime = toMySqlDateTime();

    // Insertar el movimiento (siempre como "expense" para el usuario origen)
    await connection.query(
      "INSERT INTO movements (userId, concept, amount, type, date, target_account_number) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, concept, -Math.abs(amount), "expense", movementDateTime, targetAccountNumber]
    );

    // Actualizar saldo del usuario origen (restar)
    await connection.query(
      "UPDATE users SET balance = balance - ? WHERE id = ?",
      [amount, userId]
    );

    // Actualizar saldo del usuario destino (sumar)
    await connection.query(
      "UPDATE users SET balance = balance + ? WHERE id = ?",
      [amount, targetUser[0].id]
    );

    // Instert movimiento para el usuario destino (como income)
    await connection.query(
      "INSERT INTO movements (userId, concept, amount, type, date, target_account_number) VALUES (?, ?, ?, ?, ?, ?)",
      [targetUser[0].id, concept, Math.abs(amount), "income", movementDateTime, targetAccountNumber]
    );

    const [newMovement] = await connection.query(
      "SELECT * FROM movements WHERE userId = ? ORDER BY id DESC LIMIT 1",
      [userId]
    );

    connection.release();
    res.status(201).json(normalizeMovementDate(newMovement[0]));
  } catch (error) {
    console.error("Error al crear movimiento:", error);
    res.status(500).json({ message: "Error al crear movimiento" });
  }
});

// Endpoint para borrar un movimiento por ID
app.delete("/api/movements/:id", async (req, res) => {
  const { id } = req.params;
  const { userRole, userId } = req.query;

  // Los lectores no pueden borrar movimientos
  if (userRole === "reader") {
    return res
      .status(403)
      .json({ message: "Los lectores no pueden borrar movimientos" });
  }

  try {
    const connection = await pool.getConnection();

    // Obtener el movimiento
    const [movement] = await connection.query(
      "SELECT * FROM movements WHERE id = ?",
      [id]
    );

    if (movement.length === 0) {
      connection.release();
      return res.status(404).json({ message: "No se encontró el ID" });
    }

    // Si no es admin, verificar que sea el propietario del movimiento
    if (userRole !== "admin" && movement[0].userId != userId) {
      connection.release();
      return res.status(403).json({
        message: "No tienes permiso para borrar este movimiento",
      });
    }

    // Revertir el balance del usuario según el tipo de movimiento
    const amount = movement[0].amount;
    const userIdMovement = movement[0].userId;
    const targetAccountNumber = movement[0].target_account_number;
    const movementType = movement[0].type;
    const movementDate = movement[0].date;
    
    // Revertir el balance: si fue un gasto (-), sumar; si fue ingreso (+), restar
    await connection.query(
      "UPDATE users SET balance = balance - ? WHERE id = ?",
      [amount, userIdMovement]
    );

    // Si es una transferencia, también revertir el balance del otro usuario (con signo opuesto)
    if (targetAccountNumber) {
      try {
        if (movementType === 'expense') {
          // Es el movimiento del usuario que envió (expense, -5)
          // Buscar el usuario destino por su account_number y revertir su balance
          const [targetUser] = await connection.query(
            "SELECT id FROM users WHERE account_number = ?",
            [targetAccountNumber]
          );

          if (targetUser.length > 0) {
            // Revertir el balance del usuario destino (sumar el cantidad opuesta)
            await connection.query(
              "UPDATE users SET balance = balance + ? WHERE id = ?",
              [amount, targetUser[0].id]
            );

            // Borrar el movimiento del usuario destino (income)
            await connection.query(
              "DELETE FROM movements WHERE userId = ? AND type = 'income' AND amount = ? AND DATE(date) = DATE(?)",
              [targetUser[0].id, -amount, movementDate]
            );
          }
        } else if (movementType === 'income') {
          // Es el movimiento del usuario que recibió (income, +5)
          // El monto guardado es positivo (+5), buscamos el movimiento del origen con monto negativo (-5)
          const [sourceMovement] = await connection.query(
            "SELECT userId FROM movements WHERE amount = ? AND type = 'expense' AND target_account_number IS NOT NULL AND DATE(date) = DATE(?)",
            [-amount, movementDate]
          );

          if (sourceMovement.length > 0) {
            // Revertir el balance del usuario origen (devolver lo que envió)
            // El usuario origen había perdido -5, así que le sumamos 5
            await connection.query(
              "UPDATE users SET balance = balance + ? WHERE id = ?",
              [Math.abs(amount), sourceMovement[0].userId]
            );

            // Borrar el movimiento del usuario origen
            await connection.query(
              "DELETE FROM movements WHERE userId = ? AND type = 'expense' AND amount = ? AND DATE(date) = DATE(?)",
              [sourceMovement[0].userId, -amount, movementDate]
            );
          }
        }
      } catch (error) {
        console.error("Error al revertir balance del usuario destino:", error);
      }
    }

    // Borrar el movimiento del usuario actual
    await connection.query("DELETE FROM movements WHERE id = ?", [id]);

    connection.release();
    res.json({ message: "Borrado ok" });
  } catch (error) {
    console.error("Error al borrar movimiento:", error);
    res.status(500).json({ message: "Error interno" });
  }
});

// Endpoint para editar un movimiento por ID
app.put("/api/movements/:id", async (req, res) => {
  const { id } = req.params;
  const { concept, userRole, userId } = req.body;

  // Los lectores no pueden editar movimientos
  if (userRole === "reader") {
    return res
      .status(403)
      .json({ message: "Los lectores no pueden editar movimientos" });
  }

  try {
    const connection = await pool.getConnection();

    // Obtener el movimiento
    const [movement] = await connection.query(
      "SELECT * FROM movements WHERE id = ?",
      [id]
    );

    if (movement.length === 0) {
      connection.release();
      return res.status(404).json({ message: "No encontrado" });
    }

    // Si no es admin, verificar que sea el propietario del movimiento
    if (userRole !== "admin" && movement[0].userId != userId) {
      connection.release();
      return res.status(403).json({
        message: "No tienes permiso para editar este movimiento",
      });
    }

    // Actualizar el concepto
    await connection.query(
      "UPDATE movements SET concept = ? WHERE id = ?",
      [concept, id]
    );

    // Obtener el movimiento actualizado
    const [updatedMovement] = await connection.query(
      "SELECT * FROM movements WHERE id = ?",
      [id]
    );

    connection.release();
    res.json(updatedMovement[0]);
  } catch (error) {
    console.error("Error al actualizar movimiento:", error);
    res.status(500).json({ message: "Error al actualizar" });
  }
});

// Endpoint para obtener todos los usuarios (Solo para el panel Admin)
app.get("/api/admin/users", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      "SELECT id, email, role FROM users"
    );

    connection.release();
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Endpoint para cambiar el rol de un usuario (Solo admin)
app.put("/api/admin/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar que el rol sea uno de los permitidos
    const validRoles = ["admin", "user", "reader"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    const connection = await pool.getConnection();

    // Actualizar el rol
    const result = await connection.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, id]
    );

    if (result[0].affectedRows === 0) {
      connection.release();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Obtener el usuario actualizado
    const [updatedUser] = await connection.query(
      "SELECT id, email, role FROM users WHERE id = ?",
      [id]
    );

    connection.release();
    res.json({ message: "Rol actualizado", user: updatedUser[0] });
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    res.status(500).json({ message: "Error al actualizar rol" });
  }
});

/**
 * Obtiene una transacción aleatoria desde el pool de movimientos automáticos.
 * @returns {{concept: string, amount: number}}
 */
const getRandomTransaction = () => {
  try {
    const transactionsPool = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "data", "transactions-pool.json"),
        "utf-8"
      )
    );
    const randomTransaction =
      transactionsPool.transactions[
        Math.floor(Math.random() * transactionsPool.transactions.length)
      ];
    return randomTransaction;
  } catch (e) {
    console.log("Error al leer transactions-pool.json:", e);
    return { concept: "Movimiento automático", amount: 0.5 };
  }
};

/**
 * Genera movimientos automáticos para todos los usuarios y actualiza balance.
 */
const runAutoTransactions = async () => {
  try {
    const connection = await pool.getConnection();

    // Obtener todos los usuarios
    const [users] = await connection.query("SELECT id FROM users");

    // Crear un movimiento para CADA usuario registrado
    for (const user of users) {
      const transaction = getRandomTransaction();
      const now = toMySqlDateTime();

      await connection.query(
        "INSERT INTO movements (userId, concept, amount, type, date) VALUES (?, ?, ?, ?, ?)",
        [
          user.id,
          transaction.concept,
          transaction.amount,
          transaction.amount >= 0 ? "income" : "expense",
          now,
        ]
      );

      // Actualizar el balance del usuario con el monto del movimiento
      await connection.query(
        "UPDATE users SET balance = balance + ? WHERE id = ?",
        [transaction.amount, user.id]
      );
    }

    console.log(`✅ Cron job ejecutado: ${users.length} movimientos creados`);
    connection.release();
  } catch (e) {
    console.error("Error en cron job:", e);
  }
};

if (!isTestEnv) {
  ensureMovementsDateTimeColumn();
  setInterval(runAutoTransactions, 120000);
}

// Server iniciado
if (!isTestEnv) {
  app.listen(PORT, () => {
    console.log(`🚀 NovaBank Server corriendo en http://localhost:${PORT}`);
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
  });
}

module.exports = {
  app,
  getRandomTransaction,
  runAutoTransactions,
  pool,
};
