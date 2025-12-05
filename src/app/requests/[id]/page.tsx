'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    MapPin,
    Clock,
    Droplet,
    AlertTriangle,
    ArrowLeft,
    Share2,
    ShieldCheck,
    User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import BloodMap from '@/components/maps/BloodMap' // Re-using your map component
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export default function RequestDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const id = params?.id as string

    // 1. Fetch Request Details
    const { data, isLoading, error } = useQuery({
        queryKey: ['request', id],
        queryFn: async () => {
            const res = await fetch(`/api/requests/${id}`)
            if (!res.ok) throw new Error('Failed to fetch request')
            return res.json()
        },
        enabled: !!id
    })

    const request = data?.data

    // 2. Handle "I want to Donate" (Mock logic for now)
    const handleDonate = () => {
        toast.success("Thank you! The recipient has been notified of your offer.")
        // In a real flow, this would create a 'Match' record via API
    }

    if (isLoading) return <LoadingSkeleton />
    if (error || !request) return <ErrorState />

    // Prepare location for the map
    const mapLocation = request.latitude && request.longitude ? [{
        lat: request.latitude,
        lng: request.longitude,
        title: `${request.unitsNeeded} units of ${request.bloodType}`,
        type: 'REQUEST' as const,
        bloodType: request.bloodType
    }] : []

    const isOwner = session?.user?.id === request.recipientId
    const isCritical = ['CRITICAL', 'EMERGENCY'].includes(request.urgencyLevel)

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-5xl space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                className="gap-2 pl-0 hover:pl-2 transition-all"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4" /> Back to Requests
            </Button>

            <div className="grid md:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Main Details */}
                <div className="md:col-span-2 space-y-6">

                    {/* Header Card */}
                    <Card className={`border-l-4 ${isCritical ? 'border-l-red-600' : 'border-l-blue-500'} shadow-md`}>
                        <CardHeader className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-lg px-3 py-1 font-bold border-slate-300">
                                            {request.bloodType?.replace('_', ' ')}
                                        </Badge>
                                        <Badge variant={isCritical ? 'destructive' : 'secondary'} className="animate-pulse">
                                            {request.urgencyLevel}
                                        </Badge>
                                    </div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        Blood Donation Required
                                    </h1>
                                </div>
                                <Button variant="outline" size="icon" onClick={() => {
                                    navigator.clipboard.writeText(window.location.href)
                                    toast.success("Link copied to clipboard!")
                                }}>
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="bg-red-100 p-2 rounded-full text-red-600">
                                        <Droplet className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Units Needed</p>
                                        <p className="font-semibold text-lg">{request.unitsNeeded}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Posted</p>
                                        <p className="font-semibold">
                                            {request.createdAt ? formatDistanceToNow(new Date(request.createdAt)) + ' ago' : 'Recently'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Status & Verification */}
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    Verification Status
                                </h3>
                                <Alert className={request.verificationStatus === 'VERIFIED_BLOCKCHAIN' ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                                    <AlertDescription className="text-xs sm:text-sm">
                                        {request.verificationStatus === 'VERIFIED_BLOCKCHAIN'
                                            ? "This request has been cryptographically verified on the blockchain."
                                            : "This request is currently pending peer verification."}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Map */}
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                Request Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 h-[300px] relative">
                            {request.latitude && request.longitude ? (
                                <BloodMap locations={mapLocation} />
                            ) : (
                                <div className="h-full flex items-center justify-center bg-slate-100 text-slate-500">
                                    Location not provided
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Action Panel */}
                <div className="space-y-6">
                    {/* Call to Action Card */}
                    <Card className="sticky top-6 border-t-4 border-t-red-500 shadow-lg">
                        <CardHeader>
                            <CardTitle>Can you help?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-600">
                                The patient is in urgent need. If you match this blood type, please consider donating immediately.
                            </p>

                            {/* Logic for Buttons based on Role */}
                            {isOwner ? (
                                <div className="space-y-2">
                                    <Button variant="outline" className="w-full">Edit Request</Button>
                                    <Button variant="destructive" className="w-full">Close Request</Button>
                                </div>
                            ) : (
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700 h-12 text-lg font-semibold shadow-red-200 shadow-xl"
                                    onClick={handleDonate}
                                >
                                    Donate Now
                                </Button>
                            )}

                            <div className="text-xs text-center text-slate-400 pt-2">
                                By clicking donate, you agree to share your contact details with the recipient.
                            </div>
                        </CardContent>
                    </Card>

                    {/* Donor Info (Optional Context) */}
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="bg-slate-100 p-3 rounded-full">
                                <User className="h-6 w-6 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Requestor</p>
                                <p className="font-medium text-sm">Verified Patient</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// --- Loading Component ---
function LoadingSkeleton() {
    return (
        <div className="container mx-auto p-8 max-w-5xl space-y-6">
            <Skeleton className="h-10 w-32" />
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        </div>
    )
}

// --- Error Component ---
function ErrorState() {
    return (
        <div className="container mx-auto p-12 text-center max-w-2xl">
            <div className="bg-red-50 p-6 rounded-full w-fit mx-auto mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Not Found</h2>
            <p className="text-slate-500 mb-6">This blood request may have been fulfilled, expired, or removed.</p>
            <Button asChild>
                <a href="/requests">View Active Requests</a>
            </Button>
        </div>
    )
}