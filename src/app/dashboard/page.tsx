import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth' // Assuming authOptions is in 'lib/auth'
import { logToServer } from '@/lib/actions/log.action'
import { getDashboardStats } from '@/lib/actions/dashboard.actions'
import { LogLevel } from '@/types/logger'
import { DashboardStats } from '@/lib/types/dashboard' // I've assumed you'll create this type file
import { StatsGrid } from './StatsGrid'
import { QuickActions } from './QuickActions'
import {JSX} from "react";

export default async function DashboardPage(): Promise<JSX.Element> {
    // 1. Get session on the server
    const session = await getServerSession(authOptions)

    // 2. Handle authentication on the server
    if (!session?.user) {
        redirect('/api/auth/signin?callbackUrl=/dashboard')
    }

    // 3. Fetch data on the server
    let stats: DashboardStats;
    try {
        stats = await getDashboardStats()
        // Log success (no need to await if you don't need to block)
        logToServer(LogLevel.INFO, 'Dashboard data fetched successfully')
    } catch (error) {
        // Log error
        logToServer(LogLevel.ERROR, 'Failed to fetch dashboard data', {
            error: error instanceof Error ? error.message : 'Unknown error'
        })
        // Provide default stats on failure
        stats = {
            activeRequests: 0,
            matchedDonors: 0,
            completedDonations: 0,
            totalRewards: 0,
        }
    }

    const user = session.user;

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                        Welcome, {user.name}! 👋
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Your Role: <span className="font-semibold capitalize">{user.role?.toLowerCase()}</span>
                    </p>
                </div>

                {/* Stats Grid (Server Component) */}
                <StatsGrid stats={stats} />

                {/* Quick Actions (Client Component) */}
                <QuickActions role={user.role} />
            </div>
        </div>
    )
}