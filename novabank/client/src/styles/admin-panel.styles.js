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

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background-color: white;
    border-radius: 8px;
    padding: 25px;
    max-width: 900px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .modal-header h3 {
    margin: 0;
  }

  .modal-close-btn {
    background-color: #6c757d;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }

  .modal-close-btn:hover {
    background-color: #5a6268;
  }

  .delete-warning {
    background-color: #fff3cd;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 15px;
  }

  .modal-table {
    width: 100%;
    border-collapse: collapse;
  }

  .modal-table thead {
    background-color: #f0f0f0;
  }

  .modal-table th {
    padding: 12px;
    text-align: left;
    border: 1px solid #ddd;
  }

  .modal-table td {
    padding: 12px;
    border: 1px solid #ddd;
  }

  .modal-table .amount {
    font-weight: bold;
  }

  .modal-table .amount.positive {
    color: green;
  }

  .modal-table .amount.negative {
    color: red;
  }

  .modal-actions button {
    padding: 6px 12px;
    margin-right: 5px;
    font-size: 0.85em;
  }

  .btn-save {
    background-color: #28a745;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-save:hover {
    background-color: #218838;
  }

  .btn-edit {
    background-color: #007bff;
    color: white;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 5px;
  }

  .btn-edit:hover {
    background-color: #0056b3;
  }

  .btn-delete {
    background-color: #dc3545;
    color: white;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-delete:hover {
    background-color: #c82333;
  }

  .delete-confirm-btn {
    background-color: #dc3545;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;
  }

  .delete-confirm-btn:hover {
    background-color: #c82333;
  }

  .delete-cancel-btn {
    background-color: #6c757d;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .delete-cancel-btn:hover {
    background-color: #5a6268;
  }
`;
