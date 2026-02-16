import { Component, type ReactNode } from 'react'

interface AppErrorBoundaryState {
  hasError: boolean
  message: string | null
}

interface AppErrorBoundaryProps {
  children: ReactNode
}

/**
 * Global error boundary so uncaught render errors show a user-friendly UI
 * instead of a blank screen. Matches app styling with a simple message
 * and a reload button.
 */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, message: null }
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const message =
      error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.'
    return { hasError: true, message }
  }

  // eslint-disable-next-line class-methods-use-this
  componentDidCatch(error: unknown, errorInfo: unknown) {
    // In a real app, this is where you'd log to a monitoring service.
    // eslint-disable-next-line no-console
    console.error('Uncaught error in AppErrorBoundary', { error, errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              maxWidth: 520,
              width: '100%',
              borderRadius: 10,
              padding: '1.75rem 1.5rem',
              border: '1px solid rgba(220, 53, 69, 0.35)',
              background: 'rgba(220, 53, 69, 0.08)',
            }}
          >
            <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.35rem' }}>
              Terjadi kesalahan pada aplikasi
            </h1>
            <p style={{ margin: '0 0 1.25rem', opacity: 0.8, fontSize: '0.95rem' }}>
              {this.state.message ??
                'Terjadi kesalahan tak terduga. Silakan muat ulang halaman dan coba lagi.'}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: 8,
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'linear-gradient(180deg, #7c84ff 0%, #5a62e0 100%)',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(100, 108, 255, 0.35)',
              }}
            >
              Muat ulang halaman
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

