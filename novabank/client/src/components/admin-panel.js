import { LitElement, html } from 'lit';
import { store } from '../store.js';
import { adminPanelStyles } from '../styles/admin-panel.styles.js';

export class AdminPanel extends LitElement {
  static styles = adminPanelStyles;

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