import { LitElement, html } from 'lit';
import { store } from '../store.js';
import { loginViewStyles } from '../styles/login-view.styles.js';

export class LoginView extends LitElement {
  static styles = loginViewStyles;

  render() {
    return html`
      <h2>NovaBank Login</h2>
      <form @submit=${this._handleLogin}>
        <input type="email" name="email" placeholder="Correo electrónico" required>
        <input type="password" name="password" placeholder="Contraseña" required>
        <button type="submit">Entrar</button>
      </form>

      <div class="footer-links">
        ¿No tienes cuenta? 
        <span class="link" @click=${this._emitRegister}>Regístrate aquí</span>
      </div>
    `;
  }

  async _handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const success = await store.login(email, password);
    
    if (!success) {
      store.addNotification('Credenciales incorrectas o error de conexión', 'error');
    } else {
      store.addNotification('Sesión iniciada correctamente', 'success');
    }
    // Si tiene éxito, el Store notificará y app-main cambiará la vista solo
  }

  _emitRegister() {
    // Lanzamos el evento para que app-main cambie la variable isRegistering a true
    this.dispatchEvent(new CustomEvent('go-to-register', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('login-view', LoginView);