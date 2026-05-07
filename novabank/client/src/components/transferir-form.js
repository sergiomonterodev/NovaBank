import { LitElement, html } from "lit";
import { store } from "../store.js";
import { transferirFormStyles } from "../styles/transferir-form.styles.js";

export class TransferirForm extends LitElement {
  static styles = transferirFormStyles;

  static properties = {
    _transferType: { state: true },
    _selectedDays: { state: true },
    _currentMonth: { state: true },
  };

  constructor() {
    super();
    this._transferType = "normal";
    this._selectedDays = [];
    this._currentMonth = new Date();
  }

  // ── Opciones de zona horaria UTC ─────────────────────────────────────────
  _timezoneOptions() {
    const opts = [];
    for (let i = -12; i <= 14; i++) {
      const label = i >= 0 ? `UTC+${i}` : `UTC${i}`;
      opts.push(html`<option value="${i}">${label}</option>`);
    }
    return opts;
  }

  // ── Calendario inline ────────────────────────────────────────────────────
  _renderCalendar() {
    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    const monthLabel = new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(this._currentMonth);

    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // lunes=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(html`<div class="calendar-day empty"></div>`);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const selected = this._selectedDays.includes(dateStr);
      cells.push(html`
        <div
          class="calendar-day ${selected ? "selected" : ""}"
          @click=${() => this._toggleDay(dateStr)}
        >${d}</div>
      `);
    }

