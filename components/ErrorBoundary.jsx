'use client'

import { Component } from 'react'
import { logger } from '@/lib/utils/logger'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    logger.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex-grow p-6">
          <div className="card">
            <div className="p-6 text-center py-10">
              <i className="bx bx-error-circle text-red-500" style={{ fontSize: '3rem' }}></i>
              <h4 className="mt-3 font-semibold text-lg">Something went wrong</h4>
              <p className="text-surface-500 mb-4">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <i className="bx bx-refresh mr-1"></i>
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
