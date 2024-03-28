'use server'
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, set } from "firebase/database";
import { User, getAuth } from 'firebase/auth'
import { Msg, Room } from "./data";

// import Client from "pg-listen";
// // Configure WebSocket support
// import { Pool } from 'pg';

// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// pool.on('error', err => console.error(err));  // deal with e.g. re-connect

// // Remove the duplicate import statement for 'Client'
// // import Client from 'pg-listen';

// const client = new Client({ connectionString: process.env.DATABASE_URL });

// async function listenForNotifications() {
//     await client.connect();

//     // Listen for notifications
//     client.notifications.on('new_message', async (payload) => {
//         const { rows } = await client.query('SELECT * FROM Message WHERE id = $1', [payload]);
//         const newMessage = rows[0];
//         // Broadcast newMessage to clients...
//     });

//     // Begin listening for notifications
//     await client.query('LISTEN new_message');
// }

// listenForNotifications()
//     .catch(err => {
//         throw err;
//     })
//     .finally(() => {
//         client.end();
//         pool.end();
//     });

// TODO: temperorarily impl. in firebase

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDReA-v0I3J_-CbOOpPsmn_x4us4a1_UF8",
    authDomain: "chess-nandanvarma.firebaseapp.com",
    databaseURL: "https://chess-nandanvarma-default-rtdb.firebaseio.com",
    projectId: "chess-nandanvarma",
    storageBucket: "chess-nandanvarma.appspot.com",
    messagingSenderId: "1022610696614",
    appId: "1:1022610696614:web:8e0176f9e2bd4744174767"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export async function SendMessageToFirebase(Room_ID: string, msg: Msg) {
    const room_ref = ref(db, `chat/${Room_ID}/msgs/${msg.id}`);
    set(room_ref, msg);
}

export async function GetMessagesFromFirebase(Room_ID: string, SetMessages: ((msgs: Msg[]) => void)) {
    const room_ref = ref(db, `chat/${Room_ID}/msgs`)
    onValue(room_ref, (snapshot) => {
        const data = snapshot.val();
        if (data === null || data === undefined) {
            SetMessages([])
            return
        }
        let msgs = Object.values(JSON.parse(JSON.stringify(data)))
        SetMessages(msgs as Msg[]);
        // console.log(msgs);
    });
}

export async function GetRoomsFromFirebase(SetRooms: ((msgs: Room[]) => void)){
    const rooms_ref = ref(db, `chatrooms`);
    onValue(rooms_ref, (snapshot) => {
        const data = snapshot.val();
        if (data === null || data === undefined) {
            SetRooms([])
            return
        }
        let rooms = Object.values(JSON.parse(JSON.stringify(data)))
        SetRooms(rooms as Room[]);
        // console.log(msgs);
    });
}

export async function AddRoom(room : Room){
    const rooms_ref = ref(db, `chatrooms/${room.id}`);
    set(rooms_ref,room);
}

export type firebaseUser = User;