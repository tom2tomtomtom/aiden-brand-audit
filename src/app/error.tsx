'use client'

// Route-level error boundary. Catches errors inside the app router tree
// (layouts, pages, nested components) and gives the user a way to retry
// instead of seeing a blank page.
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function AppError({
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
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong</h2>
      <p style={{ marginTop: '0.5rem', maxWidth: 480, opacity: 0.75, fontSize: '0.875rem' }}>
        We hit an unexpected error rendering this page in AIDEN Brand Audit.
        Our team has been notified. Try again, or head back to the AIDEN
        dashboard.
      </p>
      {error.digest && (
        <p style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.4 }}>
          ref: {error.digest}
        </p>
      )}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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
            border: '1px solid currentColor',
            padding: '0.6rem 1.25rem',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Back to AIDEN
        </a>
      </div>
    </main>
  )
}
