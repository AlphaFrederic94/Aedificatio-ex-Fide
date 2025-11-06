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
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 text-white shadow-strong">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-white/90 text-lg">
              Welcome to the school management system. Monitor and manage all aspects of your institution.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <AdminStatsCards />

        {/* Quick Actions */}
        <AdminQuickActions />

        {/* Blockchain Security Widget */}
        <BlockchainStatsWidget />

        {/* Recent Activity Summary */}
        <Card className="shadow-medium hover-lift border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover-lift">
                <div className="text-3xl font-bold text-primary mb-1">98%</div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20 hover-lift">
                <div className="text-3xl font-bold text-secondary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Support Available</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20 hover-lift">
                <div className="text-3xl font-bold text-accent mb-1">Latest</div>
                <div className="text-sm text-muted-foreground">System Version</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
