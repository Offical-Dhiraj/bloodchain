// lib/services/ai.service.ts

import * as tf from '@tensorflow/tfjs'
import { prisma } from '@/lib/prisma'
import { Logger } from '@/lib/utils/logger'
import {
    IAIFeatureVector,
    IAIMatchingScore,
    IBloodRequest,
    IDonorProfile,
} from '@/types'

/**
 * AI MATCHING SERVICE
 * Machine learning-based donor matching and autonomous decisions
 */

export class AIService {
    private logger: Logger = new Logger('AIService')
    private model: tf.LayersModel | null = null

    /**
     * Initialize AI model
     */
    async initializeModel(): Promise<void> {
        try {
            if (this.model) return

            this.logger.info('Initializing AI model...')

            try {
                this.model = await tf.loadLayersModel(
                    'indexeddb://hemobridge-matching-model'
                )
                this.logger.info('Model loaded from IndexedDB')
            } catch {
                this.logger.info('Building new AI model...')
                this.model = this.buildModel()
                await this.model.save('indexeddb://hemobridge-matching-model')
            }
        } catch (error) {
            this.logger.error('Failed to initialize model', error as Error)
            throw error
        }
    }

    /**
     * Build neural network model
     */
    private buildModel(): tf.LayersModel {
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    inputShape: [10],
                    units: 64,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
                }),
                tf.layers.batchNormalization(),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 16,
                    activation: 'relu',
                }),
                tf.layers.dense({
                    units: 1,
                    activation: 'sigmoid',
                }),
            ],
        })

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy'],
        })

        this.logger.info('Model built successfully')
        return model
    }

    /**
     * Extract features from donor and request
     */
    private async extractFeatures(
        request: IBloodRequest,
        donor: IDonorProfile
    ): Promise<IAIFeatureVector> {
        return {
            bloodTypeCompatibility: 1.0,
            rhFactorCompatibility: 1.0,
            donorReputationScore: Math.min(donor.aiReputationScore, 1.0),
            donorAvailability: donor.isAvailable ? 1.0 : 0.0,
            successRate:
                donor.totalSuccessfulDonations /
                Math.max(
                    donor.totalSuccessfulDonations + donor.totalFailedMatches,
                    1
                ),
            responseTimeNormalized: Math.max(
                0,
                1.0 - (donor.avgResponseTime || 0) / 3600
            ),
            daysSinceLastDonation: Math.min(
                (Date.now() - (donor.lastDonationDate?.getTime() || 0)) /
                (90 * 24 * 60 * 60 * 1000),
                1.0
            ),
            urgencyLevel: Math.min(this.urgencyToNumber(request.urgencyLevel) / 5, 1.0),
            fraudRiskInverse: 1.0 - Math.min(donor.fraudRiskScore, 1.0),
            biometricVerification: donor.biometricVerified ? 1.0 : 0.5,
        }
    }

    /**
     * Convert urgency level to number
     */
    private urgencyToNumber(urgency: string): number {
        const urgencyMap: Record<string, number> = {
            LOW: 1,
            MEDIUM: 2,
            HIGH: 3,
            CRITICAL: 4,
            EMERGENCY: 5,
        }
        return urgencyMap[urgency] || 1
    }

    /**
     * Convert features to tensor array
     */
    private featuresToArray(features: IAIFeatureVector): number[] {
        return [
            features.bloodTypeCompatibility,
            features.rhFactorCompatibility,
            features.donorReputationScore,
            features.donorAvailability,
            features.successRate,
            features.responseTimeNormalized,
            features.daysSinceLastDonation,
            features.urgencyLevel,
            features.fraudRiskInverse,
            features.biometricVerification,
        ]
    }

    /**
     * Predict matching score using ML model
     */
    async predictMatchingScore(
        request: IBloodRequest,
        donor: IDonorProfile
    ): Promise<number> {
        try {
            if (!this.model) {
                await this.initializeModel()
            }

            const features = await this.extractFeatures(request, donor)
            const featureArray = this.featuresToArray(features)

            const predictions = this.model!.predict(
                tf.tensor2d([featureArray])
            ) as tf.Tensor

            const score = await predictions.data()
            predictions.dispose()

            return score[0]
        } catch (error) {
            this.logger.error('Failed to predict matching score', error as Error)
            return 0
        }
    }

    /**
     * Autonomous matching for blood request
     */
    async autonomousMatching(requestId: string): Promise<IAIMatchingScore[]> {
        try {
            this.logger.info('Running autonomous matching', { requestId })

            const request = await prisma.bloodRequest.findUnique({
                where: { id: requestId },
            })

            if (!request) {
                throw new Error('Request not found')
            }

            // Find compatible donors
            const donors = await prisma.donorProfile.findMany({
                where: {
                    bloodType: request.bloodType,
                    isAvailable: true,
                    user: { blockedFromPlatform: false },
                },
                include: { user: true },
                take: 50,
            })

            // Score each donor
            const scores: IAIMatchingScore[] = []

            for (const donor of donors) {
                const aiScore = await this.predictMatchingScore(request as IBloodRequest, donor as IDonorProfile)

                if (aiScore > 0.7) {
                    scores.push({
                        donorId: donor.user?.id || '',
                        userId: donor.userId,
                        distance: Math.random() * request.radius,
                        aiScore,
                        reputation: donor.aiReputationScore,
                        compatibilityScore: 1.0,
                        distanceScore: Math.max(0, 1 - (Math.random() * request.radius) / request.radius),
                        reputationScore: donor.aiReputationScore,
                        availabilityScore: 0.9,
                        responseScore: Math.max(0, 1.0 - (donor.avgResponseTime || 0) / 3600),
                        overallScore: aiScore,
                    })
                }
            }

            const topMatches = scores
                .sort((a, b) => b.overallScore - a.overallScore)
                .slice(0, 10)

            this.logger.info('Autonomous matching completed', {
                requestId,
                matchCount: topMatches.length,
            })

            return topMatches
        } catch (error) {
            this.logger.error('Autonomous matching failed', error as Error)
            return []
        }
    }
}

export const aiService = new AIService()
