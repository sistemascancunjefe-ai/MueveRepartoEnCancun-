import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('m-card')
export class MCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .card {
      background-color: var(--bg-card, #1e293b);
      border-radius: var(--border-radius-lg, 0.75rem);
      border: 1px solid var(--border-color, #334155);
      padding: var(--space-4, 1rem);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;

  render() {
    return html`
      <div class="card">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'm-card': MCard;
  }
}
