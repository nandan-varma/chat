'use client'

import { SendMessage } from "@/components/send-message"
import { useEffect, useState } from "react"
import { MessageList } from "@/components/message-view"
import { RoomList } from "@/components/room-list"
import { Msg } from "@/lib/data"
import { GetMessagesFromFirebase } from "@/lib/db"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, MoveLeft, ShieldAlert } from "lucide-react"
import { use } from 'react'

export default function RoomPage({
  params,
}: {
  params: Promise<{ RoomID: string }>
}) {
  const { RoomID: roomId } = use(params);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch messages when authenticated and room ID is available
  useEffect(() => {
    if (user && roomId) {
      const unsubscribe = GetMessagesFromFirebase(roomId, (msgs) => {
        setMessages(msgs);
        setIsLoading(false);
      });

      // Return cleanup function
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [roomId, user]);

  const handleNewMessage = (msg: Msg) => {
    setMessages((prevMsgs) => [...prevMsgs, msg]);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Logging in...</p>
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

    <div className="flex flex-col h-full">
      {/* Header with room info */}
      <div className="p-4 fixed backdrop-blur-md z-10 w-[calc(100%-200px)] border-b flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="font-semibold text-lg">Room: {roomId}</h2>
          <p className="text-xs text-gray-500">Logged in as {user?.email}</p>
        </div>
        <Button
          size="sm"
          onClick={() => router.push('/')}
          className="ml-4"
        >
          <MoveLeft className="mr-2" />
          <span className="hidden md:inline">Back to Rooms</span>
        </Button>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-auto pt-14 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <MessageList username={user.email || "Anonymous"} msgs={messages} />
        )}
      </div>

      {/* Send message component */}
      <div className="sticky bottom-0 w-full border-t bg-background">
        <SendMessage
          room_id={roomId}
          username={user.email || "Anonymous"}
          SendNewMessage={handleNewMessage}
        />
      </div>
    </div>
  );
}

