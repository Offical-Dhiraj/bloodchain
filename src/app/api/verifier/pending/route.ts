import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== UserRole.VERIFIER) {
            return NextResponse.json({ error: 'Unauthorized: Verifiers only' }, { status: 403 })
        }

        // Find verifications assigned to this verifier that are pending
        const pendingTasks = await prisma.verification.findMany({
            where: {
                verifierId: session.user.id,
                status: 'PENDING'
            },
            include: {
                request: true,
            }
        })

        return NextResponse.json({ success: true, data: pendingTasks })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}