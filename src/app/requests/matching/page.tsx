'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Droplet, Clock, MapPin, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from 'next-auth/react'

export default function MatchingRequestsPage() {
    const { data: session } = useSession();

    // Assuming the user is a donor and we want to find matches for them
    // or requests that match their profile.
    // Note: The API /api/blood-requests/automated-matching is typically for recipients to trigger matching.
    // Donors would typically view `api/blood-requests/active` or a specific `api/matches/pending`.
    // For this example, we will assume we are fetching active requests that might match.

    const { data, isLoading } = useQuery({
        queryKey: ['donor-matches'],
        queryFn: async () => {
            // Fetch active requests. In a real scenario, you might filter this server-side based on donor profile
            const res = await fetch('/api/blood-requests/active')
            return res.json()
        },
        enabled: !!session // Only fetch if logged in
    })

    // Normalize data structure based on the API response
    const matches = data?.data?.requests || []

    if (isLoading) return (
        <div className="max-w-4xl mx-auto p-8 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Suggested Matches</h1>
                <p className="text-muted-foreground">Requests compatible with your blood profile and location.</p>
            </div>

            <div className="grid gap-4">
                {matches.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No active requests found at this time.</div>
                ) : (
                    matches.map((req: any, idx: number) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4 hover:border-red-200 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shrink-0">
                                    <Droplet size={20} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-lg">Request #{req.id.slice(-4)}</h3>
                                        <Badge variant={req.urgencyLevel === 'CRITICAL' || req.urgencyLevel === 'EMERGENCY' ? 'destructive' : 'secondary'}>
                                            {req.urgencyLevel}
                                        </Badge>
                                        <Badge variant="outline">{req.bloodType?.replace('_', ' ')}</Badge>
                                    </div>
                                    <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {req.radius}km radius</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> Expires: {new Date(req.expiresAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                <div className="text-right hidden md:block">
                                    <span className="text-sm font-medium text-gray-900">{req.unitsNeeded} Units</span>
                                    <p className="text-xs text-muted-foreground">Required</p>
                                </div>
                                <Button className="bg-red-600 hover:bg-red-700 w-full md:w-auto" onClick={() => {
                                    // Logic to accept or view details
                                    console.log("Viewing request", req.id)
                                }}>
                                    View Details <Check className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}