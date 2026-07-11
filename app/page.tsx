'use client'

import { useAuth } from '@/components/auth-provider'
import { AuthForm } from '@/components/auth-form'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/room')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (user) return null

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
          </div>
          <p className="text-sm text-muted-foreground">Encrypted real-time messaging</p>
        </div>
        <AuthForm />
      </div>
    </main>
  )
}
