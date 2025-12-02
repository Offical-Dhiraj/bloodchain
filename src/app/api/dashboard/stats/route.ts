import { NextResponse } from "next/server"
import prisma from "@/lib/prisma" // adjust if your prisma client is elsewhere
import { RequestStatus, DonationStatus } from "@prisma/client"

export async function GET() {
    try {
        // Active = OPEN blood requests
        const activeRequests = await prisma.bloodRequest.count({
            where: { status: RequestStatus.OPEN },
        })

        // Matched donors = blood requests that are MATCHED
        const matchedDonors = await prisma.bloodRequest.count({
            where: { status: RequestStatus.MATCHED },
        })

        // Completed donations
        const completedDonations = await prisma.donation.count({
            where: { status: DonationStatus.COMPLETED },
        })

        // Total rewards (sum of rewardTokensIssued across all donations)
        const rewardsAgg = await prisma.donation.aggregate({
            _sum: {
                rewardTokensIssued: true,
            },
        })

        const totalRewards = rewardsAgg._sum.rewardTokensIssued ?? 0

        return NextResponse.json({
            data: {
                activeRequests,
                matchedDonors,
                completedDonations,
                totalRewards,
            },
        })
    } catch (error) {
        console.error("[GET /api/dashboard/stats] ERROR:", error)

        // Safe fallback so your dashboard doesn’t crash
        return NextResponse.json(
            {
                data: {
                    activeRequests: 0,
                    matchedDonors: 0,
                    completedDonations: 0,
                    totalRewards: 0,
                },
            },
            { status: 500 },
        )
    }
}
