import { LitElement, html } from "lit";
import { store } from "../store.js";
import { transferirFormStyles } from "../styles/transferir-form.styles.js";

export class TransferirForm extends LitElement {
  static styles = transferirFormStyles;

  render() {
    return html`
      <form @submit=${this._handleSubmit}>
        <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
          <p><strong>Tu número de cuenta:</strong> ${store.user.accountNumber || "Cargando..."}</p>
          <p><strong>Saldo disponible:</strong> ${store.user.balance ? store.user.balance.toFixed(2) + "€" : "Cargando..."}</p>
        </div>

        <input
          type="text"
          name="targetAccountNumber"
          placeholder="Número de cuenta destino (ej: ACC000001)"
          required
        />

        <input
          type="text"
          name="concept"
          placeholder="Concepto (ej: Pago servicios)"
          required
        />

        <input
          type="number"
          name="amount"
          step="0.01"
          placeholder="Cantidad (ej: 50.00)"
          required
        />

        <button type="submit">Realizar Transferencia</button>
      </form>
    `;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const targetAccountNumber = formData.get("targetAccountNumber");
    const concept = formData.get("concept");
    const amount = parseFloat(formData.get("amount"));

    // Validación: cantidad debe ser menor al saldo
    if (amount > store.user.balance) {
      store.addNotification(
        `No tienes suficiente saldo. Saldo disponible: ${store.user.balance.toFixed(2)}€`,
        "error"
      );
      return;
    }

    // Validación: cantidad debe ser positiva
    if (amount <= 0) {
      store.addNotification("La cantidad debe ser mayor a 0€", "error");
      return;
    }

    const nuevoMovimiento = {
      userId: store.user.id,
      concept,
      amount,
      date: new Date().toISOString().split("T")[0],
      targetAccountNumber,
    };

    const success = await store.addMovement(nuevoMovimiento);

    if (success) {
      this.dispatchEvent(
        new CustomEvent("movimiento-creado", {
          bubbles: true,
          composed: true,
        }),
      );
      
      e.target.reset();
      store.addNotification("Transferencia realizada correctamente", "success");
    } else {
      store.addNotification("No se pudo realizar la transferencia. Verifica los datos.", "error");
    }
  }
}
customElements.define("transferir-form", TransferirForm);
