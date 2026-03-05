# Mueve Reparto

> "Tu ruta. Tu tiempo. Tu ingreso."

Aplicacion PWA para repartidores independientes de paqueteria (Mercado Libre, Amazon, paqueterias, pedidos de apps y e-commerce). Optimiza rutas de entrega en segundos usando algoritmos de clustering y TSP, comparte ubicacion en tiempo real por WhatsApp, y muestra metricas semanales de ingreso vs. costo de suscripcion.

---

## El Problema: 30 paradas, sin orden, sin tiempo

Un repartidor independiente recibe una lista de direcciones y tiene que descubrir el orden optimo por su cuenta. Cada minuto perdido es ingreso perdido. Mueve Reparto resuelve eso en el dispositivo, sin internet, en menos de un segundo.

---

## Caracteristicas Principales

- **Optimizacion de ruta en cliente** — K-Means clustering + Nearest Neighbor + 2-opt directamente en el navegador. Sin backend, sin latencia de red.
- **Multiples metodos de captura de paradas** — texto libre (geocodificacion local), link de Google Maps/Waze/OSM, GPS actual, importacion masiva linea por linea.
- **Mapa interactivo** — Leaflet.js + OpenStreetMap con marcador de posicion del repartidor actualizado en tiempo real via `watchPosition`.
- **Notificaciones por WhatsApp y Telegram** — mensaje preformateado con direccion y link de tracking por parada, con un toque.
- **Metricas semanales** — pedidos, promedio diario, ingreso estimado ($13/pedido) y calculo de ROI vs. costo de suscripcion ($70/semana).
- **Meta semanal** — barra de progreso con meta configurable guardada en localStorage.
- **PWA offline-first** — Service Worker existente; funciona sin conexion una vez instalada.
- **Dark/Light mode** — hereda el sistema de tokens CSS del proyecto base.

---

## Stack Tecnico

| Capa | Tecnologia |
|---|---|
| Framework | Astro 4 (SSG + View Transitions) |
| Lenguaje | TypeScript (client-side islands) |
| Mapa | Leaflet 1.9.4 (CDN lazy-load) + OpenStreetMap |
| Algoritmo | K-Means + Nearest Neighbor + 2-opt (TSP heuristico) |
| Distancias | Formula de Haversine |
| Estado | `sessionStorage` (`mr_stops`) + `localStorage` (metas) |
| Estilos | CSS custom properties (tokens compartidos) |
| PWA | Service Worker offline-first |

---

## Arquitectura de Paginas

```
/          — Splash screen con animacion de carga
/home      — Dashboard: progreso del dia, metricas rapidas, proximas paradas
/pedidos   — Gestion de paradas: agregar, filtrar, cambiar estado
/reparto   — Mapa + optimizacion de ruta + "siguiente parada"
/enviar    — Notificaciones WhatsApp/Telegram por parada
/metricas  — Estadisticas semanales, grafica de barras, ROI, meta
```

---

## Algoritmo de Optimizacion

```
optimizeNexus(stops, origin):
  1. K-Means clustering  (k = ceil(n/8), max 4 clusters)
  2. Ordenar clusters por distancia al origen (Haversine)
  3. Por cada cluster:
       a. Nearest Neighbor greedy desde el ultimo punto visitado
       b. 2-opt mejora (max 100 iteraciones)
  4. Concatenar clusters → ruta final ordenada
  5. Calcular distancia total (km) y tiempo estimado (min)
```

La combinacion de clustering + NN + 2-opt produce rutas dentro del 5-15% del optimo en < 50 ms para n <= 50 paradas.

---

## Captura de Paradas

El modal de nueva parada soporta 4 modos:

| Modo | Descripcion |
|---|---|
| Texto | Direccion libre; geocodificacion local con patrones de Cancun (SM, MZ, etc.) |
| Link | Parseo de URLs: Google Maps `@lat,lng`, `?q=`, `ll=`, Waze, OSM `#map=`, geo: URI |
| GPS | `navigator.geolocation.getCurrentPosition` con fallback a coordenadas demo |
| Masivo | Importacion de multiples paradas (una por linea) con deteccion automatica de links |

---

## Modelo de Negocio

- **Trial**: 30 dias gratis al instalar
- **Suscripcion**: $70 MXN/semana
- **Break-even**: 1 pedido extra por dia (~$13 ingreso adicional) cubre el costo
- **ROI tipico escenario +15%**: > 200% sobre el costo de la app

---

## Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm run dev

# Build de produccion
pnpm run build
```

---

## Estado de Paradas

| Estado | Color | Descripcion |
|---|---|---|
| `pending` | Gris | Sin iniciar |
| `in_route` | Teal | En camino actualmente |
| `delivered` | Verde | Entregado con exito |
| `failed` | Rojo | Intento fallido |

---

## Creditos

**Julian Alexander Juarez Alvarado**
_Lead Architect & Full Stack Data Engineer_

> "La eficiencia no es un lujo tecnico, es un imperativo moral."
