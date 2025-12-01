import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const requests = await prisma.bloodRequest.findMany({
            where: { status: "OPEN" },
            select: {
                latitude: true,
                longitude: true,
                unitsNeeded: true,
                bloodType: true
            }
        })

        return NextResponse.json({ data: { requests } })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ data: { requests: [] } })
    }
}
