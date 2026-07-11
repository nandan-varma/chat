'use client'

import { Room } from "@/lib/data"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AddRoom, GetRoomsFromFirebase } from "@/lib/db"
import { createPasswordHash } from "@/lib/encryption"
import { useAuth } from "./auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { v4 } from "uuid"
import { Lock, LogOut, MessageSquare, Plus } from "lucide-react"

const ROOM_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
  'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
]
function getRoomColor(name: string) {
  return ROOM_COLORS[name.charCodeAt(0) % ROOM_COLORS.length]
}

export function RoomList({ onRoomSelect }: { onRoomSelect?: () => void }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [passwordRoom, setPasswordRoom] = useState<Room | null>(null)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    return GetRoomsFromFirebase((r) => setRooms(r))
  }, [])

  const handleRoomClick = (room: Room) => {
    if (room.isPasswordProtected) {
      setPasswordRoom(room)
    } else {
      router.push(`/room/${room.id}`)
      onRoomSelect?.()
    }
  }

  const userInitial = user?.email?.[0].toUpperCase() ?? '?'
  const userDisplay = user?.email?.split('@')[0] ?? ''

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Chats</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No rooms yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create one to get started
            </p>
          </div>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room)}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <div
                className={`h-9 w-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm ${getRoomColor(room.name)}`}
              >
                {room.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{room.name}</span>
                  {room.isPasswordProtected && (
                    <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
                {room.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {room.description}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* User footer */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-t flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {userInitial}
        </div>
        <span className="flex-1 text-sm truncate text-muted-foreground">{userDisplay}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={logout}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Dialogs */}
      <NewRoomDialog open={createOpen} setOpen={setCreateOpen} />
      {passwordRoom && (
        <PasswordPromptDialog
          open={!!passwordRoom}
          setOpen={(open) => { if (!open) setPasswordRoom(null) }}
          room={passwordRoom}
          onRoomSelect={onRoomSelect}
        />
      )}
    </div>
  )
}

const CreateRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  description: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

function NewRoomDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const form = useForm<z.infer<typeof CreateRoomSchema>>({
    resolver: zodResolver(CreateRoomSchema),
    defaultValues: { name: "", description: "", password: "" },
  })

  async function onSubmit(data: z.infer<typeof CreateRoomSchema>) {
    if (!user?.email) {
      toast({ title: "Error", description: "You must be signed in", variant: "destructive" })
      return
    }
    try {
      const passwordHash = await createPasswordHash(data.password)
      const roomData: Room = {
        id: v4(),
        name: data.name,
        description: data.description ?? "",
        owner_id: user.email,
        created_at: Date.now(),
        isPasswordProtected: true,
        passwordHash,
      }
      localStorage.setItem(`room_${roomData.id}`, data.password)
      await AddRoom(roomData)
      form.reset()
      setOpen(false)
    } catch {
      toast({ title: "Error", description: "Failed to create room. Please try again.", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>New Room</DialogTitle>
          <DialogDescription>Create an encrypted chat room</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Room name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="What's this room for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); form.reset() }}>
                Cancel
              </Button>
              <Button type="submit">Create room</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function PasswordPromptDialog({
  open,
  setOpen,
  room,
  onRoomSelect,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  room: Room | null
  onRoomSelect?: () => void
}) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!room) return
    localStorage.setItem(`room_${room.id}`, password)
    router.push(`/room/${room.id}`)
    setOpen(false)
    setPassword("")
    setError("")
    onRoomSelect?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Enter room password</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{room?.name}</span> is password protected.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Input
              id="roomPassword"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError("") }}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Join room</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
