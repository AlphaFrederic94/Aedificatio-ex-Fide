'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChainHealthCard } from '@/components/blockchain/chain-health-card'
import { ActivityChart } from '@/components/blockchain/activity-chart'
import { VerificationPanel } from '@/components/blockchain/verification-panel'
import { RecentActivityFeed } from '@/components/blockchain/recent-activity-feed'
import { AuditLogTable } from '@/components/blockchain/audit-log-table'
import { BlockCard } from '@/components/blockchain/block-card'
import { Loader2, Shield, Activity, Search, Database } from 'lucide-react'
import { toast } from 'sonner'

interface BlockchainStats {
  totalBlocks: number
  chainStatus: 'verified' | 'tampered'
  lastVerification: number
  genesisBlock: {
    index: number
    hash: string
    timestamp: number
  } | null
  blocksByEntity: Record<string, number>
  blocksByAction: Record<string, number>
}

interface Block {
  index: number
  prevHash: string
  data: {
    action: string
    actorId: string
    entity: string
    entityId?: string
    payload?: any
  }
  timestamp: number
  hash: string
}

interface BlocksResponse {
  blocks: Block[]
  total: number
  page: number
  totalPages: number
}

export default function BlockchainDashboard() {
  const [stats, setStats] = useState<BlockchainStats | null>(null)
  const [blocksData, setBlocksData] = useState<BlocksResponse | null>(null)
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<{ entity?: string; action?: string; search?: string }>({})

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/audit/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        toast.error('Failed to fetch blockchain statistics')
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      toast.error('Failed to fetch blockchain statistics')
    }
  }

  const fetchBlocks = async (page: number = 1, filterOptions = filters) => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterOptions.entity && { entity: filterOptions.entity }),
        ...(filterOptions.action && { action: filterOptions.action }),
      })

      const response = await fetch(`${backendUrl}/audit/blocks?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBlocksData(data)
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error)
    }
  }

  const fetchRecentBlocks = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/api'
      const response = await fetch(`${backendUrl}/audit/recent?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRecentBlocks(data)
      }
    } catch (error) {
      console.error('Failed to fetch recent blocks:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchBlocks(), fetchRecentBlocks()])
      setLoading(false)
    }

    loadData()
  }, [])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchBlocks(page, filters)
  }

  const handleFilterChange = (newFilters: { entity?: string; action?: string; search?: string }) => {
    setFilters(newFilters)
    setCurrentPage(1)
    fetchBlocks(1, newFilters)
  }

  const handleVerify = () => {
    fetchStats()
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Failed to load blockchain data</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header with Tech-Inspired Design */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent p-8 text-white shadow-strong">
        <div className="absolute inset-0 bg-diagonal-grid opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Blockchain Dashboard</h1>
            <p className="text-white/90 text-lg">
              Monitor and verify the integrity of the blockchain audit trail
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="blocks" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Blocks
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChainHealthCard
              totalBlocks={stats.totalBlocks}
              chainStatus={stats.chainStatus}
              lastVerification={stats.lastVerification}
              genesisBlock={stats.genesisBlock}
            />
            <VerificationPanel onVerify={handleVerify} />
          </div>

          <ActivityChart
            blocksByEntity={stats.blocksByEntity}
            blocksByAction={stats.blocksByAction}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <RecentActivityFeed limit={50} />
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit-log">
          {blocksData && (
            <AuditLogTable
              blocks={blocksData.blocks}
              total={blocksData.total}
              page={blocksData.page}
              totalPages={blocksData.totalPages}
              onPageChange={handlePageChange}
              onFilterChange={handleFilterChange}
            />
          )}
        </TabsContent>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="space-y-4">
          <div className="grid gap-4">
            {recentBlocks.map((block) => (
              <BlockCard key={block.index} block={block} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  )
}

