# Roadmap — Mueve Reparto

**Última actualización:** 2026-03-10
**Fuente de verdad:** este archivo. Ver `docs/STATUS.md` para estado detallado del código.

---

## Resumen de etapas

| Stage | Descripción | Estado |
|-------|-------------|--------|
| P1 | Rebrand + UI/UX dark (6 páginas delivery) | ✅ Completo |
| P2 | Limpieza legacy + documentación | ✅ Completo |
| P2.5 | Deploy Render (bind 0.0.0.0) | ✅ Completo |
| P3.1 | Geocodificación Nominatim + caché IDB | ✅ Completo |
| P3.2 | QR Scanner (jsQR) + OCR (Tesseract.js) | ✅ Completo |
| P3.3 | Backend Rust/Axum + PostgreSQL en Render | ✅ Completo |
| P4 | Autocompletar de direcciones (Nominatim dropdown) | ✅ Completo |
| P5 | Auth OTP (SMS/Twilio) + JWT + Plan Free/Pro | ✅ Completo |
| P5.2 | Pagos Conekta (Free → Pro upgrade) | 🔴 Pendiente inmediato |
| P6 | Modo Empresa — múltiples repartidores | 🟡 Planificado |
| P7 | Integraciones externas (WhatsApp API, CSV import) | 🟢 Backlog |
| P8 | Analytics + BI para jefes de reparto | 🟢 Backlog |

---

## P1 — Rebrand + UI/UX Completo ✅

