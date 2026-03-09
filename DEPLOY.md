# DEPLOY.md — Instrucciones de Despliegue

**Mueve Reparto** es una aplicación SSR (Server-Side Rendering) con Astro + Node.js.
Se despliega como **Web Service** en Render (no como Static Site).

---

## Render — Configuración

| Campo | Valor |
|-------|-------|
| Service Type | **Web Service** |
| Branch | `main` |
| Build Command | `pnpm run build` |
| Start Command | `node ./dist/server/entry.mjs` |
| Node Version | `20.10.0` |

### Variables de entorno en Render

| Variable | Valor | Requerida |
|----------|-------|-----------|
| `NODE_VERSION` | `20.10.0` | Sí |

No hay otras variables de entorno requeridas para el MVP (P1/P2). Las fases P3-P5 requerirán variables adicionales para base de datos y autenticación.

---

## Build local

```bash
pnpm install
pnpm run build
# Salida en: ./dist/
```

### ¿Qué hace el build?

1. `pnpm optimize-json` — optimiza JSONs en `public/data/` (legacy, sin efecto activo)
2. `node scripts/build-wasm.mjs` — compila Rust → WASM (si `wasm-pack` disponible, o usa artefactos pre-compilados en `public/wasm/`)
3. `node scripts/check-wasm.cjs` — verifica que el binario WASM exista
4. `astro build` — genera `dist/` con servidor Node.js

---

## Preview local

```bash
pnpm build && pnpm preview
# Accesible en localhost:4321
```

---

## PWA (Progressive Web App)

La app es instalable como PWA en Android/iOS:
- **manifest.json** en `public/manifest.json`
- **Service Worker** en `public/sw.js`
- **favicon** en `public/favicon.svg`

Para probar la instalación:
1. Abrir la URL en Chrome/Edge mobile
2. Menú → "Agregar a pantalla de inicio"

---

## Troubleshooting

### "Publish directory does not exist"
Esto indica que Render está configurado como **Static Site**. Eliminar el servicio y crear un **Web Service** nuevo.

### Error en WASM build
Si `wasm-pack` no está disponible en el entorno de build, el script `build-wasm.mjs` usa los artefactos pre-compilados en `public/wasm/route-calculator/`. Verifica que esos archivos existan:
```bash
ls -la public/wasm/route-calculator/
# Debe mostrar route_calculator_bg.wasm y route_calculator.js
```

### Error de Node.js version
Render puede usar una versión de Node diferente. Asegúrate de que la variable de entorno `NODE_VERSION=20.10.0` esté configurada.

---

## Futuro (P3 — Backend)

En P3 se agregará un backend Rust/PostgreSQL. El despliegue cambiará a:
- **Web Service 1**: Astro frontend (este repo)
- **Web Service 2**: API Rust (repo separado)
- **PostgreSQL**: Base de datos Render (gestionada)

Las instrucciones de P3 estarán en `docs/BACKEND.md` cuando se implementen.
