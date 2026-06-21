import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center bg-[#050508] text-white p-6">
          <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0A0A0F] p-6 space-y-4">
            <h1 className="text-xl font-display font-bold">Something went wrong</h1>
            <p className="text-sm text-white/60">
              The app hit an unexpected error. Try reloading — if it keeps happening, sign out and sign in again.
            </p>
            <pre className="text-xs text-red-300/90 bg-red-500/10 border border-red-500/20 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
            <div className="flex gap-2">
              <Button className="flex-1 font-semibold" onClick={() => window.location.reload()}>
                Reload page
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  this.setState({ error: null });
                  window.location.href = "/auth";
                }}
              >
                Back to sign in
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
