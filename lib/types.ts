export type Environment = "mainnet" | "testnet"

export interface ApiKey {
  id: string
  name: string
  description?: string
  key: string
  environment: Environment
  status: "active" | "revoked"
  createdAt: string
  lastUsed?: string
  userId: string
}

export interface User {
  id: string
  email: string
  name?: string
  emailVerified: boolean
  createdAt: string
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      emailVerified: boolean
    }
  }

  interface User {
    emailVerified: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    emailVerified: boolean
  }
}
