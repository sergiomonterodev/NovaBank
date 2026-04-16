import { LitElement, html } from "lit";
import { store } from "../store.js";
import { appMainStyles } from "../styles/app-main.styles.js";
import "./movimientos-table.js";
import "./transferir-form.js";
import "./login-view.js";
import "./register-view.js";
import "./resumen-grafico.js";
import "./admin-panel.js";
import "./notification-system.js";

export class AppMain extends LitElement {
  static properties = {
    activeTab: { type: String },
    isRegistering: { type: Boolean },
    balance: { type: Number },
  };

  static styles = appMainStyles;

  constructor() {
    super();
    // Si es admin, comenzar en admin, si no en resumen
    this.activeTab = store.user.role === "admin" ? "admin" : "resumen";
    this.balance = store.user.balance;

    // Suscripción al store
    store.subscribe(() => {
      // Actualizar el balance reactivo
      this.balance = store.user.balance;

      // Si no está logueado, ir a login
      if (!store.user.isLoggedIn) {
        this.activeTab = "resumen";
      }
      this.requestUpdate();
    });

    // Llamada inicial
    store.fetchMovements();
  }

  render() {
    if (!store.user.isLoggedIn) {
      return html`
        <notification-system></notification-system>
        ${this.isRegistering
          ? html`<register-view
              @go-to-login=${() => (this.isRegistering = false)}
            ></register-view>`
          : html`<login-view
              @go-to-register=${() => (this.isRegistering = true)}
            ></login-view>`}
      `;
    }

    return html`
      <notification-system></notification-system>
      <header>
        <div>
          <h1>NovaBank 🏦</h1>
          <button @click=${() => store.logout()}>Cerrar Sesión</button>
        </div>
        <nav>
          ${store.user.role === "admin"
            ? html`<button
                ?active=${this.activeTab === "admin"}
                @click=${() => (this.activeTab = "admin")}
              >
                Mi Resumen
              </button>`
            : html`<button
                ?active=${this.activeTab === "resumen"}
                @click=${() => (this.activeTab = "resumen")}
              >
                Resumen
              </button>`}
          <button
            ?active=${this.activeTab === "movimientos"}
            @click=${() => (this.activeTab = "movimientos")}
          >
            Mis Movimientos
          </button>
          ${store.user.role !== "reader"
            ? html`<button
                ?active=${this.activeTab === "transferir"}
                @click=${() => (this.activeTab = "transferir")}
              >
                Transferencias
              </button>`
            : ""}
          ${store.user.role === "admin"
            ? html`<button
                ?active=${this.activeTab === "gestion"}
                @click=${() => (this.activeTab = "gestion")}
              >
                Gestión de Usuarios
              </button>`
            : ""}
        </nav>
      </header>

      <main class="content">${this._renderTab()}</main>
    `;
  }

  _renderTab() {
    switch (this.activeTab) {
      case "resumen":
      case "admin":
        return html`
          <h2>
            ${this.activeTab === "admin" ? "Mi Resumen" : "Estado de cuenta"}
          </h2>
          <div class="balance-container">
            <p>
              Saldo Total:
              <b
                class="balance-value ${this.balance >= 0
                  ? "balance-positive"
                  : "balance-negative"}"
              >
                ${this.balance.toFixed(2)}€
              </b>
            </p>
          </div>

          <resumen-grafico></resumen-grafico>

          <div class="last-update">
            Última actualización: ${new Date().toLocaleTimeString()}
          </div>
        `;
      case "movimientos":
        return html`
          <h2>Historial de Movimientos</h2>
          <movimientos-table></movimientos-table>
        `;
      case "transferir":
        return html`
          <h2>Realizar Transferencia</h2>
          <transferir-form
            @movimiento-creado=${() => {
              this.activeTab = "resumen";
              this.requestUpdate();
            }}
          ></transferir-form>
        `;
      case "gestion":
        return html`
          <h2>Gestión de Usuarios</h2>
          <admin-panel></admin-panel>
        `;
      default:
        return html`<p>Selecciona una opción</p>`;
    }
  }
}

customElements.define("app-main", AppMain);
