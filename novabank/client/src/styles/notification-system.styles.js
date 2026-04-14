import { css } from 'lit';

export const notificationSystemStyles = css`
  :host {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    pointer-events: none;
  }

  .notification {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    margin-bottom: 10px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
    max-width: 400px;
  }

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  .notification.removing {
    animation: slideOut 0.3s ease-in;
  }

  .notification.success {
    background: #d4edda;
    color: #155724;
    border-left: 4px solid #28a745;
  }

  .notification.error {
    background: #f8d7da;
    color: #721c24;
    border-left: 4px solid #dc3545;
  }

  .notification.warning {
    background: #fff3cd;
    color: #856404;
    border-left: 4px solid #ffc107;
  }

  .notification.info {
    background: #d1ecf1;
    color: #0c5460;
    border-left: 4px solid #17a2b8;
  }

  .icon {
    font-size: 1.2em;
    flex-shrink: 0;
  }

  .message {
    flex: 1;
    font-size: 0.95em;
    word-wrap: break-word;
  }

  .close-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 1.2em;
    padding: 0;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .close-btn:hover {
    opacity: 1;
  }
`;
