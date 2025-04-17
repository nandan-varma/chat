'use client'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { v4 } from "uuid";
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Msg } from "@/lib/data"
import { SendMessageToFirebase } from "@/lib/db"
import { encryptMessage, getRoomPassword } from "@/lib/encryption"
import { useState } from "react"

const FormSchema = z.object({
    content: z.string(),
})

interface SendMessageProps {
    room_id: string
    username: string
    SendNewMessage: ((msg: Msg) => void)
    isDisabled?: boolean
}

export function SendMessage({ room_id, username, SendNewMessage, isDisabled = false }: SendMessageProps) {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            content: "",
        },
    })
    const [isSending, setIsSending] = useState(false);

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        if (!data.content.trim()) return;
        
        setIsSending(true);
        try {
            const messageId = v4();
            let content = data.content;
            let isEncrypted = false;
            
            // Check if room has password for encryption
            const password = getRoomPassword(room_id);
            if (password) {
                // Encrypt the message content
                content = await encryptMessage(content, password);
                isEncrypted = true;
            }
            
            // Create the message object
            const msg: Msg = {
                id: messageId,
                sender: username,
                content: content,
                timestamp: Date.now(),
                encrypted: isEncrypted
            };
            
            SendNewMessage(msg);
            await SendMessageToFirebase(room_id, msg);
            form.reset();
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    }

    return (
        <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="border-t p-2 flex items-center gap-2 sticky bottom-0 backdrop-blur-md">
                <Input className="flex-1 bg-background" placeholder={isDisabled ? "Incorrect password - input disabled" : "Type a message"} {...form.register("content")} disabled={isDisabled} />
                <Button type="submit" disabled={isSending || isDisabled}>
                    {isSending ? "Sending..." : "Send"}
                </Button>
            </form>
            {isDisabled && (
                <div className="text-red-500 text-xs text-center pb-2">
                    Input disabled: Incorrect room password. Click `Try another password` to retry.
                </div>
            )}
        </>
    )
}
