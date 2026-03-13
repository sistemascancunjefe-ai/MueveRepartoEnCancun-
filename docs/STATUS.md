# STATUS.md — Mueve Reparto

**Fecha:** 2026-03-12
**Última revisión:** Jules Agent — Phase 7 UX Refinement

---

## Resumen ejecutivo

La app ha completado la **Fase 7: Mejoras de UX**. Se han eliminado redundancias críticas, se ha unificado el flujo de onboarding con la captura de identidad del repartidor, y se ha creado una página de Perfil dedicada. La deuda técnica de duplicación en `/pedidos` ha sido saldada.

---

## Estado real por módulo

### Frontend — Páginas activas

| Página | Estado | Notas |
|--------|--------|-------|
| `/home` Dashboard | ✅ Optimizado | Grid de acciones fixed (5 cols), tooltips activos |
| `/pedidos` CRUD | ✅ Refactorizado | Sin duplicaciones, validación de límites freemium, OCR/QR unificado |
| `/reparto` Mapa | ✅ Mejorado | Swipe-to-complete, bottom sheet de confirmación |
| `/perfil` Perfil | ✅ Nuevo | Editor de nombre restaurado, links de comunidad |
| `/nosotros` | ✅ Integrado | Accesible desde perfil, filosofía actualizada |
| `/auth` Login | ✅ Operativo | Magic Link (Email) implementado |

### Backend Rust (mueve-reparto-api)
- ✅ `POST /auth/magic-link` y `GET /auth/verify` operativos.
- ✅ CRUD de paradas sincronizado con IDB.

---

## Mejoras de UX (Fase 7)

1. **Onboarding Guiado**: Primera ejecución solicita el nombre y explica las 3 herramientas clave (OCR, Optimización, Notificación).
2. **Sistema de Tooltips**: Durante los primeros 7 días, globos informativos guían al usuario en acciones complejas.
3. **Gestos Táctiles**: Swipe a la derecha en la lista de ruta para completar paradas (natural en móvil).
4. **Modo Conducción Enfocado**: Interfaz simplificada con botones gigantes y contraste nocturno.
5. **Navegación Cohesiva**: 6 slots claros en BottomNav (Inicio, Paradas, Ruta, Avisar, Gasolina, Perfil).

---

## Deuda técnica remanente

| Item | Descripción | Urgencia |
|------|-------------|---------|
| Conekta Checkout | `/suscripcion` sigue siendo placeholder | 🟠 Alta |
| Drag-and-drop | Reordenamiento manual visual | 🟡 Media |
| SQLx offline | Facilitar desarrollo local sin DB activa | 🟡 Media |
