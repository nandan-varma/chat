'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { v4 } from "uuid"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Msg } from "@/lib/data"
import { SendMessageToFirebase } from "@/lib/db"
import { encryptMessage, getRoomPassword } from "@/lib/encryption"
import { useState } from "react"
import { SendHorizontal } from "lucide-react"

const FormSchema = z.object({
  content: z.string(),
})

interface SendMessageProps {
  room_id: string
  username: string
  SendNewMessage: (msg: Msg) => void
  isDisabled?: boolean
}

export function SendMessage({ room_id, username, SendNewMessage, isDisabled = false }: SendMessageProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { content: "" },
  })
  const [isSending, setIsSending] = useState(false)

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!data.content.trim()) return

    setIsSending(true)
    try {
      const messageId = v4()
      let content = data.content.trim()
      let isEncrypted = false

      const password = getRoomPassword(room_id)
      if (password) {
        content = await encryptMessage(content, password)
        isEncrypted = true
      }

      const msg: Msg = {
        id: messageId,
        sender: username,
        content,
        timestamp: Date.now(),
        encrypted: isEncrypted,
      }

      SendNewMessage(msg)
      await SendMessageToFirebase(room_id, msg)
      form.reset()
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex items-end gap-2 p-3"
    >
      <Textarea
        className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm leading-relaxed"
        placeholder={isDisabled ? "Enter the room password to send messages" : "Message… (Enter to send)"}
        disabled={isDisabled || isSending}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            form.handleSubmit(onSubmit)()
          }
        }}
        {...form.register("content")}
      />
      <Button
        type="submit"
        size="icon"
        disabled={isSending || isDisabled}
        className="flex-shrink-0 h-10 w-10 mb-0.5"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </form>
  )
}
