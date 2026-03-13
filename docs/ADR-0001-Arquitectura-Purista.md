# ADR 0001: Arquitectura Purista MueveReparto – diógenes.dev.style

## Encabezado y Metadatos

- **Título:** Arquitectura Purista MueveReparto – diógenes.dev.style
- **Autor:** Julian
- **Versión:** 1.0
- **Fecha:** 13/03/2026
- **Estado:** En uso / Iterativo
- **Normatividad aplicable:** ISO 9001, ADR estándar, BPMN

## 🎯 Objetivo y Alcance
Optimizar la aplicación de logística y reparto, enfocada en captura de paradas, optimización de rutas, notificaciones automáticas y análisis de productividad.
Mantener independencia tecnológica y evitar frameworks pesados.

## 🌐 Macroproceso
- **Captura de datos:** paradas y coordenadas.
- **Optimización:** motor Rust/WASM para rutas.
- **Orquestación:** Astro Islands.
- **Tipado:** TypeScript.
- **Estilos:** CSS purista + PostCSS/Houdini.
- **UI:** Web Components/Lit.
- **Persistencia:** IndexedDB.
- **Automatización:** CI/CD con pnpm + Render.

## 🔧 Stack Tecnológico

### Lenguajes:
- **Rust (25%)** – motor de rutas, cálculos intensivos.
- **TypeScript (25%)** – bindings WASM, lógica UI.
- **Astro (25%)** – SSR, Islands.
- **CSS/PostCSS/Houdini (15%)** – estilos accesibles, responsive.
- **Web Components/Lit (10%)** – UI ligera, interoperable.

### Frameworks/Librerías:
- **Astro** (presentación).
- **Lit** (UI declarativa).
- **PostCSS** (modularidad CSS).
- **CSS Houdini** (extensiones nativas).
- **IndexedDB** (persistencia).

### Integraciones externas:
- WhatsApp/Telegram para notificaciones.

## 📋 Procesos
- **Captura de paradas:** inputs en IndexedDB.
- **Optimización de ruta:** Rust/WASM con SpatialHash.
- **Notificación automática:** integración con WhatsApp/Telegram.
- **Análisis de productividad:** métricas en IndexedDB.
- **Automatización:** CI/CD con pnpm + Render.

## ⚠️ Controles y Riesgos
- **Sobrecarga WASM** → Circuit Breaker.
- **Accesibilidad** → WCAG + ARIA roles.
- **Persistencia fallida** → migración automática.
- **Notificaciones** → fallback en caso de fallo de red.

## 📈 KPIs
- Tiempo de cálculo < 100ms.
- Bundle reducido ≥ 30%.
- Lighthouse ≥ 90.
- Offline ≥ 95%.
- Notificaciones entregadas ≥ 99%.
