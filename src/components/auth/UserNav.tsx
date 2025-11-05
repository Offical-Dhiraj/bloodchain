// components/auth/UserNav.tsx
'use client'

import {Session} from 'next-auth'
import {signOut} from 'next-auth/react'
import Link from 'next/link'

// You can use a <Button> component from ShadCN or another library here
// For simplicity, we'll use a standard <Link> and <button>

interface UserNavProps {
    session: Session | null
}

export function UserNav({session}: UserNavProps) {
    if (session) {
        return (
            <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {session.user?.name || 'User'}
        </span>
                <button
                    onClick={() => signOut({callbackUrl: '/'})}
                    className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                    Sign Out
                </button>
            </div>
        )
    }

    return (
        <Link
            href="/signin"
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
            Sign In
        </Link>
    )
}