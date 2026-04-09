import { LitElement, html, css } from 'lit';
import { store } from '../store.js';

export class TransferirForm extends LitElement {
  static styles = css`
    form { display: flex; flex-direction: column; gap: 15px; max-width: 400px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    input, select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    button { 
      padding: 10px; 
      background-color: #005fb8; 
      color: white; 
      border: none; 
      border-radius: 4px; 
      cursor: pointer; 
    }
    button:hover { background-color: #004a8f; }
  `;

  render() {
    return html`
      <form @submit=${this._handleSubmit}>
        <div class="field">
          <label>Concepto</label>
          <input name="concept" type="text" placeholder="Ej: Compra Mercadona" required>
        </div>
        <div class="field">
          <label>Cantidad (usa "-" para gastos)</label>
          <input name="amount" type="number" step="0.01" placeholder="Ej: -20.50" required>
        </div>
        <div class="field">
          <label>Tipo</label>
          <select name="type">
            <option value="expense">Gasto</option>
            <option value="income">Ingreso</option>
          </select>
        </div>
        <button type="submit">Registrar Movimiento</button>
      </form>
    `;
  }

  _handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const nuevoMovimiento = {
      id: Date.now(), // ID temporal
      concept: formData.get('concept'),
      amount: parseFloat(formData.get('amount')),
      type: formData.get('type'),
      date: new Date().toISOString().split('T')[0]
    };

    // Actualizamos el Store
    store.movements = [...store.movements, nuevoMovimiento];
    store.notify();

    // Limpiamos el formulario y feedback
    e.target.reset();
    alert("¡Movimiento registrado con éxito!");
  }
}
customElements.define('transferir-form', TransferirForm);