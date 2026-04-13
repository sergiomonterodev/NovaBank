import { LitElement, html, css } from "lit";
import { store } from "../store.js";

export class MovimientosTable extends LitElement {
  static styles = css`
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th,
    td {
      padding: 12px;
      border: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #f4f4f4;
    }
    .income {
      color: green;
      font-weight: bold;
    }
    .expense {
      color: red;
      font-weight: bold;
    }
    button {
      cursor: pointer;
      padding: 5px 10px;
      margin-right: 5px;
    }
    .btn-edit {
      background: #006efd;
      color: white;
      border: none;
      border-radius: 3px;
    }
    .btn-delete {
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 3px;
    }
  `;

  constructor() {
    super();
    this._unsubscribe = store.subscribe(() => {
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) this._unsubscribe();
  }

  render() {
    return html`
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Cantidad</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${store.movements.map(
            (mov) => html`
              <tr>
                <td>${mov.concept}</td>
                <td class="${mov.type}">${mov.amount}€</td>
                <td>${mov.date}</td>
                <td>
                  <button
                    class="btn-edit"
                    @click=${() => console.log("Editar", mov.id)}
                  >
                    Editar
                  </button>
                  <button
                    class="btn-delete"
                    @click=${() => this._delete(mov.id)}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            `,
          )}
        </tbody>
      </table>
    `;
  }

  async _delete(id) {
    if (!id) {
      console.error("Error: El movimiento no tiene ID");
      return;
    }

    if (confirm("¿Seguro?")) {
      const success = await store.deleteMovement(id);
      if (!success) alert("No se pudo borrar en el servidor");
    }
  }
}
customElements.define("movimientos-table", MovimientosTable);
