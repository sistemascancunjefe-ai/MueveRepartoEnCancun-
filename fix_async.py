import re

with open('src/pages/pedidos.astro', 'r') as f:
    content = f.read()

# Make the requestAnimationFrame callback async so we can use await loadScript
content = content.replace("requestAnimationFrame(tick);", "requestAnimationFrame(async () => await tick());")
content = content.replace("function tick() {", "async function tick() {")

with open('src/pages/pedidos.astro', 'w') as f:
    f.write(content)
