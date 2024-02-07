'use client'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { v4 } from "uuid";
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Msg } from "@/lib/data"
import { SendMessageToFirebase } from "@/lib/db"

const FormSchema = z.object({
    content: z.string(),
})

interface SendMessageProps {
    room_id: string
    username: string
    SendNewMessage: ((msg: Msg) => void)
}

export function SendMessage({ room_id, username, SendNewMessage }: SendMessageProps) {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            content: "",
        },
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
        let msg: Msg = {
            id: v4(),
            sender: username,
            content: data.content,
            timestamp: Date.now(),
        }
        SendNewMessage(msg);
        SendMessageToFirebase(room_id, msg);
        form.reset()
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="border-t p-2 flex items-center gap-2">
            <Input className="flex-1 bg-background" placeholder="Type a message" {...form.register("content")} />
            <Button type="submit">Send</Button>
        </form>
    )
}
