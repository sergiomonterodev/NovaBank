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
  `;

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

  render() {
    return html`
      <h3>Gestión de Usuarios</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${store.allUsers.map(u => html`
            <tr>
              <td>${u.id}</td>
              <td>${u.email}</td>
              <td>
                <span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">
                  ${u.role.toUpperCase()}
                </span>
              </td>
              <td>
                <button class="btn-edit">Editar</button>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }
}
customElements.define('admin-panel', AdminPanel);