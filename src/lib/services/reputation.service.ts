// src/services/reputation.service.ts

import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger'

interface ReputationEvent {
    userId: string
    eventType:
        | 'SUCCESSFUL_DONATION'
        | 'FAILED_DONATION'
        | 'REVIEW_RECEIVED'
        | 'FRAUD_FLAG'
        | 'VERIFICATION_PASSED'
    points: number
    multiplier?: number
    reason?: string
}

interface ReputationStats {
    totalScore: number
    level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
    successRate: number
    totalDonations: number
    trustScore: number
}

const logger = new Logger('ReputationService')

const REPUTATION_THRESHOLDS = {
    BRONZE: 0,
    SILVER: 500,
    GOLD: 1500,
    PLATINUM: 3000,
}

const EVENT_POINTS = {
    SUCCESSFUL_DONATION: 100,
    FAILED_DONATION: -50,
    POSITIVE_REVIEW: 50,
    NEGATIVE_REVIEW: -100,
    VERIFICATION_PASSED: 25,
    FRAUD_FLAG: -200,
}

export class ReputationService {
    async recordEvent(event: ReputationEvent): Promise<void> {
        try {
            const donor = await prisma.donorProfile.findUnique({
                where: { userId: event.userId },
            })

            if (!donor) {
                throw new Error('Donor not found')
            }

            let points = event.points || EVENT_POINTS[event.eventType] || 0

            if (event.multiplier) {
                points *= event.multiplier
            }

            // Update reputation score
            const newScore = Math.max(0, donor.reputationScore + points)

            await prisma.donorProfile.update({
                where: { userId: event.userId },
                data: {
                    reputationScore: newScore,
                },
            })

            logger.info('✅ Reputation event recorded', {
                userId: event.userId,
                eventType: event.eventType,
                points,
                newScore,
            })
        } catch (error) {
            logger.error('Failed to record reputation event: '+ (error as Error).message)
            throw error
        }
    }

    async getStats(userId: string): Promise<ReputationStats> {
        try {
            const donor = await prisma.donorProfile.findUnique({
                where: { userId },
                include: {
                    donations: {
                        where: { status: 'COMPLETED' },
                    },
                },
            })

            if (!donor) {
                throw new Error('Donor not found')
            }

            const level = this.getReputationLevel(donor.reputationScore)
            const successRate =
                donor.totalSuccessfulDonations /
                Math.max(donor.totalSuccessfulDonations + donor.totalFailedMatches, 1)

            return {
                totalScore: donor.reputationScore,
                level,
                successRate,
                totalDonations: donor.donations.length,
                trustScore: successRate * 100,
            }
        } catch (error) {
            logger.error('Failed to get reputation stats:'+ (error as Error).message)
            throw error
        }
    }

    private getReputationLevel(
        score: number
    ): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
        if (score >= REPUTATION_THRESHOLDS.PLATINUM) return 'PLATINUM'
        if (score >= REPUTATION_THRESHOLDS.GOLD) return 'GOLD'
        if (score >= REPUTATION_THRESHOLDS.SILVER) return 'SILVER'
        return 'BRONZE'
    }

    async getLevelBadge(
        level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
    ): Promise<string> {
        const badges = {
            BRONZE: '🥉',
            SILVER: '🥈',
            GOLD: '🥇',
            PLATINUM: '👑',
        }
        return badges[level]
    }
}

export const reputationService = new ReputationService()
