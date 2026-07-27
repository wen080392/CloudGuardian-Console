
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api/client';
import { User, AuthResponse } from '../types/api';
import { toast } from 'sonner';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onIdTokenChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  register: (email: string, password: string, name: string, companyName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('access_token', token);
        } catch (error) {
          console.error("Error refreshing token:", error);
        }
      } else {
        localStorage.removeItem('access_token');
        // Do not auto-logout user_data here to prevent brief flashes if firebase is just initializing, 
        // though typically it would be null if not logged in.
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      // First authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // In a real app we'd also call our backend to sync/get profile
      // But let's simulate the backend response for now, or call login route if it was implemented
      // Since backend doesn't have login yet, we just set the user
      
      const userData: User = {
        id: userCredential.user.uid,
        email: email,
        full_name: email.split('@')[0],
        company: "Company",
        role: "admin"
      };

      localStorage.setItem('access_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.full_name || userData.email || 'User'}!`);
      return userData;
    } catch (error: any) {
      toast.error(error.message || 'Error during login');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      
      const userData: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        full_name: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
        company: "Company",
        role: "admin"
      };

      try {
        // Try to register the user in our backend database if they don't exist
        await apiClient.post('/api/v1/auth/register', 
          { email: userData.email, name: userData.full_name, companyName: `${userData.full_name}'s Company` },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err: any) {
        // It might fail if the user already exists in Postgres, which is fine for login
        console.log("User might already exist in PG, continuing login.", err);
      }

      localStorage.setItem('access_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.full_name}!`);
      return userData;
    } catch (error: any) {
      toast.error(error.message || 'Error during Google login');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, companyName: string) => {
    try {
      setLoading(true);
      // 1. Register on Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Get the new token
      const token = await userCredential.user.getIdToken();
      
      // 3. Send to backend to create Tenant and User in Neon Postgres
      const response = await apiClient.post('/api/v1/auth/register', 
        { email, name, companyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error creating account');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    auth.signOut();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('cg_auth'); // Legacy cleanup
    setUser(null);
    toast.info('Logged out successfully');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithGoogle, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

