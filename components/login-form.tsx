"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, ShoppingBag } from "lucide-react"
import { useAuth, User } from "@/hooks/use-auth"

// Mock users with different roles
const mockUsers = [
  {
    email: "admin@store.com",
    password: "admin123",
    role: "admin",
    name: "Admin User",
  },
  {
    email: "manager@store.com",
    password: "manager123",
    role: "manager",
    name: "Store Manager",
  },
  {
    email: "staff@store.com",
    password: "staff123",
    role: "staff",
    name: "Staff Member",
  },
]

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Find user in mock data
    const user = mockUsers.find((u) => u.email === email && u.password === password && u.role === selectedRole)

    if (user) {
      login(user as User)
      router.push("/")
    } else {
      setError("Invalid credentials or role selection")
    }

    setIsLoading(false)
  }

  const fillDemoCredentials = (role: string) => {
    const user = mockUsers.find((u) => u.role === role)
    if (user) {
      setEmail(user.email)
      setPassword(user.password)
      setSelectedRole(user.role)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <ShoppingBag className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl text-center">Admin Portal</CardTitle>
        <CardDescription className="text-center">Sign in to access your ecommerce dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 space-y-2">
          <p className="text-sm text-muted-foreground text-center">Demo Accounts:</p>
          <div className="grid gap-2">
            <Button variant="outline" size="sm" onClick={() => fillDemoCredentials("admin")} className="text-xs">
              Admin Demo (Full Access)
            </Button>
            <Button variant="outline" size="sm" onClick={() => fillDemoCredentials("manager")} className="text-xs">
              Manager Demo (Limited Access)
            </Button>
            <Button variant="outline" size="sm" onClick={() => fillDemoCredentials("staff")} className="text-xs">
              Staff Demo (View Only)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