**Estado:** Completado (PR #1 mergeado)

### Tareas completadas
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

### Tareas completadas
- [x] Eliminar páginas de transporte: `/wallet`, `/mapa`, `/community`, `/contribuir`, `/rutas`, `/ruta/[id]`, `/tracking`, `/about`
- [x] `README.md` reescrito para Mueve Reparto
- [x] `AGENTS.md` — contexto para agentes de IA
- [x] `DEPLOY.md` — instrucciones de despliegue actualizadas
- [x] `SECURITY.md` — política de seguridad real
- [x] `.env.example` — limpio, sin referencias a transporte
- [x] `public/robots.txt` — configurado correctamente
- [x] `docs/ARCHITECTURE.md` — arquitectura de delivery
- [x] Workflows de GitHub Actions actualizados
- [x] Docs obsoletos de transporte eliminados

---

## P2.5 — Deploy Render ✅

**Estado:** Completado

### Tareas completadas
- [x] `render.yaml` — configuración de frontend (Node.js Web Service)
- [x] Astro SSR con `@astrojs/node` adaptador standalone
- [x] Bind `0.0.0.0` para compatibilidad Render
- [x] URL producción: https://mueverepartoencancun.onrender.com

---

## P3.1 — Geocodificación Nominatim ✅

**Estado:** Completado
**Objetivo:** Capturar paradas por texto (dirección) y obtener coordenadas automáticamente

### Tareas completadas
- [x] Integración con API pública de Nominatim (OpenStreetMap)
- [x] Función `geocodeAddress()` en `src/lib/idb.ts` con caché IDB (`geocache` store)
- [x] Rate limiting del lado cliente (máx 1 req/segundo, política de Nominatim)
- [x] Fallback: captura manual de coordenadas si Nominatim no responde

### Criterios de aceptación ✅
- El repartidor escribe "Av. Tulum 123, Cancún" y obtiene coordenadas en < 2 segundos
- Las búsquedas se cachean para uso offline posterior
- No se excede el rate limit de Nominatim (1 req/s)

---

## P3.2 — QR Scanner + OCR ✅

**Estado:** Completado
**Objetivo:** Capturar paradas escaneando código QR o fotografiando texto de pedidos

### Tareas completadas
- [x] QR scanner con `jsQR` (cámara real en móvil)
- [x] OCR con `Tesseract.js` para extraer texto de imágenes de pedidos
- [x] Panel de captura integrado en `/pedidos`
- [x] Guard de concurrencia con `ocrRunId` para evitar race conditions

---

## P3.3 — Backend Rust/Axum + PostgreSQL ✅

**Estado:** Completado
**Objetivo:** Sincronización de paradas entre dispositivos del mismo repartidor

### Tareas completadas
- [x] API REST en Rust (Axum framework) — `backend/`
- [x] PostgreSQL en Render (managed database)
- [x] Migración `001_initial.sql` — tablas `devices`, `stops`, `daily_stats`
- [x] Endpoints CRUD: `GET /stops`, `POST /stops`, `PATCH /stops/:id`, `DELETE /stops/:id`
- [x] Endpoint bulk: `POST /stops/sync`
- [x] Estadísticas: `GET /stats`, `POST /stats`
- [x] Health check: `GET /health`
- [x] Sync automático al recuperar conexión (`window.online` event) via `src/lib/sync.ts`
- [x] Autenticación por `X-Device-Id` header
- [x] `docs/BACKEND_API.md` — documentación completa de la API

### Criterios de aceptación ✅
- El repartidor puede ver sus paradas en dos dispositivos distintos
- Las paradas completadas en un dispositivo se sincronizan al otro en < 5 segundos con internet
- La app funciona 100% offline si el backend no está disponible (IDB como fuente de verdad)

---

## P4 — Autocompletar de Direcciones ✅

**Estado:** Completado (bug de duplicación Jules corregido)
**Objetivo:** Dropdown de sugerencias al escribir una dirección

### Tareas completadas
- [x] Dropdown de autocompletar Nominatim en `/pedidos`
- [x] Debounce de 400ms para no saturar Nominatim
- [x] Selección de sugerencia guarda lat/lng en la parada
- [x] Corrección de `geocodeAddress` duplicada inline (Jules bug)

---

## P5 — Auth OTP + Plan Free/Pro 🟡

**Estado:** Parcial — migración SQL + UI listas; backend OTP/JWT y Render env vars PENDIENTES
**Objetivo:** Identificación del repartidor + límite de paradas por plan

### Tareas
- [x] Migración `002_auth.sql` — tablas `users`, `otp_attempts`, `subscriptions`
- [ ] `backend/src/routes/auth.rs` — `POST /auth/send-otp`, `POST /auth/verify-otp`, `GET /auth/me` (implementación real pendiente)
- [ ] `backend/src/middleware/auth.rs` — extractor `AuthUser` para rutas protegidas (pendiente)
- [ ] Rate limiting OTP: 3 intentos/hora por teléfono (pendiente)
- [ ] JWT de 72 horas con claims `sub` (user_id), `phone`, `plan` (actualmente 30 días)
- [x] `src/pages/auth.astro` — formulario teléfono → OTP 6 dígitos → JWT localStorage
- [x] `src/pages/suscripcion.astro` — comparativa Free/Pro con CTA
- [x] Paywall frontend en `/pedidos`: límite 20 paradas/día en plan Free (requiere 402 en backend)
- [x] Badge de plan en `MainLayout.astro` (Free / Pro)
- [ ] Variables de entorno `JWT_SECRET`, `TWILIO_*` en `render.yaml` (no definidas aún)

### Criterios de aceptación ✅
- El repartidor se registra con número de teléfono en < 60 segundos
- El OTP llega en < 30 segundos (requiere credenciales Twilio reales en producción)
- Plan Free: máx 20 paradas/día (paywall 402 en backend)
- Plan Pro: paradas ilimitadas

### Deuda técnica P5
- 🔴 Conekta no integrado — `/suscripcion` tiene placeholder de pago (ver P5.2)
- 🟡 Twilio no configurado en producción — requiere credenciales reales en Render

---

## P5.2 — Pagos Conekta 🔴 PENDIENTE INMEDIATO

**Estado:** Pendiente — genera ingresos reales
**Objetivo:** Activar el flujo de pago Free → Pro con Conekta (tarjeta + OXXO Pay)

### Tareas pendientes
- [ ] Backend: `POST /subscriptions/checkout` — crear orden en Conekta API v2, devolver `checkout_url`
- [ ] Backend: `POST /subscriptions/webhook` — verificar firma HMAC, actualizar `users.plan = 'pro'`
- [ ] Backend: añadir deps `hmac = "0.12"`, `base64 = "0.22"` en `Cargo.toml`
- [ ] Frontend: `suscripcion.astro` — `handleUpgrade()` llama `/subscriptions/checkout`, redirige a Conekta
- [ ] Frontend: manejo de retorno `?success=1` → actualizar `mr-plan` localStorage + renovar JWT
- [ ] Variables de entorno: `CONEKTA_PRIVATE_KEY`, `CONEKTA_WEBHOOK_SECRET`, `PUBLIC_CONEKTA_PUBLIC_KEY`, `PUBLIC_URL`
- [ ] `render.yaml` actualizado con nuevas vars

### Criterios de aceptación
- [ ] Usuario free puede iniciar pago con tarjeta desde `/suscripcion`
- [ ] Al completar pago, plan se actualiza automáticamente a Pro
- [ ] Badge del header cambia de "Free" a "Pro" sin reiniciar sesión
- [ ] Paywall de 20 paradas desaparece al activar Pro
- [ ] Webhook de Conekta verificado con HMAC antes de actualizar plan

**Prompt detallado:** `docs/prompts/CLAUDE_P5_2_CONEKTA.md`

---

## P6 — Modo Empresa / Múltiples Repartidores 🟡

**Estado:** Planificado
**Prerequisito:** P5.2 completado
**Objetivo:** Pequeños negocios de Cancún (ferreterías, farmacias) gestionan 2–5 repartidores

### Tareas pendientes
- [ ] Migración `003_teams.sql` — tablas `teams`, `team_members`; columna `assigned_to` en `stops`
- [ ] Backend: `POST /teams`, `GET /teams/me`, `POST /teams/join`, `GET /teams/:id/stops`, `PATCH /stops/:id/assign`
- [ ] Frontend: nueva página `src/pages/equipo.astro` — panel jefe con mapa en tiempo real
- [ ] Frontend: `pedidos.astro` — selector "Asignar a:" para owners
- [ ] Frontend: `BottomNav.astro` — tab "Equipo" si `mr-team-id` en localStorage
- [ ] Frontend: `suscripcion.astro` — nuevos planes Pro Equipo 3 ($199/mes) y Pro Equipo 10 ($399/mes)

### Nuevos planes de precios
| Plan | Repartidores | Precio/mes |
|------|-------------|------------|
| Free | 1 | Gratis (20 paradas/día) |
| Pro Individual | 1 | $99 MXN |
| Pro Equipo 3 | hasta 3 | $199 MXN |
| Pro Equipo 10 | hasta 10 | $399 MXN |

### Criterios de aceptación
- [ ] Owner puede crear equipo y obtener código de invitación
- [ ] Repartidor puede unirse con código (por WhatsApp)
- [ ] Owner ve mapa con GPS en tiempo real de cada repartidor activo
- [ ] Owner puede crear y asignar paradas a repartidores específicos
- [ ] Repartidor solo ve sus paradas asignadas
- [ ] Límite de miembros se valida al intentar unirse

**Prompt detallado:** `docs/prompts/CLAUDE_P6_EQUIPOS.md`

---

## P7 — Integraciones Externas 🟢

**Estado:** Backlog
**Prerequisito:** P6 completado

### P7.1 — WhatsApp Business API (Twilio) automático

**Objetivo:** Envío automático de confirmación al completar parada (sin copiar/pegar)

- [ ] Webhook backend: al marcar parada "completada" → `POST /notifications/whatsapp`
- [ ] Plantilla Meta aprobada: "Hola {nombre}, tu pedido fue entregado en {dirección}. ✅"
- [ ] Config en `/enviar`: habilitar/deshabilitar envío automático
- [ ] Variables: `TWILIO_WHATSAPP_FROM` en `render.yaml`

### P7.2 — Import CSV (Shopify / WooCommerce)

**Objetivo:** Import masivo de pedidos desde CSV — elimina captura manual

- [ ] Nueva página `src/pages/importar.astro`
- [ ] Parser CSV con columnas: nombre, teléfono, dirección, monto
- [ ] Previsualización antes de confirmar import
- [ ] Geocodificación batch con Nominatim (respetando rate limit 1 req/s)
- [ ] Backend: `POST /integrations/shopify` — webhook para crear paradas automáticamente

### P7.3 — Recibos PDF simples

- [ ] Al completar parada con cobro: generar recibo PDF
- [ ] Envío automático al cliente por WhatsApp o email

---

## P8 — Analytics + BI 🟢

**Estado:** Backlog
**Prerequisito:** P6 completado

### Funcionalidades
- [ ] Dashboard `/metricas` ampliado con mapa de calor de zonas de Cancún
- [ ] Horas pico: ¿cuándo se completan más paradas?
- [ ] Comparativa semana a semana: "Esta semana: +15% vs. semana pasada"
- [ ] Alertas: "Llevas 3 días sin registrar paradas" → notificación push
- [ ] Exportar CSV/Excel por rango de fechas
- [ ] Reporte PDF semanal/mensual
- [ ] Backend: `ALTER TABLE daily_stats ADD COLUMN avg_delivery_min FLOAT, zone_counts JSONB`

---

## Deuda técnica global

| Item | Descripción | Urgencia |
|------|-------------|---------|
| Conekta Checkout | `/suscripcion` tiene placeholder sin integración real | 🔴 Alta (P5.2) |
| Twilio producción | Configurar credenciales reales en Render | 🔴 Alta |
| Drag-and-drop | Handle visual sin lógica de reordenamiento real | 🟡 Media |
| Link parser | Modo "Link" guarda URL completo, no extrae coords | 🟡 Media |
| SQLx offline | Backend no compila con `query!` sin DB activa | 🟡 Media |
| Service Worker | Funcionalidad offline no verificada completamente | 🟡 Media |

---

## Prioridad de ejecución recomendada

```
P5.2 (Conekta) → P6 (Equipos) → P7.1 (WhatsApp auto) → P7.2 (CSV import) → P8 (Analytics)
```

**Criterio:** P5.2 genera ingresos inmediatos → P6 expande el mercado → P7 aumenta retención → P8 diferencia del competidor.
