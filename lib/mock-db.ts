import type { User, ApiKey } from "./types"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"

// In-memory mock database
const users: User[] = []
const apiKeys: ApiKey[] = []

// Utility to generate a random 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// User functions
export function getUserByEmail(email: string): User | undefined {
  return users.find((user) => user.email === email)
}

export function getUserById(id: string): User | undefined {
  return users.find((user) => user.id === id)
}

export function createUser(email: string, passwordPlain: string): User | undefined {
  if (getUserByEmail(email)) {
    return undefined // User already exists
  }

  const hashedPassword = bcrypt.hashSync(passwordPlain, 10)
  const verificationCode = generateVerificationCode()

  const newUser: User = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    emailVerified: false,
    verificationCode,
  }
  users.push(newUser)
  console.log(`User created: ${email}. Verification code: ${verificationCode}`) // Log code for testing
  return newUser
}

export function verifyUserEmail(email: string, code: string): boolean {
  const user = getUserByEmail(email)
  if (user && user.verificationCode === code && !user.emailVerified) {
    user.emailVerified = true
    user.verificationCode = undefined // Clear code after verification
    console.log(`Email ${email} verified successfully.`)
    return true
  }
  return false
}

export function resendVerificationCode(email: string): boolean {
  const user = getUserByEmail(email)
  if (user && !user.emailVerified) {
    const newCode = generateVerificationCode()
    user.verificationCode = newCode
    console.log(`New verification code for ${email}: ${newCode}`) // Log new code
    return true
  }
  return false
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

// API Key functions
export function getApiKeysByUserId(userId: string): ApiKey[] {
  return apiKeys.filter((key) => key.userId === userId)
}

export function getApiKeyById(id: string): ApiKey | undefined {
  return apiKeys.find((key) => key.id === id)
}

export function createApiKey(userId: string, name: string): ApiKey {
  const newKey: ApiKey = {
    id: uuidv4(),
    userId,
    name,
    key: generateApiKey(),
    createdAt: new Date().toISOString(),
  }
  apiKeys.push(newKey)
  return newKey
}

export function updateApiKey(updatedKey: ApiKey): void {
  const index = apiKeys.findIndex((key) => key.id === updatedKey.id)
  if (index !== -1) {
    apiKeys[index] = updatedKey
  }
}

export function deleteApiKey(id: string): boolean {
  const initialLength = apiKeys.length
  const updatedKeys = apiKeys.filter((key) => key.id !== id)
  apiKeys.length = 0 // Clear existing array
  apiKeys.push(...updatedKeys) // Push filtered keys back
  return apiKeys.length < initialLength
}

export function generateApiKey(): string {
  return uuidv4().replace(/-/g, "") + uuidv4().replace(/-/g, "") // Generate a longer key
}
