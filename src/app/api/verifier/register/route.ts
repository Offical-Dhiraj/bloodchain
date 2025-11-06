import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verificationService } from '@/lib/services/verification.service'
import { Logger } from '@/lib/utils/logger'
import { HemoBridgeError } from '@/types'

const logger = new Logger('VerifierRegisterAPI')

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id;

        // Check eligibility (as per SRS [cite: 262-266])
        const donorProfile = await prisma.donorProfile.findUnique({
            where: { userId },
            select: { totalSuccessfulDonations: true, reputationScore: true }
        });

        if (!donorProfile || donorProfile.totalSuccessfulDonations < 3) {
            throw new HemoBridgeError("Ineligible", 403, "Requires at least 3 successful donations.");
        }

        if (donorProfile.reputationScore < 500) {
            throw new HemoBridgeError("Ineligible", 403, "Reputation score must be over 500.");
        }

        // Use the verification service to register
        await verificationService.registerAsVerifier(userId);

        // Upgrade user role
        await prisma.user.update({
            where: { id: userId },
            data: { role: 'VERIFIER' }
        });

        return NextResponse.json({
            success: true,
            message: 'Successfully registered as verifier'
        }, { status: 201 })

    } catch (error) {
        logger.error('Failed to register verifier', error as Error)
        if (error instanceof HemoBridgeError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}