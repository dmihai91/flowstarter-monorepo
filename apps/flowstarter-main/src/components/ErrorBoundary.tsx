'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/lib/i18n';
import en from '@/locales/en';
import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details on server/console for debugging
    console.error('ErrorBoundary caught an error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Wrap error fallback with necessary providers so it can use theme toggle
      return (
        <ThemeProvider>
          <I18nProvider initialLocale="en" initialMessages={{ en }}>
            <ErrorFallback />
          </I18nProvider>
        </ThemeProvider>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier usage
export function ErrorBoundaryWrapper({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
