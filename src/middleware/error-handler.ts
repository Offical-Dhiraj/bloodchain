import {Logger} from '@/lib/utils/logger'

const logger = new Logger('ErrorHandler')

interface ErrorResponse {
    success: false
    error: string
    statusCode: number
    timestamp: string
}

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public data?: any
    ) {
        super(message)
    }
}

export function handleError(error: any): ErrorResponse {
    logger.error('API Error:', error)

    if (error instanceof ApiError) {
        return {
            success: false,
            error: error.message,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString(),
        }
    }

    if (error instanceof TypeError) {
        return {
            success: false,
            error: 'Invalid request',
            statusCode: 400,
            timestamp: new Date().toISOString(),
        }
    }

    return {
        success: false,
        error: 'Internal server error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
    }
}