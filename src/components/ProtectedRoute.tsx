"use client";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-green-600" />
      </div>
    );
  }
  return <>{children}</>;
}
