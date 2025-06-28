import { Room } from "@/lib/data";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AddRoom, GetRoomsFromFirebase } from "@/lib/db";
import { createPasswordHash } from "@/lib/encryption";
import { useAuth } from "./auth-provider";
import { v4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";

export function RoomList({ onRoomSelect }: { onRoomSelect?: () => void }) {
  const [rooms, SetRooms] = useState<Room[]>([]);
  const [open, setOpen] = useState(false);
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const router = useRouter();

  useEffect(() => {
    GetRoomsFromFirebase((RoomsInFirebase) => {
      SetRooms(RoomsInFirebase);
    });
  }, [])

  const handleRoomClick = (room: Room, e: React.MouseEvent) => {
    e.preventDefault();

    if (room.isPasswordProtected) {
      // Show password prompt for protected rooms
      setSelectedRoom(room);
      setPasswordPromptOpen(true);
    } else {
      // Navigate directly to non-protected rooms
      router.push(`/room/${room.id}`);
      onRoomSelect?.(); // Close sidebar on mobile
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <h2 className="p-4 text-2xl md:text-3xl font-bold text-center border-b">Rooms</h2>
        <nav className="grid gap-2 p-4">
          {rooms.map((room) =>
            <Link
              key={room.id}
              href={'/room/' + room.id}
              className="p-3 bg-secondary shadow-md rounded-lg hover:bg-transparent transition-colors"
              onClick={(e) => handleRoomClick(room, e)}
            >
              <div className="font-medium flex items-center gap-2 text-sm md:text-base">
                {room.name}
                {room.isPasswordProtected && <span className="text-amber-600">🔒</span>}
              </div>
              <div className="text-xs md:text-sm text-primary line-clamp-2">{room.description}</div>
            </Link>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-2">Add Room</Button>
            </DialogTrigger>
            <NewRoomDialog setOpen={setOpen} />
          </Dialog>

          <PasswordPromptDialog
            open={passwordPromptOpen}
            setOpen={setPasswordPromptOpen}
            room={selectedRoom}
            onRoomSelect={onRoomSelect}
          />
        </nav>
      </div>
    </div>
  )
}

const FormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  password: z.string(),
})

export function NewRoomDialog({ setOpen }: { setOpen: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: "",
      password: "",
    },
  })
  const { user } = useAuth();

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    // Add your form submission logic here
    if (data.name === "") {
      alert("You need to provide a room name");
      return;
    }

    let email = user?.email
    if (email === undefined || email === null) {
      alert("you need to login in order complete this action")
      return;
    }

    if (!data.password || data.password.length < 6) {
      alert("Please provide a password with at least 6 characters");
      return;
    }

    try {
      // Create password hash for the room
      const passwordHash = await createPasswordHash(data.password);

      const roomData: Room = {
        id: v4(),
        name: data.name,
        description: data.description,
        owner_id: email,
        created_at: Date.now(),
        isPasswordProtected: true,
        passwordHash: passwordHash,
      };

      // Store password in local storage for the creator
      const roomKey = `room_${roomData.id}`;
      localStorage.setItem(roomKey, data.password);

      await AddRoom(roomData);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Error creating room. Please try again.");
    }
  }

  return (
    <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>Add New Room</DialogTitle>
        <DialogDescription>
          Add new room to chat rooms
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input id="name" className="col-span-3" {...form.register("name", { required: true })} />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Input id="description" className="col-span-3" {...form.register("description", { required: true })} />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password" className="text-right">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            className="col-span-3"
            {...form.register("password", {
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters"
              }
            })}
          />
          {form.formState.errors.password && (
            <div className="col-span-4 text-right text-red-500 text-sm">
              {form.formState.errors.password.message}
            </div>
          )}
        </div>
        <Button type="submit" className="ml-auto">Save changes</Button>
      </form>
    </DialogContent>
  )
}

export function PasswordPromptDialog({
  open,
  setOpen,
  room,
  onRoomSelect
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  room: Room | null;
  onRoomSelect?: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!room) return;

    // Store password in localStorage if valid
    const roomKey = `room_${room.id}`;
    localStorage.setItem(roomKey, password);

    // Navigate to the room
    router.push(`/room/${room.id}`);
    setOpen(false);
    setPassword("");
    setError("");
    onRoomSelect?.(); // Close sidebar on mobile
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Room Password</DialogTitle>
          <DialogDescription>
            This room is password-protected. Enter the password to join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roomPassword" className="text-right">
              Password
            </Label>
            <Input
              id="roomPassword"
              type="password"
              className="col-span-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Enter Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
