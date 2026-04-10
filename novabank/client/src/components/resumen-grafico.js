import { LitElement, html, css } from 'lit';
import { store } from '../store.js';
import Chart from 'chart.js/auto'; // Importamos Chart.js

export class ResumenGrafico extends LitElement {
  static styles = css`
    :host { display: block; max-width: 500px; margin: 20px auto; }
    canvas { width: 100% !important; height: auto !important; }
  `;

  firstUpdated() {
    this._initChart();
    // Nos suscribimos para actualizar el gráfico si cambian los datos
    store.subscribe(() => this._updateChart());
  }

  _initChart() {
    const ctx = this.renderRoot.querySelector('#myChart').getContext('2d');
    const { ingresos, gastos } = this._getData();

    this.chart = new Chart(ctx, {
      type: 'doughnut', // Gráfico circular tipo dónut
      data: {
        labels: ['Ingresos', 'Gastos'],
        datasets: [{
          data: [ingresos, gastos],
          backgroundColor: ['#4caf50', '#f44336'],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  _getData() {
    // Calculamos totales filtrando por tipo
    const ingresos = store.movements
      .filter(m => m.type === 'income')
      .reduce((acc, m) => acc + m.amount, 0);
    
    const gastos = Math.abs(store.movements
      .filter(m => m.type === 'expense')
      .reduce((acc, m) => acc + m.amount, 0));

    return { ingresos, gastos };
  }

  _updateChart() {
    if (this.chart) {
      const { ingresos, gastos } = this._getData();
      this.chart.data.datasets[0].data = [ingresos, gastos];
      this.chart.update();
    }
  }

  render() {
    return html`<canvas id="myChart"></canvas>`;
  }
}
customElements.define('resumen-grafico', ResumenGrafico);