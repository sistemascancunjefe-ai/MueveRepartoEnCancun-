import type { APIRoute } from 'astro';

const pages = [
  { path: '/', changefreq: 'daily', priority: 1.0 },
  { path: '/home', changefreq: 'daily', priority: 1.0 },
  { path: '/pedidos', changefreq: 'hourly', priority: 0.9 },
  { path: '/reparto', changefreq: 'hourly', priority: 0.8 },
  { path: '/metricas', changefreq: 'daily', priority: 0.7 },
  { path: '/enviar', changefreq: 'daily', priority: 0.6 },
  { path: '/contribuir', changefreq: 'monthly', priority: 0.5 },
  { path: '/offline', changefreq: 'yearly', priority: 0.1 }
];

export const GET: APIRoute = ({ site }) => {
  // Use the site from astro.config.mjs or fallback to the Render URL
  const baseUrl = site ? new URL(site.href).origin : 'https://muevereparto.onrender.com';

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => {
  const loc = new URL(page.path, baseUrl).href;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`;
}).join('\n')}
</urlset>`.trim();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
