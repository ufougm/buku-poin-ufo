import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>
            <p className="text-sm text-gray-500 mb-4">
              Aplikasi mengalami error saat memuat. Ini mungkin karena database belum terhubung.
            </p>
            {this.state.error && (
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-red-400 text-left mb-4 overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh Halaman
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Jika error terus berlanjut, pastikan Supabase sudah dikonfigurasi dengan benar.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
