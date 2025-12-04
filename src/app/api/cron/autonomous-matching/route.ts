import { NextResponse } from 'next/server'
import { runAutonomousMatchingJob } from '@/jobs/autonomous-matching.job'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('CronAutonomousMatching')

export async function GET(request: Request) {
    // Security: Verify secret header to prevent unauthorized triggering
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await runAutonomousMatchingJob()
        return NextResponse.json({ success: true, message: 'Autonomous matching job completed' })
    } catch (error) {
        logger.error('Job failed', error as Error)
        return NextResponse.json({ success: false, error: 'Job failed' }, { status: 500 })
    }
}