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

  static properties = {
    editingId: { type: Object }
  };

  constructor() {
    super();
    this.editingId = null;
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
            ${store.user.role === "admin" ? html`<th>Usuario ID</th>` : ""}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${store.movements.map(
            (mov) => {
              // Determinar si el usuario actual puede editar/borrar este movimiento
              const isOwner = mov.userId === store.user.id;
              const canEdit = store.user.role === "admin" || (store.user.role === "user" && isOwner);
              const isReader = store.user.role === "reader";
              
              return html`
              <tr>
                <td>
                  ${this.editingId === mov.id && canEdit
                    ? html`<input
                        type="text"
                        id="edit-${mov.id}"
                        .value=${mov.concept}
                      />`
                    : mov.concept}
                </td>

                <td class="${mov.type}">${mov.amount}€</td>
                <td>${mov.date}</td>
                ${store.user.role === "admin" ? html`<td>${mov.userId}</td>` : ""}
                <td>
                  ${!isReader ? html`
                    ${this.editingId === mov.id
                      ? html`<button
                          class="btn-edit"
                          @click=${() => this._save(mov.id)}
                        >
                          Guardar
                        </button>`
                      : html`<button
                          class="btn-edit"
                          @click=${() => (this.editingId = mov.id)}
                          ?disabled=${!canEdit}
                        >
                          Editar
                        </button>`}
                    <button
                      class="btn-delete"
                      @click=${() => this._delete(mov.id)}
                      ?disabled=${!canEdit}
                    >
                      Borrar
                    </button>
                  ` : html`<span style="color: #999;">Solo lectura</span>`}
                </td>
              </tr>
            `;
            }
          )}
        </tbody>
      </table>
    `;
  }

  async _save(id) {
    try {
      const selector = `input[id="edit-${id}"]`;
      const input = this.renderRoot.querySelector(selector);

      if (!input) {
        throw new Error(`No se encontró el input`);
      }

      const nuevoConcepto = input.value;
      const success = await store.updateMovement(id, nuevoConcepto);

      if (success) {
        this.editingId = null;
        alert("✅ ¡Movimiento actualizado!");
      }
    } catch (error) {
      console.error("DETALLE:", error);
      alert("Error al guardar");
    }
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
