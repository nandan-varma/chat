"use client";

import { RoomList } from "@/components/room-list";
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, ShieldAlert } from "lucide-react"

export default function RoomLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="grid h-screen grid-cols-[200px_1fr]">
            <RoomList />
            {children}
        </div>
    );
}