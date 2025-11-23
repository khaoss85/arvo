import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'
export const contentType = 'image/png'

// Default size for favicon
export const size = {
  width: 32,
  height: 32,
}

// Image generation with dynamic sizing from query params
export default function Icon(request: NextRequest) {
  // Extract size from URL search params
  const searchParams = request.nextUrl?.searchParams
  const requestedSize = searchParams?.get('size')
  const iconSize = requestedSize ? parseInt(requestedSize) : 32

  // Clamp size between 16 and 512 for safety
  const finalSize = Math.min(Math.max(iconSize, 16), 512)

  // Calculate font size proportional to icon size
  const fontSize = finalSize * 0.625 // 62.5% of icon size

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: fontSize,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          borderRadius: '20%',
        }}
      >
        A
      </div>
    ),
    {
      width: finalSize,
      height: finalSize,
    }
  )
}
