import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/domain";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  primaryRole: AppRole | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isGuardian: boolean;
  fullName: string;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_PRIORITY: AppRole[] = ["admin", "teacher", "student", "guardian"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
      if (event === "SIGNED_OUT") {
        queryClient.clear();
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        queryClient.invalidateQueries();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const { data: roles = [] } = useQuery({
    queryKey: ["my-roles", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const primaryRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
    return {
      session,
      user: session?.user ?? null,
      loading,
      roles,
      primaryRole,
      isAdmin: roles.includes("admin"),
      isTeacher: roles.includes("teacher"),
      isStudent: roles.includes("student"),
      isGuardian: roles.includes("guardian"),
      fullName: profile?.full_name || session?.user.email || "",
      signOut,
    };
  }, [session, loading, roles, profile, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
