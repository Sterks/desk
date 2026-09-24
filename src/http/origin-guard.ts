import type { IncomingHttpHeaders } from 'node:http';

const SAFE_METHODS = new Set(['GET', 'HEAD']);

export function checkRequestOrigin(headers: IncomingHttpHeaders, method: string, port: number): string | null {
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!headers.host || !hosts.includes(headers.host)) return `Недопустимый Host: ${headers.host ?? 'нет'}. desk ui принимает только ${hosts.join(' и ')}.`;
  if (SAFE_METHODS.has(method)) return null;
  const origins = hosts.map((host) => `http://${host}`);
  if (!headers.origin || !origins.includes(headers.origin)) return `Недопустимый Origin: ${headers.origin || 'нет'}. Изменять данные можно только со страницы desk ui.`;
  return null;
}
