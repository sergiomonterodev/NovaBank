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
    if (confirm("¿Seguro que quieres borrar este movimiento?")) {
      const success = await store.deleteMovement(id);
      if (success) {
        console.log("Borrado con éxito de la base de datos");
      } else {
        alert("Error al intentar borrar el movimiento");
      }
    }
  }
}
customElements.define("movimientos-table", MovimientosTable);
