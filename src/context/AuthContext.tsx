import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isConfigured, supabase } from "../lib/supabase";
import type { GuideProfile, Profile, Role } from "../lib/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  guide: GuideProfile | null;
  loading: boolean;
  isGuide: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  const loadUserData = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRoles([]);
      setGuide(null);
      return;
    }
    const [p, r, g] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("guide_profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    setProfile((p.data as Profile) ?? null);
    setRoles(((r.data ?? []) as { role: Role }[]).map((x) => x.role));
    setGuide((g.data as GuideProfile) ?? null);
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadUserData(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Defer so we do not call Supabase inside its own auth callback.
      setTimeout(() => void loadUserData(next?.user.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

  const refresh = useCallback(() => loadUserData(session?.user.id), [loadUserData, session]);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        roles,
        guide,
        loading,
        isGuide: roles.includes("guide") && Boolean(guide),
        isAdmin: roles.includes("admin"),
        refresh,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
