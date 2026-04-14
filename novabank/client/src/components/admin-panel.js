import { LitElement, html, css } from 'lit';
import { store } from '../store.js';

export class AdminPanel extends LitElement {
  static styles = css`
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
    th { background-color: #f4f4f4; color: #333; }
    .badge { 
      padding: 4px 8px; 
      border-radius: 4px; 
      font-size: 0.8em; 
      font-weight: bold; 
    }
    .badge-admin { background: #ffe3e3; color: #d32f2f; }
    .badge-user { background: #e3f2fd; color: #1976d2; }
    .badge-reader { background: #f3e5f5; color: #7b1fa2; }
    select {
      cursor: pointer;
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 0.9em;
      background-color: white;
    }
    button {
      cursor: pointer;
      padding: 5px 10px;
      margin-left: 5px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 3px;
      font-size: 0.85em;
    }
    button:hover {
      background: #218838;
    }
  `;

  constructor() {
    super();
    this.selectedRoles = {};
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

  render() {
    return html`
      <h3>Gestión de Usuarios</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Rol Actual</th>
            <th>Cambiar Rol</th>
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
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }
}
customElements.define('admin-panel', AdminPanel);