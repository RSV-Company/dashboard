"use client"

import type React from "react"

import { AdminSidebar } from "@/components/admin-sidebar"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-white">{children}</main>
    </div>
  )
}
