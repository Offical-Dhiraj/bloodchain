import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bloodRequestService } from '@/lib/services/blood-request.service'
import { Logger } from '@/lib/utils/logger'
import { HemoBridgeError } from '@/types'

const logger = new Logger('AcceptMatchAPI')

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ matchId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const matchId = (await params).matchId
        const userId = session.user.id

        if (!matchId) {
            return NextResponse.json({ error: 'Match ID required' }, { status: 400 })
        }

        logger.info('Attempting to accept match', { matchId, userId })

        // Use the service function we added
        const confirmedMatch = await bloodRequestService.confirmDonationMatch(matchId, userId)

        // TODO: Notify recipient via Socket.IO
        // This is handled by the socket server, but we could also emit from here
        // (e.g., using a Redis pub/sub)

        return NextResponse.json({
            success: true,
            message: 'Match accepted',
            matchId: confirmedMatch.id
        }, { status: 200 })

    } catch (error) {
        logger.error('Failed to accept match', error as Error, { matchId: (await params).matchId })

        if (error instanceof HemoBridgeError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode })
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}