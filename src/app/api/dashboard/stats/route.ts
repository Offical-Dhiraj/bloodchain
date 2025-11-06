import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('DashboardStatsAPI')

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        let stats = {
            activeRequests: 0,
            matchedDonors: 0,
            completedDonations: 0,
            totalRewards: 0,
        }

        if (session.user.role === 'RECIPIENT') {
            const requests = await prisma.bloodRequest.count({
                where: { recipientId: userId, status: 'OPEN' },
            })
            const completed = await prisma.donation.count({
                where: { request: { recipientId: userId }, status: 'COMPLETED' },
            })
            stats.activeRequests = requests
            stats.completedDonations = completed

        } else if (session.user.role === 'DONOR') {
            const matches = await prisma.requestMatch.count({
                where: { donorId: userId, status: 'PENDING' },
            })
            const donorProfile = await prisma.donorProfile.findUnique({
                where: { userId },
                select: { totalSuccessfulDonations: true, totalRewardsEarned: true }
            })
            stats.matchedDonors = matches
            stats.completedDonations = donorProfile?.totalSuccessfulDonations || 0
            stats.totalRewards = donorProfile?.totalRewardsEarned || 0
        }

        return NextResponse.json({ success: true, data: stats }, { status: 200 })

    } catch (error) {
        logger.error('Failed to fetch dashboard stats', error as Error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}