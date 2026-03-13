import re

with open('src/layouts/MainLayout.astro', 'r') as f:
    content = f.read()

# Replace setTimeout string patterns
content = content.replace("setTimeout(() => input.focus(), 400);", "window.setTimeout(function() { input.focus(); }, 400);")
content = content.replace("setTimeout(() => {", "window.setTimeout(function() {")

with open('src/layouts/MainLayout.astro', 'w') as f:
    f.write(content)


with open('src/pages/pedidos.astro', 'r') as f:
    content = f.read()

content = content.replace("setTimeout(() => geocodePendingStops(), 2000);", "window.setTimeout(function() { geocodePendingStops(); }, 2000);")

with open('src/pages/pedidos.astro', 'w') as f:
    f.write(content)
