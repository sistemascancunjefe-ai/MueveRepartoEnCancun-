/**
 * notifications.ts — notificaciones locales vía Service Worker
 *
 * Notificaciones 100% locales (no requieren backend Push).
 * Disponibles con trial activo o plan Pro.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function canNotify(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

export async function notifyLocal(
  title: string,
  body: string,
  options: { url?: string; tag?: string; urgent?: boolean } = {},
): Promise<void> {
  if (!canNotify()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon:      '/icons/pwa-192x192.png',
      badge:     '/icons/pwa-192x192.png',
      tag:       options.tag ?? 'mr-route',
      renotify:  true,
      vibrate:   options.urgent ? [200, 100, 200] : [100],
      data:      { url: options.url ?? '/reparto' },
    });
  } catch {
    // Fallback: notificación DOM si SW no disponible
    try {
      new Notification(title, { body, icon: '/icons/pwa-192x192.png' });
    } catch { /* noop */ }
  }
}

/**
 * Estima minutos de viaje dado km de distancia en ciudad.
 * Velocidad urbana promedio Cancún ~18 km/h con tráfico.
 */
function estimateMinutes(distanceKm: number): number {
  return Math.round((distanceKm / 18) * 60);
}

/**
 * Lanza notificación "llegarás pronto" si la distancia es ≤ 2 km.
 * Llamar desde reparto.astro cuando GPS se acerca a la parada activa.
 */
export async function notifyNearby(stopAddress: string, distanceKm: number): Promise<void> {
  if (distanceKm > 2) return;
  const min = estimateMinutes(distanceKm);
  const timeText = min <= 1 ? 'menos de 1 minuto' : `~${min} minutos`;
  await notifyLocal(
    `¡Llegas en ${timeText}!`,
    `Avisa al cliente de: ${stopAddress}`,
    { url: '/enviar', tag: 'mr-nearby', urgent: true },
  );
}

/** Notifica al completar una parada. */
export async function notifyStopCompleted(
  stopAddress: string,
  remaining: number,
): Promise<void> {
  await notifyLocal(
    '✅ Entrega completada',
    remaining > 0
      ? `Quedan ${remaining} parada${remaining !== 1 ? 's' : ''}. ¡Sigue así!`
      : '¡Todas las entregas del día completadas! 🎉',
    { url: '/reparto', tag: 'mr-completed' },
  );
}

/** Notifica inicio de ruta. */
export async function notifyRouteStarted(totalStops: number): Promise<void> {
  await notifyLocal(
    '🚚 Ruta iniciada',
    `${totalStops} parada${totalStops !== 1 ? 's' : ''} en tu ruta de hoy.`,
    { url: '/reparto', tag: 'mr-route-start' },
  );
}
