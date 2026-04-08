import { LitElement, html, css } from "lit";
import { store } from "../store.js";
import "./movimientos-table.js";

export class AppMain extends LitElement {
  static properties = {
    activeTab: { type: String },
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
      this.requestUpdate();
    });

    // Llamada inicial
    store.fetchMovements();
  }

  render() {
    return html`
      <header>
        <h1>NovaBank 🏦</h1>
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
        </nav>
      </header>

      <main class="content">${this._renderTab()}</main>
    `;
  }

  _renderTab() {
    switch (this.activeTab) {
      case "resumen":
        return html`
          <h2>Resumen General</h2>
          <p>Saldo Actual: <strong>${store.getSaldoTotal()}€</strong></p>
        `;
      case "movimientos":
        return html`
          <h2>Historial de Movimientos</h2>
          <movimientos-table></movimientos-table>
        `;
      case "transferir":
        return html`<h2>Nuevo Movimiento</h2>`;
      default:
        return html`<p>Selecciona una opción</p>`;
    }
  }
}

customElements.define("app-main", AppMain);
