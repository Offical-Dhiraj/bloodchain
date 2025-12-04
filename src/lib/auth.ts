import {NextAuthOptions} from 'next-auth'
import {PrismaAdapter} from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import {prisma} from '@/lib/prisma'
import {UserRole, VerificationStatus} from '@prisma/client'
import {validateUserCredentials} from '@/lib/services/auth.service'
import {fraudDetectionService} from '@/lib/services/fraud-detection.service'
import {Logger} from '@/lib/utils/logger'

const logger = new Logger('NextAuth')
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://');

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),

    cookies: {
        sessionToken: {
            name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies,
            }
        }
    },

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    role: UserRole.DONOR,
                    verificationStatus: VerificationStatus.PENDING,
                    blockedFromPlatform: false
                }
            },
        }),

        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: {label: 'Email', type: 'email', placeholder: 'user@example.com'},
                password: {label: 'Password', type: 'password'},
            },
            async authorize(credentials, req) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        throw new Error('Missing email or password')
                    }

                    const user = await validateUserCredentials({
                        email: credentials.email,
                        password: credentials.password,
                    })

                    if (!user) {
                        throw new Error('Invalid credentials')
                    }

                    if (user.blockedFromPlatform) {
                        throw new Error('This account has been suspended.')
                    }

                    // PATCH: Fraud Detection Check
                    // We run this asynchronously so it doesn't block login unless critical
                    const fraudCheck = await fraudDetectionService.analyzeFraudRisk(user.id, {
                        event: 'LOGIN',
                        ip: 'captured-in-middleware', // In prod, pass actual IP if available
                    })

                    if (fraudCheck.risk === 'critical') {
                        logger.warn('Critical fraud risk detected during login', { userId: user.id })
                        throw new Error('Account flagged for security review.')
                    }

                    logger.info('User authenticated successfully', {userId: user.id})

                    return user
                } catch (error) {
                    logger.error('Authentication error', error as Error)
                    throw new Error((error as Error).message || 'Authentication failed')
                }
            },
        }),
    ],

    callbacks: {
        async jwt({token, user}) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.verificationStatus = user.verificationStatus
            }
            return token
        },

        async session({session, token}) {
            if (session.user) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.verificationStatus = token.verificationStatus
            }
            return session
        },
    },

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },

    pages: {
        signIn: '/signin',
        signOut: '/signout',
        error: '/signin',
    },

    secret: process.env.NEXTAUTH_SECRET,
}