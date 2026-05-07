import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Spinner from '../components/Spinner';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Procesa la sesión actual (incluyendo el token del link de confirmación)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escucha cambios: login, logout, confirmación de email, token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      // Cuando el usuario confirma el email, redirigir al dashboard
      if (event === 'SIGNED_IN') {
        // Limpiar el hash feo de la URL sin recargar la página
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login  = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signup = (email, password) => supabase.auth.signUp({ email, password });
  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
    {loading
      ? <Spinner splash />
      : children
    }
  </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);