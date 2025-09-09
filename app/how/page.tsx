import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, Users, BookOpen, BarChart3, Shield, Clock, CheckCircle, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "How EduManage Works - Complete School Management Solution",
  description:
    "Discover how EduManage streamlines school administration, enhances teaching efficiency, and improves student learning outcomes. Learn about our comprehensive school management platform.",
  keywords:
    "school management system, education software, student information system, teacher portal, admin dashboard, academic management",
  openGraph: {
    title: "How EduManage Works - Complete School Management Solution",
    description:
      "Streamline your school operations with our all-in-one management platform designed for administrators, teachers, and students.",
    type: "website",
  },
}

export default function HowPage() {
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Transform Your School with
            <span className="text-primary block mt-2">Smart Management</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            EduManage is the comprehensive school management platform that connects administrators, teachers, and
            students in one seamless ecosystem. Streamline operations, enhance learning, and drive academic success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How EduManage Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to revolutionize your school management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">1. Set Up Your School</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create your school profile, add administrators, teachers, and students. Our intuitive setup wizard
                  guides you through the entire process in minutes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">2. Manage Everything</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Handle student enrollment, class scheduling, grade management, attendance tracking, and
                  communication—all from one centralized platform.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">3. Track & Improve</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor student progress, generate detailed reports, and make data-driven decisions to continuously
                  improve educational outcomes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose EduManage?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for educational institutions with features that matter
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure & Compliant",
                description: "Enterprise-grade security with FERPA compliance and data protection.",
              },
              {
                icon: Clock,
                title: "Save Time",
                description: "Automate routine tasks and reduce administrative workload by 60%.",
              },
              {
                icon: Users,
                title: "Role-Based Access",
                description: "Customized dashboards for administrators, teachers, and students.",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reports",
                description: "Comprehensive insights into student performance and school operations.",
              },
              {
                icon: BookOpen,
                title: "Academic Management",
                description: "Complete grade book, attendance tracking, and curriculum management.",
              },
              {
                icon: CheckCircle,
                title: "Easy Integration",
                description: "Seamlessly integrate with existing school systems and tools.",
              },
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your School?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of schools already using EduManage to streamline operations and improve student outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
              >
                Sign In Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">EduManage</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/support" className="hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 EduManage. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
