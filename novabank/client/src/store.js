class BankStore {
  constructor() {
    this.movements = [];
    this.subscribers = [];
    this.allUsers = [];
    this.notifications = [];
    this.notificationId = 0;

    const savedRole = localStorage.getItem("role");
    const savedToken = localStorage.getItem("token");
    const savedUserId = localStorage.getItem("userId");

    this.user = {
      isLoggedIn: !!savedToken,
      token: savedToken,
      role: savedRole,
      id: savedUserId ? Number(savedUserId) : null,
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
        `http://localhost:3000/api/movements?userId=${this.user.id}&userRole=${this.user.role}`,
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

  // Añadir movimiento
  async addMovement(movimiento) {
    try {
      const movimientoConRole = {
        ...movimiento,
        userRole: this.user.role
      };
      const response = await fetch("http://localhost:3000/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movimientoConRole),
      });

      if (response.ok) {
        const nuevoMov = await response.json();
        this.movements = [...this.movements, nuevoMov];
        this.notify();
        return true;
      } else {
        const error = await response.json();
        console.error("Error:", error.message);
      }
    } catch (error) {
      console.error("Error al añadir:", error);
    }
    return false;
  }

  // Borrar movimiento
  async deleteMovement(id) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/movements/${id}?userRole=${this.user.role}&userId=${this.user.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        this.movements = this.movements.filter(
          (m) => Number(m.id) !== Number(id),
        );
        this.notify();
        return true;
      } else {
        const error = await response.json();
        console.error("Error:", error.message);
      }
    } catch (error) {
      console.error("Error al borrar:", error);
    }
    return false;
  }

  async updateMovement(id, newConcept) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/movements/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            concept: newConcept,
            userRole: this.user.role,
            userId: this.user.id
          }),
        },
      );

      if (response.ok) {
        // Actualizamos el array local para que la UI se entere
        const index = this.movements.findIndex(
          (m) => Number(m.id) === Number(id),
        );
        if (index !== -1) {
          this.movements[index].concept = newConcept;
          // Importante: Crear una copia del array para disparar la reactividad
          this.movements = [...this.movements];
          this.notify();
          return true;
        }
      } else {
        const error = await response.json();
        console.error("Error:", error.message);
      }
    } catch (error) {
      console.error("Error en el store:", error);
    }
    return false;
  }

  async register(email, password) {
    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: "Error de conexión" };
    }
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
    this.allUsers = []; // Limpiamos todos los usuarios
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

  // Método para cambiar el rol de un usuario
  async changeUserRole(userId, newRole) {
    if (this.user.role !== "admin") return { success: false, message: "No tienes permisos" };

    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const data = await response.json();
        // Actualizamos el usuario en la lista local
        const index = this.allUsers.findIndex((u) => Number(u.id) === Number(userId));
        if (index !== -1) {
          this.allUsers[index] = data.user;
          this.allUsers = [...this.allUsers];
          this.notify();
        }
        return { success: true, message: "Rol actualizado" };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      return { success: false, message: "Error de conexión" };
    }
  }

  // Métodos para notificaciones
  addNotification(message, type = "info", duration = 4000) {
    const id = this.notificationId++;
    const notification = { id, message, type };
    
    this.notifications = [...this.notifications, notification];
    this.notify();
    
    // Auto-remover después del duration especificado
    if (duration > 0) {
      setTimeout(() => this.removeNotification(id), duration);
    }
    
    return id;
  }

  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify();
  }

  clearNotifications() {
    this.notifications = [];
    this.notify();
  }
}

// Exportamos una única instancia (Singleton)
export const store = new BankStore();
