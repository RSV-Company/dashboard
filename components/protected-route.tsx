"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, hasPermission, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-64">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
