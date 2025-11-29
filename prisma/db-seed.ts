// src/lib/db-seed.ts

import {VerificationStatus} from '@prisma/client'
import {UserRole} from '@prisma/client'
import {prisma} from '@/lib/prisma'
import {Logger} from '@/lib/utils/logger'
import bcrypt from "bcryptjs";

const logger = new Logger('DatabaseSeed')

export async function seedDatabase() {
    try {
        logger.info('🌱 Seeding database...')

        // CLEANUP: delete dependent records first to avoid foreign key constraint errors
        // Delete donorProfile before user because donorProfile likely has a FK to user
        await prisma.donorProfile.deleteMany()
        await prisma.user.deleteMany()

        logger.info('🧹 Cleaned existing users and donor profiles')

        // More sample donors
        const donors = [
            {
                email: 'donor1@test.com',
                passwordHash: 'hashed_password_1',
                name: 'Test Donor 1',
                phone: '+911234567890',
                role: 'DONOR',
                verificationStatus: 'VERIFIED_BLOCKCHAIN',
                donorProfile: {
                    bloodType: 'O_POSITIVE',
                    rhFactor: 'POSITIVE',
                    isAvailable: true,
                    aiReputationScore: 0.92,
                    totalSuccessfulDonations: 12,
                    reputationScore: 920,
                },
            },
            {
                email: 'donor2@test.com',
                passwordHash: 'hashed_password_2',
                name: 'Test Donor 2',
                phone: '+919876543210',
                role: 'DONOR',
                verificationStatus: 'VERIFIED_BLOCKCHAIN',
                donorProfile: {
                    bloodType: 'A_NEGATIVE',
                    rhFactor: 'NEGATIVE',
                    isAvailable: false,
                    aiReputationScore: 0.76,
                    totalSuccessfulDonations: 5,
                    reputationScore: 760,
                },
            },
            {
                email: 'donor3@test.com',
                passwordHash: 'hashed_password_3',
                name: 'Test Donor 3',
                phone: '+919112223334',
                role: 'DONOR',
                verificationStatus: 'PENDING',
                donorProfile: {
                    bloodType: 'B_POSITIVE',
                    rhFactor: 'POSITIVE',
                    isAvailable: true,
                    aiReputationScore: 0.66,
                    totalSuccessfulDonations: 2,
                    reputationScore: 660,
                },
            },
            {
                email: 'donor4@test.com',
                passwordHash: 'hashed_password_4',
                name: 'Test Donor 4',
                phone: '+919998887776',
                role: 'DONOR',
                verificationStatus: 'VERIFIED_BLOCKCHAIN',
                donorProfile: {
                    bloodType: 'AB_NEGATIVE',
                    rhFactor: 'NEGATIVE',
                    isAvailable: true,
                    aiReputationScore: 0.88,
                    totalSuccessfulDonations: 20,
                    reputationScore: 880,
                },
            },
            {
                email: 'donor5@test.com',
                passwordHash: 'hashed_password_5',
                name: 'Test Donor 5',
                phone: '+919070605040',
                role: 'DONOR',
                verificationStatus: 'VERIFIED_BLOCKCHAIN',
                donorProfile: {
                    bloodType: 'O_NEGATIVE',
                    rhFactor: 'NEGATIVE',
                    isAvailable: false,
                    aiReputationScore: 0.55,
                    totalSuccessfulDonations: 0,
                    reputationScore: 550,
                },
            },
        ]

        for (const d of donors) {
            const createdUser = await prisma.user.create({
                data: {
                    email: d.email,
                    passwordHash: await bcrypt.hash(d.passwordHash, 10),
                    name: d.name,
                    phone: d.phone,
                    role: d.role as UserRole,
                    verificationStatus: d.verificationStatus as VerificationStatus,
                },
            })

            await prisma.donorProfile.create({
                data: {
                    userId: createdUser.id,
                    bloodType: d.donorProfile.bloodType as any,
                    rhFactor: d.donorProfile.rhFactor as any,
                    isAvailable: d.donorProfile.isAvailable,
                    aiReputationScore: d.donorProfile.aiReputationScore,
                    totalSuccessfulDonations: d.donorProfile.totalSuccessfulDonations,
                    reputationScore: d.donorProfile.reputationScore,
                },
            })

            logger.info(`➕ Created donor ${createdUser.email}`)
        }

        logger.info('✅ Database seeding completed')
    } catch (error) {
        logger.error('Database seeding failed:', error as Error)
    } finally {
        // Make sure the process isn't left hanging in case this is run standalone
        try {
            await prisma.$disconnect()
        } catch (e) {
            // ignore
        }
    }
}

// Run seed on startup if invoked directly
if (require.main === module) {
    seedDatabase().then(() => process.exit(0))
}
