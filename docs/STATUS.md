# STATUS.md — Mueve Reparto

**Fecha:** 2026-03-09
**Última revisión:** Claude Code (Sonnet 4.6)

---

## Resumen ejecutivo

La app está en producción en **https://mueverepartoencancun.onrender.com**.
P1 y P2 están completos. P3 (backend Rust) fue asignado a Jules pero **no se completó**.
P4 (geocodificación) es necesaria urgentemente para que el mapa funcione correctamente.

---

## Estado por módulo

### Frontend — Páginas

| Página | Estado | Notas |
|--------|--------|-------|
| `/` Splash | ✅ Completo | Animación + redirect `/home` |
| `/home` Dashboard | ✅ Completo | Progress ring, métricas IDB, próxima parada |
| `/pedidos` CRUD | ⚠️ Parcial | Funcional pero sin QR real ni geocodificación |
| `/reparto` Mapa | ⚠️ Parcial | Mapa OK, pero paradas sin coords no aparecen |
| `/enviar` Notificaciones | ✅ Completo | WhatsApp/Telegram/Copy |
| `/metricas` Métricas | ✅ Completo | Bar chart CSS, ROI, meta editable |

### Modos de captura en `/pedidos`

| Modo | Estado | Detalle |
|------|--------|---------|
| Texto | ✅ Funciona | Guarda dirección como texto plano — SIN lat/lng |
| Coords | ✅ Funciona | Lat/lng manual + GPS actual |
| Link | ✅ Funciona | Parsea URLs de Google Maps/Waze |
| QR | ❌ Placeholder | Muestra "Próximamente" — sin cámara, sin OCR |

### Problemas críticos actuales

| # | Problema | Impacto | Prioridad |
|---|---------|---------|-----------|
| 1 | **Paradas sin coords no aparecen en mapa** | 90% de paradas son texto → invisible en `/reparto` | 🔴 Alta |
| 2 | **QR no funciona** | Modo QR es una pantalla vacía | 🔴 Alta |
| 3 | **Sin validación de dirección** | Cualquier texto se guarda, sin verificar si es una dirección real | 🟡 Media |
| 4 | **Sin geocodificación** | Texto → coordenadas no existe; el mapa no puede mostrar paradas sin coords | 🔴 Alta |

---

## Lo que Jules hizo (análisis real)

### P3 Backend Rust — **NO completado**

Jules fue asignado para crear el backend Rust/Axum/PostgreSQL. Resultado:

| Archivo esperado | Estado real |
|-----------------|-------------|
| `backend/Cargo.toml` | ❌ No existe |
| `backend/src/main.rs` | ❌ No existe |
| `backend/src/db.rs` | ❌ No existe |
| `backend/src/models.rs` | ❌ No existe |
| `backend/src/middleware/device.rs` | ❌ No existe (directorio vacío) |
| `backend/src/routes/stops.rs` | ❌ No existe (directorio vacío) |
| `backend/src/routes/stats.rs` | ❌ No existe (directorio vacío) |
| `backend/migrations/001_initial.sql` | ✅ Existe (hecho por Claude, no Jules) |
| `backend/rust-toolchain.toml` | ✅ Existe (hecho por Claude) |
| `backend/.gitignore` | ✅ Existe (hecho por Claude) |

Jules **creó las carpetas vacías** (`backend/src/middleware/`, `backend/src/routes/`) pero no escribió ningún archivo `.rs`.

### Qué sí hizo Jules (otros branches, pre-rebrand)

Los branches de Jules en el repo son de trabajo anterior al rebrand delivery:
- `jules-speedy-inline-svgs` — Optimización de iconos SVG (transporte público)
- `jules-fix-route-calc-ui` — Fix UI calculadora de rutas (transporte público)
- `jules-fix-truncate-text-tests` — Tests de texto truncado
- `jules-refactor-transport-labels` — Etiquetas de transporte (legacy)
- `jules/documentation-validation-improvements` — Performance route-calculator, FavoritesStore tests, build fixes

Ninguno de estos aporta funcionalidad de delivery. Son parches al repo anterior.

### Lo que Jules ignoró

- El prompt completo en `docs/JULES_PROMPT_P3.md`
- El spec completo del backend (sección 2.2 al 2.10)
- Los criterios de aceptación de P3
- La instrucción de crear rama `jules/p3-backend-{id}`

---

## Roadmap actualizado

### P1 — Rebrand UI/UX ✅ Completado
### P2 — Limpieza legacy + docs ✅ Completado
### P2.5 — Deploy Render (0.0.0.0) ✅ Completado (fix más reciente)

### P3.1 — Geocodificación Nominatim ⚡ NUEVA PRIORIDAD INMEDIATA

