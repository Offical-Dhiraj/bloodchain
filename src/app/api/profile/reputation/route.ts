import {NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '@/lib/auth'
import {reputationService} from '@/lib/services/reputation.service'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }

        const stats = await reputationService.getStats(session.user.id)
        const badge = await reputationService.getLevelBadge(stats.level)

        return NextResponse.json({
            success: true,
            data: {...stats, badge}
        })
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch reputation'}, {status: 500})
    }
}