import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef   = useRef(true);
  const initDoneRef  = useRef(false);
  const ignoreSIGNIN = useRef(false); // bloqueia SIGNED_IN do signup de aluno

  const loadProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      let { data } = await supabase
        .from("profiles").select("*").eq("user_id", userId).maybeSingle();
      if (!data) {
        const r = await supabase
          .from("profiles").select("*").eq("id", userId).maybeSingle();
        data = r.data;
      }
      return data ?? null;
    } catch { return null; }
  }, []);

  useEffect(() => {
    mountedRef.current  = true;
    initDoneRef.current = false;

    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 5000);

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;
        if (session?.user) {
          setUser(session.user);
          const p = await loadProfile(session.user.id);
          if (mountedRef.current) setProfile(p);
        }
      } catch (e) {
        console.error("AuthContext init:", e?.message);
      } finally {
        if (mountedRef.current) {
          clearTimeout(safetyTimer);
          setLoading(false);
          initDoneRef.current = true;
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!initDoneRef.current) return;
        if (!mountedRef.current) return;

        // Ignora SIGNED_IN disparado pelo signup de aluno pelo admin
        if (event === "SIGNED_IN" && ignoreSIGNIN.current) {
          ignoreSIGNIN.current = false;
          return;
        }

        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          setProfile(null);
          return;
        }
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setUser(session.user);
          const p = await loadProfile(session.user.id);
          if (mountedRef.current) setProfile(p);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message?.includes('Invalid login credentials') || error.status === 400) {
        throw new Error('Email ou senha incorretos. Verifique seus dados e tente novamente.');
      }
      throw new Error(error.message || 'Erro ao fazer login. Tente novamente.');
    }
  };

  const logout = async () => {
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  // Expõe flag para CreateStudentPage bloquear o SIGNED_IN do signup
  const setIgnoreNextSignIn = () => { ignoreSIGNIN.current = true; };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      login, logout,
      isAdmin:         profile?.role === "admin" || profile?.is_admin === true,
      isStudent:       profile?.role === "student",
      isAuthenticated: !!user,
      reloadProfile:   () => user && loadProfile(user.id).then(p => { if (mountedRef.current) setProfile(p); }),
      setIgnoreNextSignIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);