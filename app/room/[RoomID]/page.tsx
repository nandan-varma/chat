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

export default function Component({ params }: { params: { RoomID: string } }) {
  const [userName, SetUserName] = useState("NV");
  const { user } = useAuth();
  const router = useRouter();
  const [messages, SetMessages] = useState<Msg[]>([]);
  useEffect(() => {
    GetMessagesFromFirebase(params.RoomID, SetMessages);
  }, [])
  useEffect(() => {
    let email = user?.email
    if (email !== null && email !== undefined) {
      SetUserName(email);
    }
  }, [user])

  const SendNewMessage = (msg: Msg) => {
    SetMessages((prevMsgs: Msg[]) => {
      let msgs = [...prevMsgs, msg]
      return msgs;
    });
  }

  return (
    <div className="grid h-screen grid-cols-[200px_1fr]">
      <RoomList />
      <div className="flex flex-col">
        <div className="border-b p-2">
          <h2 className="text-2xl text-center font-bold">Room ID: <span className="text-primary">{params.RoomID}</span></h2>
        </div>
        <MessageList username={userName} msgs={messages} />
        {user ? <SendMessage
          username={userName}
          room_id={params.RoomID}
          SendNewMessage={SendNewMessage} />
         : <Button onClick={()=>{router.push('/account')}} className="m-2">Login to chat</Button>
        }
      </div>
    </div>
  )
}

