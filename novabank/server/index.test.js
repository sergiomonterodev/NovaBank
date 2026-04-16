const request = require("supertest");

jest.mock("mysql2/promise", () => ({
  createPool: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-token"),
}));

describe("NovaBank server", () => {
  let app;
  let getRandomTransaction;
  let runAutoTransactions;
  let connection;
  let pool;

  const loadServer = () => {
    jest.resetModules();
    process.env.NODE_ENV = "test";

    const mysql = require("mysql2/promise");
    mysql.createPool.mockReturnValue(pool);

    const mod = require("./index");
    app = mod.app;
    getRandomTransaction = mod.getRandomTransaction;
    runAutoTransactions = mod.runAutoTransactions;
  };

  const queueQueryResults = (results) => {
    const queue = [...results];
    connection.query.mockImplementation(async () => {
      if (queue.length === 0) {
        throw new Error("Unexpected query call");
      }
      return queue.shift();
    });
  };

  beforeEach(() => {
    connection = {
      query: jest.fn(),
      release: jest.fn(),
    };

    pool = {
      getConnection: jest.fn().mockResolvedValue(connection),
    };

    loadServer();
  });

  test("POST /api/register should reject existing users", async () => {
    queueQueryResults([[[{ id: 1 }]]]);

    const response = await request(app)
      .post("/api/register")
      .send({ email: "test@x.com", password: "123" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("El usuario ya existe");
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test("POST /api/register should create a user", async () => {
    queueQueryResults([[[]], [{ insertId: 5 }]]);

    const response = await request(app)
      .post("/api/register")
      .send({ email: "new@x.com", password: "123" });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Usuario creado con éxito");
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test("POST /api/login should return token for valid credentials", async () => {
    queueQueryResults([[[{ id: 10, role: "admin" }]]]);

    const response = await request(app)
      .post("/api/login")
      .send({ email: "admin@x.com", password: "123" });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("mock-token");
    expect(response.body.role).toBe("admin");
    expect(response.body.userId).toBe(10);
  });

  test("POST /api/login should reject invalid credentials", async () => {
    queueQueryResults([[[]]]);

    const response = await request(app)
      .post("/api/login")
      .send({ email: "bad@x.com", password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credenciales incorrectas");
  });

  test("GET /api/movements should return user movements", async () => {
    queueQueryResults([[[{ id: 1, concept: "Pago", amount: "5.00" }]]]);

    const response = await request(app).get(
      "/api/movements?userId=1&userRole=user"
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(1);
  });

  test("GET /api/user/:id should return 404 when user does not exist", async () => {
    queueQueryResults([[[]]]);

    const response = await request(app).get("/api/user/222");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Usuario no encontrado");
  });

  test("GET /api/user/:id should return user data", async () => {
    queueQueryResults([[[{ id: 1, email: "u@x.com", role: "user", account_number: "ES001", balance: 100 }]]]);

    const response = await request(app).get("/api/user/1");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
    expect(response.body.account_number).toBe("ES001");
  });

  test("POST /api/movements should block reader role", async () => {
    const response = await request(app).post("/api/movements").send({
      userId: 1,
      concept: "Transfer",
      amount: 10,
      date: "2026-04-16",
      userRole: "reader",
      targetAccountNumber: "ES001",
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Los lectores no pueden crear movimientos");
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  test("POST /api/movements should validate available balance", async () => {
    queueQueryResults([[[{ id: 1, balance: 10 }]]]);

    const response = await request(app).post("/api/movements").send({
      userId: 1,
      concept: "Transfer",
      amount: 100,
      date: "2026-04-16",
      userRole: "user",
      targetAccountNumber: "ES001",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("No tienes suficiente saldo");
  });

  test("POST /api/movements should return 404 when source user does not exist", async () => {
    queueQueryResults([[[]]]);

    const response = await request(app).post("/api/movements").send({
      userId: 999,
      concept: "Transfer",
      amount: 10,
      date: "2026-04-16",
      userRole: "user",
      targetAccountNumber: "ES001",
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Usuario no encontrado");
  });

  test("POST /api/movements should return 404 when target account does not exist", async () => {
    queueQueryResults([
      [[{ id: 1, balance: 100 }]],
      [[ ]],
    ]);

    const response = await request(app).post("/api/movements").send({
      userId: 1,
      concept: "Transfer",
      amount: 10,
      date: "2026-04-16",
      userRole: "user",
      targetAccountNumber: "NOTFOUND",
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Cuenta destino no encontrada");
  });

  test("POST /api/movements should create transfer and return movement", async () => {
    queueQueryResults([
      [[{ id: 1, balance: 100 }]],
      [[{ id: 2 }]],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
      [[{ id: 999, userId: 1, concept: "Transfer" }]],
    ]);

    const response = await request(app).post("/api/movements").send({
      userId: 1,
      concept: "Transfer",
      amount: 25,
      date: "2026-04-16",
      userRole: "user",
      targetAccountNumber: "ES001",
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(999);
  });

  test("DELETE /api/movements/:id should return 404 for unknown movement", async () => {
    queueQueryResults([[[]]]);

    const response = await request(app).delete(
      "/api/movements/50?userRole=user&userId=1"
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No se encontró el ID");
  });

  test("DELETE /api/movements/:id should block reader role", async () => {
    const response = await request(app).delete(
      "/api/movements/7?userRole=reader&userId=1"
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Los lectores no pueden borrar movimientos");
  });

  test("DELETE /api/movements/:id should reject non-owner", async () => {
    queueQueryResults([[[{ id: 7, userId: 99, amount: -5 }]]]);

    const response = await request(app).delete(
      "/api/movements/7?userRole=user&userId=1"
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "No tienes permiso para borrar este movimiento"
    );
  });

  test("DELETE /api/movements/:id should delete owner movement", async () => {
    queueQueryResults([
      [[{ id: 7, userId: 1, amount: -5, type: "expense", target_account_number: null, date: "2026-04-16" }]],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
    ]);

    const response = await request(app).delete(
      "/api/movements/7?userRole=user&userId=1"
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Borrado ok");
  });

  test("DELETE /api/movements/:id should revert paired transfer for expense movements", async () => {
    queueQueryResults([
      [[{ id: 7, userId: 1, amount: -5, type: "expense", target_account_number: "ES999", date: "2026-04-16" }]],
      [{ affectedRows: 1 }],
      [[{ id: 2 }]],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
    ]);

    const response = await request(app).delete(
      "/api/movements/7?userRole=user&userId=1"
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Borrado ok");
  });

  test("DELETE /api/movements/:id should revert paired transfer for income movements", async () => {
    queueQueryResults([
      [[{ id: 8, userId: 2, amount: 5, type: "income", target_account_number: "ES999", date: "2026-04-16" }]],
      [{ affectedRows: 1 }],
      [[{ userId: 1 }]],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
    ]);

    const response = await request(app).delete(
      "/api/movements/8?userRole=admin&userId=99"
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Borrado ok");
  });

  test("PUT /api/movements/:id should block reader role", async () => {
    const response = await request(app).put("/api/movements/7").send({
      concept: "Nuevo",
      userRole: "reader",
      userId: 1,
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Los lectores no pueden editar movimientos");
  });

  test("PUT /api/movements/:id should update concept", async () => {
    queueQueryResults([
      [[{ id: 7, userId: 1, concept: "Viejo" }]],
      [{ affectedRows: 1 }],
      [[{ id: 7, userId: 1, concept: "Nuevo" }]],
    ]);

    const response = await request(app).put("/api/movements/7").send({
      concept: "Nuevo",
      userRole: "user",
      userId: 1,
    });

    expect(response.status).toBe(200);
    expect(response.body.concept).toBe("Nuevo");
  });

  test("PUT /api/movements/:id should return 404 when movement does not exist", async () => {
    queueQueryResults([[[]]]);

    const response = await request(app).put("/api/movements/700").send({
      concept: "Nuevo",
      userRole: "user",
      userId: 1,
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("No encontrado");
  });

  test("PUT /api/movements/:id should block non-owner users", async () => {
    queueQueryResults([[[{ id: 7, userId: 200, concept: "Viejo" }]]]);

    const response = await request(app).put("/api/movements/7").send({
      concept: "Nuevo",
      userRole: "user",
      userId: 1,
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("No tienes permiso para editar este movimiento");
  });

  test("GET /api/admin/users should return users list", async () => {
    queueQueryResults([[[{ id: 1, email: "admin@x.com", role: "admin" }]]]);

    const response = await request(app).get("/api/admin/users");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  test("PUT /api/admin/users/:id/role should validate role values", async () => {
    const response = await request(app)
      .put("/api/admin/users/1/role")
      .send({ role: "root" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Rol inválido");
  });

  test("PUT /api/admin/users/:id/role should return 404 when user does not exist", async () => {
    queueQueryResults([[{ affectedRows: 0 }]]);

    const response = await request(app)
      .put("/api/admin/users/1/role")
      .send({ role: "user" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Usuario no encontrado");
  });

  test("PUT /api/admin/users/:id/role should update role", async () => {
    queueQueryResults([
      [{ affectedRows: 1 }],
      [[{ id: 1, email: "u@x.com", role: "reader" }]],
    ]);

    const response = await request(app)
      .put("/api/admin/users/1/role")
      .send({ role: "reader" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Rol actualizado");
    expect(response.body.user.role).toBe("reader");
  });

  test("GET /api/movements should return 500 when db fails", async () => {
    pool.getConnection.mockRejectedValueOnce(new Error("db down"));

    const response = await request(app).get(
      "/api/movements?userId=1&userRole=user"
    );

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Error al leer datos");
  });

  test("POST /api/register should return 500 when db fails", async () => {
    pool.getConnection.mockRejectedValueOnce(new Error("db down"));

    const response = await request(app)
      .post("/api/register")
      .send({ email: "fail@x.com", password: "123" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Error al registrar");
  });

  test("runAutoTransactions should process all users", async () => {
    queueQueryResults([
      [[{ id: 1 }, { id: 2 }]],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
      [{ affectedRows: 1 }],
    ]);

    await runAutoTransactions();

    expect(connection.query).toHaveBeenCalledTimes(5);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test("getRandomTransaction should fallback on read error", () => {
    const fs = require("fs");
    const readSpy = jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("boom");
    });

    const transaction = getRandomTransaction();

    expect(transaction).toEqual({ concept: "Movimiento automático", amount: 0.5 });
    readSpy.mockRestore();
  });
});
