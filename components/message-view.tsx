'use client'

import { Msg } from "@/lib/data"
import { decryptMessage, getRoomPassword } from "@/lib/encryption"
import { useEffect, useRef, useState } from "react"
import { useRouter } from 'next/navigation'

const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-teal-500', 'bg-sky-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-pink-500',
]

function getAvatarColor(email: string) {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length]
}

function getSenderName(email: string) {
  return email.split('@')[0]
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

interface DecryptedMessageProps {
  msg: Msg
  isCurrentUser: boolean
  password: string | null
  showAvatar: boolean
  showSenderName: boolean
  onDecryptionError: () => void
}

function DecryptedMessage({
  msg,
  isCurrentUser,
  password,
  showAvatar,
  showSenderName,
  onDecryptionError,
}: DecryptedMessageProps) {
  const [content, setContent] = useState(msg.content)
  const [decrypting, setDecrypting] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    async function decrypt() {
      if (msg.encrypted && password) {
        setDecrypting(true)
        setFailed(false)
        try {
          setContent(await decryptMessage(msg.content, password))
        } catch {
          setContent('Could not decrypt message')
          setFailed(true)
          onDecryptionError()
        } finally {
          setDecrypting(false)
        }
      } else {
        setContent(msg.content)
        setFailed(false)
      }
    }
    decrypt()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg.content, msg.encrypted, password])

  const senderName = getSenderName(msg.sender)
  const initial = msg.sender[0].toUpperCase()
  const avatarColor = getAvatarColor(msg.sender)

  return (
    <div className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar — only for others, only on last message in group */}
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white ${avatarColor} ${!isCurrentUser ? '' : 'invisible'} ${showAvatar ? 'visible' : 'invisible'}`}>
        {initial}
      </div>

      <div className={`max-w-[72%] flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {showSenderName && !isCurrentUser && (
          <span className="text-xs text-muted-foreground px-1">{senderName}</span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isCurrentUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          } ${failed ? 'opacity-60 italic' : ''}`}
        >
          {decrypting ? (
            <span className="opacity-60 text-xs">Decrypting…</span>
          ) : (
            content
          )}
        </div>
        <span className="text-xs text-muted-foreground px-1">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  )
}

interface MessageGroup {
  sender: string
  isCurrentUser: boolean
  messages: Msg[]
}

function groupMessages(msgs: Msg[], username: string): MessageGroup[] {
  const groups: MessageGroup[] = []
  for (const msg of msgs) {
    const isCurrentUser = msg.sender === username
    const last = groups[groups.length - 1]
    if (last && last.sender === msg.sender) {
      last.messages.push(msg)
    } else {
      groups.push({ sender: msg.sender, isCurrentUser, messages: [msg] })
    }
  }
  return groups
}

interface MessageListProps {
  msgs: Msg[]
  username: string
  onPasswordInvalid?: () => void
}

export function MessageList({ username, msgs, onPasswordInvalid }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const [roomPassword, setRoomPassword] = useState<string | null>(null)
  const [decryptionErrors, setDecryptionErrors] = useState(0)
  const roomId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() ?? '' : ''
  const router = useRouter()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs])

  useEffect(() => {
    if (typeof window !== 'undefined' && roomId) {
      setRoomPassword(getRoomPassword(roomId))
    }
  }, [roomId])

  useEffect(() => {
    const encrypted = msgs.filter((m) => m.encrypted).length
    if (decryptionErrors > 0 && encrypted > 0 && decryptionErrors / encrypted > 0.5) {
      onPasswordInvalid?.()
    }
  }, [decryptionErrors, msgs, onPasswordInvalid])

  const sorted = [...msgs].sort((a, b) => a.timestamp - b.timestamp)
  const groups = groupMessages(sorted, username)

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {groups.map((group, gi) => (
        <div
          key={`${group.sender}-${gi}`}
          className={`flex flex-col gap-1 ${group.isCurrentUser ? 'items-end' : 'items-start'}`}
        >
          {group.messages.map((msg, mi) => (
            <DecryptedMessage
              key={msg.id}
              msg={msg}
              isCurrentUser={group.isCurrentUser}
              password={roomPassword}
              showAvatar={mi === group.messages.length - 1}
              showSenderName={mi === 0}
              onDecryptionError={() => setDecryptionErrors((n) => n + 1)}
            />
          ))}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}
