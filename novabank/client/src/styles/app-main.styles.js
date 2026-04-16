import { css } from 'lit';

export const appMainStyles = css`
  :host {
    display: block;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  nav {
    display: flex;
    gap: 20px;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
    margin-top: 20px;
    margin-bottom: 20px;
  }

  nav button {
    padding: 10px 20px;
    cursor: pointer;
    border: none;
    background: #f0f0f0;
    border-radius: 5px;
  }

  nav button[active] {
    background: #005fb8;
    color: white;
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

  header {
    margin-bottom: 20px;
  }

  header div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  header h1 {
    margin: 0;
  }

  header > div > button {
    background: #dc3545;
    color: white;
  }

  header > div > button:hover {
    background: #c82333;
  }

  .balance-container {
    text-align: center;
  }

  .balance-value {
    font-size: 1.5em;
    font-weight: bold;
  }

  .balance-positive {
    color: green;
  }

  .balance-negative {
    color: red;
  }

  .last-update {
    margin-top: 20px;
    font-size: 0.9em;
    color: #666;
  }
`;
