import re

with open('src/pages/pedidos.astro', 'r') as f:
    content = f.read()

content = content.replace("function scanFrame() {", "async function scanFrame() {")
content = content.replace("requestAnimationFrame(scanFrame)", "requestAnimationFrame(() => scanFrame())")

with open('src/pages/pedidos.astro', 'w') as f:
    f.write(content)
