"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { GraduationCap, ArrowRight } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      const redirectMap = {
        admin: "/admin",
        teacher: "/teacher",
        student: "/student",
      }
      router.push(redirectMap[user.role])
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-foreground">EduManage</span>
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-mesh bg-dot-pattern">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Text Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Welcome to
                  <span className="bg-gradient-primary bg-clip-text text-transparent block mt-2">EduManage</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  The complete school management platform that connects administrators, teachers, and students in one
                  seamless ecosystem. Transform your educational institution with modern, efficient tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/signup">
                    <Button size="lg" className="text-lg px-8 py-6 h-auto bg-foreground hover:bg-foreground/90">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/how">
                    <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto border-2">
                      Learn More
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="mt-12 grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-primary">7K+</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Schools</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">99%</div>
                    <div className="text-sm text-muted-foreground">Satisfaction</div>
                  </div>
                </div>
              </div>

              {/* Right Side - Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/children-back-school-with-parents.png"
                    alt="Children back to school with parents"
                    width={600}
                    height={600}
                    className="w-full h-auto"
                    priority
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none"></div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Features */}
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">Built for Everyone</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful tools designed specifically for each role in your educational institution
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-2xl border-2 border-border hover:border-primary transition-all hover:shadow-xl bg-card">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">For Administrators</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Complete school oversight with powerful analytics, user management, and comprehensive reporting tools
                </p>
              </div>

              <div className="group p-8 rounded-2xl border-2 border-border hover:border-secondary transition-all hover:shadow-xl bg-card">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">For Teachers</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Streamlined classroom management, grade tracking, attendance monitoring, and student engagement tools
                </p>
              </div>

              <div className="group p-8 rounded-2xl border-2 border-border hover:border-primary transition-all hover:shadow-xl bg-card">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">For Students</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track academic progress, manage assignments, view grades, and stay connected with teachers
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // This should not be reached due to the redirect above, but just in case
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
