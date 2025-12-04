import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const donations = await prisma.donation.findMany({
            where: {
                OR: [
                    { donorId: session.user.id },
                    { request: { recipientId: session.user.id } }
                ]
            },
            include: {
                request: {
                    select: {
                        urgencyLevel: true,
                        recipient: { select: { name: true } }
                    }
                },
                donor: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: { donations } })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }
}