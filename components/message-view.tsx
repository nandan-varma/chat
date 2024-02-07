import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Msg } from "@/lib/data"

interface MessageListProps {
  username: string
  msgs: Msg[]
}

function orderByTimestamp(messages: Msg[]) {
  messages.sort((msg1, msg2) => {
    return msg1.timestamp - msg2.timestamp;
  });
  return messages;
}

export function MessageList({ username, msgs }: MessageListProps) {
  let ordered_msgs = orderByTimestamp(msgs);
  return (
    <div className="flex flex-col flex-1 p-4">
      {ordered_msgs.map((msg) => (
        msg.sender === username ?
          // my messages
          <div key={msg.id} className="flex items-end gap-2 mb-4 ml-auto">
            <div className="inline-block my-2 mx-1 p-2 px-3 rounded-t-lg rounded-bl-lg bg-primary text-secondary">
              <p className="text-sm">{msg.content}</p>
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage alt={msg.sender} src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-primary text-secondary font-bold">Me</AvatarFallback>
            </Avatar>
          </div> :
          // other messages
          <div key={msg.id} className="flex items-end gap-2 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage alt={msg.sender} src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-secondary font-bold">{msg.sender.substring(0,2)}</AvatarFallback>
            </Avatar>
            <div className="inline-block my-2 mx-1 p-2 px-3 rounded-t-lg rounded-br-lg bg-secondary">
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
      ))}
    </div>
  )
} 