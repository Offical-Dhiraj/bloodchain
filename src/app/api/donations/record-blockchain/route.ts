import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { blockchainService } from '@/lib/services/blockchain.service'
import { Logger } from '@/lib/utils/logger'
import {
    IApiResponse,
    IDonationRecord,
    IDonationRecordDto,
    ValidationError,
    BlockchainError,
} from '@/types'

const logger = new Logger('DonationAPI')

export async function POST(
    request: NextRequest
): Promise<NextResponse<IApiResponse<any>>> {
    let donationId: string | null = null // Variable to hold the ID for cleanup

    try {
        logger.info('POST /api/donations/record-blockchain')

        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized',
                    statusCode: 401,
                    timestamp: new Date(),
                },
                { status: 401 }
            )
        }

        const body: IDonationRecordDto = await request.json()

        // 1. Get match details
        const match = await prisma.requestMatch.findUnique({
            where: { id: body.matchId },
            include: {
                request: true,
            },
        })

        if (!match) {
            throw new ValidationError('Match not found')
        }

        // 2. Create preliminary donation record in DB to get an ID
        const preliminaryDonation = await prisma.donation.create({
            data: {
                matchId: body.matchId,
                donorId: match.donorId,
                requestId: match.requestId,
                bloodType: match.request.bloodType as any,
                rhFactor: match.request.rhFactor,
                unitsCollected: body.unitsCollected,
                status: 'PENDING' as any, // Pending blockchain confirmation
                blockchainVerified: false,
                rewardTokensIssued: 0,
                nftMinted: false,
            },
        })

        donationId = preliminaryDonation.id // Store the ID

        // 3. Prepare the data for the blockchain service
        //    This now correctly uses the numeric ID from the record we just created.
        const donationDataForContract: IDonationRecord = {
            recordId: preliminaryDonation.id, // This is a number!
            donor: preliminaryDonation.donorId,
            recipient: match.request.recipientId,
            bloodType: preliminaryDonation.bloodType,
            unitsCollected: preliminaryDonation.unitsCollected,
            verifiers: [], // Your original logic passed an empty array

            // Fill in the rest of the interface
            timestamp: Math.floor(preliminaryDonation.createdAt.getTime() / 1000),
            verified: false,
            rewardIssued: 0,
            nftMinted: false,
        };

        // 4. Initialize and call the blockchain service
        await blockchainService.initialize()
        const transactionHash = await blockchainService.recordDonation(
            donationDataForContract,
            body.ipfsProofHash,
            body.verifierSignatures
        )

        // 5. Update the donation record with blockchain data
        const rewardAmount = body.unitsCollected * 100
        await prisma.donation.update({
            where: { id: donationId },
            data: {
                status: 'COMPLETED' as any,
                transactionHash,
                blockchainVerified: true,
                rewardTokensIssued: rewardAmount,
                nftMinted: true,
            },
        })

        // 6. Update donor profile
        await prisma.donorProfile.update({
            where: { userId: match.donorId },
            data: {
                totalSuccessfulDonations: { increment: 1 },
                totalRewardsEarned: { increment: rewardAmount },
            },
        })

        logger.info('Donation recorded successfully', {
            donationId: donationId,
            transactionHash,
        })

        return NextResponse.json(
            {
                success: true,
                data: {
                    donationId: donationId,
                    transactionHash,
                    rewardIssued: rewardAmount,
                    nftMinted: true,
                },
                message: 'Donation recorded successfully',
                statusCode: 201,
                timestamp: new Date(),
            },
            { status: 201 }
        )
    } catch (error) {
        logger.error('Failed to record donation', error as Error)

        // **CRITICAL:** If blockchain call fails, roll back the DB entry
        if (error instanceof BlockchainError && donationId) {
            await prisma.donation.delete({ where: { id: donationId } })

            return NextResponse.json(
                {
                    success: false,
                    error: `Blockchain transaction failed: ${error.message}. Donation record rolled back.`,
                    statusCode: 500,
                    timestamp: new Date(),
                },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                statusCode: 500,
                timestamp: new Date(),
            },
            { status: 500 }
        )
    }
}