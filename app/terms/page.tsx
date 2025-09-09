import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/signup">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Signup
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-emerald-900">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-emerald max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using our School Management System, you accept and agree to be bound by the terms and
              provision of this agreement.
            </p>

            <h2>Use License</h2>
            <p>
              Permission is granted to temporarily use our platform for educational purposes. This is the grant of a
              license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>Use the materials for commercial purposes</li>
              <li>Attempt to reverse engineer any software</li>
              <li>Remove any copyright or proprietary notations</li>
            </ul>

            <h2>User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities
              that occur under your account.
            </p>

            <h2>Acceptable Use</h2>
            <p>You agree not to use the service to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Transmit harmful or malicious content</li>
              <li>Interfere with the security of the platform</li>
              <li>Access data you are not authorized to view</li>
            </ul>

            <h2>Educational Records</h2>
            <p>
              All educational records and data remain the property of the respective educational institution. We serve
              as a service provider and data processor.
            </p>

            <h2>Service Availability</h2>
            <p>
              While we strive for continuous availability, we do not guarantee uninterrupted access to our services and
              may perform maintenance as needed.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              In no event shall our company be liable for any damages arising out of the use or inability to use our
              services.
            </p>

            <h2>Contact Information</h2>
            <p>Questions about these Terms of Service should be sent to us at legal@schoolmanagement.edu</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
