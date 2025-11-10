'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardStats } from '../types/dashboard'
import { logToServer } from './log.action' // Assuming log action is in the same directory
import { LogLevel } from '@/types/logger'
import { headers } from 'next/headers' // To forward cookies

export const getDashboardStats = async (): Promise<DashboardStats> => {
    // 1. Validate session
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        throw new Error('Unauthorized')
    }

    // 2. Fetch data from the internal API route
    try {
        // We need the absolute URL to fetch from an API route within a server action
        // NEXT_PUBLIC_APP_URL should be set in your .env file (e.g., http://localhost:3000)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL
        if (!baseUrl) {
            throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables.')
        }

        // Fetch from your API route
        const response = await fetch(`${baseUrl}/api/dashboard/stats`, {
            method: 'GET',
            headers: {
                // Forward cookies (like the auth session cookie) to the API route
                'Cookie': (await headers()).get('Cookie') || '',
            },
            // Caching can be controlled here.
            // 'no-store' ensures fresh data, just like your original client component.
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.message || 'API returned success: false')
        }

        // Log success
        await logToServer(LogLevel.INFO, 'Dashboard stats fetched via API route')

        return data.data as DashboardStats

    } catch (error) {
        // Log the error
        await logToServer(LogLevel.ERROR, 'Failed to fetch dashboard stats from API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        })

        // Re-throw or return default stats
        // Re-throwing will be caught by the <Error> boundary in Next.js
        throw new Error('Could not fetch dashboard statistics.')
    }
}