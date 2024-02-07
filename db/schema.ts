import { pgTable, serial, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('user', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }),
    last_online: timestamp('last_online'),
});

export const rooms = pgTable('room', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 256 }),
    owner_id: serial('owner_id').references(() => users.id),
    created_at: timestamp('created_at'),
}, (rooms) => {
    return {
        nameIndex: uniqueIndex('name_idx').on(rooms.name),
    };
});

export const messages = pgTable('message', {
    id: serial('id').primaryKey(),
    content: text('content'),
    timestamp: timestamp('timestamp'),
    sender_id: serial('sender_id').references(() => users.id),
    room_id: serial('room_id').references(() => rooms.id),
});