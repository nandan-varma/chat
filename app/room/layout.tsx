"use client"

import { RoomList } from "@/components/room-list"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          w-72 md:w-64 flex-shrink-0 border-r bg-background
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <RoomList onRoomSelect={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-hidden relative">
        {/* Mobile menu trigger — floats above content */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-30 md:hidden h-9 w-9"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {children}
      </div>
    </div>
  )
}
