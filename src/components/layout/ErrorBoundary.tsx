import { logger } from '../../services/logger';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[Vertex Forge ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.removeItem('vertexforge_autosave');
      localStorage.removeItem('vertex_forge_layout_config_v2');
      localStorage.removeItem('vertex_forge_theme_preferences_v2');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 select-none font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              {this.props.fallbackTitle || 'Vertex Forge Workbench UI Protected'}
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              An unexpected component issue was caught safely to prevent a white screen. You can reload the workbench or restore standard defaults.
            </p>
            {this.state.error && (
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-left mb-4 overflow-x-auto max-h-32 text-[11px] font-mono text-rose-300">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Workbench
              </button>
              <button
                onClick={this.handleResetState}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Clears cached layout and reloads"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
