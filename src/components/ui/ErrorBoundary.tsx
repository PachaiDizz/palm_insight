"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl card-glow" style={{ backgroundColor: "var(--bg-card)" }}>
          <AlertTriangle className="w-12 h-12 mb-4" style={{ color: "var(--accent-amber)" }} />
          <h2 className="section-heading text-lg mb-2" style={{ color: "var(--text-primary)" }}>Something went wrong</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ backgroundColor: "var(--accent-green-light)", color: "var(--accent-green)" }}>
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
