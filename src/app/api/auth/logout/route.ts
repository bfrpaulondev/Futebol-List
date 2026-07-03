import { NextResponse } from 'next/server';
import { COOKIE_OPTIONS, COOKIE_CLEAR_OPTIONS } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Clear the auth cookie. Both the value (empty) and maxAge (0) plus an
  // explicit expires in the past ensure the browser deletes the cookie.
  // `path` matches the one used at login so the deletion actually applies.
  response.cookies.set({
    name: COOKIE_OPTIONS.name,
    value: '',
    ...COOKIE_CLEAR_OPTIONS,
  });
  return response;
}
