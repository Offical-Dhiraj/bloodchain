// app/middleware.ts

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * MIDDLEWARE
 * Protects routes and validates requests
 */

export default withAuth(
    function proxy(request: NextRequest) {
        // Additional middleware logic
        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/signin',
        },
    }
)

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/protected/:path*',
    ],
}
