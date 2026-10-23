import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger, ErrorTracker } from '../../services/logger';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    ErrorTracker.captureException(error, {
      componentStack: errorInfo.componentStack || '',
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 select-none">
          <div className="max-w-md w-full bg-slate-900 border border-rose-900/40 rounded-xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center mb-4 text-rose-400">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100 mb-2">IDE Runtime Exception</h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              An unhandled rendering fault occurred. Details have been captured by the Vertex Forge Observability engine.
            </p>
            {this.state.error && (
              <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-[11px] font-mono text-rose-300 overflow-x-auto mb-5 max-h-36">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
