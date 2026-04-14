import { css } from 'lit';

export const adminPanelStyles = css`
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  th, td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
  }

  th {
    background-color: #f4f4f4;
    color: #333;
  }

  .badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    font-weight: bold;
  }

  .badge-admin {
    background: #ffe3e3;
    color: #d32f2f;
  }

  .badge-user {
    background: #e3f2fd;
    color: #1976d2;
  }

  .badge-reader {
    background: #f3e5f5;
    color: #7b1fa2;
  }

  select {
    cursor: pointer;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-size: 0.9em;
    background-color: white;
  }

  button {
    cursor: pointer;
    padding: 5px 10px;
    margin-left: 5px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 3px;
    font-size: 0.85em;
  }

  button:hover {
    background: #218838;
  }
`;
