import { LitElement, html, css } from "lit";
import { store } from "../store.js";

export class RegisterView extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 300px;
      margin: 50px auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    input {
      display: block;
      width: 100%;
      margin-bottom: 10px;
      padding: 8px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 10px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .link {
      display: block;
      margin-top: 10px;
      text-align: center;
      color: #007bff;
      cursor: pointer;
      text-decoration: underline;
    }
  `;

  constructor() {
    super();
  }

  render() {
    return html`
      <h2>Crear Cuenta</h2>
      <form @submit=${this._handleRegister}>
        <input type="email" name="email" placeholder="Email" required />
        
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          required
        />
        
        <input
          type="password"
          name="confirmPassword"
          placeholder="Repetir contraseña"
          required
        />

        <button type="submit">Registrarse</button>
      </form>
      
      <span
        class="link"
        @click=${() => this.dispatchEvent(new CustomEvent("go-to-login"))}
      >
        ¿Ya tienes cuenta? Inicia sesión
      </span>
    `;
  }

  async _handleRegister(e) {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (password !== confirmPassword) {
      store.addNotification("Las contraseñas no coinciden", "warning");
      return;
    }

    const result = await store.register(email, password);

    if (result.success) {
      store.addNotification("¡Cuenta creada! Ahora puedes iniciar sesión.", "success");
      setTimeout(() => {
        this.dispatchEvent(new CustomEvent("go-to-login"));
      }, 1500);
    } else {
      store.addNotification(result.message, "error");
    }
  }
}
customElements.define("register-view", RegisterView);