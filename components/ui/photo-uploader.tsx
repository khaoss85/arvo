'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { Button } from './button'
import imageCompression from 'browser-image-compression'

interface PhotoUploaderProps {
  onUpload: (base64: string) => void
  onClear?: () => void
  isLoading?: boolean
}

export function PhotoUploader({ onUpload, onClear, isLoading }: PhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return
    }

    try {
      setIsCompressing(true)

      // Comprimi immagine (max 1024px, max 1MB)
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options)

      // Converti in base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setPreview(base64)
        setIsCompressing(false)
        onUpload(base64)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error('Error processing image:', error)
      setIsCompressing(false)
    }
  }

  const handleClear = () => {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    onClear?.()
  }

  if (preview) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
          <img src={preview} alt="Equipment preview" className="w-full h-48 object-contain" />
          {!isLoading && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
        disabled={isCompressing || isLoading}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
        disabled={isCompressing || isLoading}
      />

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isCompressing || isLoading}
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm">Take Photo</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing || isLoading}
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm">Upload Photo</span>
        </Button>
      </div>

      {isCompressing && (
        <p className="text-sm text-muted-foreground text-center">Compressing image...</p>
      )}
    </div>
  )
}
