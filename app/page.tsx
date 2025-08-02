import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Modern React Dashboard</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Please login or sign up to continue.
      </p>
      <div className="flex gap-4">
        <a href="/auth/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Login
        </a>
        <a href="/auth/signup" className="px-\
