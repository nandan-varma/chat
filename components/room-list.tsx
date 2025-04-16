import { Room } from "@/lib/data";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "./auth-provider";
import { v4 } from "uuid";
// import { Pool } from 'pg';

// async function getData() {
//   const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: true,
//   });

//   pool.on('error', (err) => console.error('Pool error:', err));

//   const client = await pool.connect();

//   try {
//     console.log("Started");

//     client.on('notification', (msg) => {
//       const newMessage = JSON.parse(msg.payload!);
//       console.log("Received new message:", newMessage);
//     });

//     await client.query('LISTEN new_message');
//     console.log("Listening for new messages...");

//     // Add any additional logic or await here if needed.

//   } catch (err) {
//     console.error('Error during notification setup:', err);
//   } finally {
//     // Ensure to release the client only after handling notifications.
//     // Consider using async/await for the finalization to guarantee order.
//     client.release();
//     console.log("Ended");
//   }

//   await pool.end();
// }


export function RoomList() {
  const [rooms, SetRooms] = useState<Room[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    GetRoomsFromFirebase((RoomsInFirebase) => {
      SetRooms(RoomsInFirebase);
    });
  }, [])
  // const data = getData();
  return (
    <div className="border-r bg-background">
      <div className="flex flex-col gap-4 py-2 fixed">
        <h2 className="p-5 text-3xl font-bold text-center">Rooms</h2>
        <nav className="grid gap-2 px-4">
          {/* rooms list */}
          {/* TODO : get rooms from server */}
          {rooms.map((room) =>
            <Link key={room.id} href={'/room/' + room.id} className="p-4 bg-secondary shadow-md rounded-lg hover:bg-transparent">
              <div className="font-medium">{room.name}</div>
              <div className="text-sm text-primary">{room.description}</div>
            </Link>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Add Room</Button>
            </DialogTrigger>
            <NewRoomDialog setOpen={setOpen} />
          </Dialog>
        </nav>
      </div>
    </div>
  )
}



const FormSchema = z.object({
  name: z.string(),
  description: z.string(),
})

export function NewRoomDialog({ setOpen }: { setOpen: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })
  const { user } = useAuth();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // Add your form submission logic here
    if (data.name === "" || data.description === "") {
      alert("You need to fill all the details");
      return;
    }

    let email = user?.email
    if (email === undefined || email === null) {
      alert("you need to login in order complete this action")
      return;
    }

    AddRoom({ ...data, id: v4(), owner_id: email, created_at: Date.now() })
    form.reset();
    setOpen(false);
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
        <Button type="submit" className="ml-auto">Save changes</Button>
      </form>
    </DialogContent>
  )
}
