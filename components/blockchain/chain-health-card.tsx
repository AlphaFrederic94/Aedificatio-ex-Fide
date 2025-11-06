'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, AlertTriangle, Database, Clock } from 'lucide-react'

interface ChainHealthCardProps {
  totalBlocks: number
  chainStatus: 'verified' | 'tampered'
  lastVerification: number
  genesisBlock: {
    index: number
    hash: string
    timestamp: number
  } | null
}

export function ChainHealthCard({ totalBlocks, chainStatus, lastVerification, genesisBlock }: ChainHealthCardProps) {
  const isVerified = chainStatus === 'verified'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Chain Health Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {isVerified ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">Chain Status</span>
          </div>
          <Badge variant={isVerified ? "default" : "destructive"}>
            {isVerified ? 'Verified ✓' : 'Integrity Issue ⚠️'}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              Total Blocks
            </div>
            <p className="text-2xl font-bold">{totalBlocks.toLocaleString()}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last Verified
            </div>
            <p className="text-sm font-medium">
              {new Date(lastVerification).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Genesis Block Info */}
        {genesisBlock && (
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Genesis Block
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Index:</span>
                <span className="font-mono">{genesisBlock.index}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hash:</span>
                <span className="font-mono truncate max-w-[200px]" title={genesisBlock.hash}>
                  {genesisBlock.hash.substring(0, 16)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(genesisBlock.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Security Note */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            🔒 All operations are cryptographically secured using SHA-256 hashing and immutably stored in the blockchain.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

