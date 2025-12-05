'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

interface RecenterMapProps {
    center: [number, number]
}

export default function RecenterMap({ center }: RecenterMapProps) {
    const map = useMap()

    useEffect(() => {
        if (center) {
            // Fly to the new location with a smooth animation (Uber-like feel)
            map.flyTo(center, 14, { duration: 2 })
        }
    }, [center, map])

    return null
}