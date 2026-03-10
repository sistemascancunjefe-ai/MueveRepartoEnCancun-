# Arquitectura — Mueve Reparto

## Visión general

Mueve Reparto es una PWA offline-first construida sobre Astro 5 SSR. El principio guía es **simplicidad operativa**: el repartidor debe poder usar la app con una mano, en movimiento, con internet inestable.

---

## Capas de la arquitectura

```
┌─────────────────────────────────────────┐
│            USUARIO MÓVIL                │
│         (Android gama media)            │
└──────────────────┬──────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────┐
│         ASTRO SSR (Render)              │
│   Node.js Web Service                   │
│                                         │
│  src/pages/       ← rutas y páginas     │
│  src/components/  ← UI reutilizable     │
│  src/layouts/     ← estructura global   │
│  src/lib/idb.ts   ← abstracción IDB     │
│  src/lib/sync.ts  ← syncQueue → API     │
└──────────────────┬──────────────────────┘
                   │ IndexedDB API
┌──────────────────▼──────────────────────┐
│         INDEXEDDB (cliente)             │
│  stops · syncQueue · trackingLog        │
│  dailyStats · geocache                  │
└──────────────────┬──────────────────────┘
                   │ REST (X-Device-Id / JWT Bearer)
┌──────────────────▼──────────────────────┐
│      BACKEND RUST + POSTGRESQL          │
│  Axum Web Service (Render)              │
│                                         │
│  /stops    ← CRUD + paywall (plan check)│
│  /stats    ← métricas diarias           │
│  /auth     ← OTP + JWT (P5)             │
│  /subscriptions ← Conekta (P5.2 ⏳)    │
│  /teams    ← equipos (P6 ⏳)            │
└──────────────────┬──────────────────────┘
                   │ pg
┌──────────────────▼──────────────────────┐
│         POSTGRESQL (Render)             │
│  devices · stops · daily_stats          │
│  users · otp_attempts · subscriptions   │
└─────────────────────────────────────────┘

Servicios externos:
  ├─ Nominatim OSM  ← geocodificación (con caché IDB)
  ├─ jsQR           ← QR scanner en cámara
  ├─ Tesseract.js   ← OCR de imágenes de pedidos
  ├─ Leaflet + OSM  ← mapa interactivo en /reparto
  └─ Twilio         ← SMS para OTP (credenciales prod)
```

---

## Módulos clave

### `src/lib/idb.ts`
IndexedDB helper tipado. Único punto de acceso a persistencia local.

**Stores (v2):**
- `stops` — paradas del día del repartidor
- `syncQueue` — cola de cambios pendientes de sincronizar con backend
- `trackingLog` — historial de puntos GPS durante reparto activo
- `dailyStats` — métricas agregadas por día (completadas, ganancias)
- `geocache` — caché de búsquedas Nominatim para uso offline

**API pública:**
```typescript
getStops(): Promise<Stop[]>
getNextStop(): Promise<Stop | undefined>
getTodayStats(): Promise<DailyStats>
completeStop(id: string): Promise<void>
geocodeAddress(query: string): Promise<{lat, lng} | null>
generateId(): string
put<T>(store, value): Promise<void>
getAll<T>(store): Promise<T[]>
dbPutMany<T>(store, items): Promise<void>
```

### `src/lib/sync.ts`
Sincronización IDB → backend. Se activa al recuperar conexión (`window.online`).
- Envía `syncQueue` pendiente al backend via `PATCH /stops/:id` y `POST /stats`
- Headers: `X-Device-Id` para identificar dispositivo

### `src/layouts/MainLayout.astro`
Layout global con:
- Header dark con nombre del repartidor (editable, guardado en IDB)
- Indicador GPS (activo/inactivo)
- Badge de plan (Free / Pro) desde `localStorage.getItem('mr-plan')`
- `<BottomNav>` — navegación inferior de 4 tabs

### `src/components/BottomNav.astro`
Barra de navegación inferior con 4 tabs:
1. Inicio (`/home`)
2. Paradas (`/pedidos`)
3. Ruta (`/reparto`)
4. Métricas (`/metricas`)

### `src/components/InteractiveMap.astro`
Mapa Leaflet con dark tiles de OpenStreetMap. Cargado dinámicamente para evitar errores de SSR.

### `backend/src/`
Backend Rust con Axum. Estructura:
```
backend/src/
├── main.rs          ← AppState { pool, jwt_secret }, rutas registradas
├── state.rs         ← AppState + JwtSecret (FromRef para extracción sin copia)
├── routes/
│   ├── stops.rs     ← CRUD paradas + paywall 402
│   ├── stats.rs     ← GET/POST daily_stats
│   ├── auth.rs      ← send-otp, verify-otp, me
│   └── mod.rs
└── middleware/
    └── auth.rs      ← extractor AuthUser (JWT Bearer)
```

---

## Decisiones de diseño

| Decisión | Razón |
|----------|-------|
| Astro + Vanilla JS | Sin overhead de framework; < 50KB bundle |
| Leaflet + OSM | Sin costos de token; gratuito a escala |
| Nearest-neighbor (no Dijkstra) | Suficiente para 10-30 paradas/día; O(n²) aceptable |
| SSR (no SSG) | Permite API endpoints y auth OTP activa |
| IndexedDB (no localStorage) | Capacidad mayor, estructurado, preparado para sync |
| Dark mode obligatorio | Batería + legibilidad en exteriores |
| Rust + Axum (backend) | Performance, seguridad de tipos, bajo footprint en Render |
| X-Device-Id (sync) | Permite sync sin login obligatorio en plan Free |
| JWT localStorage (auth) | Stateless backend, sin sesiones server-side |

---

## Flujo de datos — Parada completada

```
Usuario toca "Completar" en /pedidos
        │
        ▼
completeStop(id)  ←  src/lib/idb.ts
        │
        ├─→ stops: stop.completed = true, completedAt = Date.now()
        ├─→ dailyStats: completedStops++
        └─→ syncQueue: { action: 'COMPLETE', stopId, timestamp }
                                    │
                                    └─ sync.ts (window.online) → PATCH /stops/:id → PostgreSQL
```

## Flujo de datos — Auth OTP

```
Usuario introduce teléfono en /auth
        │
        ▼
POST /auth/send-otp → Twilio SMS → código 6 dígitos
        │
        ▼
Usuario introduce código → POST /auth/verify-otp
        │
        ▼
JWT 72h → localStorage('mr-auth-token')
plan   → localStorage('mr-plan')   ← 'free' | 'pro'
```

---

## Performance objetivo

| Métrica | Objetivo |
|---------|---------|
| Bundle JS gzipped | < 50KB |
| LCP en 3G | < 1.5s |
| Lighthouse PWA | 100 |
| Tiempo de arranque offline | < 500ms |
