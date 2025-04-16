'use client'

import { useEffect } from "react"
import { RoomList } from "@/components/room-list"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"

export default function RoomListingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);


  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="h-12 w-12 text-red-500" />
          <h2 className="text-lg font-semibold">Authentication Required</h2>
          <p className="text-gray-500 text-center max-w-md">
            You need to be signed in to access this page
          </p>
          <Button onClick={() => router.push('/')}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center justify-center bg-muted/20 rounded-lg p-12">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Select a room</h3>
        <p className="text-muted-foreground">
          Choose a room from the list or create a new one to start chatting
        </p>
      </div>
    </div>
  );
}