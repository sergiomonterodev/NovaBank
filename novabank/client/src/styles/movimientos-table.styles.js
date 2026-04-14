import { css } from 'lit';

export const movimientosTableStyles = css`
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  th,
  td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
  }

  th {
    background-color: #f4f4f4;
  }

  .income {
    color: green;
    font-weight: bold;
  }

  .expense {
    color: red;
    font-weight: bold;
  }

  button {
    cursor: pointer;
    padding: 5px 10px;
    margin-right: 5px;
  }

  .btn-edit {
    background: #006efd;
    color: white;
    border: none;
    border-radius: 3px;
  }

  .btn-delete {
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 3px;
  }

  .modal-overlay {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    text-align: center;
  }

  .modal-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    justify-content: center;
  }

  .btn-confirm {
    background: #dc3545;
    color: white;
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-cancel {
    background: #6c757d;
    color: white;
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
`;
