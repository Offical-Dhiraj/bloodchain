import { NextResponse } from 'next/server'
import { runFraudDetectionJob } from '@/jobs/fraud-detection.job'
import { Logger } from '@/lib/utils/logger'

const logger = new Logger('CronFraudDetection')

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await runFraudDetectionJob()
        return NextResponse.json({ success: true, message: 'Fraud detection job completed' })
    } catch (error) {
        logger.error('Job failed', error as Error)
        return NextResponse.json({ success: false, error: 'Job failed' }, { status: 500 })
    }
}