import { NextAuth } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getUserByEmail, verifyPassword } from "./mock-db"
import type { User } from "./types"

const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/signup",
    verifyRequest: "/auth/verify-email",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email and password are required")
        }

        const user = getUserByEmail(credentials.email as string)

        if (!user) {
          throw new Error("No user found with this email")
        }

        if (!user.emailVerified) {
          throw new Error("Email not verified. Please check your email for a verification code.")
        }

        const isValidPassword = await verifyPassword(credentials.password as string, user.password)

        if (!isValidPassword) {
          throw new Error("Invalid password")
        }

        return { id: user.id, email: user.email, name: user.name } as User
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      if (pathname.startsWith("/dashboard")) return !!auth
      return true
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
})

export { handlers, signIn, signOut, auth }
