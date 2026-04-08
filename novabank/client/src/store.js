class BankStore {
  constructor() {
    // Array vacío de movements
    this.movements = [];
    this.subscribers = [];
  }

  // Método para que los componentes se "suscriban" a los cambios
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  // Notificar a todos los suscritos
  notify() {
    this.subscribers.forEach(callback => callback(this.movements));
  }

  // Llamada al backend
  async fetchMovements() {
    try {
      const response = await fetch('http://localhost:3000/api/movements');
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
}

// Exportamos una única instancia (Singleton)
export const store = new BankStore();