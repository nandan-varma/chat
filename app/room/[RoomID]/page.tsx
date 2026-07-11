'use client'

import { SendMessage } from "@/components/send-message"
import { useEffect, useState, useCallback, useRef } from "react"
import { MessageList } from "@/components/message-view"
import { Msg, Room } from "@/lib/data"
import { GetMessagesFromFirebase, GetRoomDetails } from "@/lib/db"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Loader2, Lock, LogOut } from "lucide-react"
import { use } from 'react'
import { hasRoomPassword, getRoomPassword, verifyPasswordHash } from "@/lib/encryption"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function RoomPage({
  params,
}: {
  params: Promise<{ RoomID: string }>
}) {
  const { RoomID: roomId } = use(params)
  const [messages, setMessages] = useState<Msg[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isPasswordValid, setIsPasswordValid] = useState(true)
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const messagesUnsubRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Cleanup the messages subscription on unmount
  useEffect(() => {
    return () => { messagesUnsubRef.current?.() }
  }, [])

  const loadMessages = useCallback(() => {
    if (user && roomId) {
      messagesUnsubRef.current?.()
      setIsPasswordValid(true)
      messagesUnsubRef.current = GetMessagesFromFirebase(roomId, (msgs) => {
        setMessages(msgs)
        setIsLoading(false)
      })
    }
  }, [user, roomId])

  useEffect(() => {
    if (user && roomId) {
      GetRoomDetails(roomId).then((room) => {
        setCurrentRoom(room)

        if (!room) {
          router.push('/room')
          return
        }

        if (room.isPasswordProtected) {
          if (!hasRoomPassword(roomId)) {
            setPasswordPromptOpen(true)
            setIsPasswordValid(false)
          } else {
            const storedPassword = getRoomPassword(roomId)
            if (storedPassword && room.passwordHash) {
              verifyPasswordHash(storedPassword, room.passwordHash).then((isValid) => {
                if (isValid) {
                  setIsPasswordValid(true)
                  loadMessages()
                } else {
                  localStorage.removeItem(`room_${roomId}`)
                  setPasswordPromptOpen(true)
                  setIsPasswordValid(false)
                }
              })
            } else {
              setPasswordPromptOpen(true)
              setIsPasswordValid(false)
            }
          }
        } else {
          setIsPasswordValid(true)
          loadMessages()
        }
      }).catch(() => {
        router.push('/room')
      })
    }
  }, [roomId, user, loadMessages, router])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setPasswordError("Password is required")
      return
    }

    if (!currentRoom?.passwordHash) {
      setPasswordError("Room configuration error")
      return
    }

    try {
      const isValid = await verifyPasswordHash(password, currentRoom.passwordHash)
      if (isValid) {
        localStorage.setItem(`room_${roomId}`, password)
        setPasswordPromptOpen(false)
        setPasswordError("")
        setIsPasswordValid(true)
        loadMessages()
      } else {
        setPasswordError("Incorrect password. Please try again.")
        setPassword("")
      }
    } catch {
      setPasswordError("Could not verify password. Please try again.")
      setPassword("")
    }
  }

  const handleNewMessage = (msg: Msg) => {
    setMessages((prev) => [...prev, msg])
  }

  if (authLoading || !user) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Password dialog */}
      <Dialog
        open={passwordPromptOpen}
        onOpenChange={(open) => {
          if (!open && passwordPromptOpen) router.push('/room')
        }}
      >
        <DialogContent
          className="sm:max-w-[380px]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Enter room password</DialogTitle>
            <DialogDescription>
              {currentRoom ? (
                <>
                  <span className="font-medium text-foreground">{currentRoom.name}</span> is password protected.
                </>
              ) : (
                "This room is password protected."
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError("") }}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  localStorage.removeItem(`room_${roomId}`)
                  router.push('/room')
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Join room</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
        <div className="flex-1 min-w-0 pl-10 md:pl-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-sm truncate">
              {currentRoom?.name ?? roomId}
            </h2>
            {currentRoom?.isPasswordProtected && (
              <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {currentRoom?.description && (
            <p className="text-xs text-muted-foreground truncate">{currentRoom.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {user.email?.split('@')[0]}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading messages…</span>
          </div>
        ) : (
          <MessageList
            username={user.email ?? "Anonymous"}
            msgs={messages}
            roomId={roomId}
            onPasswordInvalid={() => {
              setIsPasswordValid(false)
              setPasswordPromptOpen(true)
              setPasswordError("Password appears incorrect. Please re-enter.")
              setPassword("")
              localStorage.removeItem(`room_${roomId}`)
            }}
          />
        )}
      </div>

      {/* Send area */}
      <div className="flex-shrink-0 border-t bg-background">
        <SendMessage
          room_id={roomId}
          username={user.email ?? "Anonymous"}
          SendNewMessage={handleNewMessage}
          isDisabled={!isPasswordValid}
        />
      </div>
    </div>
  )
}
