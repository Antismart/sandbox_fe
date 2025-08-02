import type { NextAuthOptions } from "next-auth"

// Simple mock authentication without CredentialsProvider
export const authOptions: NextAuthOptions = {
  providers: [
    // Using a custom provider approach to avoid import issues
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Mock user validation - replace with real database logic
        if (credentials.email && credentials.password) {
          return {
            id: "1",
            email: credentials.email,
            name: "Demo User",
            emailVerified: true,
          }
        }

        return null
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.emailVerified = user.emailVerified
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.emailVerified = token.emailVerified as boolean
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === "development",
}
