/**
 * session.ts — única fuente de verdad para autenticación y plan.
 *
 * Usa localStorage (acceso síncrono necesario para isPro() en guards de UI).
 * Todas las páginas deben importar desde aquí — nunca leer/escribir
 * claves de sesión directamente.
 */

const KEYS = {
  TOKEN:  'mr-auth-token',
  PLAN:   'mr-plan',
  USER:   'mr-user-id',
  PHONE:  'mr-phone',
  NAME:   'mr-repartidor-name',
} as const;

export interface Session {
  token:  string;
  plan:   'free' | 'pro';
  userId: string;
  phone:  string;
}

export function getSession(): Session | null {
  const token = localStorage.getItem(KEYS.TOKEN);
  if (!token) return null;
  return {
    token,
    plan:   (localStorage.getItem(KEYS.PLAN) ?? 'free') as 'free' | 'pro',
    userId: localStorage.getItem(KEYS.USER) ?? '',
    phone:  localStorage.getItem(KEYS.PHONE) ?? '',
  };
}

export function saveSession(data: Session): void {
  localStorage.setItem(KEYS.TOKEN,  data.token);
  localStorage.setItem(KEYS.PLAN,   data.plan);
  localStorage.setItem(KEYS.USER,   data.userId);
  localStorage.setItem(KEYS.PHONE,  data.phone);
}

export function clearSession(): void {
  Object.values(KEYS).forEach(k => {
    // Conservar nombre del repartidor — no es sesión de auth
    if (k !== KEYS.NAME) localStorage.removeItem(k);
  });
}

/** Guard síncrono para UI — no async para no bloquear renders. */
export function isPro(): boolean {
  return localStorage.getItem(KEYS.PLAN) === 'pro';
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem(KEYS.TOKEN);
}

export function getPhone(): string {
  return localStorage.getItem(KEYS.PHONE) ?? '';
}

export function getPlan(): 'free' | 'pro' {
  return (localStorage.getItem(KEYS.PLAN) ?? 'free') as 'free' | 'pro';
}

export function getRepartidorName(): string {
  return localStorage.getItem(KEYS.NAME) ?? '';
}

export function setRepartidorName(name: string): void {
  localStorage.setItem(KEYS.NAME, name);
}
