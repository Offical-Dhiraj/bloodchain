'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

// --- Dynamic Imports ---
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-xl" /> }
)
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
)
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
)
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
)

// --- Types ---
export interface Location {
    id?: string
    lat: number
    lng: number
    title: string
    type: 'DONOR' | 'REQUEST'
    bloodType?: string
}

// --- 1. Helper Components (Defined OUTSIDE to fix ESLint error) ---

// Fix 1: Arrow component moved outside OffScreenIndicators
const Arrow = ({ direction, count }: { direction: 'top' | 'bottom' | 'left' | 'right', count: number }) => {
    if (count === 0) return null

    const positions = {
        top: 'top-2 left-1/2 -translate-x-1/2 flex-col',
        bottom: 'bottom-2 left-1/2 -translate-x-1/2 flex-col-reverse',
        left: 'left-2 top-1/2 -translate-y-1/2 flex-row',
        right: 'right-2 top-1/2 -translate-y-1/2 flex-row-reverse',
    }

    const Icon = {
        top: ChevronUp,
        bottom: ChevronDown,
        left: ChevronLeft,
        right: ChevronRight
    }[direction]

    return (
        <div
            className={`absolute ${positions[direction]} flex items-center justify-center z-[1000] pointer-events-none animate-pulse`}
        >
            <div className="bg-red-600/90 text-white p-1 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] backdrop-blur-sm border border-red-400">
                <Icon size={32} strokeWidth={3} />
            </div>
            <div className="mt-1 mb-1 mx-1 bg-white text-red-600 text-xs font-black px-2 py-0.5 rounded-full shadow-md border border-red-100">
                {count} {count === 1 ? 'Req' : 'Reqs'}
            </div>
        </div>
    )
}

function MapController({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14, { duration: 1.5 })
        }
    }, [center, map])
    return null
}

// --- 2. Game HUD Component ---
function OffScreenIndicators({ locations }: { locations: Location[] }) {
    const map = useMap()
    const [counts, setCounts] = useState({ top: 0, bottom: 0, left: 0, right: 0 })

    // Fix 2: Use useCallback for stable function reference
    const calculateOffScreen = useCallback(() => {
        const bounds = map.getBounds()
        const newCounts = { top: 0, bottom: 0, left: 0, right: 0 }

        locations.forEach(loc => {
            if (loc.type !== 'REQUEST') return

            const isNorth = loc.lat > bounds.getNorth()
            const isSouth = loc.lat < bounds.getSouth()
            const isEast = loc.lng > bounds.getEast()
            const isWest = loc.lng < bounds.getWest()

            if (isNorth) newCounts.top++
            if (isSouth) newCounts.bottom++
            if (isEast) newCounts.right++
            if (isWest) newCounts.left++
        })

        // Optimization: prevent unnecessary re-renders if counts haven't changed
        setCounts(prev => {
            if (JSON.stringify(prev) === JSON.stringify(newCounts)) return prev
            return newCounts
        })
    }, [map, locations])

    useMapEvents({
        move: calculateOffScreen,
        zoom: calculateOffScreen,
    })

    // Fix 3: Wrap initial call in requestAnimationFrame to avoid synchronous setState warning
    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            calculateOffScreen()
        })
        return () => cancelAnimationFrame(rafId)
    }, [calculateOffScreen])

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-[999]">
            <Arrow direction="top" count={counts.top} />
            <Arrow direction="bottom" count={counts.bottom} />
            <Arrow direction="left" count={counts.left} />
            <Arrow direction="right" count={counts.right} />
        </div>
    )
}

// --- Main Component ---
export default function BloodMap({ locations }: { locations: Location[] }) {
    const [isMounted, setIsMounted] = useState(false)
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
    const [Leaflet, setLeaflet] = useState<any>(null)

    useEffect(() => {
        setIsMounted(true)

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude])
                },
                (error) => console.warn("Location access denied or failed:", error),
                { enableHighAccuracy: true }
            )
        }

        import('leaflet').then((L) => {
            setLeaflet(L)
        })
    }, [])

    if (!isMounted || !Leaflet) return <Skeleton className="h-[400px] w-full rounded-xl" />

    const requestIcon = new Leaflet.DivIcon({
        className: 'bg-transparent',
        html: `
            <div class="relative flex items-center justify-center w-8 h-8">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-lg ring-2 ring-red-500/30"></span>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -10]
    })

    const userIcon = new Leaflet.DivIcon({
        className: 'bg-transparent',
        html: `
            <div class="relative flex items-center justify-center w-8 h-8">
                <span class="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-xl ring-2 ring-white"></span>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -10]
    })

    const defaultCenter: [number, number] = [28.6139, 77.2090]

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border shadow-lg relative z-0 group">
            <MapContainer
                center={userLocation || defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {userLocation && <MapController center={userLocation} />}

                <OffScreenIndicators locations={locations} />

                {userLocation && (
                    <Marker position={userLocation} icon={userIcon}>
                        <Popup className="custom-popup">
                            <div className="font-semibold text-xs">You are here</div>
                        </Popup>
                    </Marker>
                )}

                {locations.map((loc, idx) => (
                    <Marker
                        key={idx}
                        position={[loc.lat, loc.lng]}
                        icon={requestIcon}
                    >
                        <Popup className="p-0 rounded-md overflow-hidden">
                            <div className="min-w-[160px]">
                                <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                                    Emergency Request
                                </div>
                                <div className="p-3">
                                    {loc.id ? (
                                        <Link
                                            href={`/requests/${loc.id}`}
                                            className="font-bold text-gray-900 text-sm mb-1 hover:text-red-600 hover:underline block"
                                        >
                                            {loc.title}
                                        </Link>
                                    ) : (
                                        <h3 className="font-bold text-gray-900 text-sm mb-1">{loc.title}</h3>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span>📍 {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                                    </div>
                                    {loc.id && (
                                        <Link href={`/requests/${loc.id}`} className="mt-2 block w-full text-center bg-slate-100 hover:bg-slate-200 text-xs py-1 rounded text-slate-700 font-medium transition-colors">
                                            View Request
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}