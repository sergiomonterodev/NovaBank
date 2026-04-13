class BankStore {
  constructor() {
    this.movements = [];
    this.subscribers = [];
    this.allUsers = [];

    const savedRole = localStorage.getItem("role");
    const savedToken = localStorage.getItem("token");
    const savedUserId = localStorage.getItem("userId");

    this.user = {
      isLoggedIn: !!savedToken,
      token: savedToken,
      role: savedRole,
      id: savedUserId ? parseInt(savedUserId) : null, // Convertimos a número
    };

    // Si ya estaba logueado, pedimos sus datos de inmediato
    if (this.user.isLoggedIn) {
      this.fetchMovements();
    }
  }

  // Método para que los componentes se "suscriban" a los cambios
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  // Notificar a todos los suscritos
  notify() {
    this.subscribers.forEach((callback) => callback(this.movements));
  }

  // Llamada al backend
  async fetchMovements() {
    if (!this.user.id) return; // Si no hay usuario, no pedimos nada

    try {
      const response = await fetch(
        `http://localhost:3000/api/movements?userId=${this.user.id}`,
      );
      this.movements = await response.json();
      this.notify();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // Obtener el saldo total (amount)
  getSaldoTotal() {
    return this.movements.reduce((acc, mov) => acc + mov.amount, 0);
  }

  // Borrar movimiento
  async deleteMovement(id) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/movements/${id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        // Si el servidor dice que OK, lo quitamos de nuestra lista local para que la UI se actualice
        this.movements = this.movements.filter((m) => m.id !== id);
        this.notify();
        return true;
      }
    } catch (error) {
      console.error("Error al borrar:", error);
    }
    return false;
  }

  // Método para loguearse
  async login(email, password) {
    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();

        this.user = {
          isLoggedIn: true,
          role: data.role,
          token: data.token,
          id: data.userId,
        };

        // Guardamos en persistencia
        localStorage.setItem("role", data.role);
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);

        this.notify();

        // Cargamos los movimientos del usuario recién logueado
        await this.fetchMovements();
        return true;
      }
    } catch (error) {
      console.error("Error crítico en el login:", error);
    }
    return false;
  }

  // Método para cerrar sesión
  logout() {
    this.user = { isLoggedIn: false, role: null, token: null, id: null };
    this.movements = []; // Limpiamos movimientos
    this.allUsers = [];  // Limpiamos todos los usuarios
    localStorage.clear();
    this.notify();
  }

  // Método para cargar todos los usuarios
  async fetchAllUsers() {
    if (this.user.role !== "admin") return;

    try {
      const response = await fetch("http://localhost:3000/api/admin/users");
      this.allUsers = await response.json();
      this.notify();
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  }
}

// Exportamos una única instancia (Singleton)
export const store = new BankStore();
