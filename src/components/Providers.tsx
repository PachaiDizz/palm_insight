"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