    return html`
      <div class="calendar">
        <div class="calendar-nav">
          <button type="button" @click=${this._prevMonth}>&#8249;</button>
          <span>${monthLabel}</span>
          <button type="button" @click=${this._nextMonth}>&#8250;</button>
        </div>
        <div class="calendar-weekdays">
          <span>L</span><span>M</span><span>X</span><span>J</span>
          <span>V</span><span>S</span><span>D</span>
        </div>
        <div class="calendar-grid">${cells}</div>
        ${this._selectedDays.length > 0
          ? html`<p class="selected-days-info">${this._selectedDays.length} día(s) seleccionado(s)</p>`
          : ""}
      </div>
    `;
  }

  _toggleDay(dateStr) {
    this._selectedDays = this._selectedDays.includes(dateStr)
      ? this._selectedDays.filter((d) => d !== dateStr)
      : [...this._selectedDays, dateStr];
  }

  _prevMonth() {
    const d = new Date(this._currentMonth);
    d.setMonth(d.getMonth() - 1);
    this._currentMonth = d;
  }

  _nextMonth() {
    const d = new Date(this._currentMonth);
    d.setMonth(d.getMonth() + 1);
    this._currentMonth = d;
  }

  // ── Sección extra según tipo ─────────────────────────────────────────────
  _renderScheduleSection() {
    switch (this._transferType) {
      case "hora":
        return html`
          <div class="schedule-section">
            <label>Zona horaria</label>
            <select name="timezone">${this._timezoneOptions()}</select>
            <label>Hora de ejecución (0 – 23 h)</label>
            <input
              type="number"
              name="scheduleHour"
              min="0"
              max="23"
              placeholder="ej: 14"
              required
            />
          </div>
        `;
      case "calendario":
        return html`
          <div class="schedule-section">${this._renderCalendar()}</div>
        `;
      case "periodicidad":
        return html`
          <div class="schedule-section">
            <label>Repetir cada</label>
            <div class="periodicidad-row">
              <input
                type="number"
                name="periodicidad"
                min="1"
                placeholder="ej: 2"
                required
              />
              <select name="periodicidadUnit">
                <option value="dias">Días</option>
                <option value="semanas">Semanas</option>
                <option value="meses">Meses</option>
              </select>
            </div>
          </div>
        `;
      default:
        return "";
    }
  }

  // ── Render principal ─────────────────────────────────────────────────────
  render() {
    const isCalendar = this._transferType === "calendario";
    return html`
      <form @submit=${this._handleSubmit} class="${isCalendar ? "form-grid" : ""}">
        <div class="form-fields">
          <div class="account-info">
            <p>
              <strong>Tu número de cuenta:</strong>
              ${store.user.accountNumber || "Cargando..."}
            </p>
          </div>

          <label>Tipo de transferencia</label>
          <select
            name="transferType"
            @change=${(e) => { this._transferType = e.target.value; }}
          >
            <option value="normal">Transferencia normal</option>
            <option value="hora">Por hora exacta</option>
            <option value="calendario">Por calendario</option>
            <option value="periodicidad">Periodicidad</option>
          </select>

          <input
            type="text"
            name="targetAccountNumber"
            placeholder="Número de cuenta destino (ej: ACC000001)"
            required
          />

          <input
            type="text"
            name="concept"
            placeholder="Concepto (ej: Pago servicios)"
            required
          />

          <input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            placeholder="Cantidad (ej: 50.00)"
            required
          />

          ${isCalendar ? "" : this._renderScheduleSection()}

          <button type="submit">
            ${this._transferType === "normal"
              ? "Realizar Transferencia"
              : "Programar Transferencia"}
          </button>
        </div>

        ${isCalendar
          ? html`<div class="form-calendar">${this._renderCalendar()}</div>`
          : ""}
      </form>
    `;
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async _handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const targetAccountNumber = formData.get("targetAccountNumber");
    const concept = formData.get("concept");
    const amount = parseFloat(formData.get("amount"));

    // Validaciones comunes
    if (targetAccountNumber === store.user.accountNumber) {
      store.addNotification("No puedes hacer una transferencia a tu propia cuenta", "error");
      return;
    }
    if (amount > store.user.balance) {
      store.addNotification(
        `No tienes suficiente saldo. Saldo disponible: ${store.user.balance.toFixed(2)}€`,
        "error"
      );
      return;
    }
    if (amount <= 0) {
      store.addNotification("La cantidad debe ser mayor a 0€", "error");
      return;
    }

    // ── Normal ──────────────────────────────────────────────────────────────
    if (this._transferType === "normal") {
      const nuevoMovimiento = {
        userId: store.user.id,
        concept,
        amount,
        date: new Date().toISOString().split("T")[0],
        targetAccountNumber,
      };
      const success = await store.addMovement(nuevoMovimiento);
      if (success) {
        this.dispatchEvent(new CustomEvent("movimiento-creado", { bubbles: true, composed: true }));
        e.target.reset();
        store.addNotification("Transferencia realizada correctamente", "success");
      } else {
        store.addNotification("No se pudo realizar la transferencia. Verifica los datos.", "error");
      }
      return;
    }

    // ── Por hora exacta ──────────────────────────────────────────────────────
    if (this._transferType === "hora") {
      const hour = formData.get("scheduleHour");
      const tz = Number(formData.get("timezone"));
      if (hour === null || hour === "") {
        store.addNotification("Introduce una hora de ejecución válida", "error");
        return;
      }
      const tzLabel = tz >= 0 ? `UTC+${tz}` : `UTC${tz}`;
      store.addNotification(
        `Transferencia programada a las ${hour}:00 h (${tzLabel}) todos los meses`,
        "success"
      );
      e.target.reset();
      this._transferType = "normal";
      return;
    }

    // ── Por calendario ──────────────────────────────────────────────────────
    if (this._transferType === "calendario") {
      if (this._selectedDays.length === 0) {
        store.addNotification("Selecciona al menos un día en el calendario", "error");
        return;
      }
      store.addNotification(
        `Transferencia programada para ${this._selectedDays.length} día(s) seleccionado(s)`,
        "success"
      );
      e.target.reset();
      this._selectedDays = [];
      this._transferType = "normal";
      return;
    }

    // ── Periodicidad ────────────────────────────────────────────────────────
    if (this._transferType === "periodicidad") {
      const n = formData.get("periodicidad");
      const unit = formData.get("periodicidadUnit");
      if (!n || Number(n) < 1) {
        store.addNotification("Introduce una periodicidad válida", "error");
        return;
      }
      store.addNotification(
        `Transferencia programada cada ${n} ${unit}`,
        "success"
      );
      e.target.reset();
      this._transferType = "normal";
    }
  }
}
customElements.define("transferir-form", TransferirForm);
