'use client'

import { SendMessage } from "@/components/send-message"
import { useEffect, useState } from "react"
import { MessageList } from "@/components/message-view"
import { RoomList } from "@/components/room-list"
import { Msg, Room } from "@/lib/data"
import { GetMessagesFromFirebase, GetRoomsFromFirebase } from "@/lib/db"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, MoveLeft, ShieldAlert } from "lucide-react"
import { use } from 'react'
import { hasRoomPassword, getRoomPassword } from "@/lib/encryption"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RoomPage({
  params,
}: {
  params: Promise<{ RoomID: string }>
}) {
  const { RoomID: roomId } = use(params);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(true);
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  
  // Function to load messages once we have appropriate access
  const loadMessages = () => {
    if (user && roomId) {
      setIsPasswordValid(true); // Consider password valid when loading messages
      const unsubscribe = GetMessagesFromFirebase(roomId, (msgs) => {
        setMessages(msgs);
        setIsLoading(false);
      });

      return unsubscribe;
    }
  };
  // Check for room details and if it's password protected
  useEffect(() => {
    if (user && roomId) {
      // Get room details to check if password protected
      const unsubscribe = GetRoomsFromFirebase((rooms) => {
        const room = rooms.find(r => r.id === roomId);
        setCurrentRoom(room || null);
        
        // If room requires password and we don't have it, show prompt
        if (!hasRoomPassword(roomId)) {
          setPasswordPromptOpen(true);
        } else {
          // If we have the password or room doesn't need one, load messages
          loadMessages();
        }
      });
      
      return unsubscribe;
    }
  }, [roomId, user, loadMessages]);


  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }
    
    // Try to decrypt a test message or verify password some other way
    try {
      // Store the password temporarily
      const roomKey = `room_${roomId}`;
      localStorage.setItem(roomKey, password);
      
      // Check if we can load and decrypt messages with this password
      const testLoadResult = await new Promise<boolean>((resolve) => {
        const unsub = GetMessagesFromFirebase(roomId, (msgs) => {
          unsub(); // Unsubscribe immediately as we only want to test
          
          // If there are no messages, we can't validate the password
          if (msgs.length === 0) {
            resolve(true); // Allow access if no messages to test against
            return;
          }
          
          // Find an encrypted message to test
          const encryptedMsg = msgs.find(m => m.encrypted);
          if (!encryptedMsg) {
            resolve(true); // No encrypted messages, password is likely correct
            return;
          }
          
          // We have a message to test against - this will be validated in the MessageList component
          // For now, assume password is valid and let the message decryption handle errors
          resolve(true);
        });
      });
      
      if (testLoadResult) {
        // Password seems valid, close dialog and load messages
        setPasswordPromptOpen(false);
        setIsPasswordValid(true);
        loadMessages();
      } else {
        // Password appears to be invalid
        setPasswordError("Incorrect password. Please try again.");
        setIsPasswordValid(false);
        localStorage.removeItem(roomKey); // Remove the invalid password
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      setPasswordError("Could not verify password. Please try again.");
      setIsPasswordValid(false);
      const roomKey = `room_${roomId}`;
      localStorage.removeItem(roomKey); // Remove the potentially invalid password
    }
  };

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
      {/* Password prompt dialog */}
      <Dialog open={passwordPromptOpen} onOpenChange={setPasswordPromptOpen}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Enter Room Password</DialogTitle>
            <DialogDescription>
              This chat room is password-protected. Enter the password to view messages.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomPassword" className="text-right">
                Password
              </Label>
              <Input
                id="roomPassword"
                type="password"
                className="col-span-3"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
              />
            </div>
            {passwordError && (
              <div className="text-red-500 text-sm text-center">
                {passwordError}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.push('/room')}>
                Cancel
              </Button>
              <Button type="submit">
                Enter Room
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Header with room info */}
      <div className="p-4 fixed backdrop-blur-md z-10 w-[calc(100%-200px)] border-b flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="font-semibold text-lg">
            {currentRoom?.name || `Room: ${roomId}`}
            <span className="ml-2 text-amber-600">🔒</span>
          </h2>
          <p className="text-xs text-gray-500">Logged in as {user?.email}</p>
        </div>
        <Button
          size="sm"
          onClick={logout}
          className="ml-4"
        >
          <span className="hidden md:inline">Log Out</span>
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
          <MessageList 
            username={user.email || "Anonymous"} 
            msgs={messages} 
            onPasswordInvalid={() => setIsPasswordValid(false)}
          />
        )}
      </div>

      {/* Send message component */}
      <div className="sticky bottom-0 w-full border-t bg-background">
        <SendMessage
          room_id={roomId}
          username={user.email || "Anonymous"}
          SendNewMessage={handleNewMessage}
          isDisabled={!isPasswordValid}
        />
      </div>
    </div>
  );
}

