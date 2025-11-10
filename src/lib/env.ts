import { z } from 'zod'

// Centralized environment validation
// In production, missing required envs will throw at startup.

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // App
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required in production').optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Database
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }).optional(),

  // Redis / Rate limit
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),

  // Blockchain
  ETHEREUM_RPC_URL: z.string().optional(),
  BLOCKCHAIN_SIGNER_PRIVATE_KEY: z.string().optional(),
  SMART_CONTRACT_ADDRESS: z.string().optional(),
  REWARD_TOKEN_ADDRESS: z.string().optional(),
  CHAIN_ID: z.string().optional(),

  // Logging
  LOG_DIR: z.string().optional(),
  LOG_TO_FILE: z.string().optional(), // 'true' to write logs to disk
}).transform((env) => {
  // Force requirements in production
  const isProd = env.NODE_ENV === 'production'

  function requireIfProd(name: keyof typeof env) {
    if (isProd && (!env[name] || String(env[name]).length === 0)) {
      throw new Error(`Missing required environment variable: ${name}`)
    }
  }

  requireIfProd('NEXTAUTH_SECRET')
  requireIfProd('DATABASE_URL')

  return env
})

export const env = EnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,

  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  DATABASE_URL: process.env.DATABASE_URL,

  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,

  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL,
  BLOCKCHAIN_SIGNER_PRIVATE_KEY: process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY,
  SMART_CONTRACT_ADDRESS: process.env.SMART_CONTRACT_ADDRESS,
  REWARD_TOKEN_ADDRESS: process.env.REWARD_TOKEN_ADDRESS,
  CHAIN_ID: process.env.CHAIN_ID,

  LOG_DIR: process.env.LOG_DIR,
  LOG_TO_FILE: process.env.LOG_TO_FILE,
})

export const isProd = env.NODE_ENV === 'production'
