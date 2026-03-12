/**
 * freemium.ts — lógica de trial y restricciones del plan gratuito
 *
 * Reglas:
 * - Días 0-31: acceso completo (trial implícito, sin registro)
 * - Día 32+, sin Pro: freemium restringido (máx 5 paradas, gate en cada apertura)
 * - Pro activo: sin restricciones
 */

import { isPro } from './session';

const INSTALL_DATE_KEY = 'mr-install-date';

export const TRIAL_DAYS      = 31;
export const FREE_STOP_LIMIT = 5;

/** Registra fecha de primera instalación (idempotente). */
export function initInstallDate(): number {
  const stored = localStorage.getItem(INSTALL_DATE_KEY);
  if (stored) return parseInt(stored, 10);
  const now = Date.now();
  localStorage.setItem(INSTALL_DATE_KEY, String(now));
  return now;
}

export function getInstallDate(): number {
  return parseInt(localStorage.getItem(INSTALL_DATE_KEY) ?? '0', 10) || Date.now();
}

export function getDaysUsed(): number {
  return Math.floor((Date.now() - getInstallDate()) / (1000 * 60 * 60 * 24));
}

export function getTrialDaysRemaining(): number {
  return Math.max(0, TRIAL_DAYS - getDaysUsed());
}

/** true si está en trial activo O tiene plan Pro */
export function hasFullAccess(): boolean {
  return isPro() || getDaysUsed() <= TRIAL_DAYS;
}

/** true si está en freemium restringido (día 32+ sin Pro) */
export function isFreemiumRestricted(): boolean {
  return !isPro() && getDaysUsed() > TRIAL_DAYS;
}

/** Límite de paradas activas (Infinity si tiene acceso completo) */
export function getStopLimit(): number {
  return hasFullAccess() ? Infinity : FREE_STOP_LIMIT;
}

/** Retorna objeto con estado legible para UI */
export function getFreemiumStatus(): {
  isPro: boolean;
  inTrial: boolean;
  isRestricted: boolean;
  daysUsed: number;
  daysRemaining: number;
  stopLimit: number;
} {
  const pro        = isPro();
  const daysUsed   = getDaysUsed();
  const inTrial    = daysUsed <= TRIAL_DAYS;
  return {
    isPro:        pro,
    inTrial:      pro || inTrial,
    isRestricted: !pro && !inTrial,
    daysUsed,
    daysRemaining: getTrialDaysRemaining(),
    stopLimit:    getStopLimit(),
  };
}
