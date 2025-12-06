'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Users, X, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCoachClientsAction, type CoachClient } from '@/app/actions/shared-package-actions'

interface ClientInfo {
  id: string
  name: string
}

interface SharedPackageFormProps {
  coachId: string
  primaryClientId: string
  primaryClientName: string
  isShared: boolean
  sharedWithClientIds: string[]
  maxSharedUsers: number
  onSharedChange: (isShared: boolean) => void
  onSharedWithChange: (clientIds: string[]) => void
  onMaxUsersChange: (max: number) => void
  className?: string
}

export function SharedPackageForm({
  coachId,
  primaryClientId,
  primaryClientName,
  isShared,
  sharedWithClientIds,
  maxSharedUsers,
  onSharedChange,
  onSharedWithChange,
  onMaxUsersChange,
  className,
}: SharedPackageFormProps) {
  const t = useTranslations('packages.shared')

  const [availableClients, setAvailableClients] = useState<ClientInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  // Load available clients for sharing
  useEffect(() => {
    if (isShared) {
      loadClients()
    }
  }, [isShared, coachId])

  const loadClients = async () => {
    setIsLoading(true)
    try {
      const result = await getCoachClientsAction()
      if (result.success && result.clients) {
        // Filter out the primary client and already added clients
        const clients = result.clients
          .filter((c: CoachClient) => c.client_id !== primaryClientId)
          .map((c: CoachClient) => ({
            id: c.client_id,
            name: c.client_name || 'Unknown',
          }))
        setAvailableClients(clients)
      }
    } catch (error) {
      console.error('[SharedPackageForm] Error loading clients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddClient = () => {
    if (!selectedClientId || sharedWithClientIds.includes(selectedClientId)) return
    if (sharedWithClientIds.length >= maxSharedUsers - 1) return // -1 because primary is counted

    onSharedWithChange([...sharedWithClientIds, selectedClientId])
    setSelectedClientId('')
  }

  const handleRemoveClient = (clientId: string) => {
    onSharedWithChange(sharedWithClientIds.filter(id => id !== clientId))
  }

  const getClientName = (clientId: string): string => {
    const client = availableClients.find(c => c.id === clientId)
    return client?.name || 'Unknown'
  }

  const filteredClients = availableClients.filter(
    c => !sharedWithClientIds.includes(c.id)
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toggle Shared Package */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{t('title')}</p>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        <Switch
          checked={isShared}
          onCheckedChange={onSharedChange}
        />
      </div>

      {/* Shared Package Configuration */}
      {isShared && (
        <div className="space-y-4 p-4 border rounded-lg">
          {/* Max Users */}
          <div className="space-y-2">
            <Label>{t('maxUsers')}</Label>
            <Select
              value={String(maxSharedUsers)}
              onValueChange={(value) => onMaxUsersChange(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5].map(num => (
                  <SelectItem key={num} value={String(num)}>
                    {num} {t('people')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Owner */}
          <div className="space-y-2">
            <Label>{t('primaryOwner')}</Label>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {primaryClientName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{primaryClientName}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {t('owner')}
              </Badge>
            </div>
          </div>

          {/* Shared With */}
          <div className="space-y-2">
            <Label>{t('sharedWith')}</Label>

            {/* Added Clients */}
            {sharedWithClientIds.length > 0 && (
              <div className="space-y-2">
                {sharedWithClientIds.map(clientId => (
                  <div
                    key={clientId}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {getClientName(clientId).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>{getClientName(clientId)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClient(clientId)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Client */}
            {sharedWithClientIds.length < maxSharedUsers - 1 && (
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedClientId}
                      onValueChange={setSelectedClientId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t('selectClient')} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                        {filteredClients.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {t('noClientsAvailable')}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleAddClient}
                      disabled={!selectedClientId}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Slots remaining info */}
            <p className="text-xs text-muted-foreground">
              {t('slotsRemaining', {
                current: sharedWithClientIds.length + 1,
                max: maxSharedUsers,
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
