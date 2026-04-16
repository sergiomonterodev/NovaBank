import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { BankStore } from "./store.js";

describe("BankStore", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes logged out when no storage data exists", () => {
    const store = new BankStore();

    expect(store.user.isLoggedIn).toBe(false);
    expect(store.user.id).toBeNull();
    expect(store.movements).toEqual([]);
  });

  it("notifies subscribers", () => {
    const store = new BankStore();
    const callback = vi.fn();

    store.subscribe(callback);
    store.notify();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("calculates saldo total from movement amounts", () => {
    const store = new BankStore();
    store.movements = [
      { amount: "10.50" },
      { amount: -4 },
      { amount: "3" },
    ];

    expect(store.getSaldoTotal()).toBeCloseTo(9.5, 5);
  });

  it("adds and auto-removes notifications", () => {
    const store = new BankStore();

    const id = store.addNotification("Guardado", "success", 1000);
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0].id).toBe(id);

    vi.advanceTimersByTime(1001);
    expect(store.notifications).toHaveLength(0);
  });

  it("register returns success true when backend responds ok", async () => {
    global.fetch.mockResolvedValue({ ok: true });
    const store = new BankStore();

    const result = await store.register("mail@x.com", "1234");

    expect(result).toEqual({ success: true });
  });

  it("register returns backend message when request fails", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "El usuario ya existe" }),
    });
    const store = new BankStore();

    const result = await store.register("mail@x.com", "1234");

    expect(result.success).toBe(false);
    expect(result.message).toBe("El usuario ya existe");
  });

  it("login stores session data and loads movements and user data", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "user", token: "abc", userId: 9 }),
      })
      .mockResolvedValueOnce({
        json: async () => [{ id: 1, amount: "10" }],
      })
      .mockResolvedValueOnce({
        json: async () => ({ balance: "120", account_number: "ES009" }),
      });

    const store = new BankStore();
    const loggedIn = await store.login("mail@x.com", "1234");

    expect(loggedIn).toBe(true);
    expect(store.user.isLoggedIn).toBe(true);
    expect(store.user.balance).toBe(120);
    expect(store.movements[0].amount).toBe(10);
    expect(localStorage.getItem("token")).toBe("abc");
  });

  it("logout resets state and clears localStorage", () => {
    localStorage.setItem("token", "abc");
    const store = new BankStore();
    store.user = { isLoggedIn: true, role: "admin", token: "abc", id: 1, balance: 10, accountNumber: "ES001" };
    store.movements = [{ id: 1 }];
    store.allUsers = [{ id: 1 }];

    store.logout();

    expect(store.user.isLoggedIn).toBe(false);
    expect(store.movements).toEqual([]);
    expect(store.allUsers).toEqual([]);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("addMovement sends role and refreshes user data", async () => {
    const store = new BankStore();
    store.user = { ...store.user, id: 1, role: "user" };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 8, concept: "Transfer", amount: -5 }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ balance: "95", account_number: "ES001" }),
      })
      .mockResolvedValueOnce({
        json: async () => [{ id: 8, amount: "-5" }],
      });

    const result = await store.addMovement({
      userId: 1,
      concept: "Transfer",
      amount: 5,
      date: "2026-04-16",
      targetAccountNumber: "ES002",
    });

    expect(result).toBe(true);
    expect(store.user.balance).toBe(95);
    expect(store.movements[0].id).toBe(8);
  });

  it("deleteMovement removes local movement on success", async () => {
    const store = new BankStore();
    store.user = { ...store.user, id: 1, role: "user" };
    store.movements = [{ id: 1 }, { id: 2 }];

    global.fetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        json: async () => ({ balance: "100", account_number: "ES001" }),
      });

    const result = await store.deleteMovement(1);

    expect(result).toBe(true);
    expect(store.movements).toEqual([{ id: 2 }]);
  });

  it("changeUserRole blocks non-admin users", async () => {
    const store = new BankStore();
    store.user.role = "user";

    const result = await store.changeUserRole(1, "admin");

    expect(result.success).toBe(false);
    expect(result.message).toBe("No tienes permisos");
  });

  it("changeUserRole updates local user list for admins", async () => {
    const store = new BankStore();
    store.user.role = "admin";
    store.allUsers = [{ id: 7, email: "u@x.com", role: "user" }];

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 7, email: "u@x.com", role: "reader" } }),
    });

    const result = await store.changeUserRole(7, "reader");

    expect(result.success).toBe(true);
    expect(store.allUsers[0].role).toBe("reader");
  });

  it("fetchMovements should skip call when user id is missing", async () => {
    const store = new BankStore();
    store.user.id = null;

    await store.fetchMovements();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetchCurrentUser updates balance and account number", async () => {
    const store = new BankStore();
    store.user.id = 3;

    global.fetch.mockResolvedValue({
      json: async () => ({ balance: "55.25", account_number: "ES555" }),
    });

    await store.fetchCurrentUser();

    expect(store.user.balance).toBe(55.25);
    expect(store.user.accountNumber).toBe("ES555");
  });

  it("updateMovement updates concept when movement exists", async () => {
    const store = new BankStore();
    store.user = { ...store.user, id: 1, role: "user" };
    store.movements = [{ id: 50, concept: "Old" }];

    global.fetch.mockResolvedValue({ ok: true });

    const result = await store.updateMovement(50, "New");

    expect(result).toBe(true);
    expect(store.movements[0].concept).toBe("New");
  });

  it("updateMovement returns false when backend rejects", async () => {
    const store = new BankStore();
    store.user = { ...store.user, id: 1, role: "user" };

    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "No autorizado" }),
    });

    const result = await store.updateMovement(50, "New");

    expect(result).toBe(false);
  });

  it("login returns false on invalid credentials", async () => {
    const store = new BankStore();

    global.fetch.mockResolvedValue({ ok: false });

    const result = await store.login("mail@x.com", "bad");

    expect(result).toBe(false);
    expect(store.user.isLoggedIn).toBe(false);
  });

  it("fetchAllUsers loads users only for admin", async () => {
    const store = new BankStore();
    store.user.role = "admin";

    global.fetch.mockResolvedValue({
      json: async () => [{ id: 1, role: "user" }],
    });

    await store.fetchAllUsers();

    expect(store.allUsers).toHaveLength(1);
  });

  it("fetchAllUsers should skip for non-admin", async () => {
    const store = new BankStore();
    store.user.role = "user";

    await store.fetchAllUsers();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("changeUserRole returns backend error message", async () => {
    const store = new BankStore();
    store.user.role = "admin";

    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Rol inválido" }),
    });

    const result = await store.changeUserRole(5, "root");

    expect(result.success).toBe(false);
    expect(result.message).toBe("Rol inválido");
  });

  it("changeUserRole handles network errors", async () => {
    const store = new BankStore();
    store.user.role = "admin";

    global.fetch.mockRejectedValue(new Error("network"));

    const result = await store.changeUserRole(5, "reader");

    expect(result.success).toBe(false);
    expect(result.message).toBe("Error de conexión");
  });

  it("clearNotifications removes all notifications", () => {
    const store = new BankStore();
    store.notifications = [{ id: 1 }, { id: 2 }];

    store.clearNotifications();

    expect(store.notifications).toEqual([]);
  });
});
