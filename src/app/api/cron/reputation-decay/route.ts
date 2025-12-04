import { NextResponse } from 'next/server'
import { runReputationDecayJob } from '@/jobs/reputation-decay.job'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('CronReputationDecay')

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await runReputationDecayJob()
        return NextResponse.json({ success: true, message: 'Reputation decay job completed' })
    } catch (error) {
        logger.error('Job failed', error as Error)
        return NextResponse.json({ success: false, error: 'Job failed' }, { status: 500 })
    }
}