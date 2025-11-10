import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'Arvo - Smart Workout Tracker'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Image generation
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 180,
              fontWeight: 700,
              color: 'white',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20%',
              width: 240,
              height: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            A
          </div>
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: 'white',
            marginBottom: 20,
          }}
        >
          Arvo
        </div>
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Smart Workout Tracker & Training Program Builder
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
