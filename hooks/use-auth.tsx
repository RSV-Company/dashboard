"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

export interface User {
  email: string
  name: string
  role: "admin" | "manager" | "staff"
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Role-based permissions
const rolePermissions = {
  admin: [
    "view_dashboard",
    "manage_inventory",
    "view_inventory",
    "manage_orders",
    "view_orders",
    "manage_categories",
    "view_categories",
    "view_analytics",
    "manage_customers",
    "view_customers",
    "manage_settings",
    "view_settings",
    "delete_products",
    "delete_orders",
    "delete_categories",
    "manage_users",
  ],
  manager: [
    "view_dashboard",
    "manage_inventory",
    "view_inventory",
    "manage_orders",
    "view_orders",
    "manage_categories",
    "view_categories",
    "view_analytics",
    "manage_customers",
    "view_customers",
    "view_settings",
  ],
  staff: ["view_dashboard", "view_inventory", "view_orders", "view_categories", "view_analytics", "view_customers"],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return rolePermissions[user.role]?.includes(permission) || false
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, isLoading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
