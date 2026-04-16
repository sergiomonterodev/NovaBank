import { css } from 'lit';

export const transferirFormStyles = css`
  form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-width: 400px;
  }

  input,
  select,
  button {
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
  }

  button {
    background: #005fb8;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }

  label {
    font-size: 0.9em;
    color: #555;
  }

  .account-info {
    background: #f0f0f0;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 20px;
  }

  .account-info p {
    margin: 0;
  }

  .account-info strong {
    font-weight: bold;
  }
`;
