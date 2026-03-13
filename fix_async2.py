import re

with open('src/pages/pedidos.astro', 'r') as f:
    content = f.read()

# We need to find the function that contains the call on line 349 (which is probably tick() and ensure it's async)
# the previous regex might not have caught the declaration of tick properly if it was not "function tick() {"
content = re.sub(r'function tick\(\)', 'async function tick()', content)
content = content.replace("requestAnimationFrame(tick);", "requestAnimationFrame(async () => await tick());")
content = content.replace("requestAnimationFrame(tick)", "requestAnimationFrame(async () => await tick())")

with open('src/pages/pedidos.astro', 'w') as f:
    f.write(content)
