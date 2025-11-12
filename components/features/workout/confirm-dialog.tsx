'use client'

import { useEffect } from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ConfirmDialogType = 'confirm' | 'alert' | 'warning'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmDialogType
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  type = 'confirm',
}: ConfirmDialogProps) {
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && onConfirm) {
        onConfirm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onConfirm])

  if (!isOpen) return null

  // Color schemes based on type
  const colorSchemes = {
    confirm: {
      icon: CheckCircle,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
    },
    alert: {
      icon: AlertCircle,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      confirmBg: 'bg-gray-700 hover:bg-gray-600',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-400',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
    },
  }

  const scheme = colorSchemes[type]
  const Icon = scheme.icon
  const isAlert = type === 'alert'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-md w-full border border-gray-800 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${scheme.iconBg} rounded-lg`}>
              <Icon className={`w-5 h-5 ${scheme.iconColor}`} />
            </div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-800">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            {isAlert ? 'Chiudi' : cancelText}
            <span className="text-xs text-gray-500 ml-2">(ESC)</span>
          </Button>
          {!isAlert && onConfirm && (
            <Button
              onClick={onConfirm}
              className={`flex-1 ${scheme.confirmBg} text-white`}
            >
              {confirmText}
              <span className="text-xs opacity-70 ml-2">(ENTER)</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
