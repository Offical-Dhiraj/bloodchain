// lib/utils/logger.ts

import { LogLevel, ILogEntry } from '@/types/logger'
import fs from 'node:fs'
import path from 'node:path'
import { env, isProd } from '@/lib/env'

/**
 * COMPREHENSIVE LOGGING SERVICE
 * Structured logging for an entire platform
 */

export class Logger {
    private service: string
    private logDir: string
    private logToFile: boolean

    constructor(service: string) {
        this.service = service
        this.logDir = env.LOG_DIR || './logs'
        this.logToFile = (env.LOG_TO_FILE === 'true')
        this.ensureLogDirectory()
    }

    private ensureLogDirectory(): void {
        if (this.logToFile && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true })
        }
    }

    private getLogFile(level: LogLevel): string {
        const filename = `${level.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`
        return path.join(this.logDir, filename)
    }

    private formatLogEntry(entry: ILogEntry): string {
        return JSON.stringify(entry, null, 2)
    }

    private writeLog(entry: ILogEntry): void {
        const content = this.formatLogEntry(entry)

        // Write to file only if explicitly enabled
        if (this.logToFile) {
            const logFile = this.getLogFile(entry.level)
            try {
                fs.appendFileSync(logFile, content + '\n', 'utf-8')
            } catch (e) {
                // Fallback to console if file write fails (e.g., serverless)
                console.error('Logger file write failed:', e)
                console.log(content)
            }
        }

        // Always log to console in development; in production, log to console if file logging is disabled
        if (!isProd || !this.logToFile) {
            console.log(content)
        }
    }

    debug(message: string, data?: Record<string, any>): void {
        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.DEBUG,
            service: this.service,
            message,
            data,
        }
        this.writeLog(entry)
    }

    info(message: string, data?: Record<string, any>): void {
        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.INFO,
            service: this.service,
            message,
            data,
        }
        this.writeLog(entry)
    }

    warn(message: string, data?: Record<string, any>): void {
        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.WARN,
            service: this.service,
            message,
            data,
        }
        this.writeLog(entry)
    }

    error(message: string, error?: Error | string, data?: Record<string, any>): void {
        const errorObj = typeof error === 'string' ? new Error(error) : error

        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.ERROR,
            service: this.service,
            message,
            data,
            error: errorObj
                ? {
                    name: errorObj.name,
                    message: errorObj.message,
                    stack: errorObj.stack,
                }
                : undefined,
        }
        this.writeLog(entry)
    }

    critical(message: string, error: Error | string, data?: Record<string, any>): void {
        const errorObj = typeof error === 'string' ? new Error(error) : error

        const entry: ILogEntry = {
            timestamp: new Date(),
            level: LogLevel.CRITICAL,
            service: this.service,
            message,
            data,
            error: {
                name: errorObj.name,
                message: errorObj.message,
                stack: errorObj.stack,
            },
        }
        this.writeLog(entry)
    }
}
