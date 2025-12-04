// src/lib/services/blockchain.service.ts

import {Contract, ethers, Signer} from 'ethers'
import {Logger} from '@/lib/utils/logger'
import {BlockchainError, IBlockchainConfig, IDonationRecord,} from '@/types'

/**
 * BLOCKCHAIN SERVICE
 * Smart contract interactions and blockchain operations
 */

export class BlockchainService {
    private logger: Logger = new Logger('BlockchainService')
    private provider: ethers.JsonRpcProvider | null = null
    private signer: Signer | null = null
    private contract: Contract | null = null
    private tokenContract: Contract | null = null
    private config: IBlockchainConfig

    constructor(config?: IBlockchainConfig) {
        this.config = config || {
            rpcUrl: process.env.ETHEREUM_RPC_URL || '',
            privateKey: process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY || '',
            contractAddress: process.env.SMART_CONTRACT_ADDRESS || '',
            tokenAddress: process.env.REWARD_TOKEN_ADDRESS || '',
            chainId: parseInt(process.env.CHAIN_ID || '137'),
            gasLimit: 300000,
        }
    }

    /**
     * Initialize blockchain connection
     */
    async initialize(): Promise<void> {
        try {
            if (this.contract) return; // Already initialized

            this.logger.info('Initializing blockchain connection...')

            // Create provider
            this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl)

            // Create signer
            this.signer = new ethers.Wallet(this.config.privateKey, this.provider)

            // PATCH: Added missing 'getDonorProfile' to ABI so it can be called
            const mainAbi = [
                'function recordDonationWithAutoVerification(uint256 requestId, address donor, uint26 unitsCollected, string memory ipfsProof, address[] memory verifiers, bytes[] memory signatures) external',
                'function createBloodRequest(string memory bloodType, uint256 unitsNeeded, uint256 urgencyLevel, string memory medicalProofIPFS, uint256 expirationTime) external',
                'function detectAndReportFraud(address user, string memory fraudType, address[] memory witnesses) external',
                // Added View Functions
                'function getDonorProfile(address donor) external view returns (uint256 reputation, bool isVerified)',
            ]

            this.contract = new ethers.Contract(
                this.config.contractAddress,
                mainAbi,
                this.signer
            )

            const tokenAbi = [
                'function transfer(address to, uint256 amount) external returns (bool)',
                'function balanceOf(address account) external view returns (uint256)'
            ];

            this.tokenContract = new ethers.Contract(
                this.config.tokenAddress,
                tokenAbi,
                this.signer
            );

            // Verify connection
            const network = await this.provider.getNetwork()
            this.logger.info('Blockchain connected', {
                network: network.name,
                chainId: network.chainId.toString(),
            })
        } catch (error) {
            this.logger.error('Blockchain initialization failed', error as Error)
            throw new BlockchainError('Failed to initialize blockchain connection')
        }
    }

    /**
     * Transfer ERC-20 reward tokens to a user
     */
    async transferTokens(toAddress: string, amount: number): Promise<string> {
        try {
            await this.initialize();

            // Assuming 18 decimals
            const txAmount = ethers.parseUnits(amount.toString(), 18);

            this.logger.info('Transferring reward tokens', {
                to: toAddress,
                amount: amount,
            });

            const tx = await this.tokenContract!.transfer(
                toAddress,
                txAmount,
                {gasLimit: this.config.gasLimit}
            );

            const receipt = await tx.wait();
            const txHash = receipt?.hash || '';

            this.logger.info('Token transfer successful', {
                transactionHash: txHash,
            });

            return txHash;
        } catch (error) {
            this.logger.error('Failed to transfer tokens', error as Error);
            throw new BlockchainError('Failed to transfer reward tokens');
        }
    }

    /**
     * Record donation on blockchain
     */
    async recordDonation(
        donation: IDonationRecord,
        ipfsProof: string,
        signatures: string[]
    ): Promise<string> {
        try {
            await this.initialize();

            const {recordId, donor, unitsCollected, verifiers} = donation

            this.logger.info('Recording donation on blockchain', {
                requestId: recordId,
                donor,
                unitsCollected,
            })

            const tx = await this.contract!.recordDonationWithAutoVerification(
                recordId,
                donor,
                unitsCollected,
                ipfsProof,
                verifiers,
                signatures,
                {gasLimit: this.config.gasLimit}
            )

            const receipt = await tx.wait()

            this.logger.info('Donation recorded successfully', {
                transactionHash: receipt?.hash,
                blockNumber: receipt?.blockNumber,
            })

            return receipt?.hash || ''
        } catch (error) {
            this.logger.error('Failed to record donation', error as Error)
            throw new BlockchainError('Failed to record donation on blockchain')
        }
    }

    /**
     * Create blood request on blockchain
     */
    async createBloodRequest(
        bloodType: string,
        unitsNeeded: number,
        urgencyLevel: number,
        medicalProofIPFS: string,
        expirationTime: number
    ): Promise<string> {
        try {
            await this.initialize();

            const tx = await this.contract!.createBloodRequest(
                bloodType,
                unitsNeeded,
                urgencyLevel,
                medicalProofIPFS,
                expirationTime,
                {gasLimit: this.config.gasLimit}
            )

            const receipt = await tx.wait()
            return receipt?.hash || ''
        } catch (error) {
            this.logger.error('Failed to create blood request', error as Error)
            throw new BlockchainError('Failed to create blood request on blockchain')
        }
    }

    /**
     * Sign data for multi-signature verification
     */
    signData(data: string): string {
        try {
            // Note: Does not require async initialize if signer was passed in config,
            // but usually safe to assume we need the private key from config.
            // For stateless signing, we just use the wallet directly.
            const wallet = new ethers.Wallet(this.config.privateKey);

            const messageHash = ethers.id(data)
            // Use signing key directly for raw signature
            const signingKey = wallet.signingKey;
            const signature = signingKey.sign(messageHash);

            return ethers.Signature.from(signature).serialized
        } catch (error) {
            this.logger.error('Failed to sign data', error as Error)
            throw new BlockchainError('Failed to sign data')
        }
    }

    /**
     * Get donor reputation from blockchain
     */
    async getDonorReputation(donorAddress: string): Promise<number> {
        try {
            await this.initialize();

            // PATCH: Now this call will work because we added it to the ABI
            const result = await this.contract!.getDonorProfile(donorAddress);
            // Result is [reputation, isVerified]
            return Number(result[0]);
        } catch (error) {
            this.logger.error('Failed to get donor reputation', error as Error)
            // Fallback for UI if blockchain call fails
            return 0;
        }
    }

    /**
     * Report fraud on blockchain
     */
    async reportFraud(
        user: string,
        fraudType: string,
        witnesses: string[]
    ): Promise<string> {
        try {
            await this.initialize();

            const tx = await this.contract!.detectAndReportFraud(
                user,
                fraudType,
                witnesses,
                {gasLimit: this.config.gasLimit}
            )

            const receipt = await tx.wait()
            return receipt?.hash || ''
        } catch (error) {
            this.logger.error('Failed to report fraud', error as Error)
            throw new BlockchainError('Failed to report fraud')
        }
    }
}

export const blockchainService = new BlockchainService()