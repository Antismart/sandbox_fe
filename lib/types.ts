export type User = {
  id: string
  name: string
  email: string
  password?: string
  emailVerified?: boolean
  verificationCode?: string
}

export type ApiKey = {
  id: string
  userId: string
  name: string
  key: string
  createdAt: string
}
