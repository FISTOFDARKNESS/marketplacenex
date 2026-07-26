export function middleware(request) {
  return NextResponse.next();
}

import { NextResponse } from 'next/server';

export const config = {
  matcher: [],
};
