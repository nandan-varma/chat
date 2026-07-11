import { initializeApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { getDatabase, ref, get, onValue, set, remove, Unsubscribe, update } from "firebase/database";
import { Msg, Room } from "./data";
import { v4 as uuidv4 } from "uuid";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export function SendMessageToFirebase(roomId: string, msg: Msg): Promise<void> {
  const messageId = msg.id || uuidv4();
  const messagesRef = ref(db, `messages/${roomId}/${messageId}`);
  return set(messagesRef, { ...msg, id: messageId });
}

export function GetMessagesFromFirebase(roomId: string, callback: (msgs: Msg[]) => void): Unsubscribe {
  const messagesRef = ref(db, `messages/${roomId}`);
  return onValue(
    messagesRef,
    (snapshot) => {
      const data = snapshot.val();
      const messages: Msg[] = data
        ? Object.values<Msg>(data).sort((a, b) => a.timestamp - b.timestamp)
        : [];
      callback(messages);
    },
    (error) => {
      console.error("Error fetching messages:", error);
      callback([]);
    }
  );
}

export function GetRoomsFromFirebase(callback: (rooms: Room[]) => void): Unsubscribe {
  const roomsRef = ref(db, "chatrooms");
  return onValue(
    roomsRef,
    (snapshot) => {
      const data = snapshot.val();
      const rooms: Room[] = data
        ? Object.values<Room>(data).sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
        : [];
      callback(rooms);
    },
    (error) => {
      console.error("Error fetching rooms:", error);
      callback([]);
    }
  );
}

export function AddRoom(room: Room): Promise<void> {
  if (!room.name || !room.id) {
    return Promise.reject(new Error("Room must have name and id"));
  }
  const roomRef = ref(db, `chatrooms/${room.id}`);
  return set(roomRef, { ...room, created_at: room.created_at || Date.now() });
}

export function DeleteRoom(roomId: string): Promise<void> {
  return Promise.all([
    remove(ref(db, `chatrooms/${roomId}`)),
    remove(ref(db, `messages/${roomId}`)),
  ]).then(() => undefined);
}

export async function GetRoomDetails(roomId: string): Promise<Room | null> {
  const snapshot = await get(ref(db, `chatrooms/${roomId}`));
  if (!snapshot.exists()) return null;
  return { id: roomId, ...snapshot.val() };
}

export type firebaseUser = User;
