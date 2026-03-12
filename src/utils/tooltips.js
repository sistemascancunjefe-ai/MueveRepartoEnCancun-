export function setupTooltips() {
  const INSTALL_KEY = 'mr-install-date';
  const TOOLTIP_SEEN_KEY = 'mr-tooltips-seen';

  const installDate = parseInt(localStorage.getItem(INSTALL_KEY), 10);
  if (!installDate) return;

  const daysUsed = Math.floor((Date.now() - installDate) / 86400000);
  // Solo mostrar la primera semana (7 días)
  if (daysUsed > 7) return;

  const seenTooltips = JSON.parse(localStorage.getItem(TOOLTIP_SEEN_KEY) || '{}');

  const elements = document.querySelectorAll('[data-tooltip]');
  elements.forEach(el => {
    const tooltipId = el.getAttribute('data-tooltip-id') || el.getAttribute('data-tooltip');
    if (seenTooltips[tooltipId]) {
      el.classList.add('tooltip-seen');
      return;
    }

    // Activar tooltip con un pequeño delay para llamar la atención
    setTimeout(() => {
      if (!seenTooltips[tooltipId]) {
        el.classList.add('tooltip-active');
      }
    }, 1500);

    // Al interactuar, marcar como visto
    const markSeen = () => {
      el.classList.remove('tooltip-active');
      el.classList.add('tooltip-seen');
      seenTooltips[tooltipId] = true;
      localStorage.setItem(TOOLTIP_SEEN_KEY, JSON.stringify(seenTooltips));
      el.removeEventListener('click', markSeen);
      el.removeEventListener('mouseenter', markSeen);
    };

    el.addEventListener('click', markSeen);
    el.addEventListener('mouseenter', markSeen);
  });
}
