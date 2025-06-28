import { initializeApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { getDatabase, ref, push, onValue, set, off, remove, DatabaseReference, Unsubscribe, update } from "firebase/database";
import { Msg, Room } from "./data";
import { v4 as uuidv4 } from "uuid";

// Firebase configuration - in a real app, use environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBp2I61CnWdZud7YjF-jDVYAWisbHtcgLc",
  authDomain: "chats-nv.firebaseapp.com",
  databaseURL: "https://chats-nv-default-rtdb.firebaseio.com",
  projectId: "chats-nv",
  storageBucket: "chats-nv.firebasestorage.app",
  messagingSenderId: "991108923374",
  appId: "1:991108923374:web:2f56652a15477c826598ff",
  measurementId: "G-TJ91QHE4Q6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

/**
 * Sends a message to a specific chat room
 * @param roomId - The ID of the room to send the message to
 * @param msg - The message object to send
 * @returns Promise that resolves when the message is sent
 */
export function SendMessageToFirebase(roomId: string, msg: Msg): Promise<void> {
  try {
    // Generate a unique ID if one isn't provided
    const messageId = msg.id || uuidv4();
    const messageWithId = { ...msg, id: messageId };

    const messagesRef = ref(db, `messages/${roomId}/${messageId}`);
    return set(messagesRef, messageWithId);
  } catch (error) {
    console.error("Error sending message:", error);
    return Promise.reject(error);
  }
}

/**
 * Subscribe to messages from a specific room
 * @param roomId - The ID of the room to get messages from
 * @param callback - Function to call with the messages
 * @returns Unsubscribe function to stop listening for updates
 */
export function GetMessagesFromFirebase(roomId: string, callback: (msgs: Msg[]) => void): Unsubscribe {
  const messagesRef = ref(db, `messages/${roomId}`);

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    const messages: Msg[] = [];

    if (data) {
      Object.keys(data).forEach((key) => {
        messages.push({
          id: key,
          ...data[key]
        });
      });

      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
    }

    callback(messages);
  }, (error) => {
    console.error("Error fetching messages:", error);
    callback([]);
  });

  return unsubscribe;
}

/**
 * Subscribe to the list of chat rooms
 * @param callback - Function to call with the rooms
 * @returns Unsubscribe function to stop listening for updates
 */
export function GetRoomsFromFirebase(callback: (rooms: Room[]) => void): Unsubscribe {
  const roomsRef = ref(db, 'chatrooms');

  const unsubscribe = onValue(roomsRef, (snapshot) => {
    const data = snapshot.val();
    const rooms: Room[] = [];

    if (data) {
      Object.keys(data).forEach((key) => {
        rooms.push({
          id: key,
          ...data[key]
        });
      });

      // Sort rooms by creation date if available
      rooms.sort((a, b) => {
        return (b.created_at || 0) - (a.created_at || 0);
      });
    }

    callback(rooms);
  }, (error) => {
    console.error("Error fetching rooms:", error);
    callback([]);
  });

  return unsubscribe;
}

/**
 * Add a new chat room
 * @param room - The room object to add
 * @returns Promise that resolves when the room is added
 */
export function AddRoom(room: Room): Promise<void> {
  try {
    // Ensure room has required fields
    if (!room.name || !room.id) {
      return Promise.reject(new Error("Room must have name and id"));
    }

    const roomRef = ref(db, `chatrooms/${room.id}`);
    return set(roomRef, {
      ...room,
      created_at: room.created_at || Date.now()
    });
  } catch (error) {
    console.error("Error adding room:", error);
    return Promise.reject(error);
  }
}

/**
 * Delete a chat room
 * @param roomId - The ID of the room to delete
 * @returns Promise that resolves when the room is deleted
 */
export function DeleteRoom(roomId: string): Promise<void> {
  try {
    const roomRef = ref(db, `chatrooms/${roomId}`);
    const messagesRef = ref(db, `messages/${roomId}`);

    // Delete room and its messages
    return Promise.all([
      remove(roomRef),
      remove(messagesRef)
    ]).then(() => Promise.resolve());
  } catch (error) {
    console.error("Error deleting room:", error);
    return Promise.reject(error);
  }
}

/**
 * Update a room's password protection status
 * @param roomId - The ID of the room to update
 * @param isPasswordProtected - Whether the room should be password protected
 * @param passwordHash - The hash of the password (if protected)
 * @returns Promise that resolves when the room is updated
 */
export function UpdateRoomPasswordStatus(roomId: string, isPasswordProtected: boolean, passwordHash?: string): Promise<void> {
  try {
    const roomRef = ref(db, `chatrooms/${roomId}`);
    const updates: any = {
      isPasswordProtected,
    };

    if (isPasswordProtected && passwordHash) {
      updates.passwordHash = passwordHash;
    } else {
      // Remove password hash if not password protected
      updates.passwordHash = null;
    }

    return update(roomRef, updates);
  } catch (error) {
    console.error("Error updating room password status:", error);
    return Promise.reject(error);
  }
}

/**
 * Get room details including password protection status
 * @param roomId - The ID of the room to get
 * @returns Promise that resolves with the room data
 */
export function GetRoomDetails(roomId: string): Promise<Room | null> {
  return new Promise((resolve) => {
    const roomRef = ref(db, `chatrooms/${roomId}`);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        resolve({
          id: roomId,
          ...data
        });
      } else {
        resolve(null);
      }
    }, { onlyOnce: true });
  });
}

export type firebaseUser = User;