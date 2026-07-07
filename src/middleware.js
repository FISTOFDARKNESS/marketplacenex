import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://unpkg.com https://www.google.com https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://tr.rbxcdn.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://accounts.google.com https://www.google.com;
    frame-src 'self' https://accounts.google.com https://www.google.com;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