**Antes que el backend**, el frontend necesita poder convertir texto → coordenadas.
Sin esto el mapa es inútil para el flujo real del repartidor.

**Entregables:**
- [ ] Integración Nominatim OSM en `/pedidos` (modo Texto)
- [ ] Al escribir una dirección y guardar → busca coordenadas automáticamente
- [ ] Rate limiting cliente: 1 req/seg (política Nominatim)
- [ ] Caché de búsquedas en IDB (`geocache` store)
- [ ] Fallback gracioso: guarda sin coords si Nominatim falla/timeout
- [ ] Mostrar indicador visual "Buscando ubicación..." mientras geocodifica

### P3.2 — QR + OCR Scanner ⚡ NUEVA PRIORIDAD INMEDIATA

El escáner QR debe hacer **dos cosas**:
1. **Leer QR**: Usando `jsQR` o `@zxing/library` — extrae URL, texto, etc.
2. **Leer texto (OCR)**: Usando `Tesseract.js` — captura de pantalla de WhatsApp/foto con dirección → extrae texto de dirección automáticamente

**Flujo completo esperado:**
1. Usuario abre modo QR/Texto
2. Cámara se activa
3. Si detecta QR → extrae datos → rellena campos
4. Si detecta texto → OCR → extrae dirección → rellena campo dirección
5. Los datos extraídos se pueden editar antes de guardar
6. Se intenta geocodificar la dirección extraída

**Datos que puede extraer de QR/imagen:**
- Dirección completa
- Nombre del cliente
- Teléfono
- Notas de entrega
- Ingreso/cobro

### P3.3 — Backend Rust ⏳ Pendiente (Jules no completó)

El spec completo está en `docs/JULES_PROMPT_P3.md`. Requiere:
- `backend/Cargo.toml` con dependencias Axum, sqlx, tokio
- `backend/src/main.rs` con router y CORS
- `backend/src/db.rs` con pool PostgreSQL
- `backend/src/models.rs` con structs
- `backend/src/middleware/device.rs` con extractor X-Device-Id
- `backend/src/routes/stops.rs` con CRUD endpoints
- `backend/src/routes/stats.rs` con stats endpoints
- Variables de entorno en Render: `DATABASE_URL`, `ALLOWED_ORIGINS`, `PORT`

### P4 — Validación de direcciones ⏳ Pendiente

Post-geocodificación, agregar:
- Verificación de que la dirección existe en Nominatim
- Sugerencias de autocompletar mientras el usuario escribe
- Corrección de errores tipográficos comunes en Cancún (SM = Supermanzana, etc.)

### P5 — Auth OTP + Monetización ⏳ Pendiente

Ver `docs/ROADMAP.md` para spec completo.

---

## Deuda técnica identificada

| Item | Descripción | Urgencia |
|------|-------------|---------|
| Link parser | El modo "Link" dice que extrae coordenadas de Google Maps/Waze pero el `getAddressValue()` solo guarda el URL como texto | 🟡 Media |
| Sin lat/lng en modo texto | Paradas de texto quedan sin coordenadas → no aparecen en mapa | 🔴 Alta |
| QR placeholder | El tab QR muestra "Próximamente" — genera confusión | 🔴 Alta |
| Drag-and-drop | El handle de drag existe visualmente pero no hay lógica de reordenamiento | 🟡 Media |
| Optimizador GPS | Nearest-neighbor funciona pero requiere que todas las paradas tengan coords | 🟡 Media |
| sw.js | Service Worker referenciado pero no verificado funcionamiento offline | 🟡 Media |

---

## Arquitectura objetivo (corto plazo)

```
[Usuario móvil en Cancún]
       │
       ▼
[Astro 5 SSR + Vanilla JS]  ← src/pages/*.astro
       │
       ├─► [IndexedDB]        ← offline-first, fuente de verdad local
       │       │
       │       └─► [syncQueue] ─► [API Rust P3.3] ─► [PostgreSQL]
       │
       ├─► [Nominatim OSM]    ← geocodificación P3.1 (texto → coords)
       │
       ├─► [Leaflet Map]      ← todas las paradas con coords aparecen aquí
       │
       └─► [Cámara Web]       ← P3.2 QR + OCR (jsQR + Tesseract.js)
```

---

## Archivos clave para próximas tareas

| Archivo | Relevancia |
|---------|-----------|
| `src/pages/pedidos.astro` | QR scanner, geocodificación, modos de captura |
| `src/pages/reparto.astro` | Mapa Leaflet, marcadores de paradas |
| `src/lib/idb.ts` | Agregar store `geocache` para caché de Nominatim |
| `backend/src/` | Backend Rust (vacío, pendiente) |
| `docs/JULES_PROMPT_P3.md` | Spec completo del backend |
