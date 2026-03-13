import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('m-button')
export class MButton extends LitElement {
  @property({ type: String }) variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';
  @property({ type: Boolean }) disabled: boolean = false;

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 44px;
      padding: 0.75rem 1.5rem;
      border-radius: var(--border-radius-lg, 0.75rem);
      border: 1px solid transparent;
      font-weight: 700;
      font-family: inherit;
      font-size: 1rem;
      line-height: 1.5;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      width: 100%;

      /* Fallback variables */
      --btn-bg: var(--primary, #3b82f6);
      --btn-text: white;
      --btn-hover-bg: var(--primary-hover, #2563eb);
      --btn-shadow: 0 4px 14px -2px rgba(59, 130, 246, 0.35);

      background-color: var(--btn-bg);
      color: var(--btn-text);
      box-shadow: var(--btn-shadow);
    }

    /* Variants */
    :host([variant="primary"]) button {
      --btn-bg: var(--primary, #3b82f6);
      --btn-text: white;
      --btn-hover-bg: var(--primary-hover, #2563eb);
      --btn-shadow: 0 4px 14px -2px rgba(59, 130, 246, 0.35);
    }

    :host([variant="secondary"]) button {
      --btn-bg: var(--bg-card, #1e293b);
      --btn-text: var(--text-main, #f8fafc);
      --btn-hover-bg: var(--border-color, #334155);
      --btn-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.35);
    }

    :host([variant="ghost"]) button {
      --btn-bg: transparent;
      --btn-text: var(--text-muted, #94a3b8);
      --btn-hover-bg: var(--bg-card, #1e293b);
      --btn-shadow: none;
    }

    :host([variant="danger"]) button {
      --btn-bg: var(--danger, #ef4444);
      --btn-text: white;
      --btn-hover-bg: var(--danger-hover, #dc2626);
      --btn-shadow: 0 4px 14px -2px rgba(239, 68, 68, 0.35);
    }

    /* States */
    button:hover:not(:disabled) {
      background-color: var(--btn-hover-bg);
      transform: translateY(-1px);
    }

    button:active:not(:disabled) {
      transform: scale(0.96);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
      filter: grayscale(1);
    }

    button:focus-visible {
      outline: 2px solid var(--btn-bg);
      outline-offset: 2px;
    }
  `;

  render() {
    return html`
      <button
        type="${this.type}"
        ?disabled="${this.disabled}"
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'm-button': MButton;
  }
}
