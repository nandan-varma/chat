'use client'
import { SendMessage } from "@/components/send-message"
import { useEffect, useState } from "react"
import { MessageList } from "@/components/message-view"
import { RoomList } from "@/components/room-list"
import { Msg } from "@/lib/data"
import { GetMessagesFromFirebase } from "@/lib/db"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"

export default function Component({ params }: { params: { RoomID: string } }) {
  const [userName, SetUserName] = useState("NV");
  const { user } = useAuth();
  const [messages, SetMessages] = useState<Msg[]>([]);
  useEffect(() => {
    if(params.RoomID){
      GetMessagesFromFirebase(params.RoomID, SetMessages);
    }
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

    </div>
  )
}

