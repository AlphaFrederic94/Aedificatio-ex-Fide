"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types/user"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  getAuthHeaders: () => Record<string, string> // Added getAuthHeaders function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const getAuthHeaders = (): Record<string, string> => {
    const cookie = typeof document !== 'undefined' ? document.cookie : ''
    const token = cookie.split("; ").find((row) => row.startsWith("auth-token="))?.split("=")[1]
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const setAuthToken = (token: string) => {
    localStorage.setItem("auth-token", token)
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:"
    // Set cookie for middleware to read on full page navigations
    document.cookie = `auth-token=${token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${isSecure ? "; Secure" : ""}`
  }

  const removeAuthToken = () => {
    localStorage.removeItem("auth-token")
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("auth-token")
    if (token) {
      // Verify token with API
      fetch("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user)
            setAuthToken(token)
          } else {
            removeAuthToken()
          }
        })
        .catch(() => {
          removeAuthToken()
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setAuthToken(data.token)
        setUser(data.user)

        console.log("[v0] Login successful, redirecting to:", data.user.role)

        const redirectMap = {
          admin: "/admin",
          teacher: "/teacher",
          student: "/student",
        } as const
        const dest = redirectMap[data.user.role as keyof typeof redirectMap]

        // Use hard navigation to guarantee middleware picks up the cookie immediately
        window.location.href = dest

        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logout = () => {
    removeAuthToken()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
        getAuthHeaders, // Added getAuthHeaders to context value
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
