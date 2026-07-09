import { AlertTriangle, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SupabaseCheck({ children }: { children: React.ReactNode }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  const isConfigured = supabaseUrl.startsWith("https://") && supabaseKey.length > 20;

  if (isConfigured) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Database Belum Terhubung</h1>
        <p className="text-sm text-gray-500 mb-6">
          Aplikasi Buku Poin UFO memerlukan Supabase database untuk menyimpan data. Silakan hubungkan Supabase terlebih dahulu.
        </p>

        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <p className="text-sm text-gray-700">Buat project di <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-red-600 font-medium hover:underline">supabase.com</a></p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <p className="text-sm text-gray-700">Buka Project Settings &rarr; API, copy URL dan Anon Key</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <p className="text-sm text-gray-700">Tambahkan ke Environment Variables di Vercel:</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 space-y-1">
            <div>VITE_SUPABASE_URL=https://...</div>
            <div>VITE_SUPABASE_ANON_KEY=eyJ...</div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <p className="text-sm text-gray-700">Jalankan SQL schema di Supabase SQL Editor</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">5</span>
            <p className="text-sm text-gray-700">Redeploy di Vercel</p>
          </div>
        </div>

        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">
            File schema SQL tersedia di repositori: <code className="font-mono bg-yellow-100 px-1 rounded">supabase-schema.sql</code>
          </p>
        </div>
      </div>
    </div>
  );
}
