import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Only rate limit login and signup pages
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isSignupPage = request.nextUrl.pathname === '/signup'

  if (!isLoginPage && !isSignupPage) {
    return res
  }

  // Get client IP address
  const ip = request.ip ||
             request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'

  try {
    // Check if IP is currently blocked
    const { data: existingAttempt } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('ip_address', ip)
      .single()

    const now = new Date()

    // If record exists and IP is blocked
    if (existingAttempt?.blocked_until) {
      const blockedUntil = new Date(existingAttempt.blocked_until)

      if (now < blockedUntil) {
        // Still blocked - calculate remaining time
        const remainingMinutes = Math.ceil((blockedUntil.getTime() - now.getTime()) / 60000)

        return new NextResponse(
          JSON.stringify({
            error: `Too many login attempts. Try again in ${remainingMinutes} minute(s).`,
            blocked_until: blockedUntil.toISOString(),
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      } else {
        // Block expired - reset counter
        await supabase
          .from('login_attempts')
          .update({
            attempt_count: 1,
            blocked_until: null,
            last_attempt: now.toISOString(),
          })
          .eq('ip_address', ip)
      }
    } else if (existingAttempt) {
      // Record exists but not blocked - increment counter
      const newCount = existingAttempt.attempt_count + 1

      if (newCount >= 5) {
        // Block for 15 minutes
        const blockUntil = new Date(now.getTime() + 15 * 60 * 1000)

        await supabase
          .from('login_attempts')
          .update({
            attempt_count: newCount,
            blocked_until: blockUntil.toISOString(),
            last_attempt: now.toISOString(),
          })
          .eq('ip_address', ip)

        return new NextResponse(
          JSON.stringify({
            error: 'Too many login attempts. Your IP has been blocked for 15 minutes.',
            blocked_until: blockUntil.toISOString(),
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      } else {
        // Increment attempt count
        await supabase
          .from('login_attempts')
          .update({
            attempt_count: newCount,
            last_attempt: now.toISOString(),
          })
          .eq('ip_address', ip)
      }
    } else {
      // No record - create new one
      await supabase.from('login_attempts').insert({
        ip_address: ip,
        attempt_count: 1,
        last_attempt: now.toISOString(),
      })
    }

    return res
  } catch (error) {
    console.error('Rate limiting error:', error)
    // On error, allow request to proceed (fail open)
    return res
  }
}

export const config = {
  matcher: ['/login', '/signup'],
}
