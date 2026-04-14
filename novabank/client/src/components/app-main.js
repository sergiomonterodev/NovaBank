import { LitElement, html, css } from "lit";
import { store } from "../store.js";
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
  };

  static styles = css`
    :host {
      display: block;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    nav {
      display: flex;
      gap: 10px;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    button {
      padding: 10px 20px;
      cursor: pointer;
      border: none;
      background: #f0f0f0;
      border-radius: 5px;
    }
    button[active] {
      background: #005fb8;
      color: white;
    }
    .content {
      padding: 20px;
      border: 1px solid #eee;
      border-radius: 8px;
    }
  `;

  constructor() {
    super();
    this.activeTab = "resumen";

    // Suscripción al store
    store.subscribe(() => {
      if (
        !store.user.isLoggedIn ||
        (this.activeTab === "admin" && store.user.role !== "admin")
      ) {
        this.activeTab = "resumen";
      }
      this.requestUpdate();
    });

    // Llamada inicial
    store.fetchMovements();
  }

  render() {
    if (!store.user.isLoggedIn) {
      return this.isRegistering
        ? html`<register-view
            @go-to-login=${() => (this.isRegistering = false)}
          ></register-view>`
        : html`<login-view
            @go-to-register=${() => (this.isRegistering = true)}
          ></login-view>`;
    }

    return html`
      <notification-system></notification-system>
      <header>
        <div
          style="display: flex; justify-content: space-between; align-items: center;"
        >
          <h1>NovaBank 🏦</h1>
          <button @click=${() => store.logout()}>Cerrar Sesión</button>
        </div>
        <nav>
          <button
            ?active=${this.activeTab === "resumen"}
            @click=${() => (this.activeTab = "resumen")}
          >
            Resumen
          </button>
          <button
            ?active=${this.activeTab === "movimientos"}
            @click=${() => (this.activeTab = "movimientos")}
          >
            Movimientos
          </button>
          <button
            ?active=${this.activeTab === "transferir"}
            @click=${() => (this.activeTab = "transferir")}
          >
            Transferir
          </button>

          ${store.user.role === "admin"
            ? html`<button
                ?active=${this.activeTab === "admin"}
                @click=${() => (this.activeTab = "admin")}
              >
                Admin
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
        return html`
          <h2>Estado de cuenta</h2>
          <div style="text-align: center;">
            <p>
              Saldo Total:
              <b
                style="font-size: 1.5em; color: ${store.getSaldoTotal() >= 0
                  ? "green"
                  : "red"}"
              >
                ${store.getSaldoTotal().toFixed(2)}€
              </b>
            </p>
          </div>

          <resumen-grafico></resumen-grafico>

          <div style="margin-top: 20px; font-size: 0.9em; color: #666;">
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
          <h2>Nueva Transferencia / Gasto</h2>
          <transferir-form
            @movimiento-creado=${() => {
              this.activeTab = "resumen";
              this.requestUpdate();
            }}
          ></transferir-form>
        `;
      case "admin":
        return html`
          <h2>Panel de Administración</h2>
          <p>Bienvenido, administrador. Aquí puedes gestionar la plataforma.</p>
          <admin-panel></admin-panel>
        `;
      default:
        return html`<p>Selecciona una opción</p>`;
    }
  }
}

customElements.define("app-main", AppMain);
