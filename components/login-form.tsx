"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { GraduationCap, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const searchParams = useSearchParams()
  const message = searchParams?.get("message")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(email, password)

    if (!success) {
      setError("Invalid email or password")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form (White Background) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="mb-12">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-foreground rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">EduManage</span>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Sign in</h1>
          </div>

          {/* Form */}
          <div>
              {message && (
                <Alert className="mb-6 border-primary/20 bg-primary/5">
                  <AlertDescription className="text-primary">{message}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 h-12 border-border/50 focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-foreground hover:bg-foreground/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-foreground font-medium hover:underline">
                      Sign up
                    </Link>
                  </p>
                </div>
                <div className="text-center">
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Forgot Password
                  </Link>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Right Side - Dark Promotional Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0D2440] text-white p-12 flex-col justify-center relative overflow-hidden">
        {/* Decorative curved lines in background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,30 50,50 T100,50" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <path d="M0,60 Q25,40 50,60 T100,60" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <path d="M0,70 Q25,50 50,70 T100,70" stroke="currentColor" strokeWidth="0.5" fill="none" />
          </svg>
        </div>

        <div className="max-w-lg relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <span className="text-2xl font-bold">EduManage</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Welcome to EduManage
          </h2>

          {/* Description */}
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            Built as the comprehensive solution for modern educational institutions, EduManage helps administrators,
            teachers, and students create smart, beautiful dashboards filled with powerful modules. Step into the
            next chapter of education and start building your digital workspace today.
          </p>

          <p className="text-white/60 text-sm mb-12">
            More than 7k people joined us, it's your turn
          </p>

          {/* Call to Action Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-4">
              Apply now and shape the future of education.
            </h3>
            <p className="text-white/80 mb-6">
              Be among the first educators to join EduManage, the new way to connect with students,
              deliver content, and grow your impact.
            </p>
            {/* Colorful dots decoration */}
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-[#7BA4D0]"></div>
              <div className="w-12 h-12 rounded-full bg-[#E91E63]"></div>
              <div className="w-12 h-12 rounded-full bg-[#9C27B0]"></div>
              <div className="w-12 h-12 rounded-full bg-[#FF5722]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
