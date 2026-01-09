import { createContext, useContext, useEffect, useState, ReactNode } from "react";
// 1. Import the socket functions
import { connectSocket, disconnectSocket } from "../lib/socket";

// User role type
type UserRole = "student" | "teacher" | "parent" | "admin";

// User type (matching backend)
interface User {
  _id: string;
  id: string; // compatibility alias
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  token?: string;
  roadmap?: string;
}

// Compatibility Profile type
interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null; // compatibility
  role: UserRole | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived state for compatibility
  const role = user?.role || null;
  const profile: Profile | null = user ? {
    id: user._id,
    name: user.name,
    avatar_url: user.avatar || null
  } : null;

  // ----------------------------
  // NEW: SOCKET MANAGEMENT
  // ----------------------------
  useEffect(() => {
    if (user) {
      // Connect to socket when user is logged in
      connectSocket(user._id);
    } else {
      // Disconnect when user is null (logged out)
      disconnectSocket();
    }
  }, [user]); // Re-run whenever 'user' changes

  // ----------------------------
  // LOAD USER ON MOUNT
  // ----------------------------
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token with backend
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch user');
        })
        .then(data => {
          // Normalize data
          data.id = data._id; // Alias _id to id
          setUser(data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // ----------------------------
  // SIGN UP
  // ----------------------------
  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ error: Error | null }> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Save token and set user
      localStorage.setItem('token', data.token);
      data.id = data._id;
      setUser(data);
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  };

  // ----------------------------
  // SIGN IN
  // ----------------------------
  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and set user
      localStorage.setItem('token', data.token);
      data.id = data._id;
      setUser(data);
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  };

  // ----------------------------
  // SIGN OUT
  // ----------------------------
  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    // Socket disconnection is handled by the useEffect above
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, role, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

export type { UserRole, User };