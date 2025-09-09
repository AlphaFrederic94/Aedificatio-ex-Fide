"use client"

import React from "react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Properly log errors instead of event objects
    console.error('Error caught by boundary:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Also override console.error to catch any event objects being logged
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    const processedArgs = args.map(arg => {
      // Check if argument is an Event object or has Event-like properties
      if (arg && typeof arg === 'object') {
        // Check for Event objects
        if (arg.constructor && arg.constructor.name && arg.constructor.name.includes('Event')) {
          return `[Event: ${arg.type || 'unknown'} on ${arg.target?.tagName || 'unknown element'}]`
        }
        // Check for objects that stringify to [object Event]
        if (Object.prototype.toString.call(arg) === '[object Event]') {
          return `[Event: ${arg.type || 'unknown'} on ${arg.target?.tagName || 'unknown element'}]`
        }
      }
      return arg
    })
    originalConsoleError.apply(console, processedArgs)
  }

  // Add global error handlers
  window.addEventListener('error', (event) => {
    console.error('Global error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.message || 'Unknown error'
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', {
      reason: event.reason?.message || event.reason || 'Unknown rejection',
      stack: event.reason?.stack || 'No stack trace'
    })
  })
}
