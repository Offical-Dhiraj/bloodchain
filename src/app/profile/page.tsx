// app/profile/page.tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth' // adjust path to your authOptions
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
    const session = await getServerSession(authOptions)

    // if you want to block unauthenticated users:
    if (!session) {
        // redirect to sign-in (preserve callback to return)
        redirect('/api/auth/signin?callbackUrl=/profile')
    }

    // pass the session object to the client component
    return <ProfileClient session={session} />
}
