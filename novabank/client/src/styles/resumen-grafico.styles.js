import { css } from 'lit';

export const resumenGraficoStyles = css`
  :host {
    display: block;
    max-width: 500px;
    margin: 20px auto;
  }

  canvas {
    width: 100% !important;
    height: 300px !important;
    display: block;
  }
`;
