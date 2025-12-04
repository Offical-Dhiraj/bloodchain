import {NextRequest, NextResponse} from 'next/server'
import {getServerSession} from 'next-auth'
import {authOptions} from '@/lib/auth'
import {prisma} from '@/lib/prisma'
import {blockchainService} from '@/lib/services/blockchain.service'
import {rewardService} from '@/lib/services/reward.service'
import {reputationService} from '@/lib/services/reputation.service'
import {Logger} from '@/lib/utils/logger'
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
    let donationId: string | null = null

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
                {status: 401}
            )
        }

        const body: IDonationRecordDto = await request.json()

        // 1. Get match details
        const match = await prisma.requestMatch.findUnique({
            where: {id: body.matchId},
            include: {
                request: true,
            },
        })

        if (!match) {
            throw new ValidationError('Match not found')
        }

        // 2. Create preliminary donation record
        const preliminaryDonation = await prisma.donation.create({
            data: {
                matchId: body.matchId,
                donorId: match.donorId,
                requestId: match.requestId,
                bloodType: match.request.bloodType as any,
                rhFactor: match.request.rhFactor,
                unitsCollected: body.unitsCollected,
                status: 'PENDING' as any,
                blockchainVerified: false,
                rewardTokensIssued: 0,
                nftMinted: false,
            },
        })

        donationId = preliminaryDonation.id

        // 3. Prepare blockchain data
        const donationDataForContract: IDonationRecord = {
            recordId: preliminaryDonation.id,
            donor: preliminaryDonation.donorId,
            recipient: match.request.recipientId,
            bloodType: preliminaryDonation.bloodType,
            unitsCollected: preliminaryDonation.unitsCollected,
            verifiers: [],
            timestamp: Math.floor(preliminaryDonation.createdAt.getTime() / 1000),
            verified: false,
            rewardIssued: 0,
            nftMinted: false,
        };

        // 4. Record on Blockchain
        await blockchainService.initialize()
        const transactionHash = await blockchainService.recordDonation(
            donationDataForContract,
            body.ipfsProofHash,
            body.verifierSignatures
        )

        // 5. Issue Rewards via Service
        const rewardAmount = body.unitsCollected * 100
        await rewardService.issueTokenReward({
            userId: match.donorId,
            eventType: 'DONATION_COMPLETED',
            amount: rewardAmount,
            description: `Reward for donation ${donationId}`
        })

        // 6. Update Reputation via Service
        await reputationService.recordEvent({
            userId: match.donorId,
            eventType: 'SUCCESSFUL_DONATION',
            points: 100,
            multiplier: match.request.urgencyLevel === 'EMERGENCY' ? 2 : 1
        })

        // 7. Check for NFT Milestones
        // Example: Check if user reached 10 donations
        const donorStats = await reputationService.getStats(match.donorId)
        if (donorStats.totalDonations % 10 === 0) {
            await rewardService.mintNFTBadge(match.donorId, 'GOLD_DONOR')
        }

        // 8. Finalize Record
        await prisma.donation.update({
            where: {id: donationId},
            data: {
                status: 'COMPLETED' as any,
                transactionHash,
                blockchainVerified: true,
                rewardTokensIssued: rewardAmount,
                nftMinted: true,
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
            {status: 201}
        )
    } catch (error) {
        logger.error('Failed to record donation', error as Error)

        if (error instanceof BlockchainError && donationId) {
            await prisma.donation.delete({where: {id: donationId}})

            return NextResponse.json(
                {
                    success: false,
                    error: `Blockchain transaction failed: ${error.message}. Donation record rolled back.`,
                    statusCode: 500,
                    timestamp: new Date(),
                },
                {status: 500}
            )
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                statusCode: 500,
                timestamp: new Date(),
            },
            {status: 500}
        )
    }
}