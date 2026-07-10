"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { UserProfile } from "@/types";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  profile: UserProfile | null;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  fetchProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setProfile(data ?? null);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  // Fetch profile when user logs in
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, profile, fetchProfile }}>
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-amber-500" size={40} />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

