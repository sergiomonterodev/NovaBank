import { LitElement, html } from 'lit';
import { store } from '../store.js';
import { adminPanelStyles } from '../styles/admin-panel.styles.js';

export class AdminPanel extends LitElement {
  static styles = adminPanelStyles;

  static properties = {
    selectedUserId: { type: Number },
    showMovementsModal: { type: Boolean },
    userMovements: { type: Object },
    editingMovementId: { type: Number },
    deletingMovementId: { type: Number },
  };

  constructor() {
    super();
    this.selectedRoles = {};
    this.selectedUserId = null;
    this.showMovementsModal = false;
    this.userMovements = {};
    this.editingMovementId = null;
    this.deletingMovementId = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = store.subscribe(() => {
      this.requestUpdate();
    });
    store.fetchAllUsers();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubscribe) this._unsubscribe();
  }

  handleRoleChange(userId, event) {
    const newRole = event.target.value;
    this.selectedRoles[userId] = newRole;
    this.requestUpdate();
  }

  async handleRoleUpdate(userId) {
    const newRole = this.selectedRoles[userId];
    if (!newRole) return;

    const result = await store.changeUserRole(userId, newRole);
    if (result.success) {
      store.addNotification(`Rol actualizado a ${newRole}`, 'success');
      delete this.selectedRoles[userId];
      this.requestUpdate();
    } else {
      store.addNotification(`Error: ${result.message}`, 'error');
    }
  }

  _formatDate(date) {
    if (!date) return "";
    // Si la fecha contiene T (formato ISO), tomar solo la parte de la fecha
    if (date.includes("T")) {
      return date.split("T")[0];
    }
    // Si ya es formato AAAA-MM-DD, devolverla tal cual
    return date;
  }

  async toggleUserMovements(userId) {
    if (this.showMovementsModal && this.selectedUserId === userId) {
      // Si ya está abierto, cerrarlo
      this.showMovementsModal = false;
      this.selectedUserId = null;
      this.editingMovementId = null;
      this.deletingMovementId = null;
    } else {
      // Cargar movimientos del usuario y abrir modal
      this.selectedUserId = userId;
      this.showMovementsModal = true;
      this.editingMovementId = null;
      this.deletingMovementId = null;
      try {
        const response = await fetch(
          `http://localhost:3000/api/movements?userId=${userId}&userRole=admin`,
        );
        const movements = await response.json();
        this.userMovements[userId] = movements.map(m => ({
          ...m,
          amount: Number(m.amount)
        }));
      } catch (error) {
        console.error("Error al cargar movimientos:", error);
        store.addNotification("Error al cargar movimientos", "error");
      }
    }
    this.requestUpdate();
  }

  _startEdit(movementId) {
    this.editingMovementId = movementId;
    this.requestUpdate();
  }

  async _saveEditMovement(movementId) {
    const input = this.renderRoot.querySelector(`input[data-movement="${movementId}"]`);
    if (!input) return;

    const newConcept = input.value;
    try {
      const response = await fetch(
        `http://localhost:3000/api/movements/${movementId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            concept: newConcept,
            userRole: store.user.role,
            userId: store.user.id
          }),
        }
      );

      if (response.ok) {
        store.addNotification("Movimiento actualizado", "success");
        this.editingMovementId = null;
        // Recargar movimientos del usuario
        const userId = this.selectedUserId;
        const movResponse = await fetch(
          `http://localhost:3000/api/movements?userId=${userId}&userRole=admin`,
        );
        const movements = await movResponse.json();
        this.userMovements[userId] = movements.map(m => ({
          ...m,
          amount: Number(m.amount)
        }));
      } else {
        store.addNotification("Error al actualizar movimiento", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      store.addNotification("Error al actualizar movimiento", "error");
    }
    this.requestUpdate();
  }

  _startDelete(movementId) {
    this.deletingMovementId = movementId;
    this.requestUpdate();
  }

  async _confirmDelete(movementId) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/movements/${movementId}?userRole=${store.user.role}&userId=${store.user.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        store.addNotification("Movimiento eliminado", "success");
        this.deletingMovementId = null;
        // Recargar movimientos del usuario
        const userId = this.selectedUserId;
        const movResponse = await fetch(
          `http://localhost:3000/api/movements?userId=${userId}&userRole=admin`,
        );
        const movements = await movResponse.json();
        this.userMovements[userId] = movements.map(m => ({
          ...m,
          amount: Number(m.amount)
        }));
      } else {
        store.addNotification("Error al eliminar movimiento", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      store.addNotification("Error al eliminar movimiento", "error");
    }
    this.requestUpdate();
  }

  render() {
    const selectedUser = this.selectedUserId ? store.allUsers.find(u => u.id === this.selectedUserId) : null;
    
    return html`
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Rol Actual</th>
            <th>Cambiar Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${store.allUsers.map(u => html`
            <tr>
              <td>${u.id}</td>
              <td>${u.email}</td>
              <td>
                <span class="badge badge-${u.role}">
                  ${u.role.toUpperCase()}
                </span>
              </td>
              <td>
                <select @change="${(e) => this.handleRoleChange(u.id, e)}" .value="${this.selectedRoles[u.id] || u.role}">
                  <option value="admin">Admin</option>
                  <option value="user">Usuario Normal</option>
                  <option value="reader">Lector</option>
                </select>
                ${this.selectedRoles[u.id] && this.selectedRoles[u.id] !== u.role ? html`
                  <button @click="${() => this.handleRoleUpdate(u.id)}">Guardar</button>
                ` : html``}
              </td>
              <td>
                <button @click="${() => this.toggleUserMovements(u.id)}">Ver Movimientos</button>
              </td>
            </tr>
          `)}
        </tbody>
      </table>

      ${this.showMovementsModal && selectedUser && this.userMovements[this.selectedUserId] ? html`
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
          <div style="background-color: white; border-radius: 8px; padding: 25px; max-width: 900px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h3 style="margin: 0;">Movimientos de ${selectedUser.email}</h3>
              <button style="background-color: #6c757d; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;" @click="${() => (this.showMovementsModal = false, this.selectedUserId = null, this.requestUpdate())}">✕</button>
            </div>
            
            ${this.deletingMovementId ? html`
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <p>¿Está seguro de que desea eliminar este movimiento?</p>
                <button style="background-color: #dc3545; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;" 
                  @click="${() => this._confirmDelete(this.deletingMovementId)}">Eliminar</button>
                <button style="background-color: #6c757d; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer;" 
                  @click="${() => (this.deletingMovementId = null, this.requestUpdate())}">Cancelar</button>
              </div>
            ` : ""}
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Concepto</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Cantidad</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Tipo</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Fecha</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${this.userMovements[this.selectedUserId].map(m => html`
                  <tr style="border: 1px solid #ddd;">
                    <td style="padding: 12px; border: 1px solid #ddd;">
                      ${this.editingMovementId === m.id
                        ? html`<input type="text" data-movement="${m.id}" .value="${m.concept}" />`
                        : m.concept}
                    </td>
                    <td style="padding: 12px; border: 1px solid #ddd; color: ${m.amount >= 0 ? 'green' : 'red'}; font-weight: bold;">
                      ${m.amount >= 0 ? '+' : ''}${m.amount.toFixed(2)}€
                    </td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${m.type}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${this._formatDate(m.date)}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">
                      ${this.editingMovementId === m.id
                        ? html`<button style="background-color: #28a745; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;" @click="${() => this._saveEditMovement(m.id)}">Guardar</button>`
                        : html`<button style="background-color: #007bff; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;" @click="${() => this._startEdit(m.id)}">Editar</button>`}
                      <button style="background-color: #dc3545; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;" @click="${() => this._startDelete(m.id)}">Borrar</button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      ` : ""}
    `;
  }
}
customElements.define('admin-panel', AdminPanel);