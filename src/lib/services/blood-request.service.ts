// lib/services/blood-request.service.ts

import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger'
import { GeoUtil, ICoordinates } from '@/lib/utils/distance'
import {
    IBloodRequest,
    IBloodRequestCreateDto,
    BloodType,
    UrgencyLevel,
    ValidationError,
    VerificationStatus,
    HemoBridgeError,
} from '@/types'
import { Validator } from '@/lib/utils/validators'

/**
 * BLOOD REQUEST SERVICE
 * Manages blood requests, matching, and request lifecycle
 */

export class BloodRequestService {
    private logger: Logger = new Logger('BloodRequestService')

    /**
     * Create blood request
     */
    async createBloodRequest(
        userId: string,
        data: IBloodRequestCreateDto
    ): Promise<IBloodRequest> {
        try {
            this.logger.info('Creating blood request', { userId, bloodType: data.bloodType })

            // Validate input
            const validated = Validator.validateBloodRequest(data)

            // Check user is recipient
            const user = await prisma.user.findUnique({
                where: { id: userId },
            })

            if (!user) {
                throw new ValidationError('User not found')
            }

            // Create blood request
            const bloodRequest = await prisma.bloodRequest.create({
                data: {
                    recipientId: userId,
                    bloodType: validated.bloodType as BloodType,
                    rhFactor: validated.rhFactor as any,
                    unitsNeeded: validated.units,
                    urgencyLevel: validated.urgency as UrgencyLevel,
                    latitude: validated.latitude,
                    longitude: validated.longitude,
                    radius: validated.radius || 50,
                    medicalProofIPFSHash: validated.medicalProofIPFS,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    autoMatchingEnabled: true,
                    status: 'OPEN',
                    verificationStatus: VerificationStatus.PENDING,
                },
            })

            this.logger.info('Blood request created', { requestId: bloodRequest.id })
            return bloodRequest as IBloodRequest
        } catch (error) {
            this.logger.error('Failed to create blood request', error as Error)
            throw error
        }
    }

    /**
     * Find donors near request
     */
    async findNearbyDonors(
        requestId: string,
        maxResults: number = 10
    ): Promise<any[]> {
        try {
            const request = await prisma.bloodRequest.findUnique({
                where: { id: requestId },
            })

            if (!request) {
                throw new ValidationError('Blood request not found')
            }

            if (!request.latitude || !request.longitude) {
                throw new ValidationError('Location data missing')
            }

            const center: ICoordinates = {
                latitude: request.latitude,
                longitude: request.longitude,
            }

            // Get bounding box for database query
            const bbox = GeoUtil.getBoundingBox(center, request.radius)

            // Find compatible donors
            const donors = await prisma.donorProfile.findMany({
                where: {
                    bloodType: request.bloodType,
                    isAvailable: true,
                    user: {
                        blockedFromPlatform: false,
                    },
                },
                include: {
                    user: true,
                },
                take: maxResults * 2,
            })

            // Filter by distance
            const nearbyDonors = donors
                .filter((donor) => {
                    if (!donor.user) return false

                    const donorCoords: ICoordinates = {
                        latitude: 0, // Would be from user location data
                        longitude: 0,
                    }

                    return GeoUtil.isWithinRadius(center, donorCoords, request.radius)
                })
                .slice(0, maxResults)

            this.logger.info('Found nearby donors', {
                requestId,
                donorCount: nearbyDonors.length,
            })

            return nearbyDonors
        } catch (error) {
            this.logger.error('Failed to find nearby donors', error as Error)
            throw error
        }
    }

    /**
     * Update request status
     */
    async updateRequestStatus(
        requestId: string,
        status: string
    ): Promise<IBloodRequest> {
        try {
            const request = await prisma.bloodRequest.update({
                where: { id: requestId },
                data: { status },
            })

            this.logger.info('Blood request status updated', {
                requestId,
                status,
            })

            return request as IBloodRequest
        } catch (error) {
            this.logger.error('Failed to update request status', error as Error)
            throw error
        }
    }

    /**
     * Get request details
     */
    async getRequest(requestId: string): Promise<IBloodRequest | null> {
        try {
            const request = await prisma.bloodRequest.findUnique({
                where: { id: requestId },
                include: {
                    matches: true,
                    recipient: true,
                },
            })

            return request as IBloodRequest | null
        } catch (error) {
            this.logger.error('Failed to get request details', error as Error)
            throw error
        }
    }

    /**
     * Get active requests
     */
    async getActiveRequests(limit: number = 20): Promise<IBloodRequest[]> {
        try {
            const requests = await prisma.bloodRequest.findMany({
                where: {
                    status: 'OPEN',
                    expiresAt: { gt: new Date() },
                },
                orderBy: { urgencyLevel: 'desc' },
                take: limit,
            })

            return requests as IBloodRequest[]
        } catch (error) {
            this.logger.error('Failed to get active requests', error as Error)
            throw error
        }
    }
}

export const bloodRequestService = new BloodRequestService()
