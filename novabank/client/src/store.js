class BankStore {
  constructor() {
    // Array vacío de movements
    this.movements = [];
    this.subscribers = [];
    this.user = {
      isLoggedIn: !!localStorage.getItem("token"),
      role: localStorage.getItem("role") || null,
      token: localStorage.getItem("token") || null,
    };
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
    try {
      const response = await fetch("http://localhost:3000/api/movements");
      this.movements = await response.json();
      this.notify(); // ¡Avisamos a todos que ya hay datos!
    } catch (error) {
      console.error("Error cargando movimientos:", error);
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
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      this.user = { isLoggedIn: true, role: data.role, token: data.token };
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      this.notify();
      return true;
    }
    return false;
  }

  // Método para cerrar sesión
  logout() {
    this.user = { isLoggedIn: false, role: null, token: null };
    localStorage.clear();
    this.notify();
  }
}

// Exportamos una única instancia (Singleton)
export const store = new BankStore();