'use client'

import { useAuth } from '@/components/auth-provider'
import { AuthForm } from '@/components/auth-form'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const navigateToChat = () => {
    router.push('/room');
  };

  return (
    <section className="w-full h-screen flex items-center justify-center relative overflow-hidden py-12 md:py-24 lg:py-32 xl:py-48">
      {/* Decorative shapes */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-300 mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-yellow-300 mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-pink-300 mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="container px-4 md:px-6 z-10">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-lg">Loading...</p>
            </div>
          ) : user ? (
            <>
              <div className="space-y-3 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome back to Chats
                  <span className="text-lg tracking-normal font-normal border-b ml-2">
                    ALPHA
                  </span>
                </h1>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Logged in as <span className="font-semibold">{user.email}</span>
                </p>
              </div>
              
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
                <Button onClick={navigateToChat} size="lg">
                  Go to Chat Rooms
                </Button>
                <Button onClick={logout} variant="outline" size="lg">
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome to Chats
                  <span className="text-lg tracking-normal font-normal border-b ml-2">
                    ALPHA
                  </span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Sign in to start chatting with your friends and colleagues
                </p>
              </div>
              
              <div className="w-full max-w-md backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 p-6 rounded-xl shadow-lg">
                <AuthForm />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
