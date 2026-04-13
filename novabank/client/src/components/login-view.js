import { LitElement, html, css } from 'lit';
import { store } from '../store.js';

export class LoginView extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 350px;
      margin: 100px auto;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      background: white;
      font-family: sans-serif;
    }

    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 25px;
    }

    input {
      display: block;
      width: 100%;
      margin-bottom: 15px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-sizing: border-box;
      font-size: 16px;
    }

    button {
      width: 100%;
      padding: 12px;
      background: #006efd;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.3s;
    }

    button:hover {
      background: #0056b3;
    }

    .footer-links {
      margin-top: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }

    .link {
      color: #006efd;
      cursor: pointer;
      font-weight: bold;
      text-decoration: none;
    }

    .link:hover {
      text-decoration: underline;
    }
  `;

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
      alert('Credenciales incorrectas o error de conexión');
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