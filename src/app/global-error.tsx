'use client'

// Top-level error boundary. Renders when error.tsx itself fails or when
// an error bubbles past every route-level boundary. Without this Next.js
// falls back to a blank white page on unhandled render errors.
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#ffffff',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: 480, padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>
            An unexpected error occurred in AIDEN Brand Audit. Our team has been
            notified. You can try again, or return to the AIDEN dashboard.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 0,
                padding: '0.6rem 1.25rem',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Try again
            </button>
            <a
              href="https://www.aiden.services/dashboard"
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid #3f3f46',
                padding: '0.6rem 1.25rem',
                borderRadius: 6,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Back to AIDEN
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
