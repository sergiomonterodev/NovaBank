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

  button[type='submit'] {
    background: #005fb8;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }

  button[type='submit']:hover {
    background: #004a94;
  }

  label {
    font-size: 0.9em;
    color: #555;
    margin-bottom: -8px;
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

  /* ── Grid form + calendario ─────────────────── */
  form.form-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 24px;
    align-items: start;
    max-width: 720px;
  }

  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .form-calendar {
    min-width: 270px;
    max-width: 300px;
    background: #f7f9fc;
    border: 1px solid #d0dce8;
    border-radius: 12px;
    padding: 20px 18px;
    box-shadow: 0 2px 10px rgba(0, 95, 184, 0.08);
    margin-left: 40px;
    margin-top: 60px;
    align-self: start;
  }

  /* ── Sección de programación ─────────────────── */
  .schedule-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #f7f9fc;
    border: 1px solid #d0dce8;
    border-radius: 8px;
    padding: 14px;
  }

  /* Periodicidad */
  .periodicidad-row {
    display: flex;
    gap: 10px;
  }

  .periodicidad-row input,
  .periodicidad-row select {
    flex: 1;
  }

  /* ── Calendario ──────────────────────────────── */
  .calendar {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .calendar-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .calendar-nav button {
    background: none;
    border: 1px solid #ccc;
    color: #333;
    font-size: 1.2em;
    padding: 3px 10px;
    cursor: pointer;
    border-radius: 4px;
    line-height: 1.4;
  }

  .calendar-nav button:hover {
    background: #e8f0fc;
    border-color: #005fb8;
  }

  .calendar-nav span {
    font-weight: bold;
    text-transform: capitalize;
    font-size: 0.95em;
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 0.78em;
    color: #888;
    font-weight: bold;
    margin-top: 4px;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .calendar-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.82em;
    cursor: pointer;
    border: 1px solid transparent;
    user-select: none;
    transition: background 0.15s, border-color 0.15s;
  }

  .calendar-day:hover:not(.empty) {
    background: #d6e8ff;
    border-color: #005fb8;
  }

  .calendar-day.selected {
    background: #005fb8;
    color: white;
    border-color: #005fb8;
  }

  .calendar-day.empty {
    cursor: default;
  }

  .selected-days-info {
    font-size: 0.83em;
    color: #005fb8;
    margin: 2px 0 0;
    font-weight: bold;
  }
`;
