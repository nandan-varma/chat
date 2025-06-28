'use client'

import { SendMessage } from "@/components/send-message"
import { useEffect, useState, useCallback } from "react"
import { MessageList } from "@/components/message-view"
import { RoomList } from "@/components/room-list"
import { Msg, Room } from "@/lib/data"
import { GetMessagesFromFirebase, GetRoomsFromFirebase, GetRoomDetails } from "@/lib/db"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, MoveLeft, ShieldAlert } from "lucide-react"
import { use } from 'react'
import { hasRoomPassword, getRoomPassword, decryptMessage, verifyPasswordHash } from "@/lib/encryption"
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
  const loadMessages = useCallback(() => {
    if (user && roomId) {
      setIsPasswordValid(true); // Consider password valid when loading messages
      const unsubscribe = GetMessagesFromFirebase(roomId, (msgs) => {
        setMessages(msgs);
        setIsLoading(false);
      });

      return unsubscribe;
    }
  }, [user, roomId]);

  // Check for room details and if it's password protected
  useEffect(() => {
    if (user && roomId) {
      // Get room details to check if password protected
      GetRoomDetails(roomId).then((room) => {
        setCurrentRoom(room);
        
        if (!room) {
          // Room doesn't exist, redirect to room list
          router.push('/room');
          return;
        }
        
        // Check if room is password protected
        if (room.isPasswordProtected) {
          // Check if we have a stored password for this room
          if (!hasRoomPassword(roomId)) {
            setPasswordPromptOpen(true);
            setIsPasswordValid(false);
          } else {
            // We have a stored password, verify it against the room's hash
            const storedPassword = getRoomPassword(roomId);
            if (storedPassword && room.passwordHash) {
              verifyPasswordHash(storedPassword, room.passwordHash).then((isValid) => {
                if (isValid) {
                  setIsPasswordValid(true);
                  loadMessages();
                } else {
                  // Stored password is invalid, clear it and show prompt
                  localStorage.removeItem(`room_${roomId}`);
                  setPasswordPromptOpen(true);
                  setIsPasswordValid(false);
                }
              });
            } else {
              // No password hash in room or no stored password, show prompt
              setPasswordPromptOpen(true);
              setIsPasswordValid(false);
            }
          }
        } else {
          // Room is not password protected, load messages directly
          setIsPasswordValid(true);
          loadMessages();
        }
      }).catch((error) => {
        console.error("Error getting room details:", error);
        router.push('/room');
      });
    }
  }, [roomId, user, loadMessages, router]);


  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }
    
    if (!currentRoom || !currentRoom.passwordHash) {
      setPasswordError("Room password configuration error");
      return;
    }
    
    try {
      // Verify the password against the stored hash
      const isValid = await verifyPasswordHash(password, currentRoom.passwordHash);
      
      if (isValid) {
        // Password is correct, store it and close dialog
        const roomKey = `room_${roomId}`;
        localStorage.setItem(roomKey, password);
        setPasswordPromptOpen(false);
        setPasswordError("");
        setIsPasswordValid(true);
        loadMessages();
      } else {
        // Password is incorrect - DO NOT close dialog, make user retry
        setPasswordError("Incorrect password. Please try again.");
        setIsPasswordValid(false);
        setPassword(""); // Clear the password field for retry
        // Keep the dialog open by NOT setting setPasswordPromptOpen(false)
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      setPasswordError("Could not verify password. Please try again.");
      setIsPasswordValid(false);
      setPassword(""); // Clear the password field for retry
      // Keep the dialog open by NOT setting setPasswordPromptOpen(false)
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
      <Dialog open={passwordPromptOpen} onOpenChange={(open) => {
        // Only allow closing the dialog if user clicks Cancel button
        // Don't allow closing by clicking outside or escape key
        if (!open && passwordPromptOpen) {
          // If someone tries to close the dialog, redirect them back to room list
          router.push('/room');
        }
      }}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          // Prevent closing dialog by clicking outside
          e.preventDefault();
        }} onEscapeKeyDown={(e) => {
          // Prevent closing dialog with escape key
          e.preventDefault();
        }}>
          <DialogHeader>
            <DialogTitle>Enter Room Password</DialogTitle>
            <DialogDescription>
              This chat room is password-protected. You must enter the correct password to access the room and view messages.
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
              <Button type="button" variant="outline" onClick={() => {
                // Clear any stored password and redirect to room list
                const roomKey = `room_${roomId}`;
                localStorage.removeItem(roomKey);
                router.push('/room');
              }}>
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
      <div className="p-4 fixed backdrop-blur-md z-10 w-full border-b flex items-center justify-between bg-background/80">
        <div className="space-y-1 ml-12 md:ml-0">
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
          <span className="hidden sm:inline">Log Out</span>
          <span className="sm:hidden">Out</span>
        </Button>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-auto pt-16 md:pt-14 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 px-4">
            <p className="text-center">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <MessageList 
            username={user.email || "Anonymous"} 
            msgs={messages} 
            onPasswordInvalid={() => {
              // If password becomes invalid after entering room, show password prompt again
              setIsPasswordValid(false);
              setPasswordPromptOpen(true);
              setPasswordError("Password appears to be incorrect. Please re-enter the room password.");
              setPassword("");
              // Clear the stored password since it's invalid
              const roomKey = `room_${roomId}`;
              localStorage.removeItem(roomKey);
            }}
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

