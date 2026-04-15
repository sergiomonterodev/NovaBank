import { LitElement, html } from "lit";
import { store } from "../store.js";
import { movimientosTableStyles } from "../styles/movimientos-table.styles.js";

export class MovimientosTable extends LitElement {
  static styles = movimientosTableStyles;

  static properties = {
    editingId: { type: Object },
    deletingId: { type: Object }
  };

  _formatDate(date) {
    if (!date) return "";
    // Si la fecha contiene T (formato ISO), tomar solo la parte de la fecha
    if (date.includes("T")) {
      return date.split("T")[0];
    }
    // Si ya es formato AAAA-MM-DD, devolverla tal cual
    return date;
  }

  constructor() {
    super();
    this.editingId = null;
    this.deletingId = null;
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
      ${this.deletingId ? html`
        <div class="modal-overlay" @click=${() => this.deletingId = null}>
          <div class="modal" @click=${(e) => e.stopPropagation()}>
            <h3>¿Eliminar movimiento?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div class="modal-buttons">
              <button class="btn-confirm" @click=${() => this._confirmDelete(this.deletingId)}>Eliminar</button>
              <button class="btn-cancel" @click=${() => this.deletingId = null}>Cancelar</button>
            </div>
          </div>
        </div>
      ` : ""}

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
                <td>${this._formatDate(mov.date)}</td>
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
        store.addNotification("Movimiento actualizado correctamente", "success");
      } else {
        store.addNotification("No se pudo actualizar el movimiento", "error");
      }
    } catch (error) {
      console.error("DETALLE:", error);
      store.addNotification("Error al guardar el movimiento", "error");
    }
  }

  async _delete(id) {
    if (!id) {
      console.error("Error: El movimiento no tiene ID");
      store.addNotification("Error: ID de movimiento no válido", "error");
      return;
    }

    this.deletingId = id;
  }

  async _confirmDelete(id) {
    const success = await store.deleteMovement(id);
    this.deletingId = null;
    
    if (success) {
      store.addNotification("Movimiento eliminado correctamente", "success");
    } else {
      store.addNotification("No se pudo eliminar el movimiento", "error");
    }
  }
}
customElements.define("movimientos-table", MovimientosTable);
