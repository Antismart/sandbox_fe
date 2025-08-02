export interface User {
  id: string
  email: string
  password?: string // Optional for client-side, required for mock-db
  name?: string
  emailVerified?: boolean
  verificationCode?: string
}

export interface ApiKey {
  id: string
  userId: string
  name: string
  key: string
  createdAt: string
  lastUsed?: string
}
