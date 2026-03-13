import re

with open('docs/STATUS.md', 'r') as f:
    content = f.read()

# Fix the appended string to be part of a proper section
# It currently has \n strings at the end instead of actual newlines.
content = content.replace('\\n- Se ha completado la migración estructural del Frontend: Tailwind y React han sido reemplazados por Lit Web Components nativos y CSS puro en alineación con ADR-2026-001.\\n- Librerías pesadas (jsQR, tesseract.js) son cargadas vía CDN perezosamente para mejorar drásticamente el peso inicial de la aplicación.\n', '')

new_section = """
## Actualizaciones Arquitectónicas (13/03/2026)
- Se ha completado la migración estructural del Frontend: Tailwind y React han sido reemplazados por Lit Web Components nativos y CSS puro en alineación con **ADR-2026-001** y la filosofía `diógenes.dev.style`.
- Las librerías pesadas (`jsQR`, `tesseract.js`) ahora son cargadas vía CDN perezosamente (Lazy Loading) únicamente cuando el usuario activa las funciones de escaneo, mejorando drásticamente el peso inicial de la aplicación.
- Se optimizaron las promesas y llamadas asíncronas para cumplir con las normativas CSP (Content Security Policy) y se previnieron fugas de memoria con `worker.terminate()` y `URL.revokeObjectURL()`.
"""

content = content + "\n" + new_section

with open('docs/STATUS.md', 'w') as f:
    f.write(content)
