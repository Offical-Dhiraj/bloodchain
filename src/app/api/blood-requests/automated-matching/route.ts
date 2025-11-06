// app/api/blood-requests/automated-matching/route.ts

import {NextRequest, NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
// CHANGED: Import aiService instead of matchingService
import {aiService} from '@/lib/services/ai.service'
import {notificationService} from '@/lib/services/notification.service'
import {Logger} from '@/lib/utils/logger'

const logger = new Logger('AutomatedMatchingAPI')

/**
 * POST /api/blood-requests/automated-matching
 * Triggers autonomous AI matching for a blood request
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                {error: 'Unauthorized'},
                {status: 401}
            )
        }

        const body = await request.json()
        const {requestId} = body

        if (!requestId || typeof requestId !== 'string') {
            return NextResponse.json(
                {error: 'Invalid requestId'},
                {status: 400}
            )
        }

        // Get blood request
        const bloodRequest = await prisma.bloodRequest.findUnique({
            where: {id: requestId},
            include: {recipient: true},
        })

        if (!bloodRequest) {
            return NextResponse.json(
                {error: 'Request not found'},
                {status: 404}
            )
        }

        logger.info('🔄 Starting automated matching', {requestId})

        // Initialize ML model
        // CHANGED: Use aiService
        await aiService.initializeModel()

        // Find matches using AI
        // CHANGED: Use aiService.autonomousMatching
        const matches = await aiService.autonomousMatching(requestId)

        if (matches.length === 0) {
            logger.warn('⚠️ No matches found', {requestId})
            return NextResponse.json(
                {
                    success: true,
                    matchCount: 0,
                    message: 'No suitable matches found',
                },
                {status: 200}
            )
        }

        // ** NOTE: createMatches is in matching.service, not ai.service.
        // We will leave this one import for createMatches.
        // A better refactor would move createMatches into ai.service.
        const { matchingService } = await import('@/lib/services/matching.service');
        const createdMatches = await matchingService.createMatches(
            matches.map(m => ({
                matchId: `${requestId}-${m.donorId}`, // Reconstruct matchId
                donorId: m.donorId,
                score: m.overallScore,
                features: { // Reconstruct features for the limited createMatches function
                    bloodTypeScore: m.compatibilityScore,
                    distanceScore: m.distanceScore,
                    reputationScore: m.reputationScore,
                    availabilityScore: m.availabilityScore,
                    urgencyScore: bloodRequest.urgencyLevel === 'URGENT' ? 1.0 : 0.8, // Approximation
                    successRateScore: 0, // Data not available in this scope
                    responseTimeScore: m.responseScore,
                    fraudRiskScore: 0 // Data not available in this scope
                }
            }))
        );

        // Notify top donors
        for (let i = 0; i < Math.min(createdMatches.length, 3); i++) {
            const match = createdMatches[i]
            const donor = await prisma.donorProfile.findUnique({
                where: {id: match.donorId},
                include: {user: true},
            })

            if (donor?.user?.email) {
                try {
                    await notificationService.sendEmailNotification(donor.user.email, {
                        userId: donor.userId,
                        type: 'MATCH_FOUND',
                        title: '🎉 You Have a New Match!',
                        message: `Your profile matches a blood request. Score: ${(match.overallScore * 100).toFixed(0)}%`,
                        data: {matchId: match.id, requestId},
                    })
                } catch (error) {
                    logger.warn(
                        `Failed to send email to donor ${donor.userId}: ` +
                        (error as Error).message
                    )
                }
            }
        }

        logger.info('✅ Automated matching completed', {
            requestId,
            matchCount: createdMatches.length,
        })

        return NextResponse.json(
            {
                success: true,
                matchCount: createdMatches.length,
                matches: createdMatches.map((m) => ({
                    id: m.id,
                    score: m.overallScore,
                    donorId: m.donorId,
                })),
            },
            {status: 200}
        )
    } catch (error) {
        logger.error(
            'Automated matching error:',
            error instanceof Error ? error.message : String(error)
        )
        return NextResponse.json(
            {error: 'Failed to process matching'},
            {status: 500}
        )
    }
}