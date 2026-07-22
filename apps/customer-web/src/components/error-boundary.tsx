'use client';
import React, { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-ink mb-2">Something went wrong</h2>
          <p className="text-sm text-body mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button onClick={() => this.setState({ hasError: false })} className="btn btn-primary btn-sm">Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
