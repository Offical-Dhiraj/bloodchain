import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const id = (await params).id

        await prisma.notification.updateMany({
            where: {
                id: id,
                userId: session.user.id
            },
            data: { read: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}