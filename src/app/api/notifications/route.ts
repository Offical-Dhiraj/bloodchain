import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json({ success: true, data: notifications })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}