import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const active = await prisma.bloodRequest.count({
            where: { status: "OPEN" }
        })

        const matched = await prisma.bloodRequest.count({
            where: { status: "MATCHED" }
        })

        const completed = await prisma.bloodRequest.count({
            where: { status: "FULFILLED" }
        })

        const rewardsAgg = await prisma.donorProfile.aggregate({
            _sum: {
                totalRewardsEarned: true,
            },
        })
        const totalRewards = rewardsAgg._sum.totalRewardsEarned ?? 0

        return NextResponse.json({
            data: {
                activeRequests: active,
                matchedDonors: matched,
                completedDonations: completed,
                totalRewards
            }
        })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ data: {} }, { status: 500 })
    }
}
