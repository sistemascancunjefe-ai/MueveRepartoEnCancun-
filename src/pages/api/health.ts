import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      version: '1.0.0',
      timestamp: Date.now(),
      message: 'MueveCancun API is healthy',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};
