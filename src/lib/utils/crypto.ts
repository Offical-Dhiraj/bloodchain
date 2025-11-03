// lib/utils/crypto.ts

import crypto from 'crypto'
import { createHash, createHmac } from 'crypto'

/**
 * CRYPTOGRAPHIC UTILITIES
 * Secure hashing, encryption, and signing
 */

export class CryptoUtil {
    /**
     * Hash a string using SHA-256
     */
    static hash(data: string): string {
        return createHash('sha256').update(data).digest('hex')
    }

    /**
     * Create HMAC signature
     */
    static hmac(data: string, secret: string): string {
        return createHmac('sha256', secret).update(data).digest('hex')
    }

    /**
     * Generate random token
     */
    static generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex')
    }

    /**
     * Encrypt data with AES-256-GCM
     */
    static encrypt(data: string, key: string): string {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            Buffer.from(key, 'hex'),
            iv
        )

        let encrypted = cipher.update(data, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        const authTag = cipher.getAuthTag()
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    }

    /**
     * Decrypt data with AES-256-GCM
     */
    static decrypt(encryptedData: string, key: string): string {
        const [iv, authTag, encrypted] = encryptedData.split(':')

        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(key, 'hex'),
            Buffer.from(iv, 'hex')
        )

        decipher.setAuthTag(Buffer.from(authTag, 'hex'))

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    }

    /**
     * Generate Merkle root from proofs
     */
    static generateMerkleRoot(data: string[]): string {
        if (data.length === 0) return ''

        let leaves = data.map((item) => this.hash(item))

        while (leaves.length > 1) {
            const newLeaves: string[] = []
            for (let i = 0; i < leaves.length; i += 2) {
                const left = leaves[i]
                const right = leaves[i + 1] || leaves[i]
                newLeaves.push(this.hash(left + right))
            }
            leaves = newLeaves
        }

        return leaves[0]
    }

    /**
     * Verify Merkle proof
     */
    static verifyMerkleProof(
        leaf: string,
        proof: string[],
        root: string
    ): boolean {
        let computed = this.hash(leaf)

        for (const proofElement of proof) {
            computed = this.hash(computed + proofElement)
        }

        return computed === root
    }

    /**
     * Generate public/private key pair
     */
    static generateKeyPair(): { publicKey: string; privateKey: string } {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'secp256k1',
        })

        return {
            publicKey: publicKey
                .export({ format: 'pem', type: 'spki' })
                .toString('hex'),
            privateKey: privateKey
                .export({ format: 'pem', type: 'pkcs8' })
                .toString('hex'),
        }
    }

    /**
     * Sign data with private key
     */
    static sign(data: string, privateKey: string): string {
        const sign = crypto.createSign('SHA256')
        sign.update(data)
        return sign.sign(Buffer.from(privateKey, 'hex')).toString('hex')
    }

    /**
     * Verify signature with public key
     */
    static verifySignature(
        data: string,
        signature: string,
        publicKey: string
    ): boolean {
        const verify = crypto.createVerify('SHA256')
        verify.update(data)
        return verify.verify(
            Buffer.from(publicKey, 'hex'),
            Buffer.from(signature, 'hex')
        )
    }
}
