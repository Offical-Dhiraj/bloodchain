// src/middleware/rate-limit.ts

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from 'ioredis'
import { env } from '@/lib/env'

// Support REDIS_URL or host/port
const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL)
  : new Redis({
      host: env.REDIS_HOST || 'localhost',
      port: parseInt(env.REDIS_PORT || '6379', 10),
    })

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    // The first IP in X-Forwarded-For is the original client IP
    return xff.split(',')[0].trim()
  }
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri
  // Next.js request IP header (Vercel)
  const vercelIp = req.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp
  return 'unknown'
}

export async function rateLimit(
  _request: NextRequest,
  key: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
): Promise<boolean> {
  try {
    const count = await redis.incr(key)

    if (count === 1) {
      await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW / 1000))
    }

    return count <= maxRequests
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return true // Allow on error
  }
}

export function rateLimitMiddleware(maxRequests: number = RATE_LIMIT_MAX_REQUESTS) {
  return async (request: NextRequest) => {
    const ip = getClientIp(request)

    const key = `rate-limit:${ip}`
    const allowed = await rateLimit(request, key, maxRequests)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      )
    }

    return NextResponse.next()
  }
}
