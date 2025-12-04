import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verificationService } from '@/lib/services/verification.service'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('VerifierAttestAPI')

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Fixed params type for Next.js 15+
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'VERIFIER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const verificationId = (await params).id
        const { signature, approved, notes } = await request.json()

        const verification = await prisma.verification.findUnique({
            where: { id: verificationId }
        })

        if (!verification || verification.verifierId !== session.user.id) {
            return NextResponse.json({ error: 'Verification not found or unauthorized' }, { status: 404 })
        }

        // Update the verification record
        await prisma.verification.update({
            where: { id: verificationId },
            data: {
                status: approved ? 'VERIFIED_BLOCKCHAIN' : 'REJECTED',
                blockchainSignature: signature,
                confidence: approved ? 1.0 : 0.0,
            }
        })

        // Update verifier's reputation/score via service
        await verificationService.updateVerifierQualification(session.user.id, approved)

        logger.info(`Verification ${verificationId} processed by ${session.user.id}`)

        return NextResponse.json({ success: true, message: 'Attestation recorded' })
    } catch (error) {
        logger.error('Attestation failed', error as Error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}