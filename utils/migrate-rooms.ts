/**
 * Development utility to migrate existing rooms to have password protection
 * This script helps set up existing rooms with the new password protection fields
 */

import { GetRoomsFromFirebase, UpdateRoomPasswordStatus } from "../lib/db";
import { createPasswordHash } from "../lib/encryption";

// Default password for existing rooms - change this as needed
const DEFAULT_PASSWORD = "password123";

export async function migrateExistingRooms() {
  console.log("Starting room migration...");
  
  try {
    // Get all existing rooms
    const unsubscribe = GetRoomsFromFirebase(async (rooms) => {
      unsubscribe(); // Unsubscribe immediately since we only need this once
      
      for (const room of rooms) {
        // Check if room already has password protection set up
        if (room.isPasswordProtected !== undefined) {
          console.log(`Room ${room.name} already migrated, skipping...`);
          continue;
        }
        
        console.log(`Migrating room: ${room.name}`);
        
        // Create password hash
        const passwordHash = await createPasswordHash(DEFAULT_PASSWORD);
        
        // Update room with password protection
        await UpdateRoomPasswordStatus(room.id, true, passwordHash);
        
        console.log(`✅ Migrated room: ${room.name}`);
      }
      
      console.log("Migration completed!");
      console.log(`Default password for all rooms: ${DEFAULT_PASSWORD}`);
      console.log("Make sure to update room passwords as needed!");
    });
    
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Uncomment the line below to run the migration
// migrateExistingRooms();
