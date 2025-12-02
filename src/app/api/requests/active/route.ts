import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { RequestStatus } from "@prisma/client"

export async function GET() {
    try {
        const requests = await prisma.bloodRequest.findMany({
            where: {
                status: RequestStatus.OPEN,
            },
            select: {
                id: true,
                bloodType: true,
                unitsNeeded: true,
                urgencyLevel: true,
                latitude: true,
                longitude: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({
            data: { requests },
        })
    } catch (err) {
        console.error("GET /api/requests/active ERROR:", err)
        return NextResponse.json(
            { data: { requests: [] } },
            { status: 500 }
        )
    }
}
