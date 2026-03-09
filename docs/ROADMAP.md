# Roadmap — Mueve Reparto

**Última actualización:** 2026-03-09

---

## P1 — Rebrand + UI/UX Completo ✅

**Estado:** Completado (PR #1 mergeado)

### Entregables
- [x] Identidad visual dark: tokens `#00E8A2` / `#FF5A5F` / `#060A0E`
- [x] `favicon.svg`, `manifest.json`, `tailwind.config.js` rebranded
- [x] `MainLayout.astro` — header dark, modal nombre repartidor, indicador GPS
- [x] `BottomNav.astro` — 4 tabs (Inicio / Paradas / Ruta / Métricas)
- [x] `BrandAnimation.astro` — logo SVG Mueve Reparto
- [x] `/` — Splash con loader → redirect `/home`
- [x] `/home` — Dashboard con progress ring SVG + 3 métricas IDB + próxima parada
- [x] `/pedidos` — CRUD paradas con IDB, bottom sheet, 4 modos captura
- [x] `/reparto` — Mapa Leaflet dark + GPS watchPosition + optimizador nearest-neighbor
- [x] `/enviar` — 4 plantillas de mensaje, deep-link WhatsApp/Telegram
- [x] `/metricas` — Bar chart CSS puro 7 días, ROI, meta editable
- [x] `src/lib/idb.ts` — IndexedDB helper tipado completo

---

## P2 — Limpieza Legacy + Documentación ✅

**Estado:** Completado

### Entregables
- [x] Eliminar páginas de transporte: `/wallet`, `/mapa`, `/community`, `/contribuir`, `/rutas`, `/ruta/[id]`, `/tracking`, `/about`
- [x] `README.md` reescrito para Mueve Reparto
- [x] `CLAUDE.md` — contexto para Claude Code sessions
- [x] `AGENTS.md` — contexto para agentes de IA
- [x] `DEPLOY.md` — instrucciones de despliegue actualizadas
- [x] `SECURITY.md` — política de seguridad real
- [x] `.env.example` — limpio, sin referencias a transporte
- [x] `public/robots.txt` — configurado correctamente
- [x] `docs/ARCHITECTURE.md` — arquitectura de delivery
- [x] `docs/ROADMAP.md` — este archivo
- [x] Workflows de GitHub Actions actualizados
- [x] Docs obsoletos de transporte eliminados

---

## P3.1 — Geocodificación Nominatim OSM 🔴 URGENTE

**Estado:** Pendiente — BLOQUEANTE para el mapa
**Objetivo:** Paradas capturadas en modo Texto deben obtener lat/lng automáticamente

### Problema actual
Las paradas guardadas con texto libre no tienen coordenadas → no aparecen en el mapa de `/reparto`.
El optimizador nearest-neighbor también falla sin coords.

### Entregables
- [ ] Nominatim query al guardar parada: `https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1`
- [ ] Store `geocache` en IDB: `{ address: string, lat: number, lng: number, ts: number }`
- [ ] Rate limiting: máx 1 req/segundo (política Nominatim), debounce de 500ms
- [ ] UI: spinner "Buscando ubicación..." mientras geocodifica
- [ ] Fallback: guardar parada sin coords si Nominatim tarda > 3s o falla
- [ ] Intentar geocodificar paradas existentes sin coords cuando hay conexión

### Criterios de aceptación
- El repartidor escribe "Av. Tulum 123, Cancún" → la parada aparece en el mapa al abrir `/reparto`
- Las búsquedas se cachean en IDB para uso offline posterior
- Rate limit de Nominatim nunca se excede

---

## P3.2 — QR + OCR Scanner 🔴 URGENTE

**Estado:** Pendiente — Tab QR es placeholder vacío
**Objetivo:** Capturar paradas escaneando QR o fotografiando texto (WhatsApp screenshot, etc.)

### Problema actual
El tab "QR" en `/pedidos` muestra "Próximamente disponible" — no hace nada.

### Entregables
- [ ] **QR reader**: integrar `jsQR` (vanilla, sin dependencias pesadas)
  - Activar cámara trasera con `getUserMedia({ video: { facingMode: 'environment' }})`
  - Canvas + loop de animación para detección en tiempo real
  - Al detectar QR → parsear contenido → rellenar campos
- [ ] **OCR reader**: integrar `Tesseract.js` (lazy-load, ~2MB)
  - Botón "Foto de pedido" → toma foto o carga imagen
  - Procesar con Tesseract → extraer texto
  - Parser de texto → identificar: dirección, teléfono, nombre, notas, monto
- [ ] **Auto-relleno inteligente**: datos extraídos se colocan en campos editables
- [ ] **Post-captura**: intentar geocodificar la dirección extraída (Nominatim)

### Datos que se pueden extraer de un pedido de WhatsApp
```
📍 Dirección → campo address
👤 Nombre cliente → campo clientName
📞 Teléfono → campo clientPhone
📝 Notas de entrega → campo note
💰 Monto/cobro → campo income
```

### Criterios de aceptación
- El repartidor toma foto de un mensaje de WhatsApp con pedido → campos se rellenan automáticamente
- El repartidor escanea QR de etiqueta de paquete → dirección se extrae
- El proceso completo toma < 5 segundos en Android gama media

---

## P3.3 — Backend Rust + PostgreSQL ⏳

**Estado:** No completado (Jules fue asignado pero no entregó código)
**Objetivo:** Sincronización de paradas entre dispositivos del mismo repartidor

### Lo que falta (Jules no creó estos archivos)
- [ ] `backend/Cargo.toml`
- [ ] `backend/src/main.rs`
- [ ] `backend/src/db.rs`
- [ ] `backend/src/models.rs`
- [ ] `backend/src/middleware/device.rs`
- [ ] `backend/src/routes/stops.rs`
- [ ] `backend/src/routes/stats.rs`

### Lo que ya existe (pre-Jules por Claude)
- ✅ `backend/.gitignore`
- ✅ `backend/rust-toolchain.toml`
- ✅ `backend/migrations/001_initial.sql`
- ✅ `src/lib/sync.ts` (cliente sync IDB → API)

Ver spec completo en `docs/JULES_PROMPT_P3.md`.

### Criterios de aceptación
- El repartidor puede ver sus paradas en dos dispositivos distintos
- Las paradas completadas en un dispositivo se sincronizan al otro en < 5 segundos con internet
- La app funciona 100% offline si el backend no está disponible (IDB como fuente de verdad)

---

## P4 — Validación + Autocompletar de Direcciones ⏳

**Estado:** Pendiente (requiere P3.1 completado primero)
**Objetivo:** Sugerencias mientras el usuario escribe, verificación de que la dirección existe

### Entregables planificados
- [ ] Autocompletar: mientras el usuario escribe → Nominatim suggestions debounced
- [ ] Correcciones típicas de Cancún: "SM" → "Supermanzana", "MZ" → "Manzana", etc.
- [ ] Validación visual: ✅ verde si se encontró en mapa, ⚠️ amarillo si no se verificó

### Criterios de aceptación
- El repartidor escribe "Av. Tulum 1" y ve sugerencias en < 1.5 segundos
- Las sugerencias están limitadas a la zona de Cancún (`countrycodes=mx&bounded=1&viewbox=-87.3,21.0,-86.7,21.3`)

---

## P5 — Auth OTP + Monetización ⏳

**Estado:** Pendiente
**Objetivo:** Identificación del repartidor + plan de suscripción

### Entregables planificados
- [ ] Auth OTP por SMS/WhatsApp (sin contraseña)
- [ ] JWT session management (server-side, Astro middleware)
- [ ] Plan gratuito: máx 20 paradas/día
- [ ] Plan pro ($99 MXN/mes): paradas ilimitadas + historial 90 días + exportación
- [ ] Pasarela de pago: Conekta o Stripe (México)
- [ ] Panel de suscripción en app

### Criterios de aceptación
- El repartidor se registra con número de teléfono en < 60 segundos
- El OTP llega en < 30 segundos
- La suscripción pro se activa inmediatamente tras el pago
- Los datos del plan gratuito se conservan al actualizar a pro

---

## Backlog (sin prioridad asignada)

- Notificaciones push (Web Push API) para recordatorio de inicio de jornada
- Modo multi-ruta: dividir paradas del día en 2 tandas (mañana/tarde)
- Historial de rutas completadas con mapa de recorrido
- Widget Android para ver próxima parada desde pantalla de inicio
- Exportar métricas a PDF/Excel para declaración fiscal
- Versión en inglés (i18n) para repartidores angloparlantes en Cancún
