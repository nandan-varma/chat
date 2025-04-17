'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Msg } from "@/lib/data";
import { decryptMessage, getRoomPassword } from "@/lib/encryption";
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';

interface MessageProps {
    msg: Msg;
    isCurrentUser: boolean;
    password: string | null;
    onDecryptionError: () => void;
}

const Message = ({ msg, isCurrentUser, password, onDecryptionError }: MessageProps) => {
    const [decryptedContent, setDecryptedContent] = useState<string>(msg.content);
    const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
    const [decryptionError, setDecryptionError] = useState<boolean>(false);

    useEffect(() => {
        async function decryptIfNeeded() {
            // Always attempt to decrypt if password is available
            if (msg.encrypted && password) {
                setIsDecrypting(true);
                setDecryptionError(false);
                try {
                    const decrypted = await decryptMessage(msg.content, password);
                    setDecryptedContent(decrypted);
                } catch (error) {
                    console.error('Error decrypting:', error);
                    setDecryptedContent('🔒 Could not decrypt (wrong password)');
                    setDecryptionError(true);
                    onDecryptionError();
                } finally {
                    setIsDecrypting(false);
                }
            } else {
                setDecryptedContent(msg.content);
                setDecryptionError(false);
            }
        }

        decryptIfNeeded();
    }, [msg.content, msg.encrypted, password]);

    return (
        <div className={`p-4 my-2 rounded-lg max-w-[80%] ${isCurrentUser ? 'ml-auto bg-blue-500 text-white' : 'bg-secondary'}`}>
            {!isCurrentUser && <div className="font-semibold mb-1">{msg.sender}</div>}
            <div className="break-words">
                {isDecrypting ? (
                    <div className="animate-pulse">Decrypting...</div>
                ) : (
                    decryptedContent
                )}
                {msg.encrypted && (
                    <div className={`text-xs mt-1 ${decryptionError ? 'text-red-500' : 'opacity-70'}`}>
                        {decryptionError 
                            ? '🔒 Failed to decrypt - incorrect password' 
                            : `🔒 ${password ? 'Encrypted message' : 'Password required'}`}
                    </div>
                )}
            </div>
        </div>
    );
};

interface MessageListProps {
    msgs: Msg[];
    username: string;
    onPasswordInvalid?: () => void;
}

function orderByTimestamp(messages: Msg[]) {
  messages.sort((msg1, msg2) => {
    return msg1.timestamp - msg2.timestamp;
  });
  return messages;
}

export function MessageList({ username, msgs, onPasswordInvalid }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [roomPassword, setRoomPassword] = useState<string | null>(null);
    const [decryptionErrors, setDecryptionErrors] = useState<number>(0);
    const [showPasswordWarning, setShowPasswordWarning] = useState<boolean>(false);
    const roomId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '' : '';
    const router = useRouter();

    useEffect(() => {
        // Scroll to bottom on new messages
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [msgs]);

    useEffect(() => {
        // Get the room password if available
        if (typeof window !== 'undefined' && roomId) {
            const password = getRoomPassword(roomId);
            setRoomPassword(password);
        }
    }, [roomId]);

    // Track decryption errors
    useEffect(() => {
        const encryptedMessages = msgs.filter(m => m.encrypted).length;
        if (decryptionErrors > 0 && encryptedMessages > 0 && decryptionErrors / encryptedMessages > 0.5) {
            // If more than 50% of encrypted messages fail to decrypt, prompt for password
            setShowPasswordWarning(true);
            // Notify parent component about invalid password
            if (onPasswordInvalid) {
                onPasswordInvalid();
            }
        } else {
            setShowPasswordWarning(false);
        }
    }, [decryptionErrors, msgs, onPasswordInvalid]);
    
    // Function to handle decryption errors reported from Message components
    const handleDecryptionError = () => {
        setDecryptionErrors(prev => prev + 1);
    };

    // Function to handle password retry
    const handlePasswordRetry = () => {
        if (typeof window !== 'undefined' && roomId) {
            // Remove the incorrect password
            localStorage.removeItem(`room_${roomId}`);
            // Refresh the page to show the password dialog again
            router.refresh();
        }
    };

    let ordered_msgs = orderByTimestamp(msgs);
    return (
        <div className="p-4 space-y-2">
            {showPasswordWarning && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Incorrect password!</strong>
                    <span className="block sm:inline"> Unable to decrypt messages with current password.</span>
                    <button 
                        onClick={handlePasswordRetry}
                        className="underline ml-2 font-semibold hover:text-red-800"
                    >
                        Try another password
                    </button>
                </div>
            )}
            
            {ordered_msgs.length === 0 ? (
                <div className="text-center text-gray-500 my-8">No messages yet</div>
            ) : (
                ordered_msgs.map((msg) => (
                    <Message
                        key={msg.id}
                        msg={msg}
                        isCurrentUser={msg.sender === username}
                        password={roomPassword}
                        onDecryptionError={handleDecryptionError}
                    />
                ))
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}