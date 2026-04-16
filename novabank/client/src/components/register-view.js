import { LitElement, html } from "lit";
import { store } from "../store.js";
import { registerViewStyles } from "../styles/register-view.styles.js";

export class RegisterView extends LitElement {
  static styles = registerViewStyles;

  constructor() {
    super();
  }

  render() {
    return html`
      <h2>Crear Cuenta</h2>
      <form @submit=${(e) => this._handleRegister(e)}>
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

    const email = this.renderRoot.querySelector('input[name="email"]').value;
    const password = this.renderRoot.querySelector('input[name="password"]').value;
    const confirmPassword = this.renderRoot.querySelector('input[name="confirmPassword"]').value;

    // Validaciones de contraseña
    if (!password) {
      store.addNotification("La contraseña no puede estar vacía", "warning");
      return;
    }

    if (password.length < 6) {
      store.addNotification("La contraseña debe tener al menos 6 caracteres", "warning");
      return;
    }

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