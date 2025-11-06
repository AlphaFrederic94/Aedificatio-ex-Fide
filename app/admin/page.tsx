import { AdminLayout } from "@/components/layout/admin-layout"
import { AdminStatsCards } from "@/components/admin/admin-stats-cards"
import { AdminQuickActions } from "@/components/admin/admin-quick-actions"
import { BlockchainStatsWidget } from "@/components/blockchain/blockchain-stats-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to the school management system. Monitor and manage all aspects of your institution.
          </p>
        </div>

        {/* Stats Cards */}
        <AdminStatsCards />

        {/* Quick Actions */}
        <AdminQuickActions />

        {/* Blockchain Security Widget */}
        <BlockchainStatsWidget />

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">98%</div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">24/7</div>
                <div className="text-sm text-muted-foreground">Support Available</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Latest</div>
                <div className="text-sm text-muted-foreground">System Version</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
