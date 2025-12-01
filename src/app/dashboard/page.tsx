'use client'

import { useSession } from 'next-auth/react'
import { StatsGrid } from './StatsGrid'
import { QuickActions } from './QuickActions'
import BloodMap from '@/components/maps/BloodMap'
import { useActiveRequests } from '@/hooks/useBloodRequests'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
    const { data: session } = useSession()

    // Fetch stats using React Query instead of server actions directly in component
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats')
            return res.json()
        }
    })

    const { data: activeRequests } = useActiveRequests()

    // Prepare map data
    const mapLocations = activeRequests?.data?.requests?.map((req: any) => ({
        lat: req.latitude || 0,
        lng: req.longitude || 0,
        title: `${req.unitsNeeded} units of ${req.bloodType}`,
        type: 'REQUEST'
    })) || []

    if (!session) return null

    return (
        <div className="p-4 sm:p-8 bg-gray-50/50 min-h-screen space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Overview of your donations and requests.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${session ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-sm font-medium">System Operational</span>
                    </div>
                </div>

                {/* Stats */}
                {statsLoading ? (
                    <div className="grid grid-cols-4 gap-4">
                        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                    </div>
                ) : (
                    <StatsGrid stats={stats?.data || {}} />
                )}

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Actions & Map */}
                    <div className="lg:col-span-2 space-y-8">
                        <QuickActions role={session.user.role} />

                        <div className="bg-white p-6 rounded-xl border shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Live Activity Map</h2>
                            <BloodMap locations={mapLocations} />
                        </div>
                    </div>

                    {/* Right Column: Notifications/Recent Activity */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
                        <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
                        {/* We can connect this to the Zustand store notifications later */}
                        <div className="space-y-4">
                            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                System connected to Socket Server.
                            </div>
                            {/* Placeholder for real notifications */}
                            <p className="text-sm text-gray-500 text-center py-4">
                                No new alerts
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}