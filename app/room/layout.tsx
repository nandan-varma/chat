"use client";

import { RoomList } from "@/components/room-list";
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, ShieldAlert, Menu, X } from "lucide-react"
import { useState } from "react";

export default function RoomLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed md:relative z-50 md:z-auto
                h-full w-80 md:w-64
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                bg-background border-r
            `}>
                <RoomList onRoomSelect={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <div className="flex-1 h-full">
                {/* Mobile menu button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="fixed top-4 left-4 z-30 md:hidden"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Close button for mobile sidebar */}
                {sidebarOpen && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="fixed top-4 right-4 z-60 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}

                {children}
            </div>
        </div>
    );
}