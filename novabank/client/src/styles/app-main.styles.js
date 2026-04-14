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
