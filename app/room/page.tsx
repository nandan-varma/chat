'use client'

import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"

export default function RoomListingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) return null

  return (
    <div className="flex items-center justify-center h-full text-center px-6">
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">No room selected</p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a room from the sidebar to start chatting
          </p>
        </div>
      </div>
    </div>
  )
}
