import { LitElement, html } from 'lit';
import { store } from '../store.js';
import { notificationSystemStyles } from '../styles/notification-system.styles.js';

export class NotificationSystem extends LitElement {
  static styles = notificationSystemStyles;

  constructor() {
    super();
    this.removingIds = new Set();
    this._unsubscribe = store.subscribe(() => {
      this.requestUpdate();
    });
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  removeNotification(id) {
    this.removingIds.add(id);
    this.requestUpdate();
    setTimeout(() => {
      store.removeNotification(id);
      this.removingIds.delete(id);
    }, 300);
  }

  render() {
    return html`
      ${store.notifications.map(notif => html`
        <div class="notification ${notif.type} ${this.removingIds.has(notif.id) ? 'removing' : ''}">
          <span class="icon">${this.getIcon(notif.type)}</span>
          <span class="message">${notif.message}</span>
          <button class="close-btn" @click="${() => this.removeNotification(notif.id)}">×</button>
        </div>
      `)}
    `;
  }
}

customElements.define('notification-system', NotificationSystem);
