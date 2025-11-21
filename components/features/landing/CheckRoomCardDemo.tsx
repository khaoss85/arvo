'use client'

import { Camera } from 'lucide-react'

// Mock data for demo purposes
const mockCheckData = {
  taken_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
  weight: 82.5,
  notes: 'End of first mesocycle. Feeling strong, chest and shoulders looking fuller.',
  photos: [
    {
      id: 'photo-1',
      photo_type: 'front' as const,
      photo_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=600&fit=crop',
    },
    {
      id: 'photo-2',
      photo_type: 'side_left' as const,
      photo_url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&h=600&fit=crop',
    },
    {
      id: 'photo-3',
      photo_type: 'side_right' as const,
      photo_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=600&fit=crop',
    },
    {
      id: 'photo-4',
      photo_type: 'back' as const,
      photo_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=600&fit=crop',
    },
  ],
}

/**
 * Static demo version of CheckRoomCard for landing page showcase
 * Shows the UI without database dependencies
 */
export function CheckRoomCardDemo() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 max-w-2xl mx-auto shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Check Room
          </h2>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white pointer-events-none opacity-90">
          New Check
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Latest Check
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              2 weeks ago
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {mockCheckData.weight}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">kg</p>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-4 gap-2">
          {mockCheckData.photos.map((photo) => (
            <div
              key={photo.id}
              className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden"
            >
              <img
                src={photo.photo_url}
                alt={photo.photo_type}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 italic">
          "{mockCheckData.notes}"
        </div>
      </div>
    </div>
  )
}
