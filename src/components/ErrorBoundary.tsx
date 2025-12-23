import { Component, type ReactNode } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6">
          <Alert variant="destructive">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Something went wrong</h3>
                <p className="mt-2 text-sm">
                  An unexpected error occurred. Please try refreshing the page or contact support if
                  the problem persists.
                </p>
                {this.state.error && logger.isDebugMode() && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Error details (debug mode)
                    </summary>
                    <pre className="mt-2 overflow-auto rounded bg-slate-900 p-4 text-xs text-white">
                      {this.state.error.toString()}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={this.handleReset} size="sm">
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Reload Page
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
