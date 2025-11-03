// lib/utils/distance.ts

/**
 * GEOSPATIAL UTILITY FUNCTIONS
 * Distance calculations and location-based operations
 */

export interface ICoordinates {
    latitude: number
    longitude: number
}

export class GeoUtil {
    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    static calculateDistance(
        coord1: ICoordinates,
        coord2: ICoordinates
    ): number {
        const R = 6371 // Earth's radius in kilometers
        const dLat = this.toRadians(coord2.latitude - coord1.latitude)
        const dLon = this.toRadians(coord2.longitude - coord1.longitude)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(coord1.latitude)) *
            Math.cos(this.toRadians(coord2.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    /**
     * Check if coordinates are within search radius
     */
    static isWithinRadius(
        center: ICoordinates,
        point: ICoordinates,
        radiusKm: number
    ): boolean {
        const distance = this.calculateDistance(center, point)
        return distance <= radiusKm
    }

    /**
     * Get bounding box for search radius
     */
    static getBoundingBox(
        center: ICoordinates,
        radiusKm: number
    ): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
        const latOffset = (radiusKm / 111.32) // 1 degree latitude ~ 111.32 km
        const lonOffset = radiusKm / (111.32 * Math.cos(this.toRadians(center.latitude)))

        return {
            minLat: center.latitude - latOffset,
            maxLat: center.latitude + latOffset,
            minLon: center.longitude - lonOffset,
            maxLon: center.longitude + lonOffset,
        }
    }

    /**
     * Convert degrees to radians
     */
    private static toRadians(degrees: number): number {
        return (degrees * Math.PI) / 180
    }

    /**
     * Convert radians to degrees
     */
    private static toDegrees(radians: number): number {
        return (radians * 180) / Math.PI
    }
}
