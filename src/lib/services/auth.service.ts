// lib/services/auth.service.ts

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {prisma} from '@/lib/prisma'
import {Logger} from '@/lib/utils/logger'
import {AuthenticationError, IAuthCredentials, IAuthResponse, ValidationError,} from '@/types'
import {Validator} from '@/lib/utils/validators'
import {$Enums} from "@/generated/prisma";
import UserRole = $Enums.UserRole;

/**
 * AUTHENTICATION SERVICE
 * Handles user authentication, JWT tokens, and session management
 */

export class AuthService {
    private logger: Logger = new Logger('AuthService')
    private jwtSecret: string = process.env.JWT_SECRET || 'your-secret-key'
    private jwtExpiry: string = process.env.JWT_EXPIRY || '7d'

    /**
     * Register new user
     */
    async registerUser(credentials: IAuthCredentials & { name: string; phone: string }): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: UserRole
    }> {
        try {
            this.logger.info('Registering new user', {email: credentials.email})

            // Validate email
            if (!Validator.validateEmail(credentials.email)) {
                throw new ValidationError('Invalid email format')
            }

            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: {email: credentials.email},
            })

            if (existingUser) {
                throw new ValidationError('User with this email already exists')
            }

            // Hash password
            const passwordHash = await bcrypt.hash(credentials.password, 10)

            // Create user
            const user = await prisma.user.create({
                data: {
                    email: credentials.email,
                    passwordHash,
                    name: credentials.name,
                    phone: credentials.phone,
                    role: UserRole.DONOR,
                    verificationStatus: 'PENDING' as any,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            })

            this.logger.info('User registered successfully', {userId: user.id})
            return user
        } catch (error) {
            this.logger.error('User registration failed', error as Error)
            throw error
        }
    }

    /**
     * Login user
     */
    async loginUser(credentials: IAuthCredentials): Promise<IAuthResponse> {
        try {
            this.logger.info('User login attempt', {email: credentials.email})

            // Find user
            const user = await prisma.user.findUnique({
                where: {email: credentials.email},
            })

            if (!user || !user.passwordHash) {
                throw new AuthenticationError('Invalid credentials')
            }

            // Verify password
            const passwordValid = await bcrypt.compare(
                credentials.password,
                user.passwordHash
            )

            if (!passwordValid) {
                throw new AuthenticationError('Invalid credentials')
            }

            // Generate JWT token
            const token = this.generateToken({
                id: user.id,
                email: user.email,
                role: user.role,
            })

            this.logger.info('User logged in successfully', {userId: user.id})

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name as string,
                    role: user.role as UserRole,
                },
                expiresIn: this.getExpiryInSeconds(),
            }
        } catch (error) {
            this.logger.error('Login failed', error as Error)
            throw error
        }
    }

    /**
     * Verify JWT token
     */
    verifyToken(token: string): Record<string, any> {
        try {
            return jwt.verify(token, this.jwtSecret) as Record<string, any>
        } catch (error) {
            throw new AuthenticationError('Invalid or expired token')
        }
    }

    /**
     * Generate JWT token
     */
    private generateToken(payload: Record<string, any>): string {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.getExpiryInSeconds(),
        })
    }

    /**
     * Get token expiry in seconds
     */
    private getExpiryInSeconds(): number {
        const expiry = this.jwtExpiry
        const match = expiry.match(/(\d+)([a-z])/)

        if (!match) return 604800 // default 7 days

        const [, value, unit] = match
        const num = parseInt(value)

        const multipliers: Record<string, number> = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
            w: 604800,
        }

        return num * (multipliers[unit] || 1)
    }

    /**
     * Refresh token
     */
    async refreshToken(oldToken: string): Promise<IAuthResponse> {
        try {
            const decoded = this.verifyToken(oldToken)

            const user = await prisma.user.findUnique({
                where: {id: decoded.id},
            })

            if (!user) {
                throw new AuthenticationError('User not found')
            }

            const newToken = this.generateToken({
                id: user.id,
                email: user.email,
                role: user.role,
            })

            return {
                token: newToken,
                user: {
                    id: user.id as string,
                    email: user.email as string,
                    name: user.name as string,
                    role: user.role as UserRole,
                },
                expiresIn: this.getExpiryInSeconds(),
            }
        } catch (error) {
            this.logger.error('Token refresh failed', error as Error)
            throw error
        }
    }
}

export const authService = new AuthService()
