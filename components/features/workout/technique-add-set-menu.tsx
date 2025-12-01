'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Plus, TrendingUp, TrendingDown, ChevronDown, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AppliedTechnique, TechniqueConfig } from '@/lib/types/advanced-techniques'
import {
  isTopSetBackoffConfig,
  isDropSetConfig,
  isRestPauseConfig,
  isMyoRepsConfig,
  isClusterSetConfig,
} from '@/lib/types/advanced-techniques'

export type TechniqueSetType = 'topSet' | 'backoff' | 'drop' | 'miniSet' | 'cluster'

interface TechniqueAddSetMenuProps {
  technique: AppliedTechnique
  onAddSet: (type: TechniqueSetType) => void
  disabled?: boolean
}

interface AddOption {
  key: TechniqueSetType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

function getAddOptionsForTechnique(
  config: TechniqueConfig,
  t: (key: string) => string
): AddOption[] {
  if (isTopSetBackoffConfig(config)) {
    return [
      {
        key: 'topSet',
        label: t('addTopSet'),
        description: t('addTopSetDesc'),
        icon: TrendingUp,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
      },
      {
        key: 'backoff',
        label: t('addBackoff'),
        description: t('addBackoffDesc'),
        icon: TrendingDown,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
      },
    ]
  }

  if (isDropSetConfig(config)) {
    return [
      {
        key: 'drop',
        label: t('addDrop'),
        description: t('addDropDesc'),
        icon: ChevronDown,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
      },
    ]
  }

  if (isRestPauseConfig(config) || isMyoRepsConfig(config)) {
    return [
      {
        key: 'miniSet',
        label: t('addMiniSet'),
        description: t('addMiniSetDesc'),
        icon: Zap,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
      },
    ]
  }

  if (isClusterSetConfig(config)) {
    return [
      {
        key: 'cluster',
        label: t('addCluster'),
        description: t('addClusterDesc'),
        icon: Plus,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
      },
    ]
  }

  return []
}

export function TechniqueAddSetMenu({
  technique,
  onAddSet,
  disabled = false,
}: TechniqueAddSetMenuProps) {
  const t = useTranslations('workout.techniqueAddSet')
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const options = getAddOptionsForTechnique(technique.config, t)

  // If no options available for this technique, don't render
  if (options.length === 0) {
    return null
  }

  // If only one option, render direct button without menu
  if (options.length === 1) {
    const option = options[0]
    const Icon = option.icon
    return (
      <button
        onClick={() => onAddSet(option.key)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
          'border border-gray-700 hover:border-gray-600',
          option.color,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {option.label}
      </button>
    )
  }

  const handleOptionSelect = (key: TechniqueSetType) => {
    onAddSet(key)
    setIsOpen(false)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
          'border border-gray-700 hover:border-gray-600 text-blue-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Plus className="w-3.5 h-3.5" />
        {t('addSet')}
      </button>

      {/* Menu drawer */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 z-50 bg-black/60"
                />

                {/* Drawer */}
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl"
                >
                  {/* Handle */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-gray-600" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pb-4">
                    <h2 className="text-lg font-semibold">{t('selectType')}</h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Options */}
                  <div className="px-4 pb-8 space-y-3">
                    {options.map((option) => {
                      const Icon = option.icon

                      return (
                        <motion.button
                          key={option.key}
                          onClick={() => handleOptionSelect(option.key)}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all',
                            'border-2 border-gray-700 hover:border-gray-600'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0',
                              option.bgColor
                            )}
                          >
                            <Icon className={cn('h-5 w-5', option.color)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-white">
                              {option.label}
                            </span>
                            <p className="mt-0.5 text-sm text-gray-400">
                              {option.description}
                            </p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Safe area for iOS */}
                  <div className="h-safe" />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
