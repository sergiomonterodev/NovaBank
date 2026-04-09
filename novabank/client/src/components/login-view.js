import { LitElement, html, css } from 'lit';
import { store } from '../store.js';

export class LoginView extends LitElement {
  static styles = css`
    .login-box { border: 1px solid #ccc; padding: 2rem; border-radius: 8px; width: 300px; margin: 100px auto; }
    input { display: block; width: 100%; margin-bottom: 1rem; padding: 8px; box-sizing: border-box; }
    button { width: 100%; padding: 10px; background: #005fb8; color: white; border: none; cursor: pointer; }
  `;

  async _handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const pass = e.target.password.value;
    const success = await store.login(email, pass);
    if (!success) alert('Error al entrar');
  }

  render() {
    return html`
      <div class="login-box">
        <h2>NovaBank Login</h2>
        <form @submit=${this._handleLogin}>
          <input name="email" type="email" placeholder="email@nova.com" required>
          <input name="password" type="password" placeholder="password" required>
          <button type="submit">Entrar</button>
        </form>
      </div>
    `;
  }
}
customElements.define('login-view', LoginView);