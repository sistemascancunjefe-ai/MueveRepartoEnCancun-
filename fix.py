import re

with open('src/pages/pedidos.astro', 'r') as f:
    content = f.read()

# Dynamic script loading
script_loader = """
  // Dynamic Script Loader for Heavy Libraries
  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }
"""

content = content.replace("async function init() {", script_loader + "\n  async function init() {")

# Tesseract dynamic import replacement
tesseract_lazy = """
      await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
      //@ts-ignore
      const worker = await window.Tesseract.createWorker('spa');
"""
content = re.sub(r"const worker = await Tesseract\.createWorker\('spa'\);", tesseract_lazy, content)

# Worker cleanup & URL revoke
tesseract_cleanup = """
        await worker.terminate();
        if (previewUrl) {
           URL.revokeObjectURL(previewUrl);
        }
"""
content = re.sub(r"await worker\.terminate\(\);", tesseract_cleanup, content)

# jsQR dynamic import replacement
jsqr_lazy = """
          await loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js');
          //@ts-ignore
          const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
"""
content = re.sub(r"const code = jsQR\(imageData\.data, imageData\.width, imageData\.height, \{", jsqr_lazy, content)


with open('src/pages/pedidos.astro', 'w') as f:
    f.write(content)
