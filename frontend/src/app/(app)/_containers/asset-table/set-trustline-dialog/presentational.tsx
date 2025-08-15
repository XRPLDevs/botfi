'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toaster'
import type { AssetInfo } from '../types'

type SetTrustlineDialogProps = {
  isOpen: boolean
  onClose: () => void
  asset: AssetInfo | null
  onTrustlineSet: (currency: string, issuer: string, limit: string) => Promise<void>
  isLoading?: boolean
}

export function SetTrustlineDialog({
  isOpen,
  onClose,
  asset,
  onTrustlineSet,
  isLoading = false,
}: SetTrustlineDialogProps) {
  const [limit, setLimit] = useState('1000000000') // デフォルト値

  if (!asset) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await onTrustlineSet(asset.type, asset.issuer || '', limit)
      toast.success(`Trustline request created for ${asset.type}. Please sign the transaction in the new tab.`)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set trustline')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Trustline</DialogTitle>
          <DialogDescription>
            Set trustline for {asset.type} token. This will allow you to hold and trade this token.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={asset.type}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer</Label>
            <Input
              id="issuer"
              value={asset.issuer || ''}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="limit">Limit Amount</Label>
            <Input
              id="limit"
              type="text"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="1000000000"
              required
            />
            <p className="text-sm text-muted-foreground">
              Maximum amount you trust this issuer for
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Setting...' : 'Set Trustline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
