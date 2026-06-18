import { Component, type ErrorInfo, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/** Reloads the store page if anything in the storefront tree crashes. */
export default class StoreErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Storefront error:", error, info);
    window.setTimeout(() => window.location.reload(), 800);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center bg-zinc-950 text-zinc-100 p-6">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-400" />
            <p className="text-sm text-zinc-400">Reloading store…</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
