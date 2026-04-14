import { LitElement, html } from "lit";
import { store } from "../store.js";
import { transferirFormStyles } from "../styles/transferir-form.styles.js";

export class TransferirForm extends LitElement {
  static styles = transferirFormStyles;

  render() {
    return html`
      <form @submit=${this._handleSubmit}>
        <div>
          <label>Tipo de operación:</label>
          <select name="type" required>
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </select>
        </div>

        <input
          type="text"
          name="concept"
          placeholder="Concepto (ej: Compra Mercadona)"
          required
        />

        <input
          type="number"
          name="amount"
          step="0.01"
          placeholder="Cantidad (ej: 50.00)"
          required
        />

        <button type="submit">Registrar movimiento</button>
      </form>
    `;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const type = formData.get("type");
    const concept = formData.get("concept");
    let amount = parseFloat(formData.get("amount"));

    if (type === "expense" && amount > 0) amount = -amount;
    if (type === "income" && amount < 0) amount = Math.abs(amount);

    const nuevoMovimiento = {
      userId: store.user.id,
      concept,
      amount,
      type,
      date: new Date().toISOString().split("T")[0],
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
      store.addNotification("Movimiento registrado correctamente", "success");
    } else {
      store.addNotification("No se pudo registrar el movimiento. Verifica que tengas permiso.", "error");
    }
  }
}
customElements.define("transferir-form", TransferirForm);
