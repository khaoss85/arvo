'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { EquipmentSelector } from '@/components/equipment/equipment-selector'
import { updateAvailableEquipmentAction } from '@/app/actions/ai-actions'
import { Loader2, Check } from 'lucide-react'

interface EquipmentInventoryEditorProps {
  userId: string
  initialEquipment: string[]
}

export function EquipmentInventoryEditor({
  userId,
  initialEquipment
}: EquipmentInventoryEditorProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(initialEquipment)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasChanges = JSON.stringify(selectedEquipment.sort()) !== JSON.stringify(initialEquipment.sort())

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    setError(null)

    try {
      const result = await updateAvailableEquipmentAction(userId, selectedEquipment)

      if (result.success) {
        setSaveSuccess(true)
        // Reset success message after 2 seconds
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        setError(result.error || 'Failed to save equipment')
      }
    } catch (err) {
      setError('An error occurred while saving')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Equipment Inventory</h3>
        <p className="text-sm text-muted-foreground">
          Select all equipment you have access to. This helps us generate workouts tailored to your available equipment.
        </p>
      </div>

      <EquipmentSelector
        initialSelection={selectedEquipment}
        onSelectionChange={setSelectedEquipment}
        showContinueButton={false}
      />

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        {hasChanges && !isSaving && (
          <span className="text-sm text-muted-foreground">
            {selectedEquipment.length} items selected
          </span>
        )}
      </div>
    </div>
  )
}
